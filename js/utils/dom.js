// js/utils/dom.js

export const qs = (selector, scope = document) =>
  scope.querySelector(selector);

export const qsa = (selector, scope = document) =>
  [...scope.querySelectorAll(selector)];

export const onReady = (fn) => {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
};

export const initClock = () => {
  const hourHand   = document.querySelector('.clock .hour-hand');
  const minuteHand = document.querySelector('.clock .minute-hand');
  const timeStamp  = document.querySelector('.time-stamp .time-meta');
  const navTrigger = document.querySelector('.secondary-nav .trigger .block');
  const localTimes = document.querySelectorAll('.local-meta .time, .local-time');
  const localDates = document.querySelectorAll('.local-meta .date, .local-date');
  const cityTimes  = document.querySelectorAll('.city-time[data-tz]');

  const tick = () => {
    const now     = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
    const hours   = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    if (hourHand && minuteHand) {
      const hourDeg   = (hours % 12 / 12) * 360 + (minutes / 60) * 30;
      const minuteDeg = (minutes / 60) * 360 + (seconds / 60) * 6;
      hourHand.style.transform   = `rotate(${hourDeg}deg)`;
      minuteHand.style.transform = `rotate(${minuteDeg}deg)`;
    }

    if (timeStamp) {
      const h = String(hours).padStart(2, '0');
      const m = String(minutes).padStart(2, '0');
      timeStamp.innerHTML = `${h}:${m} <br> est`;
    }

    if (navTrigger) {
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).replace(/^(\w+),/, '$1');
      const h = String(hours).padStart(2, '0');
      const m = String(minutes).padStart(2, '0');
      navTrigger.innerHTML = `${dateStr} <span>•</span> ${h}:${m} EST`;
    }

    if (localTimes.length) {
      const h = String(hours).padStart(2, '0');
      const m = String(minutes).padStart(2, '0');
      const s = String(seconds).padStart(2, '0');
      localTimes.forEach(el => el.textContent = `${h}:${m}:${s} EST`);
    }

    if (localDates.length) {
      const dateStr = now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).replace(/^(\w+),/, '$1');
      localDates.forEach(el => el.textContent = dateStr);
    }

    if (cityTimes.length) {
      cityTimes.forEach(el => {
        const t = new Date(new Date().toLocaleString('en-US', { timeZone: el.dataset.tz }));
        const h = String(t.getHours()).padStart(2, '0');
        const m = String(t.getMinutes()).padStart(2, '0');
        const s = String(t.getSeconds()).padStart(2, '0');
        el.textContent = `${h}:${m}:${s}`;
      });
    }
  };

  tick();
  setInterval(tick, 1000);
};
