import gsap from '../vendors/gsap.js';
import { getLenis } from '../core/lenis.js';
import { bindEntry, initEntryIndex } from '../components/entry.js';
import { initWorkIndex } from '../components/work.js';
import { bindInfluence, initInfluenceIndex } from '../components/influence.js';

// ── Hover sync ─────────────────────────────────────────────────────────────

const ITEM_TYPES = ['project', 'entry', 'influence'];

function bindHover(item) {
    const type = ITEM_TYPES.find(t => item.dataset[t]);
    if (!type) return;
    const slug = item.dataset[type];

    item.addEventListener('mouseenter', () => {
        document.querySelectorAll(`.category-block li[data-${type}]`).forEach(li => {
            li.classList.toggle('is-active', li.dataset[type] === slug);
        });
    });

    item.addEventListener('mouseleave', () => {
        document.querySelectorAll(`.category-block li[data-${type}]`).forEach(li => {
            li.classList.remove('is-active');
        });
    });
}

// ── Video lifecycle ─────────────────────────────────────────────────────────

function initVideoObserver(item) {
    const bgVideo  = item.querySelector(':scope .index-media > video');
    const intVideo = item.querySelector('.interactive-media video');

    if (bgVideo) {
        new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                if (!bgVideo.src && bgVideo.dataset.src) bgVideo.src = bgVideo.dataset.src;
                bgVideo.play().catch(() => {});
            } else {
                bgVideo.pause();
            }
        }, { rootMargin: '0px 0px 300px 0px' }).observe(item);
    }

    if (intVideo) {
        item.addEventListener('mouseenter', () => {
            if (!intVideo.src && intVideo.dataset.src) intVideo.src = intVideo.dataset.src;
            intVideo.play().catch(() => {});
        });
        item.addEventListener('mouseleave', () => intVideo.pause());
    }
}

// ── Endless scroll ──────────────────────────────────────────────────────────

function initEndlessScroll(scrollContainer) {
    const cols = [...scrollContainer.querySelectorAll(':scope > .col')];
    if (!cols.length) return;

    const seeds = cols.map(col =>
        [...col.querySelectorAll('.index-item')].map(el => {
            const seed = el.cloneNode(true);
            seed.querySelectorAll('video').forEach(v => {
                const src = v.getAttribute('src');
                if (src) { v.dataset.src = src; v.removeAttribute('src'); }
            });
            return seed;
        })
    );

    cols.forEach((col, i) => {
        const sentinel = document.createElement('div');
        sentinel.style.height = '1px';
        col.appendChild(sentinel);

        let busy = false;

        const observer = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting || busy) return;
            busy = true;

            seeds[i].forEach(seed => {
                const clone = seed.cloneNode(true);
                bindHover(clone);
                bindEntry(clone);
                bindInfluence(clone);
                initVideoObserver(clone);
                col.appendChild(clone);
            });

            col.appendChild(sentinel);
            busy = false;

            requestAnimationFrame(() => {
                observer.unobserve(sentinel);
                observer.observe(sentinel);
            });
        }, { rootMargin: '0px 0px 1200px 0px' });

        observer.observe(sentinel);
    });
}

// ── Init ────────────────────────────────────────────────────────────────────

export async function initIndex() {
    const cols = [...document.querySelectorAll('.index-endless-scroll .col')];
    cols.forEach(col => col.innerHTML = '');

    // Fetch all three in parallel (fast), then merge every card and sort by
    // `order` so types interleave freely within a column (work/entry/influence
    // can sit in any position). `key` (entry id) is a stable tiebreaker so equal
    // `order` values don't shuffle on refresh. Appending in one synchronous pass
    // right before the intro animation also avoids the paint-then-hide flash.
    const [workCards, entryCards, influenceCards] = await Promise.all([
        initWorkIndex(), initEntryIndex(), initInfluenceIndex(),
    ]);

    const cards = [...workCards, ...entryCards, ...influenceCards];
    cards.sort((a, b) => (a.order - b.order) || a.key.localeCompare(b.key));
    cards.forEach(({ colIndex, el }) => cols[colIndex]?.appendChild(el));

    document.querySelectorAll('.index-item').forEach(item => {
        bindHover(item);
        initVideoObserver(item);
    });

    const scrollContainer = document.querySelector('.index-endless-scroll');
    if (scrollContainer) initEndlessScroll(scrollContainer);

    // Content is now in the DOM — stagger the hidden [data-reveal] blocks in
    // (intro + the three side-menu sections).
    const reveal = document.querySelectorAll('.index [data-reveal]');
    gsap.to(reveal, {
        opacity: 1,
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power2.out',
    });

    // The column cards pop in scaling from their own center. gsap.from leaves
    // no lingering hidden state, so endless-scroll clones appear normally.
    const items = document.querySelectorAll('.index-endless-scroll .index-item');
    gsap.from(items, {
        opacity: 0,
        scale: 0.9,
        transformOrigin: 'center center',
        duration: 0.7,
        stagger: 0.04,
        ease: 'power2.out',
    });
}
