import Lenis from '../vendors/lenis.js';
import gsap from '../vendors/gsap.js';
import { ScrollTrigger } from '../vendors/gsap.js';

let lenis;
let modalLenis;

export function initLenis() {
    lenis = new Lenis({
        duration: 1.8,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        prevent: (node) => !!node.closest?.('.entry-modal--overlay .inner'),
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return lenis;
}

export function initModalLenis(wrapper) {
    modalLenis = new Lenis({
        wrapper,
        content: wrapper.querySelector('.inner-content'),
        lerp: 0.048,
        smoothWheel: true,
    });

    gsap.ticker.add((time) => {
        modalLenis?.raf(time * 1000);
    });

    modalLenis.stop();

    return modalLenis;
}

export function destroyLenis() {
    if (lenis) {
        lenis.destroy();
        lenis = null;
    }
}

export function getLenis() {
    return lenis;
}

export function getModalLenis() {
    return modalLenis;
}
