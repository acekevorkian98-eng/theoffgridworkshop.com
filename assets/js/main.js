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
// FAQ ACCORDION
// ============================================
function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        const answer = item.querySelector('.faq-answer');

        if (question && answer) {
            question.setAttribute('role', 'button');
            question.setAttribute('tabindex', '0');
            question.setAttribute('aria-expanded', 'false');

            function toggleFaq() {
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherQ = otherItem.querySelector('.faq-question');
                        if (otherQ) otherQ.setAttribute('aria-expanded', 'false');
                    }
                });

                item.classList.toggle('active');
                question.setAttribute('aria-expanded', item.classList.contains('active'));
            }

            question.addEventListener('click', toggleFaq);
            question.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    toggleFaq();
                }
            });
        }
    });
}

// ============================================
// SOCIAL SHARING
// ============================================
function shareOnTwitter() {
    const text = encodeURIComponent('Check out The Off-Grid Workshop — practical guides for off-grid living!');
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=550,height=420');
}

function shareOnFacebook() {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=550,height=420');
}

function shareOnReddit() {
    const title = encodeURIComponent(document.title);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://reddit.com/submit?url=${url}&title=${title}`, '_blank', 'width=550,height=420');
}

function copyToClipboard() {
    navigator.clipboard.writeText(window.location.href).then(() => {
        const btn = document.querySelector('.share-copy');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = originalText; }, 2000);
        }
    }).catch(() => {
        const btn = document.querySelector('.share-copy');
        if (btn) {
            btn.textContent = 'Copy failed';
            setTimeout(() => { btn.textContent = 'Copy Link'; }, 2000);
        }
    });
}

// ============================================
// TABLE OF CONTENTS GENERATOR
// ============================================
function generateTOC() {
    const tocContainer = document.getElementById('table-of-contents');
    if (tocContainer) {
        const article = document.querySelector('.article-content') || document.querySelector('main');
        if (!article) return;

        const headings = article.querySelectorAll('h2, h3');
        if (headings.length < 3) { tocContainer.style.display = 'none'; return; }

        const tocList = document.createElement('ul');
        tocList.className = 'toc-list';

        headings.forEach((heading, index) => {
            if (!heading.id) heading.id = 'section-' + index;
            const li = document.createElement('li');
            li.className = heading.tagName === 'H3' ? 'toc-item toc-sub' : 'toc-item';
            const link = document.createElement('a');
            link.href = '#' + heading.id;
            link.textContent = heading.textContent;
            li.appendChild(link);
            tocList.appendChild(li);
        });

        tocContainer.appendChild(tocList);
        return;
    }

    // Sidebar "In This Article" auto-populate
    const sidebarWidgets = document.querySelectorAll('.sidebar-widget');
    let tocWidget = null;
    sidebarWidgets.forEach(function(widget) {
        const h3 = widget.querySelector('h3');
        if (h3 && h3.textContent.trim() === 'In This Article') tocWidget = widget;
    });
    if (!tocWidget) return;

    const tocUl = tocWidget.querySelector('ul');
    if (!tocUl || tocUl.querySelectorAll('li').length > 0) return;

    const article = document.querySelector('.article-content');
    if (!article) return;

    const headings = article.querySelectorAll('h2, h3');
    if (headings.length < 2) { tocWidget.style.display = 'none'; return; }

    headings.forEach(function(heading, index) {
        if (!heading.id) heading.id = 'section-' + index;
        var li = document.createElement('li');
        if (heading.tagName === 'H3') li.style.paddingLeft = '1rem';
        var link = document.createElement('a');
        link.href = '#' + heading.id;
        link.textContent = heading.textContent;
        li.appendChild(link);
        tocUl.appendChild(li);
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
    if (!navigator.share) return;

    var shareSections = document.querySelectorAll('.share-section');
    shareSections.forEach(function(section) {
        var buttonsContainer = section.querySelector('.share-buttons');
        if (!buttonsContainer) return;

        var platformBtns = buttonsContainer.querySelectorAll('.share-twitter, .share-reddit, .share-facebook');
        platformBtns.forEach(function(btn) { btn.remove(); });

        var nativeBtn = document.createElement('button');
        nativeBtn.className = 'share-btn share-btn-native';
        nativeBtn.textContent = 'Share';
        nativeBtn.addEventListener('click', function() {
            navigator.share({ title: document.title, url: window.location.href }).catch(function() {});
        });

        var copyBtn = buttonsContainer.querySelector('.share-copy');
        buttonsContainer.insertBefore(nativeBtn, copyBtn);
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
    const aliases = { 'food-and-farming': 'food', 'energy-and-homesteading': 'solar', 'building-and-homesteading': 'building', 'systems-and-maintenance': 'systems' };
    const categories = new Set(Array.from(buttons, button => button.dataset.category));

    function applyCategory(category) {
        category = aliases[category] || category;
        if (!categories.has(category)) category = 'all';
        let visible = 0;
        cards.forEach(card => {
            card.hidden = category !== 'all' && card.dataset.category !== category;
            if (!card.hidden) visible++;
        });
        buttons.forEach(button => {
            const selected = button.dataset.category === category;
            button.classList.toggle('active', selected);
            button.setAttribute('aria-pressed', String(selected));
        });
        if (count) count.textContent = visible + ' article' + (visible === 1 ? '' : 's');
    }

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            const url = new URL(window.location.href);
            url.hash = category === 'all' ? '' : category;
            if (url.href !== window.location.href) history.pushState(null, '', url.href);
            applyCategory(category);
        });
    });
    window.addEventListener('hashchange', () => applyCategory(window.location.hash.slice(1)));
    applyCategory(window.location.hash.slice(1));
    controls.hidden = false;
    directory.dataset.filterReady = 'true';
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
    const filterBtns = document.querySelectorAll('.shop-filter-btn');
    const productCards = document.querySelectorAll('.product-card');
    if (!filterBtns.length || !productCards.length) return;

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const filter = this.getAttribute('data-filter');

            productCards.forEach(card => {
                const category = card.getAttribute('data-category');
                if (filter === 'all' || category === filter) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });
}

// ============================================
// INITIALIZE EVERYTHING
// ============================================
document.addEventListener('DOMContentLoaded', function() {
    initDarkMode();
    highlightCurrentPage();
    initAffiliateTracking();
    initSmoothScroll();
    initFaqAccordion();
    generateTOC();
    initLastUpdated();
    initMobileNav();

    initReadingProgress();
    initNativeShare();
    initCategoryFilter();
    initShopFilters();

    autoApplyReveals();
    initScrollReveal();
    initSmartHeader();
    initHeroParticles();
    initCardTilt();
});
