import gsap, { Flip } from '../vendors/gsap.js';

// Shared so the height tracker can ignore the expand/collapse animation.
let animating = false;

export function initOverviewCard() {
    const card = document.querySelector('.overview-card');
    if (!card) return;

    const expandBtn   = card.querySelector('.controls button.tertiary');      // "explore the thinking"
    const minimizeBtn = card.querySelector('.controls button:first-of-type'); // "minimize"

    function setExpanded(expand) {
        if (animating || card.classList.contains('is-active') === expand) return;
        animating = true;

        const polaroid = card.querySelector('.media-container.polaroid');
        const col1 = card.querySelector('.overview--main-content .col:first-child');
        const cols = card.querySelectorAll(
            '.overview--main-content .col:nth-child(2), .overview--main-content .col:nth-child(3)'
        );

        // Reveal the expand-only content once the box is fully open — fade only,
        // at final layout, so nothing shifts into place.
        const revealContent = () => {
            gsap.to(cols, { opacity: 1, duration: 0.5, stagger: 0.08, ease: 'power2.out' });
            gsap.to(polaroid, { height: 'auto', marginBottom: 20, opacity: 1, duration: 0.5, ease: 'power2.out' });
        };

        // Morph the card box. Only the always-visible structure is a Flip target;
        // the polaroid and the expand-only columns are excluded so Flip never
        // stamps transforms on them.
        const morph = () => {
            const state = Flip.getState([card, ...card.querySelectorAll('.row'), col1]);
            card.classList.toggle('is-active', expand);
            Flip.from(state, {
                duration: 0.6,
                ease: 'power2.inOut',
                absolute: true,
                nested: true,
                onComplete: () => {
                    animating = false;
                    if (expand) revealContent();
                },
            });
        };

        if (expand) {
            gsap.set(cols, { opacity: 0 });   // hidden until the box is open
            morph();
        } else {
            // Reverse of expand: collapse the content first, THEN the box, so the
            // card's target height is stable and it doesn't snap at the end.
            gsap.timeline({ onComplete: morph })
                .to(cols,     { opacity: 0, duration: 0.3, ease: 'power2.in' }, 0)
                .to(polaroid, { height: 0, marginBottom: 0, opacity: 0, duration: 0.4, ease: 'power2.inOut' }, 0);
        }
    }

    expandBtn?.addEventListener('click', () => setExpanded(true));
    minimizeBtn?.addEventListener('click', () => setExpanded(false));
}

export function trackOverviewCardHeight() {
    const card = document.querySelector('.overview-card');
    if (!card) return;

    const observer = new ResizeObserver(() => {
        // Only track the COLLAPSED resting height. Skip while expanded or
        // mid-animation so the side menu (padded off this var) never shifts.
        if (animating || card.classList.contains('is-active')) return;
        document.documentElement.style.setProperty('--overview-card-height', `${card.offsetHeight}px`);
    });
    observer.observe(card);
}
