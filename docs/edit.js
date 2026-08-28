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

// Lucide SVG Icons for Editor.js Block Options Menu (https://github.com/lucide-icons/lucide)
const LUCIDE_ICONS = {
    paragraph: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" x2="15" y1="20" y2="20"/><line x1="12" x2="12" y1="4" y2="20"/></svg>`,
    header: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"/><path d="M6 20V4"/><path d="M18 20V4"/></svg>`,
    listUnordered: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>`,
    listOrdered: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="10" x2="21" y1="6" y2="6"/><line x1="10" x2="21" y1="12" y2="12"/><line x1="10" x2="21" y1="18" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>`,
    checklist: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="6" height="6" rx="1"/><path d="m3 17 2 2 4-4"/><path d="M13 6h8"/><path d="M13 12h8"/><path d="M13 18h8"/></svg>`,
    quote: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/></svg>`,
    delimiter: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" x2="19" y1="12" y2="12"/></svg>`,
    table: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"/><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>`,
    callout: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`,
    bookmark: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
    button: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 9 5 12 1.8-5.2L21 14Z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/></svg>`,
    toggle: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>`,
    audio: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
    video: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>`,
    product: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`,
    code: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>`,
    image: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
    embed: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`,
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></svg>`
};

// Initialize Editor.js
async function initEditor(initialData = null) {
    if (editorInstance && typeof editorInstance.destroy === 'function') {
        try {
            await editorInstance.destroy();
        } catch (e) {}
    }

    const tools = {};

    tools.paragraph = {
        toolbox: {
            title: 'Text',
            icon: LUCIDE_ICONS.paragraph
        }
    };

    if (window.Header) {
        tools.header = {
            class: window.Header,
            inlineToolbar: ['link', 'bold', 'italic', 'marker'],
            config: {
                placeholder: 'Heading',
                levels: [1, 2, 3, 4, 5, 6],
                defaultLevel: 2
            },
            toolbox: {
                title: 'Heading',
                icon: LUCIDE_ICONS.header
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
            },
            toolbox: [
                {
                    title: 'Bullet List',
                    icon: LUCIDE_ICONS.listUnordered,
                    data: { style: 'unordered' }
                },
                {
                    title: 'Numbered List',
                    icon: LUCIDE_ICONS.listOrdered,
                    data: { style: 'ordered' }
                },
                {
                    title: 'Checklist',
                    icon: LUCIDE_ICONS.checklist,
                    data: { style: 'checklist' }
                }
            ]
        };
    }

    if (window.Checklist) {
        tools.checklist = {
            class: window.Checklist,
            inlineToolbar: true,
            toolbox: {
                title: 'Checklist',
                icon: LUCIDE_ICONS.checklist
            }
        };
    }

    if (window.Quote) {
        tools.quote = {
            class: window.Quote,
            inlineToolbar: true,
            config: {
                quotePlaceholder: 'Enter a quote',
                captionPlaceholder: "Quote's author / citation"
            },
            toolbox: {
                title: 'Quote',
                icon: LUCIDE_ICONS.quote
            }
        };
    }

    if (window.Delimiter) {
        tools.delimiter = {
            class: window.Delimiter,
            toolbox: {
                title: 'Delimiter',
                icon: LUCIDE_ICONS.delimiter
            }
        };
    }

    if (window.Table) {
        tools.table = {
            class: window.Table,
            inlineToolbar: true,
            toolbox: {
                title: 'Table',
                icon: LUCIDE_ICONS.table
            }
        };
    }

    // Ghost CMS Koenig Custom Tools
    tools.callout = {
        class: GhostCalloutTool,
        toolbox: {
            title: 'Callout',
            icon: LUCIDE_ICONS.callout
        }
    };
    tools.bookmark = {
        class: GhostBookmarkTool,
        toolbox: {
            title: 'Bookmark',
            icon: LUCIDE_ICONS.bookmark
        }
    };
    tools.button = {
        class: GhostButtonTool,
        toolbox: {
            title: 'Button',
            icon: LUCIDE_ICONS.button
        }
    };
    tools.toggle = {
        class: GhostToggleTool,
        toolbox: {
            title: 'Toggle',
            icon: LUCIDE_ICONS.toggle
        }
    };
    tools.audio = {
        class: GhostAudioTool,
        toolbox: {
            title: 'Audio',
            icon: LUCIDE_ICONS.audio
        }
    };
    tools.video = {
        class: GhostVideoTool,
        toolbox: {
            title: 'Video',
            icon: LUCIDE_ICONS.video
        }
    };
    tools.product = {
        class: GhostProductTool,
        toolbox: {
            title: 'Product',
            icon: LUCIDE_ICONS.product
        }
    };
    tools.code = {
        class: GhostCodeTool,
        toolbox: {
            title: 'Code',
            icon: LUCIDE_ICONS.code
        }
    };
    tools.image = {
        class: GhostImageTool,
        toolbox: {
            title: 'Image',
            icon: LUCIDE_ICONS.image
        }
    };
    tools.embed = {
        class: GhostEmbedTool,
        toolbox: {
            title: 'Embed',
            icon: LUCIDE_ICONS.embed
        }
    };
    tools.html = {
        class: GhostHtmlTool,
        toolbox: {
            title: 'HTML',
            icon: LUCIDE_ICONS.html
        }
    };

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
