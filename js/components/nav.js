import gsap from '../vendors/gsap.js';

const DURATION = 0.64;
const EASE     = 'power2.inOut';

function switchLabel(primary, secondary, text) {
    secondary.textContent = text;
    gsap.set([primary, secondary], { transition: 'none' });

    gsap.to([primary, secondary], {
        yPercent: -100,
        duration: 0.64,
        ease: 'power2.inOut',
        onComplete: () => {
            primary.textContent = text;
            secondary.textContent = '';
            gsap.set([primary, secondary], { yPercent: 0 });
            requestAnimationFrame(() => {
                gsap.set([primary, secondary], { transition: '' });
            });
        },
    });
}

function closeNav(items) {
    gsap.to([...items].reverse(), {
        opacity: 0,
        x: 48,
        duration: .48,
        ease: EASE,
        stagger: 0.06,
        onComplete: () => gsap.set('.primary-nav-li-container', { display: 'none' }),
    });
}

export function initSecondaryNav() {
    const nav     = document.querySelector('.secondary-nav');
    const trigger = nav?.querySelector('.secondary-nav-trigger');
    const content = nav?.querySelector('.secondary-nav-content');
    const work    = content?.querySelector('.work');
    const personal = content?.querySelector('.personal');
    const wrapper = document.querySelector('[data-barba="wrapper"]');
    const overlay = document.querySelector('.overlay');

    if (!nav || !trigger || !wrapper) return;

    const initialWidth = trigger.getBoundingClientRect().width;

    gsap.set(overlay,  { opacity: 0, pointerEvents: 'none' });
    gsap.set(content,  { autoAlpha: 0, x: 40 });

    let isOpen = false;
    let tl = null;

    function open() {
        tl?.kill();
        isOpen = true;
        nav.classList.add('is-open');

        tl = gsap.timeline()
            .to(trigger,  { width: 335, duration: 0.56, ease: 'sine.inOut' }, 0)
            .to(overlay,  { opacity: 1, pointerEvents: 'auto', duration: DURATION + 0.2, ease: 'sine.inOut' }, 0)
            .set(content, { autoAlpha: 1, x: 40 }, 0)
            .set([work, personal], { opacity: 0 }, 0)
            .to(wrapper,  { x: -200, duration: DURATION + 0.3, ease: 'sine.inOut' }, 0.12)
            .to(content,  { x: 0, duration: DURATION + 0.1, ease: 'sine.inOut' }, 0.36)
            .to(work,     { opacity: 1, duration: DURATION, ease: 'sine.inOut' }, 0.52)
            .to(personal, { opacity: 1, duration: DURATION, ease: 'sine.inOut' }, 0.68);
    }

    function close() {
        tl?.kill();
        isOpen = false;
        nav.classList.remove('is-open');

        tl = gsap.timeline()
            .to(personal, { opacity: 0, duration: DURATION * 0.5, ease: 'sine.inOut' }, 0)
            .to(work,     { opacity: 0, duration: DURATION * 0.5, ease: 'sine.inOut' }, 0.08)
            .to(content,  { x: 40, duration: DURATION * 0.6, ease: 'sine.inOut' }, 0.12)
            .to(wrapper,  { x: 0, duration: DURATION + 0.3, ease: 'sine.inOut', clearProps: 'x' }, 0.12)
            .to(trigger,  { width: initialWidth, duration: 0.32, ease: 'sine.inOut', clearProps: 'width' }, 0.2)
            .to(overlay,  { opacity: 0, pointerEvents: 'none', duration: DURATION + 0.2, ease: 'sine.inOut' }, 0.2)
            .set(content, { autoAlpha: 0 }, DURATION * 0.8)
            .set([work, personal], { clearProps: 'opacity' }, DURATION * 0.8);
    }

    trigger.addEventListener('click', () => isOpen ? close() : open());
}

export function initNav() {
    const navItems = document.querySelectorAll('.primary-nav-list .nav-item');

    if (navItems.length) {
        const descriptor = document.querySelector('.nav-descriptor');
        const current    = descriptor?.querySelector('.current');
        const next       = descriptor?.querySelector('.next');

        if (next) gsap.set(next, { yPercent: 100 });

        const setActive = (item) => {
            navItems.forEach(n => n.classList.remove('is-active'));
            item.classList.add('is-active');
        };

        const switchDescriptor = (item) => {
            if (!current || !next) return;
            if (item.dataset.descriptor === current.textContent) return;

            next.textContent = item.dataset.descriptor ?? '';
            gsap.fromTo(current, { yPercent: 0 },   { yPercent: -100, duration: 0.64, ease: 'power2.inOut' });
            gsap.fromTo(next,    { yPercent: 100 },  { yPercent: 0,    duration: 0.64, ease: 'power2.inOut',
                onComplete() {
                    current.textContent = item.dataset.descriptor ?? '';
                    gsap.set(current, { yPercent: 0 });
                    next.textContent = '';
                    gsap.set(next, { yPercent: 100 });
                }
            });
        };

        navItems.forEach(item => {
            const href = item.querySelector('a')?.getAttribute('href');
            if (href && window.location.pathname === href) setActive(item);
            item.addEventListener('click', () => {
                switchDescriptor(item);
                setActive(item);
            });
        });

        const activeItem = document.querySelector('.primary-nav-list .nav-item.is-active');
        if (current && activeItem) current.textContent = activeItem.dataset.descriptor ?? '';
    }

    const trigger = document.querySelector('.primary-nav-trigger');
    const items   = document.querySelectorAll('.primary-nav-li-container li');
    const primary   = trigger?.querySelector('.btn-label.primary');
    const secondary = trigger?.querySelector('.btn-label.secondary');
    const indicator = trigger?.querySelector('.nav-indicator');

    if (!trigger || !items.length || !primary || !secondary) return;

    // Closed by default
    gsap.set('.primary-nav-li-container', { display: 'none' });
    gsap.set(items, { x: 48, transition: 'none', opacity: 0 });
    gsap.set(indicator, { scaleX: 4 / 12, scaleY: 1, borderRadius: '50%' });

    let isOpen = false;
    let blinkTween = null;

    trigger.addEventListener('mouseenter', () => {
        blinkTween = gsap.to(indicator, {
            opacity: 0,
            duration: 0.4,
            ease: 'power2.out',
            repeat: -1,
            yoyo: true,
        });
    });

    trigger.addEventListener('mouseleave', () => {
        blinkTween?.kill();
        gsap.to(indicator, { opacity: 1, duration: 0.2 });
    });

    trigger.addEventListener('click', () => {
        isOpen = !isOpen;

        if (isOpen) {
            const tl = gsap.timeline();
            tl.set('.primary-nav-li-container', { display: 'flex' })
              .to(items, {
                opacity: 1,
                x: 0,
                duration: DURATION,
                ease: EASE,
                stagger: 0.2,
            });

            gsap.to(indicator, {
                scaleX: 1,
                scaleY: 0.5,
                borderRadius: 0,
                duration: 0.4,
                ease: EASE,
            });
        } else {
            closeNav(items);

            gsap.to(indicator, {
                scaleX: 4 / 12,
                scaleY: 1,
                borderRadius: '50%',
                duration: 0.4,
                ease: EASE,
            });
        }

        trigger.classList.toggle('is-open', isOpen);
    });

    // Label swap on item click
    items.forEach(item => {
        item.addEventListener('click', () => {
            const name = item.querySelector('.btn-label.primary')?.textContent.trim();
            isOpen = false;
            trigger.classList.remove('is-open');

            gsap.to([...items].reverse(), {
                opacity: 0,
                x: 48,
                duration: .48,
                ease: EASE,
                stagger: 0.06,
                onComplete: () => {
                    gsap.set('.primary-nav-li-container', { display: 'none' });
                    if (name) switchLabel(primary, secondary, name);
                },
            });

            gsap.to(indicator, {
                scaleX: 4 / 12,
                scaleY: 1,
                borderRadius: '50%',
                duration: 0.4,
                ease: EASE,
            });
        });
    });
}
