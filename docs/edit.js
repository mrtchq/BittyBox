import * as bitty from './bitty.js';
import {
    GhostCalloutTool,
    GhostBookmarkTool,
    GhostButtonTool,
    GhostToggleTool,
    GhostAudioTool,
    GhostVideoTool,
    GhostProductTool,
    GhostCodeTool,
    GhostImageTool,
    GhostEmbedTool,
    GhostHtmlTool
} from './ghost-tools.js';
import { editorJsToGhostHtml, ghostHtmlToEditorJs } from './ghost-renderer.js';

window.bitty = bitty;

const QS = document.querySelector.bind(document);
const QSS = document.querySelectorAll.bind(document);

let editorInstance = null;
let bittyLink = undefined;
let previewContent = false;
let importedFileData = undefined;
let changeDebounceTimer = null;

// Initialize Editor.js
async function initEditor(initialData = null) {
    if (editorInstance && typeof editorInstance.destroy === 'function') {
        try {
            await editorInstance.destroy();
        } catch (e) {}
    }

    const tools = {};

    if (window.Header) {
        tools.header = {
            class: window.Header,
            inlineToolbar: ['link', 'bold', 'italic', 'marker'],
            config: {
                placeholder: 'Heading',
                levels: [1, 2, 3, 4, 5, 6],
                defaultLevel: 2
            }
        };
    }

    const ListClass = window.EditorjsList || window.List || window.NestedList;
    if (ListClass) {
        tools.list = {
            class: ListClass,
            inlineToolbar: true,
            config: {
                defaultStyle: 'unordered'
            }
        };
    if (window.Checklist) {
        tools.checklist = {
            class: window.Checklist,
            inlineToolbar: true
        };
    }

    if (window.Quote) {
        tools.quote = {
            class: window.Quote,
            inlineToolbar: true,
            config: {
                quotePlaceholder: 'Enter a quote',
                captionPlaceholder: "Quote's author / citation"
            }
        };
    }

    if (window.Delimiter) {
        tools.delimiter = window.Delimiter;
    }

    if (window.Table) {
        tools.table = {
            class: window.Table,
            inlineToolbar: true
        };
    }

    // Ghost CMS Koenig Custom Tools
    tools.callout = GhostCalloutTool;
    tools.bookmark = GhostBookmarkTool;
    tools.button = GhostButtonTool;
    tools.toggle = GhostToggleTool;
    tools.audio = GhostAudioTool;
    tools.video = GhostVideoTool;
    tools.product = GhostProductTool;
    tools.code = GhostCodeTool;
    tools.image = GhostImageTool;
    tools.embed = GhostEmbedTool;
    tools.html = GhostHtmlTool;

    // Inline formatting tools
    if (window.Marker) tools.marker = window.Marker;
    if (window.InlineCode) tools.inlineCode = window.InlineCode;
    if (window.Underline) tools.underline = window.Underline;

    editorInstance = new EditorJS({
        holder: 'editorjs',
        placeholder: 'Type your text, code, or message here...',
        tools: tools,
        data: initialData || { blocks: [] },
        autofocus: true,
        onChange: () => {
            if (changeDebounceTimer) clearTimeout(changeDebounceTimer);
            changeDebounceTimer = setTimeout(() => {
                handleContentChange();
            }, 300);
        }
    });

    await editorInstance.isReady;
    window.editorInstance = editorInstance;
}

async function initPage() {
    window.onpopstate = async function(e) {
        if (e.state && typeof e.state === 'object') {
            await initEditor(e.state);
        }
    };

    window.onhashchange = function() {
        location.reload();
    };

    // Drag and drop support
    let lastTarget;
    window.addEventListener("dragenter", function(e) {
        document.body.classList.toggle("dragging", true);
        lastTarget = e.target;
    });

    window.addEventListener("dragleave", function(e) {
        if (e.target === lastTarget || e.target === document) {
            document.body.classList.toggle("dragging", false);
        }
    });

    if (localStorage.getItem("preview")) {
        togglePreview(true);
    }

    QS("#doc-title")?.addEventListener("keyup", handleInput);
    Array.from(document.getElementsByTagName("input")).forEach(i => i.addEventListener("keydown", handleInput));
    document.getElementById("md-include")?.addEventListener("change", handleMetadataCheckbox);
    document.getElementById("drop-zone")?.addEventListener("drop", handleDrop);
    document.getElementById("drop-zone")?.addEventListener("dragover", e => e.preventDefault());

    if (QS("#copy")) QS("#copy").onclick = copyLink;
    if (QS("#preview")) QS("#preview").onclick = () => togglePreview();
    if (QS("#doc-title")) QS("#doc-title").onclick = toggleMetadata;

    // Parse initial URL hash
    let hash = window.location.hash.substring(1);
    let initialBlocks = null;

    if (hash.length) {
        let slashIndex = hash.indexOf("/");
        let title = hash.substring(0, slashIndex);
        if (title.length) {
            const titleEl = QS("#doc-title");
            if (titleEl) {
                titleEl.innerText = document.title = decodeURIComponent(title.replace(/_/g, " "));
            }
        }
        hash = hash.substring(slashIndex + 1);

        if (hash.startsWith("?")) {
            hash = hash.substring(1);
            let durl = new bitty.DataURL(hash);
            durl = await durl.decompress();
            let htmlContent = durl.data;
            initialBlocks = ghostHtmlToEditorJs(htmlContent);
        } else if (hash.startsWith("data:")) {
            let durl = new bitty.DataURL(hash);
            durl = await durl.decompress();
            let htmlContent = durl.data;
            initialBlocks = ghostHtmlToEditorJs(htmlContent);
        }
    } else {
        const saved = sessionStorage.getItem("editor-content");
        if (saved) {
            try {
                initialBlocks = JSON.parse(saved);
            } catch (e) {}
        }
    }

    await initEditor(initialBlocks);
    updateBodyClass(initialBlocks && initialBlocks.blocks && initialBlocks.blocks.length > 0);
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initPage);
} else {
    initPage();
}

function updateBodyClass(hasContent) {
    if (hasContent || importedFileData) {
        document.body.classList.add("edited");
    } else {
        document.body.classList.remove("edited");
    }
    document.body.classList.toggle("filecontent", importedFileData !== undefined);
    document.body.classList.add("loaded");
}

function handleInput(e) {
    handleContentChange();
}

function handleMetadataCheckbox(e) {
    document.body.classList.toggle("no-metadata", !e.target.checked);
    handleContentChange();
}

function getMetadata() {
    let formData = new FormData(document.forms[0]);
    let object = {};
    formData.forEach((value, key) => object[key] = value);
    return object;
}

async function handleContentChange() {
    if (!editorInstance) return;

    let savedData;
    try {
        savedData = await editorInstance.save();
    } catch (e) {
        console.warn("Editor save error:", e);
        return;
    }

    const hasContent = savedData && savedData.blocks && savedData.blocks.length > 0;
    updateBodyClass(hasContent);

    sessionStorage.setItem("editor-content", JSON.stringify(savedData));

    if (!hasContent && !importedFileData) {
        updateLink("");
        return;
    }

    const htmlContent = editorJsToGhostHtml(savedData);
    const metadata = getMetadata();

    let url = `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
    let durl = new bitty.DataURL(url);

    if (metadata.password) {
        durl.params.cipher = "aes-gcm";
        durl.params.style = "default";
        durl.params._password = metadata.password;
    }

    durl = await durl.compress(bitty.GZIP_MARKER);
    let ratio = durl.href.length / url.length;
    console.debug(`Compressed from ${url.length} to ${durl.href.length} bytes (${Math.round(ratio * 100)}%)`);

    if (ratio <= 0.95) url = durl.href;

    if (metadata.password) {
        updateLink(durl.href, metadata);
    } else {
        updateLink("?" + durl.data, metadata);
    }
}

function updateLink(url, metadata, push) {
    metadata = metadata || {};
    let title = metadata.title || "";
    let includeMetadata = !metadata.includeMetadata;
    let path = includeMetadata ? "/" : bitty.metadataToPath(metadata) ?? "/";
    let prefix = includeMetadata ? bitty.encodePrettyComponent(title) : "";

    if (url && url.length) {
        url = path + "#" + prefix + "/" + url;
    } else {
        url = "/edit";
    }

    const titleTextEl = document.getElementById("doc-title-text");
    if (titleTextEl) {
        titleTextEl.innerText = title.length ? title : "";
    }

    bittyLink = new URL(url, document.location).href;

    const canonicalEl = document.getElementById("canonical");
    if (canonicalEl) {
        canonicalEl.href = bittyLink;
    }

    if (previewContent) {
        const previewFrame = QS("#preview-frame");
        if (previewFrame) previewFrame.src = bittyLink;
    }

    let hash = location.hash;
    if (push || !hash || !hash.length) {
        window.history.pushState(null, null, bittyLink);
    } else {
        window.history.replaceState(null, null, bittyLink);
    }

    let length = bittyLink.length;
    const lengthEl = QS("#length");
    if (lengthEl) {
        lengthEl.innerText = length + " bytes";
        lengthEl.onclick = () => {
            window.open(bittyLink, "_blank");
        };
    }
}

function togglePreview(flag) {
    if (flag !== undefined) {
        previewContent = flag;
    } else {
        previewContent = !previewContent;
    }
    document.body.classList.toggle("preview", previewContent);
    if (previewContent && bittyLink) {
        const previewFrame = QS("#preview-frame");
        if (previewFrame) previewFrame.src = bittyLink;
    }
    localStorage.setItem("preview", previewContent ? "true" : "");
}

function toggleMetadata(e) {
    if (e.target.closest(".menu")) return;
    QS("#md-contents")?.classList.toggle("menu-visible");
    QS("#doc-title")?.classList.toggle("open");
    QS("#md-title")?.focus();
}

function copyLink() {
    let text = bittyLink || window.location.href;
    let dummy = document.createElement("input");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);

    document.body.classList.add("copied");
    setTimeout(function() {
        document.body.classList.remove("copied");
    }, 2000);
}

async function handleDrop(e) {
    e.preventDefault();
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0]) {
        let file = e.dataTransfer.files[0];
        let reader = new FileReader();

        if (file.type.startsWith('image/')) {
            reader.onload = async function(evt) {
                const dataUrl = evt.target.result;
                if (editorInstance) {
                    await editorInstance.blocks.insert('image', {
                        url: dataUrl,
                        caption: file.name,
                        alt: file.name,
                        width: 'regular'
                    });
                    handleContentChange();
                }
            };
            reader.readAsDataURL(file);
        } else {
            reader.onload = async function(evt) {
                const text = evt.target.result;
                if (editorInstance) {
                    await editorInstance.blocks.insert('code', {
                        code: text,
                        language: file.name.split('.').pop() || 'text',
                        caption: file.name
                    });
                    handleContentChange();
                }
            };
            reader.readAsText(file);
        }
    }
    document.body.classList.remove("dragging");
}
