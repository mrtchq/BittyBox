/**
 * Ghost CMS Koenig Card Block Tools for Editor.js
 * Implements Ghost CMS block types: Callout, Bookmark, Button, Toggle, Audio, Video, Product, Code, Image, Embed, HTML.
 */

// Helper to create element with classes and attributes
function createElement(tag, className = '', attributes = {}) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    for (const [key, val] of Object.entries(attributes)) {
        if (key === 'innerHTML') el.innerHTML = val;
        else if (key === 'innerText') el.innerText = val;
        else el.setAttribute(key, val);
    }
    return el;
}

// 1. Ghost Callout Card
export class GhostCalloutTool {
    static get toolbox() {
        return {
            title: 'Callout',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>`
        };
    }

    constructor({ data, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.data = {
            text: data.text || '',
            emoji: data.emoji || '💡',
            color: data.color || 'accent' // accent, green, yellow, red, purple, default
        };
    }

    render() {
        this.container = createElement('div', `kg-callout-card kg-callout-card-${this.data.color}`);
        
        this.emojiEl = createElement('span', 'kg-callout-emoji', {
            contentEditable: !this.readOnly,
            innerText: this.data.emoji,
            title: 'Click to change emoji'
        });

        this.textEl = createElement('div', 'kg-callout-text', {
            contentEditable: !this.readOnly,
            innerHTML: this.data.text || '<p>Type callout text...</p>'
        });

        this.emojiEl.addEventListener('input', () => {
            this.data.emoji = this.emojiEl.innerText.trim() || '💡';
        });

        this.textEl.addEventListener('input', () => {
            this.data.text = this.textEl.innerHTML;
        });

        this.container.appendChild(this.emojiEl);
        this.container.appendChild(this.textEl);
        return this.container;
    }

    renderSettings() {
        const colors = [
            { name: 'accent', label: 'Blue' },
            { name: 'green', label: 'Green' },
            { name: 'yellow', label: 'Yellow' },
            { name: 'red', label: 'Red' },
            { name: 'purple', label: 'Purple' },
            { name: 'default', label: 'Gray' }
        ];

        const wrapper = createElement('div', 'cdx-settings');
        colors.forEach(col => {
            const btn = createElement('div', `cdx-settings-button ${this.data.color === col.name ? 'cdx-settings-button--active' : ''}`, {
                innerText: col.label
            });
            btn.onclick = () => {
                this.data.color = col.name;
                this.container.className = `kg-callout-card kg-callout-card-${col.name}`;
                wrapper.querySelectorAll('.cdx-settings-button').forEach(b => b.classList.remove('cdx-settings-button--active'));
                btn.classList.add('cdx-settings-button--active');
            };
            wrapper.appendChild(btn);
        });
        return wrapper;
    }

    save() {
        return {
            text: this.textEl ? this.textEl.innerHTML : this.data.text,
            emoji: this.emojiEl ? this.emojiEl.innerText.trim() : this.data.emoji,
            color: this.data.color
        };
    }
}

// 2. Ghost Bookmark Card
export class GhostBookmarkTool {
    static get toolbox() {
        return {
            title: 'Bookmark',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`
        };
    }

    constructor({ data, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.data = {
            url: data.url || '',
            title: data.title || '',
            description: data.description || '',
            author: data.author || '',
            publisher: data.publisher || '',
            icon: data.icon || '',
            thumbnail: data.thumbnail || ''
        };
    }

    render() {
        const wrapper = createElement('div', 'kg-bookmark-card');

        if (!this.data.url && !this.readOnly) {
            const inputContainer = createElement('div', 'cdx-input-holder');
            const input = createElement('input', 'cdx-input', {
                placeholder: 'Paste URL to create bookmark and press Enter...',
                value: this.data.url
            });

            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.fetchUrl(input.value);
                }
            });

            inputContainer.appendChild(input);
            wrapper.appendChild(inputContainer);
            this.inputView = inputContainer;
        }

        this.cardView = createElement('div', 'kg-bookmark-container');
        this.renderCardContent(this.cardView);
        wrapper.appendChild(this.cardView);

        if (!this.data.url) {
            this.cardView.style.display = 'none';
        }

        this.wrapper = wrapper;
        return wrapper;
    }

    fetchUrl(url) {
        if (!url) return;
        this.data.url = url;
        try {
            const parsed = new URL(url);
            this.data.publisher = parsed.hostname.replace('www.', '');
            this.data.title = parsed.hostname;
            this.data.description = url;
            this.data.icon = `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=32`;
        } catch (e) {}

        if (this.inputView) this.inputView.style.display = 'none';
        this.cardView.style.display = 'flex';
        this.renderCardContent(this.cardView);
    }

    renderCardContent(container) {
        container.innerHTML = `
            <div class="kg-bookmark-content">
                <div class="kg-bookmark-title" contenteditable="${!this.readOnly}">${this.data.title || 'Bookmark Title'}</div>
                <div class="kg-bookmark-description" contenteditable="${!this.readOnly}">${this.data.description || 'Bookmark Description'}</div>
                <div class="kg-bookmark-metadata">
                    ${this.data.icon ? `<img src="${this.data.icon}" class="kg-bookmark-icon">` : ''}
                    <span class="kg-bookmark-publisher" contenteditable="${!this.readOnly}">${this.data.publisher || 'Website'}</span>
                    ${this.data.author ? `<span class="kg-bookmark-author">• ${this.data.author}</span>` : ''}
                </div>
            </div>
            ${this.data.thumbnail ? `<div class="kg-bookmark-thumbnail"><img src="${this.data.thumbnail}"></div>` : ''}
        `;

        const titleEl = container.querySelector('.kg-bookmark-title');
        const descEl = container.querySelector('.kg-bookmark-description');
        const pubEl = container.querySelector('.kg-bookmark-publisher');

        if (titleEl) titleEl.addEventListener('input', () => { this.data.title = titleEl.innerText; });
        if (descEl) descEl.addEventListener('input', () => { this.data.description = descEl.innerText; });
        if (pubEl) pubEl.addEventListener('input', () => { this.data.publisher = pubEl.innerText; });
    }

    save() {
        return this.data;
    }
}

// 3. Ghost Button Card
export class GhostButtonTool {
    static get toolbox() {
        return {
            title: 'Button',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 9 5 12 1.8-5.2L21 14Z"/><path d="M7.2 2.2 8 5.1"/><path d="m5.1 8-2.9-.8"/><path d="M14 4.1 12 6"/><path d="m6 12-1.9 2"/></svg>`
        };
    }

    constructor({ data, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.data = {
            buttonText: data.buttonText || 'Click here',
            buttonUrl: data.buttonUrl || 'https://',
            alignment: data.alignment || 'center',
            accent: data.accent !== undefined ? data.accent : true
        };
    }

    render() {
        const wrapper = createElement('div', `kg-button-card kg-align-${this.data.alignment}`);
        
        const btn = createElement('a', `kg-btn ${this.data.accent ? 'kg-btn-accent' : ''}`, {
            href: this.data.buttonUrl,
            innerText: this.data.buttonText,
            target: '_blank'
        });

        if (!this.readOnly) {
            const form = createElement('div', 'cdx-button-form', {
                style: 'display: flex; flex-direction: column; gap: 6px; margin-bottom: 8px; width: 100%;'
            });

            const textInput = createElement('input', 'cdx-input', {
                placeholder: 'Button Text',
                value: this.data.buttonText
            });
            const urlInput = createElement('input', 'cdx-input', {
                placeholder: 'Button Destination URL (https://...)',
                value: this.data.buttonUrl
            });

            textInput.addEventListener('input', () => {
                this.data.buttonText = textInput.value;
                btn.innerText = textInput.value || 'Click here';
            });
            urlInput.addEventListener('input', () => {
                this.data.buttonUrl = urlInput.value;
                btn.href = urlInput.value || '#';
            });

            form.appendChild(textInput);
            form.appendChild(urlInput);
            wrapper.appendChild(form);
        }

        wrapper.appendChild(btn);
        this.wrapper = wrapper;
        return wrapper;
    }

    renderSettings() {
        const wrapper = createElement('div', 'cdx-settings');
        const alignments = ['left', 'center'];
        alignments.forEach(align => {
            const btn = createElement('div', `cdx-settings-button ${this.data.alignment === align ? 'cdx-settings-button--active' : ''}`, {
                innerText: align.charAt(0).toUpperCase() + align.slice(1)
            });
            btn.onclick = () => {
                this.data.alignment = align;
                this.wrapper.className = `kg-button-card kg-align-${align}`;
                wrapper.querySelectorAll('.cdx-settings-button').forEach(b => b.classList.remove('cdx-settings-button--active'));
                btn.classList.add('cdx-settings-button--active');
            };
            wrapper.appendChild(btn);
        });
        return wrapper;
    }

    save() {
        return this.data;
    }
}

// 4. Ghost Toggle / Accordion Card
export class GhostToggleTool {
    static get toolbox() {
        return {
            title: 'Toggle',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>`
        };
    }

    constructor({ data, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.data = {
            heading: data.heading || 'Toggle Heading',
            content: data.content || '<p>Toggle collapsible content...</p>'
        };
    }

    render() {
        const card = createElement('div', 'kg-toggle-card');
        const headingWrapper = createElement('div', 'kg-toggle-heading');
        const headingText = createElement('h4', 'kg-toggle-heading-text', {
            contentEditable: !this.readOnly,
            innerHTML: this.data.heading
        });
        const iconBtn = createElement('button', 'kg-toggle-card-icon', {
            innerHTML: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`
        });

        const contentWrapper = createElement('div', 'kg-toggle-content', {
            contentEditable: !this.readOnly,
            innerHTML: this.data.content
        });

        headingText.addEventListener('input', () => {
            this.data.heading = headingText.innerHTML;
        });
        contentWrapper.addEventListener('input', () => {
            this.data.content = contentWrapper.innerHTML;
        });

        headingWrapper.onclick = (e) => {
            if (e.target === headingText) return;
            card.toggleAttribute('data-kg-toggle-state');
            if (card.hasAttribute('data-kg-toggle-state')) {
                card.setAttribute('data-kg-toggle-state', 'close');
            }
        };

        headingWrapper.appendChild(headingText);
        headingWrapper.appendChild(iconBtn);
        card.appendChild(headingWrapper);
        card.appendChild(contentWrapper);
        return card;
    }

    save() {
        return this.data;
    }
}

// 5. Ghost Audio Card
export class GhostAudioTool {
    static get toolbox() {
        return {
            title: 'Audio',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`
        };
    }

    constructor({ data, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.data = {
            src: data.src || '',
            title: data.title || 'Audio Track',
            artist: data.artist || 'Artist'
        };
    }

    render() {
        const card = createElement('div', 'kg-audio-card');
        card.innerHTML = `
            <div class="kg-audio-thumbnail">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            </div>
            <div class="kg-audio-player-container">
                <div class="kg-audio-title" contenteditable="${!this.readOnly}">${this.data.title}</div>
                <div class="kg-audio-artist" contenteditable="${!this.readOnly}">${this.data.artist}</div>
                <audio controls src="${this.data.src || ''}"></audio>
                ${!this.readOnly ? `<input class="cdx-input" style="margin-top:6px; font-size:12px;" placeholder="Audio URL (.mp3 / stream)" value="${this.data.src || ''}">` : ''}
            </div>
        `;

        const titleEl = card.querySelector('.kg-audio-title');
        const artistEl = card.querySelector('.kg-audio-artist');
        const srcInput = card.querySelector('input');
        const audioEl = card.querySelector('audio');

        if (titleEl) titleEl.addEventListener('input', () => { this.data.title = titleEl.innerText; });
        if (artistEl) artistEl.addEventListener('input', () => { this.data.artist = artistEl.innerText; });
        if (srcInput) {
            srcInput.addEventListener('input', () => {
                this.data.src = srcInput.value;
                if (audioEl) audioEl.src = srcInput.value;
            });
        }
        return card;
    }

    save() {
        return this.data;
    }
}

// 6. Ghost Video Card
export class GhostVideoTool {
    static get toolbox() {
        return {
            title: 'Video',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 8-6 4 6 4V8Z"/><rect width="14" height="12" x="2" y="6" rx="2"/></svg>`
        };
    }

    constructor({ data, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.data = {
            src: data.src || '',
            caption: data.caption || ''
        };
    }

    render() {
        const card = createElement('div', 'kg-video-card');
        const video = createElement('video', '', {
            controls: 'true',
            src: this.data.src || ''
        });

        if (!this.readOnly) {
            const input = createElement('input', 'cdx-input', {
                placeholder: 'Video URL (.mp4 / webm)',
                value: this.data.src,
                style: 'margin-bottom: 8px;'
            });
            input.addEventListener('input', () => {
                this.data.src = input.value;
                video.src = input.value;
            });
            card.appendChild(input);
        }

        card.appendChild(video);

        const caption = createElement('figcaption', '', {
            contentEditable: !this.readOnly,
            innerText: this.data.caption || 'Video caption'
        });
        caption.addEventListener('input', () => {
            this.data.caption = caption.innerText;
        });
        card.appendChild(caption);

        return card;
    }

    save() {
        return this.data;
    }
}

// 7. Ghost Product Card
export class GhostProductTool {
    static get toolbox() {
        return {
            title: 'Product',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`
        };
    }

    constructor({ data, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.data = {
            image: data.image || '',
            title: data.title || 'Product Name',
            rating: data.rating || 5,
            description: data.description || 'Product description and key highlights...',
            buttonText: data.buttonText || 'Buy Now',
            buttonUrl: data.buttonUrl || 'https://'
        };
    }

    render() {
        const card = createElement('div', 'kg-product-card');
        const container = createElement('div', 'kg-product-card-container');

        const stars = '★'.repeat(this.data.rating) + '☆'.repeat(5 - this.data.rating);

        container.innerHTML = `
            ${this.data.image ? `<img src="${this.data.image}" class="kg-product-card-image">` : ''}
            ${!this.readOnly ? `<input class="cdx-input img-input" style="font-size:12px;" placeholder="Product Image URL (optional)" value="${this.data.image}">` : ''}
            <h3 class="kg-product-card-title" contenteditable="${!this.readOnly}">${this.data.title}</h3>
            <div class="kg-product-card-rating">${stars}</div>
            <div class="kg-product-card-description" contenteditable="${!this.readOnly}">${this.data.description}</div>
            <div class="kg-product-card-button">
                <a class="kg-btn kg-btn-accent" href="${this.data.buttonUrl}" target="_blank">${this.data.buttonText}</a>
            </div>
            ${!this.readOnly ? `
                <div style="display:flex; gap:6px; margin-top:8px;">
                    <input class="cdx-input btn-text" style="font-size:12px;" placeholder="Button Text" value="${this.data.buttonText}">
                    <input class="cdx-input btn-url" style="font-size:12px;" placeholder="Button URL" value="${this.data.buttonUrl}">
                </div>
            ` : ''}
        `;

        const titleEl = container.querySelector('.kg-product-card-title');
        const descEl = container.querySelector('.kg-product-card-description');
        const imgInput = container.querySelector('.img-input');
        const btnText = container.querySelector('.btn-text');
        const btnUrl = container.querySelector('.btn-url');
        const btn = container.querySelector('.kg-btn');

        if (titleEl) titleEl.addEventListener('input', () => { this.data.title = titleEl.innerText; });
        if (descEl) descEl.addEventListener('input', () => { this.data.description = descEl.innerText; });
        if (imgInput) imgInput.addEventListener('input', () => { this.data.image = imgInput.value; });
        if (btnText) btnText.addEventListener('input', () => { this.data.buttonText = btnText.value; if (btn) btn.innerText = btnText.value; });
        if (btnUrl) btnUrl.addEventListener('input', () => { this.data.buttonUrl = btnUrl.value; if (btn) btn.href = btnUrl.value; });

        card.appendChild(container);
        return card;
    }

    save() {
        return this.data;
    }
}

// 8. Ghost Code Block Tool
export class GhostCodeTool {
    static get toolbox() {
        return {
            title: 'Code',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 16 4-4-4-4"/><path d="m6 8-4 4 4 4"/><path d="m14.5 4-5 16"/></svg>`
        };
    }

    constructor({ data, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.data = {
            code: data.code || '',
            language: data.language || 'javascript',
            caption: data.caption || ''
        };
    }

    render() {
        const card = createElement('div', 'kg-code-card');

        if (!this.readOnly) {
            const langSelect = createElement('select', 'cdx-input', {
                style: 'width: auto; margin-bottom: 6px; padding: 2px 6px; font-size: 12px;'
            });
            ['javascript', 'python', 'html', 'css', 'bash', 'json', 'typescript', 'sql', 'markdown'].forEach(lang => {
                const opt = createElement('option', '', { value: lang, innerText: lang });
                if (lang === this.data.language) opt.selected = true;
                langSelect.appendChild(opt);
            });
            langSelect.addEventListener('change', () => {
                this.data.language = langSelect.value;
            });
            card.appendChild(langSelect);
        }

        const pre = createElement('pre');
        const code = createElement('code', `language-${this.data.language}`, {
            contentEditable: !this.readOnly,
            innerText: this.data.code || '// Paste or write code here...'
        });

        code.addEventListener('input', () => {
            this.data.code = code.innerText;
        });

        pre.appendChild(code);
        card.appendChild(pre);

        const caption = createElement('figcaption', '', {
            contentEditable: !this.readOnly,
            innerText: this.data.caption || ''
        });
        caption.addEventListener('input', () => {
            this.data.caption = caption.innerText;
        });
        card.appendChild(caption);

        return card;
    }

    save() {
        return this.data;
    }
}

// 9. Ghost Image Tool
export class GhostImageTool {
    static get toolbox() {
        return {
            title: 'Image',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`
        };
    }

    constructor({ data, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.data = {
            url: data.url || '',
            caption: data.caption || '',
            alt: data.alt || '',
            width: data.width || 'regular' // regular, wide, full
        };
    }

    render() {
        const card = createElement('figure', `kg-image-card ${this.data.width === 'wide' ? 'kg-width-wide' : this.data.width === 'full' ? 'kg-width-full' : ''}`);

        const img = createElement('img', '', {
            src: this.data.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="600" height="300" viewBox="0 0 600 300"%3E%3Crect fill="%23eee" width="600" height="300"/%3E%3Ctext fill="%23aaa" font-family="sans-serif" font-size="24" dy="10.5" font-weight="bold" x="50%25" y="50%25" text-anchor="middle"%3EImage%3C/text%3E%3C/svg%3E',
            alt: this.data.alt || ''
        });

        if (!this.readOnly) {
            const input = createElement('input', 'cdx-input', {
                placeholder: 'Image URL or paste image data URL...',
                value: this.data.url,
                style: 'margin-bottom: 8px;'
            });
            input.addEventListener('input', () => {
                this.data.url = input.value;
                img.src = input.value;
            });
            card.appendChild(input);
        }

        card.appendChild(img);

        const caption = createElement('figcaption', '', {
            contentEditable: !this.readOnly,
            innerText: this.data.caption || 'Type image caption (optional)'
        });
        caption.addEventListener('input', () => {
            this.data.caption = caption.innerText;
        });
        card.appendChild(caption);

        this.card = card;
        return card;
    }

    renderSettings() {
        const wrapper = createElement('div', 'cdx-settings');
        const widths = [
            { name: 'regular', label: 'Regular' },
            { name: 'wide', label: 'Wide' },
            { name: 'full', label: 'Full' }
        ];

        widths.forEach(w => {
            const btn = createElement('div', `cdx-settings-button ${this.data.width === w.name ? 'cdx-settings-button--active' : ''}`, {
                innerText: w.label
            });
            btn.onclick = () => {
                this.data.width = w.name;
                this.card.className = `kg-image-card ${w.name === 'wide' ? 'kg-width-wide' : w.name === 'full' ? 'kg-width-full' : ''}`;
                wrapper.querySelectorAll('.cdx-settings-button').forEach(b => b.classList.remove('cdx-settings-button--active'));
                btn.classList.add('cdx-settings-button--active');
            };
            wrapper.appendChild(btn);
        });
        return wrapper;
    }

    save() {
        return this.data;
    }
}

// 10. Ghost Embed Tool
export class GhostEmbedTool {
    static get toolbox() {
        return {
            title: 'Embed',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>`
        };
    }

    constructor({ data, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.data = {
            url: data.url || '',
            embed: data.embed || '',
            caption: data.caption || ''
        };
    }

    render() {
        const card = createElement('figure', 'kg-embed-card');

        if (!this.readOnly) {
            const input = createElement('input', 'cdx-input', {
                placeholder: 'Paste YouTube, Vimeo, CodePen, or generic media embed URL and press Enter...',
                value: this.data.url,
                style: 'margin-bottom: 8px;'
            });
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.processEmbed(input.value);
                }
            });
            card.appendChild(input);
        }

        this.embedContainer = createElement('div', 'kg-embed-container', {
            style: 'width: 100%;',
            innerHTML: this.data.embed || ''
        });
        card.appendChild(this.embedContainer);

        const caption = createElement('figcaption', '', {
            contentEditable: !this.readOnly,
            innerText: this.data.caption || ''
        });
        caption.addEventListener('input', () => {
            this.data.caption = caption.innerText;
        });
        card.appendChild(caption);

        return card;
    }

    processEmbed(url) {
        this.data.url = url;
        let html = '';
        if (url.includes('youtube.com/watch?v=') || url.includes('youtu.be/')) {
            const id = url.includes('youtu.be/') ? url.split('youtu.be/')[1].split('?')[0] : url.split('v=')[1].split('&')[0];
            html = `<iframe width="100%" height="360" src="https://www.youtube.com/embed/${id}" frameborder="0" allowfullscreen></iframe>`;
        } else if (url.includes('vimeo.com/')) {
            const id = url.split('vimeo.com/')[1].split('?')[0];
            html = `<iframe src="https://player.vimeo.com/video/${id}" width="100%" height="360" frameborder="0" allowfullscreen></iframe>`;
        } else if (url.includes('codepen.io/')) {
            const parts = url.split('/');
            const penId = parts[parts.length - 1];
            const user = parts[parts.indexOf('codepen.io') + 1];
            html = `<iframe height="360" style="width: 100%;" scrolling="no" title="CodePen Embed" src="https://codepen.io/${user}/embed/${penId}?default-tab=result" frameborder="no" allowfullscreen></iframe>`;
        } else {
            html = `<iframe width="100%" height="360" src="${url}" frameborder="0"></iframe>`;
        }
        this.data.embed = html;
        if (this.embedContainer) this.embedContainer.innerHTML = html;
    }

    save() {
        return this.data;
    }
}

// 11. Ghost HTML Tool
export class GhostHtmlTool {
    static get toolbox() {
        return {
            title: 'HTML',
            icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></svg>`
        };
    }

    constructor({ data, api, readOnly }) {
        this.api = api;
        this.readOnly = readOnly;
        this.data = {
            html: data.html || ''
        };
    }

    render() {
        const card = createElement('div', 'kg-html-card');
        const textarea = createElement('textarea', 'cdx-input', {
            style: 'width: 100%; min-height: 120px; font-family: monospace; font-size: 13px; resize: vertical;',
            placeholder: '<!-- Write raw HTML here -->',
            value: this.data.html
        });

        textarea.addEventListener('input', () => {
            this.data.html = textarea.value;
        });

        card.appendChild(textarea);
        return card;
    }

    save() {
        return this.data;
    }
}
