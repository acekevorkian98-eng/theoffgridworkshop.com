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
    if (!toggle || !nav) return;

    toggle.addEventListener('click', () => {
        nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', nav.classList.contains('open'));
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (!toggle.contains(e.target) && !nav.contains(e.target)) {
            nav.classList.remove('open');
        }
    });
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
        anchor.addEventListener('click', function(e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
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
    var categoryLinks = document.querySelectorAll('.category-tags a[data-category]');
    if (!categoryLinks.length) return;

    var cards = document.querySelectorAll('.guide-card[data-category]');
    if (!cards.length) return;

    var postCount = document.querySelector('.post-count');

    categoryLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            var category = this.getAttribute('data-category');

            categoryLinks.forEach(function(l) { l.classList.remove('active'); });
            this.classList.add('active');

            var visibleCount = 0;
            cards.forEach(function(card) {
                if (category === 'all' || card.getAttribute('data-category') === category) {
                    card.style.display = '';
                    visibleCount++;
                } else {
                    card.style.display = 'none';
                }
            });

            if (postCount) {
                if (category === 'all') {
                    postCount.textContent = cards.length + ' article' + (cards.length !== 1 ? 's' : '');
                } else {
                    postCount.textContent = visibleCount + ' article' + (visibleCount !== 1 ? 's' : '');
                }
            }

            if (category === 'all') {
                history.replaceState(null, '', window.location.pathname);
            } else {
                history.replaceState(null, '', '#' + category.toLowerCase().replace(/\s+/g, '-'));
            }
        });
    });

    var hash = window.location.hash.slice(1);
    if (hash) {
        var matchingLink = null;
        categoryLinks.forEach(function(link) {
            var cat = link.getAttribute('data-category');
            if (cat && cat.toLowerCase().replace(/\s+/g, '-') === hash) matchingLink = link;
        });
        if (matchingLink) matchingLink.click();
    }
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
// NEWSLETTER FORM
// ============================================
function handleNewsletterSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const button = form.querySelector('button');
    const message = form.nextElementSibling;
    const formData = new FormData(form);

    button.disabled = true;
    button.textContent = 'Subscribing...';

    fetch(form.action, { method: 'POST', body: formData })
    .then(response => {
        if (response.ok || response.redirected) {
            if (message) {
                message.textContent = 'Thanks for subscribing! Check your email to confirm.';
                message.className = 'newsletter-message success';
            }
            form.reset();
        } else {
            if (message) {
                message.textContent = 'Something went wrong. Please try again.';
                message.className = 'newsletter-message error';
            }
        }
    })
    .catch(() => {
        if (message) {
            message.textContent = 'Something went wrong. Please try again.';
            message.className = 'newsletter-message error';
        }
    })
    .finally(() => {
        button.disabled = false;
        button.textContent = 'Subscribe';
    });
}

function initNewsletter() {
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubmit);
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
    var stored = localStorage.getItem('ogw-theme');
    var theme = (stored === 'dark' || stored === 'light') ? stored : 'light';
    document.documentElement.setAttribute('data-theme', theme);

    var headerInner = document.querySelector('.header-inner');
    if (!headerInner) return;

    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle dark mode');
    btn.setAttribute('title', 'Toggle dark mode');
    btn.innerHTML = theme === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';

    btn.addEventListener('click', function() {
        var current = document.documentElement.getAttribute('data-theme');
        var next = current === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('ogw-theme', next);
        btn.innerHTML = next === 'dark' ? '\u2600\uFE0F' : '\uD83C\uDF19';
    });

    headerInner.appendChild(btn);
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
    initNewsletter();
    initMobileNav();

    initReadingProgress();
    initNativeShare();
    initCategoryFilter();

    autoApplyReveals();
    initScrollReveal();
    initSmartHeader();
    initHeroParticles();
    initCardTilt();
});
