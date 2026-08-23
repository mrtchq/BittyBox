/**
 * Ghost CMS Koenig HTML Renderer & Parser for Editor.js in Bitty Box
 */

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Converts Editor.js data object into Ghost CMS Koenig semantic HTML.
 */
export function editorJsToGhostHtml(data) {
    if (!data || !data.blocks || !Array.isArray(data.blocks)) {
        return '';
    }

    const htmlParts = [];

    // Ensure ghost-cards.css is referenced
    htmlParts.push('<link rel="stylesheet" href="/ghost-cards.css">');

    for (const block of data.blocks) {
        const { type, data: d } = block;

        switch (type) {
            case 'paragraph':
                if (d.text && d.text.trim()) {
                    htmlParts.push(`<p>${d.text}</p>`);
                }
                break;

            case 'header':
                const level = d.level || 2;
                htmlParts.push(`<h${level}>${d.text}</h${level}>`);
                break;

            case 'list':
                const tag = d.style === 'ordered' ? 'ol' : 'ul';
                const items = (d.items || []).map(i => `<li>${typeof i === 'string' ? i : i.content || ''}</li>`).join('');
                htmlParts.push(`<${tag}>${items}</${tag}>`);
                break;

            case 'checklist':
                const checkItems = (d.items || []).map(i => `
                    <li class="kg-checklist-item" style="list-style:none; display:flex; align-items:center; gap:8px;">
                        <input type="checkbox" ${i.checked ? 'checked' : ''} disabled>
                        <span>${i.text}</span>
                    </li>
                `).join('');
                htmlParts.push(`<ul class="kg-checklist" style="padding-left:0;">${checkItems}</ul>`);
                break;

            case 'quote':
                const isPullquote = d.alignment === 'center';
                const quoteClass = isPullquote ? 'kg-blockquote-card kg-pullquote-card' : 'kg-blockquote-card';
                htmlParts.push(`
                    <blockquote class="${quoteClass}">
                        <p>${d.text || ''}</p>
                        ${d.caption ? `<cite>${d.caption}</cite>` : ''}
                    </blockquote>
                `);
                break;

            case 'delimiter':
                htmlParts.push('<hr class="kg-divider-card">');
                break;

            case 'code':
            case 'ghostCode':
                htmlParts.push(`
                    <figure class="kg-code-card">
                        <pre><code class="language-${d.language || 'javascript'}">${escapeHtml(d.code || '')}</code></pre>
                        ${d.caption ? `<figcaption>${d.caption}</figcaption>` : ''}
                    </figure>
                `);
                break;

            case 'image':
            case 'ghostImage':
                const widthClass = d.width === 'wide' ? 'kg-width-wide' : d.width === 'full' ? 'kg-width-full' : '';
                htmlParts.push(`
                    <figure class="kg-image-card ${widthClass}">
                        <img src="${d.url || ''}" alt="${escapeHtml(d.alt || '')}">
                        ${d.caption ? `<figcaption>${d.caption}</figcaption>` : ''}
                    </figure>
                `);
                break;

            case 'callout':
            case 'ghostCallout':
                htmlParts.push(`
                    <div class="kg-callout-card kg-callout-card-${d.color || 'accent'}">
                        <div class="kg-callout-emoji">${d.emoji || '💡'}</div>
                        <div class="kg-callout-text">${d.text || ''}</div>
                    </div>
                `);
                break;

            case 'bookmark':
            case 'ghostBookmark':
                htmlParts.push(`
                    <figure class="kg-bookmark-card">
                        <a class="kg-bookmark-container" href="${d.url || '#'}" target="_blank">
                            <div class="kg-bookmark-content">
                                <div class="kg-bookmark-title">${d.title || ''}</div>
                                <div class="kg-bookmark-description">${d.description || ''}</div>
                                <div class="kg-bookmark-metadata">
                                    ${d.icon ? `<img src="${d.icon}" class="kg-bookmark-icon">` : ''}
                                    <span class="kg-bookmark-publisher">${d.publisher || ''}</span>
                                    ${d.author ? `<span class="kg-bookmark-author">• ${d.author}</span>` : ''}
                                </div>
                            </div>
                            ${d.thumbnail ? `<div class="kg-bookmark-thumbnail"><img src="${d.thumbnail}"></div>` : ''}
                        </a>
                    </figure>
                `);
                break;

            case 'button':
            case 'ghostButton':
                htmlParts.push(`
                    <div class="kg-button-card kg-align-${d.alignment || 'center'}">
                        <a class="kg-btn ${d.accent ? 'kg-btn-accent' : ''}" href="${d.buttonUrl || '#'}" target="_blank">${d.buttonText || 'Click here'}</a>
                    </div>
                `);
                break;

            case 'toggle':
            case 'ghostToggle':
                htmlParts.push(`
                    <div class="kg-toggle-card">
                        <div class="kg-toggle-heading" onclick="this.parentElement.toggleAttribute('data-kg-toggle-state')">
                            <h4 class="kg-toggle-heading-text">${d.heading || ''}</h4>
                            <button class="kg-toggle-card-icon">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
                            </button>
                        </div>
                        <div class="kg-toggle-content">${d.content || ''}</div>
                    </div>
                `);
                break;

            case 'audio':
            case 'ghostAudio':
                htmlParts.push(`
                    <div class="kg-audio-card">
                        <div class="kg-audio-thumbnail">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                        </div>
                        <div class="kg-audio-player-container">
                            <div class="kg-audio-title">${d.title || ''}</div>
                            <div class="kg-audio-artist">${d.artist || ''}</div>
                            <audio controls src="${d.src || ''}"></audio>
                        </div>
                    </div>
                `);
                break;

            case 'video':
            case 'ghostVideo':
                htmlParts.push(`
                    <figure class="kg-video-card">
                        <video controls src="${d.src || ''}"></video>
                        ${d.caption ? `<figcaption>${d.caption}</figcaption>` : ''}
                    </figure>
                `);
                break;

            case 'product':
            case 'ghostProduct':
                const rating = d.rating || 5;
                const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
                htmlParts.push(`
                    <div class="kg-product-card">
                        <div class="kg-product-card-container">
                            ${d.image ? `<img src="${d.image}" class="kg-product-card-image">` : ''}
                            <h3 class="kg-product-card-title">${d.title || ''}</h3>
                            <div class="kg-product-card-rating">${stars}</div>
                            <div class="kg-product-card-description">${d.description || ''}</div>
                            <div class="kg-product-card-button">
                                <a class="kg-btn kg-btn-accent" href="${d.buttonUrl || '#'}" target="_blank">${d.buttonText || 'Buy Now'}</a>
                            </div>
                        </div>
                    </div>
                `);
                break;

            case 'embed':
            case 'ghostEmbed':
                htmlParts.push(`
                    <figure class="kg-embed-card">
                        <div class="kg-embed-container">${d.embed || ''}</div>
                        ${d.caption ? `<figcaption>${d.caption}</figcaption>` : ''}
                    </figure>
                `);
                break;

            case 'html':
            case 'raw':
            case 'ghostHtml':
                htmlParts.push(d.html || '');
                break;

            default:
                if (d.text) htmlParts.push(`<p>${d.text}</p>`);
                break;
        }
    }

    return htmlParts.join('\n');
}

/**
 * Converts raw HTML / Ghost Koenig HTML back into Editor.js data object.
 */
export function ghostHtmlToEditorJs(html) {
    if (!html || !html.trim()) {
        return { blocks: [] };
    }

    // Try parsing as JSON first in case Editor.js JSON was serialized
    if (html.trim().startsWith('{') && html.trim().endsWith('}')) {
        try {
            const parsed = JSON.parse(html);
            if (parsed && Array.isArray(parsed.blocks)) {
                return parsed;
            }
        } catch (e) {}
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks = [];

    const nodes = Array.from(doc.body.childNodes);

    for (const node of nodes) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent.trim();
            if (text) {
                blocks.push({ type: 'paragraph', data: { text } });
            }
            continue;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) continue;

        const el = node;
        const tag = el.tagName.toLowerCase();

        if (tag === 'link' || tag === 'style' || tag === 'script') {
            continue;
        }

        // Headings
        if (/^h[1-6]$/.test(tag)) {
            const level = parseInt(tag.charAt(1), 10);
            blocks.push({
                type: 'header',
                data: { text: el.innerHTML, level }
            });
            continue;
        }

        // Paragraphs
        if (tag === 'p') {
            blocks.push({
                type: 'paragraph',
                data: { text: el.innerHTML }
            });
            continue;
        }

        // Lists
        if (tag === 'ul' || tag === 'ol') {
            if (el.classList.contains('kg-checklist')) {
                const items = Array.from(el.querySelectorAll('li')).map(li => ({
                    text: li.querySelector('span')?.innerHTML || li.innerText,
                    checked: !!li.querySelector('input[type="checkbox"]:checked')
                }));
                blocks.push({ type: 'checklist', data: { items } });
            } else {
                const items = Array.from(el.querySelectorAll('li')).map(li => li.innerHTML);
                blocks.push({
                    type: 'list',
                    data: {
                        style: tag === 'ol' ? 'ordered' : 'unordered',
                        items
                    }
                });
            }
            continue;
        }

        // Quote
        if (tag === 'blockquote') {
            const p = el.querySelector('p');
            const cite = el.querySelector('cite');
            blocks.push({
                type: 'quote',
                data: {
                    text: p ? p.innerHTML : el.innerHTML,
                    caption: cite ? cite.innerHTML : '',
                    alignment: el.classList.contains('kg-pullquote-card') ? 'center' : 'left'
                }
            });
            continue;
        }

        // Divider
        if (tag === 'hr') {
            blocks.push({ type: 'delimiter', data: {} });
            continue;
        }

        // Callout Card
        if (el.classList.contains('kg-callout-card')) {
            const emojiEl = el.querySelector('.kg-callout-emoji');
            const textEl = el.querySelector('.kg-callout-text');
            let color = 'accent';
            for (const c of ['green', 'yellow', 'red', 'purple', 'default']) {
                if (el.classList.contains(`kg-callout-card-${c}`)) color = c;
            }
            blocks.push({
                type: 'ghostCallout',
                data: {
                    emoji: emojiEl ? emojiEl.innerText.trim() : '💡',
                    text: textEl ? textEl.innerHTML : '',
                    color
                }
            });
            continue;
        }

        // Bookmark Card
        if (el.classList.contains('kg-bookmark-card')) {
            const a = el.querySelector('a.kg-bookmark-container');
            const title = el.querySelector('.kg-bookmark-title')?.innerText || '';
            const description = el.querySelector('.kg-bookmark-description')?.innerText || '';
            const publisher = el.querySelector('.kg-bookmark-publisher')?.innerText || '';
            const author = el.querySelector('.kg-bookmark-author')?.innerText?.replace(/^•\s*/, '') || '';
            const icon = el.querySelector('.kg-bookmark-icon')?.getAttribute('src') || '';
            const thumbnail = el.querySelector('.kg-bookmark-thumbnail img')?.getAttribute('src') || '';
            blocks.push({
                type: 'ghostBookmark',
                data: {
                    url: a?.getAttribute('href') || '',
                    title,
                    description,
                    publisher,
                    author,
                    icon,
                    thumbnail
                }
            });
            continue;
        }

        // Button Card
        if (el.classList.contains('kg-button-card')) {
            const btn = el.querySelector('a.kg-btn');
            blocks.push({
                type: 'ghostButton',
                data: {
                    buttonText: btn ? btn.innerText : 'Click here',
                    buttonUrl: btn ? btn.getAttribute('href') : 'https://',
                    alignment: el.classList.contains('kg-align-left') ? 'left' : 'center',
                    accent: btn?.classList.contains('kg-btn-accent') ?? true
                }
            });
            continue;
        }

        // Toggle Card
        if (el.classList.contains('kg-toggle-card')) {
            const heading = el.querySelector('.kg-toggle-heading-text')?.innerHTML || '';
            const content = el.querySelector('.kg-toggle-content')?.innerHTML || '';
            blocks.push({
                type: 'ghostToggle',
                data: { heading, content }
            });
            continue;
        }

        // Audio Card
        if (el.classList.contains('kg-audio-card')) {
            const title = el.querySelector('.kg-audio-title')?.innerText || '';
            const artist = el.querySelector('.kg-audio-artist')?.innerText || '';
            const audio = el.querySelector('audio');
            blocks.push({
                type: 'ghostAudio',
                data: {
                    title,
                    artist,
                    src: audio ? audio.getAttribute('src') || '' : ''
                }
            });
            continue;
        }

        // Video Card
        if (el.classList.contains('kg-video-card')) {
            const video = el.querySelector('video');
            const caption = el.querySelector('figcaption')?.innerText || '';
            blocks.push({
                type: 'ghostVideo',
                data: {
                    src: video ? video.getAttribute('src') || '' : '',
                    caption
                }
            });
            continue;
        }

        // Product Card
        if (el.classList.contains('kg-product-card')) {
            const img = el.querySelector('.kg-product-card-image')?.getAttribute('src') || '';
            const title = el.querySelector('.kg-product-card-title')?.innerText || '';
            const desc = el.querySelector('.kg-product-card-description')?.innerText || '';
            const btn = el.querySelector('.kg-btn');
            blocks.push({
                type: 'ghostProduct',
                data: {
                    image: img,
                    title,
                    rating: 5,
                    description: desc,
                    buttonText: btn ? btn.innerText : 'Buy Now',
                    buttonUrl: btn ? btn.getAttribute('href') : 'https://'
                }
            });
            continue;
        }

        // Code Card
        if (el.classList.contains('kg-code-card') || tag === 'pre') {
            const codeEl = el.querySelector('code') || el;
            const caption = el.querySelector('figcaption')?.innerText || '';
            let lang = 'javascript';
            const match = (codeEl.className || '').match(/language-(\w+)/);
            if (match) lang = match[1];
            blocks.push({
                type: 'ghostCode',
                data: {
                    code: codeEl.innerText || '',
                    language: lang,
                    caption
                }
            });
            continue;
        }

        // Image Card
        if (el.classList.contains('kg-image-card') || tag === 'figure') {
            const img = el.querySelector('img');
            if (img) {
                const caption = el.querySelector('figcaption')?.innerText || '';
                let width = 'regular';
                if (el.classList.contains('kg-width-wide')) width = 'wide';
                if (el.classList.contains('kg-width-full')) width = 'full';
                blocks.push({
                    type: 'ghostImage',
                    data: {
                        url: img.getAttribute('src') || '',
                        caption,
                        alt: img.getAttribute('alt') || '',
                        width
                    }
                });
                continue;
            }
        }

        // Embed Card
        if (el.classList.contains('kg-embed-card')) {
            const container = el.querySelector('.kg-embed-container') || el;
            const caption = el.querySelector('figcaption')?.innerText || '';
            blocks.push({
                type: 'ghostEmbed',
                data: {
                    embed: container.innerHTML,
                    caption
                }
            });
            continue;
        }

        // Fallback to HTML or paragraph
        if (el.innerHTML && el.innerHTML.trim()) {
            blocks.push({
                type: 'paragraph',
                data: { text: el.innerHTML }
            });
        }
    }

    return { blocks };
}
