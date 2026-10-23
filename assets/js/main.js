/**
 * The Off-Grid Workshop — Main JavaScript
 * Navigation, FAQ, sharing, forms, scroll reveals, smart header.
 */

// ============================================
// SCROLL REVEAL
// ============================================
function initScrollReveal() {
    const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    if (!revealEls.length) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        revealEls.forEach(el => el.classList.add('revealed'));
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
}

// ============================================
// AUTO-APPLY REVEAL CLASSES
// ============================================
function autoApplyReveals() {
    const revealSelectors = [
        '.method-card',
        '.funnel-step',
        '.review-card',
        '.guide-card',
        '.product-card',
        '.faq-item',
        '.info-box',
        '.disclaimer-section',
        '.stats-showcase',
        '.newsletter-section',
        '.share-section',
        '.link-block',
        '.comparison-table-wrapper',
        '.start-funnel',
        'section > h2',
        'section > p'
    ];

    revealSelectors.forEach(selector => {
        document.querySelectorAll(selector).forEach((el, index) => {
            if (el.classList.contains('reveal') || el.classList.contains('reveal-scale')) return;

            if (el.classList.contains('method-card') ||
                el.classList.contains('funnel-step') ||
                el.classList.contains('guide-card') ||
                el.classList.contains('product-card') ||
                el.classList.contains('faq-item')) {
                el.classList.add('reveal');
                const delay = (index % 5) + 1;
                el.classList.add('reveal-delay-' + delay);
            } else if (el.classList.contains('stats-showcase')) {
                el.classList.add('reveal-scale');
            } else {
                el.classList.add('reveal');
            }
        });
    });
}

// ============================================
// SMART HEADER
// ============================================
function initSmartHeader() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    function updateHeader() {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 80) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }

        if (currentScrollY > lastScrollY && currentScrollY > 200) {
            header.classList.add('header-hidden');
        } else {
            header.classList.remove('header-hidden');
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateHeader);
            ticking = true;
        }
    }, { passive: true });
}

// ============================================
// MOBILE NAV TOGGLE
// ============================================
function initMobileNav() {
    const toggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.main-nav');
    if (!toggle || !nav || toggle.dataset.navReady === 'true') return;
    if (!nav.id) nav.id = 'site-primary-nav';
    toggle.type = 'button';
    toggle.setAttribute('aria-controls', nav.id);

    function setOpen(open, restoreFocus = false) {
        nav.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
        if (restoreFocus) toggle.focus();
    }

    setOpen(nav.classList.contains('open'));
    toggle.addEventListener('click', () => setOpen(!nav.classList.contains('open')));
    document.addEventListener('click', event => {
        if (!toggle.contains(event.target) && !nav.contains(event.target)) setOpen(false);
    });
    document.addEventListener('focusin', event => {
        if (!toggle.contains(event.target) && !nav.contains(event.target)) setOpen(false);
    });
    nav.addEventListener('click', event => {
        if (event.target.closest && event.target.closest('a[href]')) setOpen(false);
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && nav.classList.contains('open')) {
            event.preventDefault();
            setOpen(false, true);
        }
    });
    toggle.dataset.navReady = 'true';
}

// ============================================
// HERO PARTICLES
// ============================================
function initHeroParticles() {
    const hero = document.querySelector('.hero');
    if (!hero || hero.querySelector('.hero-particles')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const particlesDiv = document.createElement('div');
    particlesDiv.className = 'hero-particles';
    particlesDiv.setAttribute('aria-hidden', 'true');

    // Off-grid themed symbols
    const symbols = ['\uD83C\uDF31', '\u2600\uFE0F', '\uD83D\uDCA7', '\uD83D\uDD25', '\uD83C\uDF3F', '\u26CF\uFE0F'];
    symbols.forEach(symbol => {
        const span = document.createElement('span');
        span.className = 'hero-particle';
        span.textContent = symbol;
        particlesDiv.appendChild(span);
    });

    hero.appendChild(particlesDiv);
}

// ============================================
// NAVIGATION HIGHLIGHTING
// ============================================
function highlightCurrentPage() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.main-nav a');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (!href) return;
        // Normalize: strip trailing slash/index.html
        const norm = currentPath.replace(/\/?index\.html$/, '/').replace(/\/$/, '') || '/';
        const linkNorm = href.replace(/\/?index\.html$/, '/').replace(/\/$/, '') || '/';

        if (norm === linkNorm ||
            (linkNorm !== '' && linkNorm !== '/' && norm.startsWith(linkNorm))) {
            link.classList.add('active');
        }
    });
}

// ============================================
// SMOOTH SCROLL
// ============================================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        if (anchor.classList.contains('skip-link')) return;
        anchor.addEventListener('click', function(event) {
            const fragment = this.getAttribute('href').slice(1);
            if (!fragment) return;
            let identity;
            try { identity = decodeURIComponent(fragment); } catch { return; }
            const target = document.getElementById(identity);
            if (!target) return;
            event.preventDefault();
            const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
        });
    });
}

// ============================================
// SOCIAL SHARING
// ============================================
function pageShareUrl() {
    const current = new URL(window.location.href);
    const link = document.querySelector('link[rel="canonical"]');
    if (link && link.getAttribute('href')) {
        try {
            const canonical = new URL(link.getAttribute('href'), current.href);
            if (canonical.protocol === 'https:' || canonical.protocol === 'http:') {
                canonical.hash = current.hash;
                return canonical.href;
            }
        } catch {}
    }
    return current.href;
}

function showShareStatus(section, message) {
    if (!section) return;
    let status = section.querySelector('.share-status');
    if (!status) {
        status = document.createElement('p');
        status.className = 'share-status';
        status.setAttribute('role', 'status');
        section.appendChild(status);
    }
    status.textContent = message;
}

function shareOnTwitter() {
    const text = encodeURIComponent(document.title);
    const url = encodeURIComponent(pageShareUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420,noopener,noreferrer');
}

function shareOnFacebook() {
    const url = encodeURIComponent(pageShareUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=550,height=420,noopener,noreferrer');
}

function shareOnReddit() {
    const title = encodeURIComponent(document.title);
    const url = encodeURIComponent(pageShareUrl());
    window.open(`https://reddit.com/submit?url=${url}&title=${title}`, '_blank', 'width=550,height=420,noopener,noreferrer');
}

async function copyToClipboard(button) {
    const target = button || document.querySelector('.share-copy');
    const section = target ? target.closest('.share-section') : document.querySelector('.share-section');
    const url = pageShareUrl();
    if (target && target.disabled) return;
    const label = target ? target.dataset.copyLabel || target.textContent : '';
    if (target) {
        target.dataset.copyLabel = label;
        clearTimeout(target.copyTimer);
        target.disabled = true;
        target.textContent = 'Copying...';
    }
    try {
        if (!navigator.clipboard || typeof navigator.clipboard.writeText !== 'function') throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(url);
        const manual = section && section.querySelector('.share-link-input');
        if (manual) manual.remove();
        if (target) {
            target.textContent = 'Copied!';
            target.copyTimer = setTimeout(() => { target.textContent = label; }, 2000);
        }
        showShareStatus(section, 'Page link copied.');
    } catch {
        if (target) target.textContent = label;
        if (section) {
            let input = section.querySelector('.share-link-input');
            if (!input) {
                input = document.createElement('input');
                input.type = 'text';
                input.readOnly = true;
                input.className = 'share-link-input';
                input.setAttribute('aria-label', 'Page link to copy manually');
                section.appendChild(input);
            }
            input.value = url;
            input.focus();
            input.select();
        }
        showShareStatus(section, 'Automatic copying is unavailable. Copy the selected link.');
    } finally {
        if (target) target.disabled = false;
    }
}

// ============================================
// TABLE OF CONTENTS GENERATOR
// ============================================
function generateTOC() {
    const targets = [];
    const inline = document.getElementById('table-of-contents');
    if (inline && !inline.querySelector('a')) targets.push({ container: inline, inline: true });
    document.querySelectorAll('.sidebar-widget').forEach(widget => {
        const title = widget.querySelector('h3');
        const list = widget.querySelector('ul');
        if (title && ['In This Article', 'In This Review'].includes(title.textContent.trim()) && list && !list.querySelector('a')) targets.push({ container: list, inline: false });
    });
    if (!targets.length) return;
    const article = document.querySelector('.article-content');
    if (!article) return;
    const headings = Array.from(article.querySelectorAll('h2, h3')).map((heading, index) => ({ heading, index })).filter(({ heading }) => !heading.closest('.toc-container, #table-of-contents, [hidden], [aria-hidden="true"]'));
    if (headings.length < 2) return;
    headings.forEach(({ heading, index }) => {
        if (heading.id) return;
        let identity = 'section-' + index;
        let suffix = 2;
        while (document.getElementById(identity)) identity = 'section-' + index + '-' + suffix++;
        heading.id = identity;
    });
    targets.forEach(target => {
        const list = target.inline ? document.createElement('ul') : target.container;
        if (target.inline) list.className = 'toc-list';
        headings.forEach(({ heading }) => {
            const item = document.createElement('li');
            if (target.inline) item.className = heading.tagName === 'H3' ? 'toc-item toc-sub' : 'toc-item';
            else if (heading.tagName === 'H3') item.style.paddingLeft = '1rem';
            const link = document.createElement('a');
            link.setAttribute('href', '#' + encodeURIComponent(heading.id));
            link.textContent = heading.textContent.trim();
            item.appendChild(link);
            list.appendChild(item);
        });
        if (target.inline) target.container.appendChild(list);
    });
}

// ============================================
// READING PROGRESS BAR
// ============================================
function initReadingProgress() {
    var articleContent = document.querySelector('.article-content');
    if (!articleContent) return;

    var bar = document.createElement('div');
    bar.className = 'reading-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var ticking = false;

    function updateProgress() {
        var rect = articleContent.getBoundingClientRect();
        var articleTop = rect.top + window.scrollY;
        var articleHeight = rect.height;
        var windowHeight = window.innerHeight;
        var scrollY = window.scrollY;

        var start = articleTop;
        var end = articleTop + articleHeight - windowHeight;
        var progress = 0;

        if (end <= start) progress = 100;
        else if (scrollY <= start) progress = 0;
        else if (scrollY >= end) progress = 100;
        else progress = ((scrollY - start) / (end - start)) * 100;

        bar.style.width = progress + '%';
        ticking = false;
    }

    window.addEventListener('scroll', function() {
        if (!ticking) {
            requestAnimationFrame(updateProgress);
            ticking = true;
        }
    }, { passive: true });

    updateProgress();
}

// ============================================
// NATIVE MOBILE SHARE
// ============================================
function initNativeShare() {
    if (typeof navigator.share !== 'function') return;
    document.querySelectorAll('.share-section').forEach(section => {
        const buttons = section.querySelector('.share-buttons');
        if (!buttons || buttons.querySelector('.share-btn-native')) return;
        buttons.querySelectorAll('.share-twitter, .share-reddit, .share-facebook').forEach(button => button.remove());
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'share-btn share-btn-native';
        button.textContent = 'Share';
        button.addEventListener('click', async () => {
            showShareStatus(section, '');
            try {
                await navigator.share({ title: document.title, url: pageShareUrl() });
            } catch (error) {
                if (!error || error.name !== 'AbortError') showShareStatus(section, 'Sharing was not completed. You can copy the page link instead.');
            }
        });
        buttons.insertBefore(button, buttons.querySelector('.share-copy'));
    });
}

// ============================================
// BLOG CATEGORY FILTERING
// ============================================
function initCategoryFilter() {
    const directory = document.getElementById('article-directory');
    const controls = document.querySelector('.category-tags');
    if (!directory || !controls || directory.dataset.filterReady === 'true') return;
    const buttons = controls.querySelectorAll('button[data-category]');
    const cards = directory.querySelectorAll('.guide-card[data-category]');
    const count = document.querySelector('.post-count');
    const search = document.getElementById('article-search');
    const input = document.getElementById('article-query');
    const clear = document.getElementById('article-search-clear');
    const empty = document.getElementById('article-search-empty');
    const aliases = { 'food-and-farming': 'food', 'energy-and-homesteading': 'solar', 'building-and-homesteading': 'building', 'systems-and-maintenance': 'systems' };
    const categories = new Set(Array.from(buttons, button => button.dataset.category));

    function normalize(value) {
        return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    }

    const searchable = new Map(Array.from(cards, card => [card, normalize(
        Array.from(card.querySelectorAll('h3, p, .guide-card-category'), node => node.textContent).join(' ')
    )]));

    function selectedCategory() {
        const fragment = window.location.hash.slice(1);
        const category = aliases[fragment] || fragment;
        return categories.has(category) ? category : 'all';
    }

    function applyFilters() {
        const category = selectedCategory();
        const query = new URL(window.location.href).searchParams.get('q') || '';
        const words = normalize(query).trim().split(/\s+/).filter(Boolean);
        let visible = 0;
        cards.forEach(card => {
            const matchesTopic = category === 'all' || card.dataset.category === category;
            card.hidden = !matchesTopic || !words.every(word => searchable.get(card).includes(word));
            if (!card.hidden) visible++;
        });
        buttons.forEach(button => {
            const selected = button.dataset.category === category;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
        if (input) input.value = query;
        if (clear) clear.disabled = !query;
        if (empty) empty.hidden = visible !== 0;
        if (count) count.textContent = visible + ' article' + (visible === 1 ? '' : 's');
    }

    function changeFilters(category, query) {
        const url = new URL(window.location.href);
        url.hash = category === 'all' ? '' : category;
        query = query.trim().replace(/\s+/g, ' ');
        if (query) url.searchParams.set('q', query);
        else url.searchParams.delete('q');
        if (url.href !== window.location.href) history.pushState(null, '', url.href);
        applyFilters();
    }

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const query = input ? input.value : new URL(window.location.href).searchParams.get('q') || '';
            changeFilters(button.dataset.category, query);
        });
    });
    if (search && input) {
        search.addEventListener('submit', event => {
            event.preventDefault();
            changeFilters(selectedCategory(), input.value);
        });
        if (clear) {
            input.addEventListener('input', () => {
                clear.disabled = !input.value && !new URL(window.location.href).searchParams.get('q');
            });
            clear.addEventListener('click', () => {
                changeFilters(selectedCategory(), '');
                input.focus();
            });
        }
        search.hidden = false;
    }
    window.addEventListener('hashchange', applyFilters);
    window.addEventListener('popstate', applyFilters);
    applyFilters();
    controls.hidden = false;
    directory.dataset.filterReady = 'true';
}

function initScrollableTables() {
    const wrappers = Array.from(document.querySelectorAll('.comparison-table-wrapper')).filter(wrapper => wrapper.dataset.scrollReady !== 'true');
    if (!wrappers.length) return;
    const records = wrappers.map(wrapper => {
        wrapper.dataset.scrollReady = 'true';
        const table = wrapper.querySelector('table');
        const heading = table && table.closest('section') && table.closest('section').querySelector('h2, h3');
        const caption = table && table.caption ? table.caption.textContent.trim() : '';
        const label = caption || (heading ? heading.textContent.trim() : '') || 'Data table';
        return {
            wrapper, table, label,
            managed: !wrapper.hasAttribute('tabindex') && !wrapper.hasAttribute('role'),
            originalLabel: wrapper.getAttribute('aria-label')
        };
    });

    function update() {
        records.forEach(({ wrapper, label, managed, originalLabel }) => {
            if (!managed) return;
            const overflows = wrapper.clientWidth > 0 && wrapper.scrollWidth > wrapper.clientWidth + 1;
            if (overflows) {
                wrapper.setAttribute('tabindex', '0');
                wrapper.setAttribute('role', 'region');
                if (!originalLabel) wrapper.setAttribute('aria-label', 'Scrollable table: ' + label);
            } else {
                wrapper.removeAttribute('tabindex');
                wrapper.removeAttribute('role');
                if (!originalLabel) wrapper.removeAttribute('aria-label');
            }
        });
    }

    update();
    if (typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(update);
        records.forEach(({ wrapper, table }) => {
            observer.observe(wrapper);
            if (table) observer.observe(table);
        });
    } else {
        window.addEventListener('resize', update);
        window.addEventListener('load', update, { once: true });
    }
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(update);
}

// ============================================
// LAST UPDATED DISPLAY
// ============================================
function initLastUpdated() {
    const lastUpdatedEl = document.querySelector('.last-updated');
    if (lastUpdatedEl && !lastUpdatedEl.textContent.trim()) {
        const date = new Date(document.lastModified);
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        lastUpdatedEl.textContent = 'Last updated: ' + date.toLocaleDateString('en-US', options);
    }
}

// ============================================
// CARD HOVER TILT EFFECT
// ============================================
function initCardTilt() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if ('ontouchstart' in window) return;

    const cards = document.querySelectorAll('.method-card, .funnel-step, .guide-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            const rotateX = ((y - centerY) / centerY) * -3;
            const rotateY = ((x - centerX) / centerX) * 3;
            card.style.transform = `translateY(-6px) perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ============================================
// DARK MODE TOGGLE
// ============================================
function initDarkMode() {
    const header = document.querySelector('.header-inner');
    if (header && header.querySelector('.theme-toggle')) return;
    let stored;
    try { stored = localStorage.getItem('ogw-theme'); } catch {}
    let theme = stored === 'dark' || stored === 'light' ? stored : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    if (!header) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Dark mode');

    function updateButton() {
        button.setAttribute('aria-pressed', String(theme === 'dark'));
        button.setAttribute('title', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
        button.textContent = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
    }

    button.addEventListener('click', () => {
        theme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', theme);
        updateButton();
        try { localStorage.setItem('ogw-theme', theme); } catch {}
    });
    updateButton();
    header.appendChild(button);
}

// ============================================
// AFFILIATE LINK TRACKING
// ============================================
function trackAffiliateClick(linkName) {
    if (typeof gtag === 'function') {
        gtag('event', 'affiliate_click', { 'link_name': linkName });
    }
}

function initAffiliateTracking() {
    document.querySelectorAll('.affiliate-link, .referral-link').forEach(link => {
        link.addEventListener('click', function() {
            const linkName = this.dataset.ref || this.textContent.trim();
            trackAffiliateClick(linkName);
        });
    });
}

// ============================================
// SHOP FILTERS
// ============================================
function initShopFilters() {
    const filterBtns = Array.from(document.querySelectorAll('.shop-filter-btn'));
    const productCards = Array.from(document.querySelectorAll('.product-card'));
    const status = document.getElementById('shop-filter-status');
    if (!filterBtns.length || !productCards.length || filterBtns[0].dataset.filterReady === 'true') return;

    function applyFilter(selected) {
        const filter = selected.getAttribute('data-filter');
        let count = 0;
        filterBtns.forEach(button => {
            const active = button === selected;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });
        productCards.forEach(card => {
            card.hidden = filter !== 'all' && card.getAttribute('data-category') !== filter;
            if (!card.hidden) count++;
        });
        if (status) status.textContent = count + (count === 1 ? ' item shown.' : ' items shown.');
    }

    filterBtns.forEach(button => {
        button.type = 'button';
        button.addEventListener('click', () => applyFilter(button));
        button.dataset.filterReady = 'true';
    });
    applyFilter(filterBtns.find(button => button.classList.contains('active')) || filterBtns[0]);
}

// ============================================
// INITIALIZE EVERYTHING
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    highlightCurrentPage();
    initAffiliateTracking();
    initSmoothScroll();
    generateTOC();
    initLastUpdated();
    initMobileNav();

    initReadingProgress();
    initNativeShare();
    initCategoryFilter();
    initShopFilters();
    initScrollableTables();

    autoApplyReveals();
    initScrollReveal();
    initSmartHeader();
    initHeroParticles();
    initCardTilt();
});
