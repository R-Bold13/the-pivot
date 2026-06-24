import client from '../vendors/contentful-client.js';

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

function formatDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: '2-digit', year: 'numeric'
    });
}

function renderBgMedia(fields) {
    const { bgMediaAsset, bgMediaUrl } = fields;
    if (bgMediaUrl) {
        return isVideoUrl(bgMediaUrl)
            ? `<video loop muted playsinline data-src="${bgMediaUrl}"></video>`
            : `<img src="${bgMediaUrl}" alt="">`;
    }
    if (bgMediaAsset) {
        const url = assetUrl(bgMediaAsset, '?fm=webp&q=80');
        return isVideoAsset(bgMediaAsset)
            ? `<video loop muted playsinline data-src="${url}"></video>`
            : `<img src="${url}" alt="">`;
    }
    return '';
}

function renderInteractiveMedia(fields) {
    const { primaryMediaAsset, primaryMediaUrl } = fields;
    let media = '';
    if (primaryMediaUrl) {
        media = isVideoUrl(primaryMediaUrl)
            ? `<video loop muted playsinline data-src="${primaryMediaUrl}"></video>`
            : `<img src="${primaryMediaUrl}" alt="">`;
    } else if (primaryMediaAsset) {
        const url = assetUrl(primaryMediaAsset, '?fm=webp&q=80');
        media = isVideoAsset(primaryMediaAsset)
            ? `<video loop muted playsinline data-src="${url}"></video>`
            : `<img src="${url}" alt="">`;
    }
    return media ? `<div class="interactive-media">${media}</div>` : '';
}

function renderWorkCard(item) {
    const { clientName, slug, tagline, date, aspectRatio } = item.fields;
    const el = document.createElement('a');
    el.href = `/case-study/${slug}`;
    el.className = `index-item ${aspectRatio ?? ''} index-item--work`.trim();
    el.dataset.project = slug ?? '';
    el.innerHTML = `
        <div class="index-media">
            <div class="overlay"></div>
            ${renderInteractiveMedia(item.fields)}
            ${renderBgMedia(item.fields)}
        </div>
        <div class="item-meta-wrap">
            <div class="item-meta-clip">
                <div class="item-meta">
                    <span class="date">${formatDate(date)}</span>
                    <span>${tagline ?? ''}</span>
                </div>
            </div>
        </div>`;
    return el;
}

function renderListItem(item) {
    const { clientName, slug, tagline } = item.fields;
    const li = document.createElement('li');
    li.dataset.project = slug ?? '';
    li.innerHTML = `
        <a href="/case-study/${slug}" class="flex align-center gap-8">
            <div class="title-indicator flex gap-4 align-center">
                <span class="indicator"></span>
                <h4 class="text-capitalize">${clientName ?? ''}</h4>
            </div>
            <div class="item-meta">
                <p>${tagline ?? ''}</p>
            </div>
        </a>`;
    return li;
}

export async function initWorkIndex() {
    const list = document.querySelector('.work-list');

    const { items } = await client.getEntries({
        content_type: 'work',
        order: 'fields.col,fields.order',
        include: 1,
    });

    if (list) {
        list.innerHTML = '';
        items.forEach(item => list.appendChild(renderListItem(item)));
    }

    // Return cards instead of appending — initIndex merges all types and sorts
    // by `order` so types interleave freely within a column.
    return items.map(item => ({
        colIndex: (item.fields.col ?? 1) - 1,
        order: item.fields.order ?? Infinity,
        key: item.sys.id,
        el: renderWorkCard(item),
    }));
}
