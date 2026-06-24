import client from '../vendors/contentful-client.js';
import { openEntry } from './entry.js';

function assetUrl(asset, params = '') {
    const url = asset?.fields?.file?.url;
    return url ? `https:${url}${params}` : '';
}

function isVideoAsset(asset) {
    return asset?.fields?.file?.contentType?.startsWith('video/') ?? false;
}

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: '2-digit', year: 'numeric'
    });
}

// discipline is a single value, but tolerate a list field too.
function disciplineLabel(discipline) {
    return Array.isArray(discipline) ? discipline.join(', ') : (discipline ?? '');
}

// Modal media: autoplay in place (the card is small + non-scrollable).
function renderModalMedia(media) {
    if (!media) return '';
    const inner = isVideoAsset(media)
        ? `<video src="${assetUrl(media)}" loop muted autoplay playsinline></video>`
        : `<img src="${assetUrl(media, '?fm=webp&q=80')}" alt="">`;
    return `<div class="media-container">${inner}</div>`;
}

// Card media: video is lazy-loaded via data-src (endless-scroll + IntersectionObserver in index.js).
function renderCardMedia(media) {
    if (!media) return '';
    return isVideoAsset(media)
        ? `<video loop muted playsinline data-src="${assetUrl(media)}"></video>`
        : `<img src="${assetUrl(media, '?fm=webp&q=80')}" alt="">`;
}

function renderCard(fields) {
    const { heading, discipline, reflection, media, logDate, relatedEntry } = fields;
    const relatedSlug = relatedEntry?.fields?.slug;

    return `
        <div class="row row--header align-center justify-between">
            <div class="influence-type type-label-12 type-weight-medium color-font-inverse">
                <span class="discipline">${disciplineLabel(discipline)}</span>
                <span>Logged <span>${formatDate(logDate)}</span></span>
            </div>
            <button class="modal-close color-font-inverse type-label-12 type-weight-medium">
                <span>[</span>
                <span> x </span>
                <span>]</span>
            </button>
        </div>
        <div class="row row--content gap-12">
            <h2 class="influence-title text-capitalize color-font-inverse-strong type-heading-24">${heading ?? ''}</h2>
            <div class="overview">
                <p class="type-body-11 color-font-inverse">${reflection ?? ''}</p>
            </div>
            ${renderModalMedia(media)}
        </div>
        ${relatedSlug ? `
        <div class="row row--footer justify-center align-center">
            <button class="primary" data-entry="${relatedSlug}">the longer thought</button>
        </div>` : ''}`;
}

const overlay = document.querySelector('.influence-modal--overlay');
const card = overlay?.querySelector('.influence-modal--card');

export async function openInfluence(slug) {
    const { items } = await client.getEntries({
        content_type: 'influence',
        'fields.slug': slug,
        include: 2,
        limit: 1,
    });

    if (!items.length) return;

    const fields = items[0].fields;
    const relatedSlug = fields.relatedEntry?.fields?.slug;

    card.innerHTML = renderCard(fields);
    card.classList.toggle('no-cta', !relatedSlug);

    card.querySelector('.modal-close').addEventListener('click', closeInfluence);

    // "the longer thought" cross-fades: hide influence, open the related entry.
    if (relatedSlug) {
        card.querySelector('.row--footer .primary').addEventListener('click', (e) => {
            e.preventDefault();
            overlay.classList.remove('is-active');
            openEntry(relatedSlug);
        });
    }

    overlay.classList.add('is-active');
    history.pushState({ influenceSlug: slug }, '', `/influence/${slug}`);
}

export function closeInfluence() {
    overlay.classList.remove('is-active');
    history.pushState({}, '', '/');
}

export function bindInfluence(item) {
    if (!item.dataset.influence) return;
    item.addEventListener('click', (e) => {
        e.preventDefault();
        openInfluence(item.dataset.influence);
    });
}

function renderListItem({ fields }) {
    const { title, slug, tagline } = fields;
    return `
        <li class="flex align-center gap-8" data-influence="${slug}">
            <a href="/influence/${slug}" data-influence="${slug}" class="flex align-center gap-8 width-full">
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

function renderInfluenceCard(item) {
    const { slug, tagline, logDate, media, aspectRatio } = item.fields;
    const el = document.createElement('a');
    el.href = `/influence/${slug}`;
    el.className = `index-item ${aspectRatio ?? 'index-item--landscape'}`.trim();
    el.dataset.influence = slug ?? '';
    el.innerHTML = `
        <div class="index-media">
            <div class="overlay"></div>
            ${renderCardMedia(media)}
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

export async function initInfluenceIndex() {
    const list = document.querySelector('.influence-list');

    const { items } = await client.getEntries({
        content_type: 'influence',
        order: 'fields.col,fields.order',
        include: 1,
    });

    if (list) {
        list.innerHTML = items.map(renderListItem).join('');
        list.querySelectorAll('a[data-influence]').forEach(bindInfluence);
    }

    // Return cards instead of appending — initIndex merges all types and sorts
    // by `order` so types interleave freely within a column.
    return items.map(item => {
        const cardEl = renderInfluenceCard(item);
        bindInfluence(cardEl);
        return {
            colIndex: (item.fields.col ?? 1) - 1,
            order: item.fields.order ?? Infinity,
            key: item.sys.id,
            el: cardEl,
        };
    });
}

export function initInfluence() {
    const match = window.location.pathname.match(/^\/influence\/(.+)$/);
    if (match) openInfluence(match[1]);

    window.addEventListener('popstate', () => {
        const m = window.location.pathname.match(/^\/influence\/(.+)$/);
        if (m) openInfluence(m[1]);
        else overlay?.classList.remove('is-active');
    });
}
