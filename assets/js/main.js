/**
 * The OffGrid Workshop - Main JavaScript
 * Handles navigation, reading progress, forms, and interactions
 */

// =============================================================================
// Navigation Toggle (Mobile Menu)
// =============================================================================
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    navToggle.classList.toggle('active');
    nav.classList.toggle('active');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!nav.contains(e.target) && !navToggle.contains(e.target)) {
      navToggle.classList.remove('active');
      nav.classList.remove('active');
    }
  });

  // Close menu when clicking on a link
  const navLinks = nav.querySelectorAll('.nav__link');
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      navToggle.classList.remove('active');
      nav.classList.remove('active');
    });
  });
}

// =============================================================================
// Reading Progress Bar
// =============================================================================
const readingProgress = document.getElementById('readingProgress');

if (readingProgress) {
  window.addEventListener('scroll', () => {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.scrollY;
    
    const scrollPercent = (scrollTop / (documentHeight - windowHeight)) * 100;
    readingProgress.style.width = scrollPercent + '%';
  });
}

// =============================================================================
// Header Scroll Effect
// =============================================================================
const header = document.getElementById('header');
let lastScroll = 0;

if (header) {
  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    
    // Add scrolled class when scrolling down
    if (currentScroll > 50) {
      header.classList.add('header--scrolled');
    } else {
      header.classList.remove('header--scrolled');
    }
    
    lastScroll = currentScroll;
  });
}

// =============================================================================
// Active Navigation Link
// =============================================================================
const currentPage = window.location.pathname.split('/').pop() || 'index.html';
const navLinks = document.querySelectorAll('.nav__link');

navLinks.forEach(link => {
  const href = link.getAttribute('href');
  
  // Remove existing active class
  link.classList.remove('active');
  
  // Add active class to current page
  if (href === currentPage || 
      (currentPage === '' && href === 'index.html') ||
      (currentPage === 'index.html' && href === 'index.html')) {
    link.classList.add('active');
  }
});

// =============================================================================
// Newsletter Form
// =============================================================================
const newsletterForm = document.getElementById('newsletterForm');

if (newsletterForm) {
  newsletterForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const emailInput = newsletterForm.querySelector('input[type="email"]');
    const email = emailInput.value;
    
    // Simple validation
    if (email && email.includes('@')) {
      // In a real application, you would send this to a server
      alert('Thank you for subscribing! We\'ll send you our best content weekly.');
      emailInput.value = '';
    } else {
      alert('Please enter a valid email address.');
    }
  });
}

// =============================================================================
// Contact Form
// =============================================================================
const contactForm = document.getElementById('contactForm');

if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const subject = document.getElementById('subject').value;
    const message = document.getElementById('message').value;
    
    // Basic validation
    if (name && email && subject && message) {
      // In a real application, you would send this to a server
      alert(`Thank you for your message, ${name}! We'll get back to you within 24-48 hours.`);
      contactForm.reset();
    } else {
      alert('Please fill in all required fields.');
    }
  });
}

// =============================================================================
// Smooth Scroll (for anchor links)
// =============================================================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const href = this.getAttribute('href');
    
    // Skip if href is just "#"
    if (href === '#') {
      e.preventDefault();
      return;
    }
    
    const target = document.querySelector(href);
    if (target) {
      e.preventDefault();
      const headerOffset = 80;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// =============================================================================
// Card Hover Animation Enhancement
// =============================================================================
const cards = document.querySelectorAll('.card');

cards.forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
  });
});

// =============================================================================
// Initialize on DOM Ready
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
  console.log('The OffGrid Workshop website loaded successfully! 🌲');
  
  // Add fade-in animation to hero on page load
  const hero = document.querySelector('.hero');
  if (hero) {
    hero.style.opacity = '0';
    hero.style.transition = 'opacity 0.6s ease';
    setTimeout(() => {
      hero.style.opacity = '1';
    }, 100);
  }
});
