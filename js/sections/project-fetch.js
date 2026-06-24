import client from '../vendors/contentful-client.js';
import gsap from '../vendors/gsap.js';
import { documentToHtmlString } from 'https://esm.sh/@contentful/rich-text-html-renderer@16';
import { MARKS } from 'https://esm.sh/@contentful/rich-text-types@16';

const richTextOptions = {
    renderMark: {
        [MARKS.BOLD]: (text) => `<span class="color-font-headline type-weight-medium">${text}</span>`
    }
};

function renderRichText(doc) {
    if (!doc) return '';
    return documentToHtmlString(doc, richTextOptions);
}

function renderRichTextInline(doc) {
    if (!doc) return '';
    return documentToHtmlString(doc, richTextOptions).replace(/<\/?p>/g, '');
}

function assetUrl(asset, params = '') {
    const url = asset?.fields?.file?.url;
    return url ? `https:${url}${params}` : '';
}

function isVideo(asset) {
    return asset?.fields?.file?.contentType?.startsWith('video/') ?? false;
}

function optimizeUrl(url) {
    if (!url || !url.includes('cloudinary.com')) return url;
    return url.replace('/upload/', '/upload/f_auto,q_auto/');
}

function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
    })[char]);
}

function isVideoUrl(url) {
    return !!url && (url.includes('.mp4') || url.includes('.webm'));
}

function renderMediaItem(item) {
    const { asset, mediaUrl, ratio } = item.fields;
    const src = mediaUrl ?? assetUrl(asset, '?fm=webp&q=80');
    const isCloudinaryVideo = mediaUrl && (mediaUrl.includes('.mp4') || mediaUrl.includes('.webm'));
    const media = (isCloudinaryVideo || isVideo(asset))
        ? `<video src="${optimizeUrl(src)}" loop muted autoplay playsinline preload="metadata"></video>`
        : `<img src="${optimizeUrl(src)}" alt="">`;
    return `<div class="media-item ${ratio}">${media}</div>`;
}

function renderMediaColumn(col) {
    const items = col.fields.items?.map(renderMediaItem).join('') ?? '';
    return `<div class="media-col">${items}</div>`;
}

function renderModuleMedia(fields) {
    const { variant, caption, hasCaption, items } = fields;
    const captionClass = hasCaption ? 'module-media--w-caption' : '';

    const renderedItems = items?.map(item => {
        const type = item.sys.contentType.sys.id;
        if (type === 'mediaColumn') return renderMediaColumn(item);
        return renderMediaItem(item);
    }).join('') ?? '';

    return `
        <div class="module-media ${variant} ${captionClass}">
            ${caption ? `<div class="caption"><p class="type-label-10 color-font-base">${caption}</p></div>` : ''}
            ${renderedItems}
        </div>`;
}

function renderModuleHeadline(fields) {
    const { variant, item1Eyebrow, item1Subheading, item1Body, item2Eyebrow, item2Subheading, item2Body } = fields;

    return `
        <div class="module-headline ${variant}">
            <div class="content-row">
                <div class="content-row-item">
                    <div class="eyebrow"><p class="type-body-12 type-weight-medium color-font-weak">${renderRichTextInline(item1Eyebrow)}</p></div>
                    <div class="content-row-item-group">
                        <div class="type-heading-16 color-font-base"><p>${item1Subheading ?? ''}</p></div>
                        <div class="type-body-11 color-font-base">${renderRichText(item1Body)}</div>
                    </div>
                </div>
                <div class="content-row-item">
                    <div class="eyebrow"><p class="type-body-12 type-weight-medium color-font-weak">${renderRichTextInline(item2Eyebrow)}</p></div>
                    <div class="content-row-item-group">
                        <div class="type-heading-16 color-font-base"><p>${item2Subheading ?? ''}</p></div>
                        <div class="type-body-11 color-font-base">${renderRichText(item2Body)}</div>
                    </div>
                </div>
            </div>
        </div>`;
}

function renderModuleDivider(fields) {
    return `
        <div class="module module-divider headline">
            <span></span>
            <p class="type-label-11">${fields.label ?? ''}</p>
            <span></span>
        </div>`;
}

function renderModule(module) {
    const type = module.sys.contentType.sys.id;
    if (type === 'moduleHeadline') return renderModuleHeadline(module.fields);
    if (type === 'moduleMedia')    return renderModuleMedia(module.fields);
    if (type === 'moduleGroup')    return renderModuleGroup(module.fields);
    if (type === 'moduleDivider')  return renderModuleDivider(module.fields);
    return '';
}

function renderModuleGroup(fields) {
    const modules = fields.modules?.map(renderModule).join('') ?? '';
    return `<div class="module-group">${modules}</div>`;
}

function renderModuleSection(section) {
    const { dividerLabel, modules } = section.fields;
    const renderedModules = modules?.map(renderModule).join('') ?? '';

    return `
        <div class="module-section">
            ${dividerLabel ? `
            <div class="module module-divider headline">
                <span></span>
                <p class="type-meta-11">${dividerLabel}</p>
                <span></span>
            </div>` : ''}
            ${renderedModules}
        </div>`;
}

function renderMetaItems(items) {
    if (!items?.length) return '';
    return items.map(item => {
        const { label, value } = item.fields;
        const display = Array.isArray(value) ? value.join(', ') : (value ?? '');
        return `
            <div class="meta-item flex">
                <div class="meta-label flex-1">
                    <span class="type-label-11 color-font-headline">${label}</span>
                </div>
                <div class="meta-value type-body-11 color-font-base">
                    <p>${display}</p>
                </div>
            </div>`;
    }).join('');
}

function renderOverview(fields) {
    const { clientName, overviewBody, headline, metaItems } = fields;

    return `
        <section class="project-overview">
            <div class="overview-content">
                <div class="card">
                    <div class="vertical-stack gap-12">
                        <div class="overview-eyebrow text-center">
                            <span class="type-label-11 color-font-headline">The Overview</span>
                        </div>
                        <div class="overview-body">
                            <p class="type-body-11 color-font-base text-center">${overviewBody ?? ''}</p>
                        </div>
                    </div>
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb type-body-11 justify-center flex">
                            <li><a href="/index.html">Index</a></li>
                            <li><a href="/work">Work</a></li>
                            <li aria-current="page">${clientName ?? ''}</li>
                        </ol>
                    </nav>
                </div>
                <div class="project-meta flex-column gap-40" data-reveal>
                    <h2 class="project-headline">
                        <span class="type-subheading-20 color-font-headline">${headline ?? ''}</span>
                    </h2>
                    <div class="vertical-stack gap-20">
                        ${renderMetaItems(metaItems)}
                    </div>
                </div>
            </div>
        </section>`;
}

function renderOverviewMedia(asset) {
    if (!asset) return '';
    return `
        <section class="overview-media" data-reveal>
            <div class="media-container">
                <img src="${assetUrl(asset, '?fm=webp&q=80')}" alt="">
            </div>
        </section>`;
}

function renderPage(fields) {
    const { overviewMedia, moduleSections } = fields;
    const sections = moduleSections?.map(renderModuleSection).join('') ?? '';

    return `
        ${renderOverview(fields)}
        ${renderOverviewMedia(overviewMedia)}
        <section class="project-modules" data-reveal>
            ${sections}
        </section>`;
}

function footerMediaUrl(fields) {
    if (fields.primaryMediaUrl) return fields.primaryMediaUrl;
    if (fields.primaryMediaAsset) return assetUrl(fields.primaryMediaAsset, '?fm=webp&q=80');
    if (fields.bgMediaUrl) return fields.bgMediaUrl;
    if (fields.bgMediaAsset) return assetUrl(fields.bgMediaAsset, '?fm=webp&q=80');
    if (fields.overviewMedia) return assetUrl(fields.overviewMedia, '?fm=webp&q=80');
    return '';
}

function footerMediaIsVideo(fields, src) {
    if (fields.primaryMediaUrl || fields.bgMediaUrl) return isVideoUrl(src);
    return isVideo(fields.primaryMediaAsset) || isVideo(fields.bgMediaAsset);
}

function renderFooterMedia(fields) {
    const src = footerMediaUrl(fields);
    if (!src) return '';

    const optimizedSrc = optimizeUrl(src);
    return footerMediaIsVideo(fields, src)
        ? `<video src="${optimizedSrc}" loop muted autoplay playsinline preload="metadata"></video>`
        : `<img src="${optimizedSrc}" alt="">`;
}

function renderNextProjectFooter(root, nextProject) {
    const footerContent = root.querySelector('.row--controls > .flex-column');
    if (!footerContent) return;

    if (!nextProject?.fields?.slug) {
        footerContent.hidden = true;
        return;
    }

    const fields = nextProject.fields;
    const link = footerContent.querySelector(':scope > a');
    if (!link) return;

    const outputType = fields.outputType ?? '';
    link.href = `/case-study/${fields.slug}`;
    link.innerHTML = `
        <div class="flex-column gap-12">
            <h2 class="type-heading-20 color-font-base"><span>${escapeHtml(fields.clientName)}</span></h2>
            <div class="case-study-overview overflow-hidden type-label-12 color-font-medium type-weight-medium">
                <p style="width: 178px;">${escapeHtml(fields.tagline)}</p>
            </div>
        </div>
        <div class="media-meta flex-column gap-12">
            <div class="media-container">
                ${renderFooterMedia(fields)}
            </div>
            <div class="case-study--meta flex justify-between type-body-11 color-font-medium type-weight-medium text-capitalize">
                <div class="output-type overflow-hidden">
                    <span>${escapeHtml(outputType)}</span>
                </div>
                <span class="icon overflow-hidden"><span>→</span></span>
            </div>
        </div>`;
}

export async function initProjectFetch(root = document) {
    if (!root.querySelector('.page-inner')) return;

    // Slug lives in the URL: /case-study/<slug>
    const slug = location.pathname.split('/case-study/')[1]?.replace(/\/$/, '');
    if (!slug) return;

    const { items } = await client.getEntries({
        content_type: 'work',
        'fields.slug': slug,
        include: 4,
        limit: 1,
    });

    if (!items.length) return;

    const pageInner = root.querySelector('.page-inner');
    if (!pageInner) return;

    pageInner.innerHTML = renderPage(items[0].fields);
    renderNextProjectFooter(root, items[0].fields.nextProject);

    // Entrance: the overview card drops in from completely off-screen (top),
    // and the rest of the content cascades in just behind it.
    const card = pageInner.querySelector('.project-overview .card');
    const cascade = pageInner.querySelectorAll('[data-reveal]');

    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    if (card) {
        // Start above the viewport (its bottom at the top edge), slide to place.
        tl.from(card, {
            y: () => -(card.getBoundingClientRect().bottom + 20),
            duration: 1.1,
            ease: 'power3.out',
        }, 0);
    }

    tl.to(cascade, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
    }, 0.85);
}
