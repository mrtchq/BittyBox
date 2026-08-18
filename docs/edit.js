import * as bitty from './bitty.js';

window.bitty = bitty;

var QS = document.querySelector.bind(document);
var QSS = document.querySelectorAll.bind(document);

var DATA_PREFIX = "data:text/html;base64,";
var DATA_PREFIX_8 = "data:text/html;charset=utf-8;base64,";
var DATA_PREFIX_BXZE = "data:text/html;charset=utf-8;bxze64,";
var DATA_PREFIX_GZIP = "data:text/html;charset=utf-8;gzip64,";

var b = document.documentElement.setAttribute(
  "data-useragent",
  navigator.userAgent
);

var bindings = {};
var quill = new Quill('#editor', {
  theme: 'snow',
  modules: {
    syntax: true,
    keyboard: { bindings },
    toolbar: "#formatbar"
  }
});

quill.on('text-change', function(delta, oldDelta, source) {
  handleContentChange();
});
quill.setSelection(0, Infinity);

var editor = quill.root;
editor.autocomplete = "off";
var importedFileData = undefined;

var content = editor;
window.onload = async function() {
  window.onpopstate = function(e) {
    setContent(e.state);
  };
  window.onhashchange = function(e) {
    location.reload();
  };
  document.body.onclick = function(e) {
    if (e.target == document.body) editor.focus();
  };

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

  // Event Listeners for Title & Metadata
  if (QS("#doc-title")) {
    QS("#doc-title").onclick = toggleMetadata;
  }
  if (QS("#close-metadata-btn")) {
    QS("#close-metadata-btn").onclick = toggleMetadata;
  }

  Array.from(document.querySelectorAll("#metadata-modal input")).forEach(i => {
    i.addEventListener("input", handleInput);
    i.addEventListener("keydown", handleInput);
  });

  var mdInclude = document.getElementById("md-include");
  if (mdInclude) {
    mdInclude.addEventListener("change", handleMetadataCheckbox);
  }

  var dropZone = document.getElementById("drop-zone");
  if (dropZone) {
    dropZone.addEventListener("drop", handleDrop);
    dropZone.addEventListener("dragover", e => e.preventDefault());
  }

  editor.addEventListener("paste", handlePaste);
  editor.focus();

  if (QS("#copy")) QS("#copy").onclick = copyLink;
  if (QS("#length")) QS("#length").onclick = copyLink;
  if (QS("#format-toggle")) QS("#format-toggle").onclick = toggleFormat;

  var hash = window.location.hash.substring(1);

  if (hash.length) {
    var slashIndex = hash.indexOf("/");
    var title = hash.substring(0, slashIndex);
    if (title.length) {
      var decodedTitle = decodeURIComponent(title.replace(/_/g, " "));
      QS("#doc-title-text").innerText = document.title = decodedTitle;
      var mdTitleInput = QS("#md-title");
      if (mdTitleInput) mdTitleInput.value = decodedTitle;
    }
    hash = hash.substring(slashIndex + 1);
    updateLink(hash, { title });
    if (hash.startsWith("?")) {
      hash = hash.substring(1);
      let durl = new bitty.DataURL(hash);
      durl = await durl.decompress();
      let htmlContent = durl.data;
      setContent(htmlContent);
    }
  } else {
    updateBodyClass();
    setContent(sessionStorage.getItem("editor-content") || "");
  }
};

function setContent(html) {
  if (html) {
    editor.innerHTML = html;
  }
  updateBodyClass();
}

function setFileName(name) {
  var docFile = QS("#doc-file");
  if (docFile) docFile.innerText = name;
  if (name.length) {
    setContent("");
    document.body.classList.add("edited");
  }
}

function updateBodyClass(hasContent) {
  var text = editor.innerText.trim();
  var edited = (hasContent !== undefined ? hasContent : text.length > 0);
  document.body.classList.toggle("edited", edited);
  document.body.classList.add("loaded");
}

function handlePaste(e) {
  var clip = e.clipboardData;
  if (!clip) return;
  var text = clip.getData('text/plain');
  if (!text) return;

  var isCode = /^(\s*import|\s*function|\s*const|\s*let|\s*class|\s*<\?php|\s*<!DOCTYPE)/.test(text);
  if (isCode && !document.body.classList.contains("edited")) {
    e.preventDefault();
    editor.innerText = text;
    handleContentChange();
  }
}

function handleDrop(e) {
  e.preventDefault();
  document.body.classList.remove("dragging");
  var files = e.dataTransfer.files;
  if (!files || !files.length) return;

  var file = files[0];
  var reader = new FileReader();
  reader.onload = function(evt) {
    var content = evt.target.result;
    var fileName = file.name;
    var title = fileName.replace(/\.[^/.]+$/, "");
    QS("#doc-title-text").innerText = title;
    var mdTitleInput = QS("#md-title");
    if (mdTitleInput) mdTitleInput.value = title;

    if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".html") || file.name.endsWith(".js") || file.name.endsWith(".css") || file.name.endsWith(".json")) {
      editor.innerText = content;
    } else {
      editor.innerHTML = content;
    }
    handleContentChange();
  };

  if (file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".html") || file.name.endsWith(".js") || file.name.endsWith(".css") || file.name.endsWith(".json")) {
    reader.readAsText(file);
  } else {
    reader.readAsDataURL(file);
  }
}

function handleInput(e) {
  handleContentChange(e);
}

function handleMetadataCheckbox(e) {
  document.body.classList.toggle("no-metadata", !e.target.checked);
  handleContentChange(e);
}

function getMetadata() {
  var form = document.getElementById("md-contents");
  if (!form) return {};
  let formData = new FormData(form);
  var object = {};
  formData.forEach((value, key) => object[key] = value);
  return object;
}

async function handleContentChange() {
  sessionStorage.setItem("editor-content", editor.innerHTML);
  var text = editor.innerText;
  let hasContent = text.trim().length > 0;

  updateBodyClass(hasContent);
  if (!hasContent) {
    updateLink("");
    return;
  }

  var metadata = getMetadata();
  var rawHTML = text.indexOf("</") > 0;
  var payloadText = rawHTML ? text.replace(/[ |\t]+/g, " ").replace(/> +</g, "> <") : editor.innerHTML;

  if (payloadText.trim().length) {
    let url = `data:text/html;charset=utf-8,${encodeURIComponent(payloadText)}`;
    let durl = new bitty.DataURL(url);

    if (metadata.password) {
      durl.params.cipher = "aes-gcm";
      durl.params.style = "default";
      durl.params._password = metadata.password;
    }

    durl = await durl.compress(bitty.GZIP_MARKER);
    let ratio = durl.href.length / url.length;

    if (ratio <= 0.95) url = durl.href;
    if (rawHTML) {
      updateLink(url, metadata);
    } else if (metadata.password) {
      updateLink(durl.href, metadata);
    } else {
      updateLink("?" + durl.data, metadata);
    }
    setFileName("");
  } else if (importedFileData) {
    updateLink(importedFileData, metadata);
  } else {
    updateLink("");
  }
}

let bittyLink = undefined;
function updateLink(url, metadata, push) {
  metadata = metadata || getMetadata();
  let title = metadata.title || "";

  let includeMetadata = !metadata.includeMetadata;
  let path = includeMetadata ? "/" : (bitty.metadataToPath(metadata) ?? "/");
  let prefix = includeMetadata ? bitty.encodePrettyComponent(title) : "";

  if (url && url.length) {
    url = path + "#" + prefix + "/" + url;
  } else {
    url = "/edit";
  }

  var docTitleEl = document.getElementById("doc-title-text");
  if (docTitleEl) {
    docTitleEl.innerText = title.length ? title : "untitled";
  }

  bittyLink = new URL(url, document.location).href;

  var canonical = document.getElementById("canonical");
  if (canonical) canonical.href = bittyLink;

  var hash = location.hash;
  if (push || !hash || !hash.length) {
    window.history.pushState(null, null, bittyLink);
  } else {
    window.history.replaceState(null, null, bittyLink);
  }

  var length = bittyLink.length;
  var lengthEl = QS("#length");
  if (lengthEl) {
    lengthEl.innerText = length + " bytes";
  }

  // Store in user's link history for the Account page
  if (url !== "/edit" && length > 50) {
    try {
      var history = JSON.parse(localStorage.getItem('bittybox_history') || '[]');
      var existingIndex = history.findIndex(h => h.url === bittyLink);
      var item = {
        url: bittyLink,
        title: title || 'Untitled Capsule',
        format: 'html',
        created: new Date().toISOString(),
        byteLength: length
      };
      if (existingIndex >= 0) {
        history[existingIndex] = item;
      } else {
        history.unshift(item);
      }
      localStorage.setItem('bittybox_history', JSON.stringify(history.slice(0, 100)));
    } catch (e) {
      console.debug('History save skipped', e);
    }
  }
}

function toggleMetadata(e) {
  var modal = QS("#metadata-modal");
  if (!modal) return;
  modal.classList.toggle("active");
  if (modal.classList.contains("active")) {
    var mdTitle = QS("#md-title");
    if (mdTitle) mdTitle.focus();
  }
}

let formatContent = false;
function toggleFormat() {
  formatContent = !formatContent;
  document.body.classList.toggle("format", formatContent);
}

function copyLink() {
  if (!bittyLink || bittyLink.endsWith("/edit")) {
    handleContentChange();
  }
  var text = bittyLink || window.location.href;
  navigator.clipboard.writeText(text).then(() => {
    showToast();
  }).catch(() => {
    var dummy = document.createElement("input");
    document.body.appendChild(dummy);
    dummy.value = text;
    dummy.select();
    document.execCommand("copy");
    document.body.removeChild(dummy);
    showToast();
  });
}

function showToast() {
  var msg = document.getElementById("copy-message");
  if (msg) {
    msg.style.display = "flex";
    setTimeout(() => {
      msg.style.display = "none";
    }, 2500);
  }
}
