import { initLenis, getLenis, initModalLenis } from './core/lenis.js';
import { initBarba } from './transitions/globalbarba.js';
import { initProjectFetch } from './sections/project-fetch.js';
import { initNav } from './components/nav.js';
import { initClock } from './utils/dom.js';
import { initIndex } from './sections/index.js';
import { initEntry } from './components/entry.js';
import { initInfluence } from './components/influence.js';
import { initOverviewCard, trackOverviewCardHeight } from './components/overview-card.js';

function initPage(namespace, container) {
    if (namespace === 'project') initProjectFetch(container);
    if (namespace === 'index') initIndex();
}

function initModalScrollLock() {
    const overlay = document.querySelector('.entry-modal--overlay');
    if (!overlay) return;

    const inner = overlay.querySelector('.inner');
    const modalLenis = initModalLenis(inner);

    const toggle = () => {
        const active = overlay.classList.contains('is-active');
        const lenis = getLenis();
        if (active) {
            lenis?.stop();
            modalLenis.start();
        } else {
            lenis?.start();
            modalLenis.stop();
        }
    };

    new MutationObserver(toggle).observe(overlay, { attributes: true, attributeFilter: ['class'] });

    overlay.addEventListener('wheel', (e) => {
        if (!e.target.closest('.inner')) {
            inner.dispatchEvent(new WheelEvent('wheel', {
                deltaY: e.deltaY,
                deltaMode: e.deltaMode,
                bubbles: false,
            }));
            e.preventDefault();
        }
    }, { passive: false });

    toggle();
}

document.addEventListener('DOMContentLoaded', () => {
    const namespace = document.querySelector('[data-barba-namespace]')?.dataset.barbaNamespace;

    initLenis();
    initBarba(initPage);
    initNav();
    initClock();
    initPage(namespace);
    initModalScrollLock();
    initEntry();
    initInfluence();
    initOverviewCard();
    trackOverviewCardHeight();
});
