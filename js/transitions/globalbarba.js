import barba from '../vendors/barba.js';
import gsap from '../vendors/gsap.js';
import { getLenis } from '../core/lenis.js';

export function initBarba(onPageEnter) {
    barba.init({
        // Leave /entry/ and /influence/ links alone — those open a modal, not a page.
        prevent: ({ el }) => el.href?.includes('/entry/') || el.href?.includes('/influence/'),

        transitions: [{
            name: 'crossfade',
            sync: true, // leave + enter run together — both containers coexist

            // Freeze smooth scroll before either page animates.
            beforeLeave() {
                getLenis()?.stop();
            },

            // Both containers are alive at once. Stack them in the same spot
            // and crossfade between them.
            enter({ current, next }) {
                // GOTCHA: position:fixed pins to the viewport top, so the
                // leaving page would jump to ITS top. Offset it by the current
                // scroll so it stays visually where the user was.
                const scroll = getLenis()?.scroll ?? window.scrollY;

                gsap.set([current.container, next.container], {
                    position: 'fixed', left: 0, width: '100%',
                });
                gsap.set(current.container, { top: -scroll, zIndex: 1, opacity: 1 });
                gsap.set(next.container, { top: 0, zIndex: 2, opacity: 0 });

                const tl = gsap.timeline();
                tl.to(current.container, { opacity: 0, duration: 1.0 }, 0)
                  .to(next.container, { opacity: 1, duration: 1.0 }, 0);
                return tl;
            },

            // New page is settled and alone.
            afterEnter({ next }) {
                // Strip the inline transition styles so the page lays out and
                // scrolls normally again.
                gsap.set(next.container, { clearProps: 'all' });

                const lenis = getLenis();
                if (lenis) lenis.scrollTo(0, { immediate: true });
                else window.scrollTo(0, 0);
                lenis?.start();

                onPageEnter?.(next.namespace, next.container);
            },
        }],
    });
}
