import client from '../vendors/contentful-client.js';
import { getModalLenis } from '../core/lenis.js';

function assetUrl(asset, params = '') {
    const url = asset?.fields?.file?.url;
    return url ? `https:${url}${params}` : '';
}

function isVideoAsset(asset) {
    return asset?.fields?.file?.contentType?.startsWith('video/') ?? false;
}

function isVideoUrl(url) {
    return !!url && (url.includes('.mp4') || url.includes('.webm'));
}

// Card thumbnail: Cloudinary URL wins over Contentful asset (mirrors work.js).
// Videos use data-src so initVideoObserver lazy-loads + plays them on scroll.
function renderThumbnail(thumbnail, thumbnailUrl) {
    if (thumbnailUrl) {
        return isVideoUrl(thumbnailUrl)
            ? `<video loop muted playsinline data-src="${thumbnailUrl}"></video>`
            : `<img src="${thumbnailUrl}" alt="">`;
    }
    if (thumbnail) {
        return isVideoAsset(thumbnail)
            ? `<video loop muted playsinline data-src="${assetUrl(thumbnail)}"></video>`
            : `<img src="${assetUrl(thumbnail, '?fm=webp&q=80')}" alt="">`;
    }
    return '';
}

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: '2-digit', year: 'numeric'
    });
}

function renderMedia(asset) {
    if (!asset) return '';
    const url = assetUrl(asset, '?fm=webp&q=80');
    const isVideo = asset?.fields?.file?.contentType?.startsWith('video/');
    const media = isVideo
        ? `<video src="${url}" loop muted autoplay playsinline></video>`
        : `<img src="${url}" alt="">`;
    return `<div class="media-container">${media}</div>`;
}

function renderBlock(block) {
    const { title, body, media } = block.fields;
    return `
        <div class="entry-block">
            <div class="title-body-container flex-column gap-12">
                ${title ? `<div class="entry-title text-capitalize color-font-inverse-strong type-heading-17">${title}</div>` : ''}
                <div class="entry-overview-body">
                    <p class="type-body-11 color-font-inverse">${body ?? ''}</p>
                </div>
            </div>
            ${renderMedia(media)}
        </div>`;
}

function renderModal(fields) {
    const { title, logDate, overview, headerMedia, blocks } = fields;
    const renderedBlocks = blocks?.map(renderBlock).join('') ?? '';

    return `
        <div>
            <div class="color-font-inverse type-label-12 type-weight-medium">
                <span>Logged:</span>
                <span class="date">${formatDate(logDate)}</span>
            </div>
            <button class="modal-close color-font-inverse type-label-12 type-weight-medium">
                <span>[</span>
                <span>x</span>
                <span>]</span>
            </button>
        </div>
        <div class="entry-header">
            <div class="entry-overview flex-column gap-40">
                <div class="title-body-container flex-column gap-12">
                    <h2 class="entry-title text-capitalize color-font-inverse-strong type-heading-24">${title ?? ''}</h2>
                    <div class="entry-overview-body">
                        <p class="type-body-11 color-font-inverse">${overview ?? ''}</p>
                    </div>
                </div>
                ${renderMedia(headerMedia)}
            </div>
        </div>
        ${renderedBlocks}`;
}

const overlay = document.querySelector('.entry-modal--overlay');
const modalInner = overlay?.querySelector('.entry-modal--inner');

export async function openEntry(slug) {
    const { items } = await client.getEntries({
        content_type: 'entry',
        'fields.slug': slug,
        include: 2,
        limit: 1,
    });

    if (!items.length) return;

    modalInner.innerHTML = renderModal(items[0].fields);
    getModalLenis()?.scrollTo(0, { immediate: true });
    getModalLenis()?.resize();

    modalInner.querySelector('.modal-close').addEventListener('click', closeEntry);

    overlay.classList.add('is-active');
    history.pushState({ entrySlug: slug }, '', `/entry/${slug}`);
}

export function closeEntry() {
    overlay.classList.remove('is-active');
    history.pushState({}, '', '/');
}

export function bindEntry(item) {
    if (!item.dataset.entry) return;
    item.addEventListener('click', (e) => {
        e.preventDefault();
        openEntry(item.dataset.entry);
    });
}

function renderListItem({ fields }) {
    const { title, slug, tagline } = fields;
    return `
        <li class="flex align-center gap-8" data-entry="${slug}">
            <a href="/entry/${slug}" data-entry="${slug}" class="flex align-center gap-8 width-full">
                <div class="title-indicator flex gap-4 align-center">
                    <span class="indicator"></span>
                    <h4 class="text-capitalize">${title ?? ''}</h4>
                </div>
                <div class="item-meta">
                    <p>${tagline ?? ''}</p>
                </div>
            </a>
        </li>`;
}

function renderEntryCard(item) {
    const { slug, tagline, logDate, thumbnail, thumbnailUrl, aspectRatio } = item.fields;
    const el = document.createElement('a');
    el.href = `/entry/${slug}`;
    el.className = `index-item ${aspectRatio ?? ''}`.trim();
    el.dataset.entry = slug ?? '';
    el.innerHTML = `
        <div class="index-media">
            <div class="overlay"></div>
            ${renderThumbnail(thumbnail, thumbnailUrl)}
        </div>
        <div class="item-meta-wrap">
            <div class="item-meta-clip">
                <div class="item-meta">
                    <span class="date">${formatDate(logDate)}</span>
                    <span>${tagline ?? ''}</span>
                </div>
            </div>
        </div>`;
    return el;
}

export async function initEntryIndex() {
    const list = document.querySelector('.entry-list');

    const { items } = await client.getEntries({
        content_type: 'entry',
        order: 'fields.col,fields.order',
        include: 1,
    });

    if (list) {
        list.innerHTML = items.map(renderListItem).join('');
        list.querySelectorAll('a[data-entry]').forEach(bindEntry);
    }

    // Return cards instead of appending — initIndex merges all types and sorts
    // by `order` so types interleave freely within a column.
    return items.map(item => {
        const card = renderEntryCard(item);
        bindEntry(card);
        return {
            colIndex: (item.fields.col ?? 1) - 1,
            order: item.fields.order ?? Infinity,
            key: item.sys.id,
            el: card,
        };
    });
}

export function initEntry() {

    const match = window.location.pathname.match(/^\/entry\/(.+)$/);
    if (match) openEntry(match[1]);

    window.addEventListener('popstate', () => {
        const m = window.location.pathname.match(/^\/entry\/(.+)$/);
        if (m) openEntry(m[1]);
        else overlay.classList.remove('is-active');
    });
}
