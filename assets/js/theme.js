// Light/dark theme. Loaded without defer in <head> so the theme is applied
// before the page paints. Follows the device setting until the visitor picks
// one with the nav toggle; that choice is remembered on this device.

(function () {
    const KEY = 'theme';
    const root = document.documentElement;
    const media = window.matchMedia('(prefers-color-scheme: dark)');

    function stored() {
        try { return localStorage.getItem(KEY); } catch (e) { return null; }
    }

    function apply(theme) {
        root.setAttribute('data-theme', theme);
    }

    apply(stored() || (media.matches ? 'dark' : 'light'));

    // Keep following the device until the visitor has chosen
    media.addEventListener('change', e => {
        if (!stored()) apply(e.matches ? 'dark' : 'light');
        updateButton();
    });

    const SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    const MOON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';

    let button = null;

    function updateButton() {
        if (!button) return;
        const dark = root.getAttribute('data-theme') === 'dark';
        // Show what you'll switch to
        button.innerHTML = dark ? SUN : MOON;
        button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
        button.title = button.getAttribute('aria-label');
    }

    function toggle() {
        const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
        root.classList.add('theme-switching');
        apply(next);
        try { localStorage.setItem(KEY, next); } catch (e) {}
        updateButton();
        setTimeout(() => root.classList.remove('theme-switching'), 400);
    }

    function addButton() {
        const links = document.querySelector('.nav-links');
        if (!links) return;
        const li = document.createElement('li');
        li.className = 'theme-item';
        button = document.createElement('button');
        button.type = 'button';
        button.className = 'theme-toggle';
        button.addEventListener('click', toggle);
        li.appendChild(button);
        links.appendChild(li);
        updateButton();
        // The nav links shift left to make room; re-seat the active indicator
        if (window.Motion) window.Motion.moveIndicator();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addButton);
    } else {
        addButton();
    }
})();
