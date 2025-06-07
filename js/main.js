/**
 * Main JavaScript file for Vidhyashree's Cyberpunk Portfolio
 * Handles navigation, animations, and general interactions
 */

class PortfolioApp {
  constructor() {
    this.letterGlitch = null;
    this.isLoaded = false;
    this.currentSection = 'home';
    this.scrollThreshold = 100;
    
    this.init();
  }

  /**
   * Initialize the application
   */
  init() {
    this.setupEventListeners();
    this.initializeComponents();
    this.handleInitialLoad();
  }

  /**
   * Setup all event listeners
   */
  setupEventListeners() {
    // DOM Content Loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.handleDOMReady());
    } else {
      this.handleDOMReady();
    }

    // Window load event
    window.addEventListener('load', () => this.handleWindowLoad());

    // Scroll events
    window.addEventListener('scroll', () => this.handleScroll());

    // Navigation events
    this.setupNavigation();

    // Form submissions
    this.setupForms();

    // Intersection observer for animations
    this.setupIntersectionObserver();
  }

  /**
   * Handle DOM ready event
   */
  handleDOMReady() {
    console.log('DOM is ready');
    this.initializeLetterGlitch();
    this.animateHeroStats();
  }

  /**
   * Handle window load event
   */
  handleWindowLoad() {
    this.isLoaded = true;
    console.log('Page fully loaded');
    
    // Initialize dashboard
    if (typeof DashboardManager !== 'undefined') {
      window.dashboardManager = new DashboardManager();
    }
    
    // Initialize feedback system
    if (typeof FeedbackManager !== 'undefined') {
      window.feedbackManager = new FeedbackManager();
    }
    
    // Initialize audio
    if (typeof AudioManager !== 'undefined') {
      window.audioManager = new AudioManager();
    }
  }

  /**
   * Initialize the letter glitch effect
   */
  initializeLetterGlitch() {
    try {
      this.letterGlitch = new LetterGlitch('glitch-canvas', {
        glitchColors: ['#00FFFF', '#00FF00', '#FF00FF'],
        glitchSpeed: 50,
        centerVignette: false,
        outerVignette: true,
        smooth: true
      });
      console.log('Letter glitch effect initialized');
    } catch (error) {
      console.error('Failed to initialize letter glitch:', error);
    }
  }

  /**
   * Initialize other components
   */
  initializeComponents() {
    this.setupTypewriterEffect();
    this.setupGlitchText();
  }

  /**
   * Setup navigation functionality
   */
  setupNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    if (navToggle && navMenu) {
      navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
      });
    }

    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetId = link.getAttribute('href').substring(1);
        this.scrollToSection(targetId);
        
        // Close mobile menu if open
        if (navMenu && navMenu.classList.contains('active')) {
          navToggle.classList.remove('active');
          navMenu.classList.remove('active');
        }
      });
    });
  }

  /**
   * Setup form handling
   */
  setupForms() {
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFeedbackSubmission(e.target);
      });
    }
  }

  /**
   * Handle feedback form submission
   */
  handleFeedbackSubmission(form) {
    const formData = new FormData(form);
    const feedback = {
      name: document.getElementById('feedback-name').value,
      email: document.getElementById('feedback-email').value,
      message: document.getElementById('feedback-message').value,
      timestamp: new Date().toISOString()
    };

    // Validate form
    if (!feedback.name || !feedback.email || !feedback.message) {
      this.showMessage('Please fill in all fields', 'error');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(feedback.email)) {
      this.showMessage('Please enter a valid email address', 'error');
      return;
    }

    // Submit feedback
    if (window.feedbackManager) {
      window.feedbackManager.submitFeedback(feedback);
      form.reset();
      this.showMessage('Feedback transmitted successfully!', 'success');
    } else {
      console.error('Feedback manager not available');
      this.showMessage('System error - please try again later', 'error');
    }
  }

  /**
   * Show message to user
   */
  showMessage(text, type = 'info') {
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${text}</span>
    `;

    // Insert message
    const form = document.getElementById('feedback-form');
    if (form) {
      form.parentNode.insertBefore(message, form);
      
      // Remove message after 5 seconds
      setTimeout(() => {
        message.remove();
      }, 5000);
    }
  }

  /**
   * Setup intersection observer for scroll animations
   */
  setupIntersectionObserver() {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          
          // Trigger specific animations based on element
          if (entry.target.classList.contains('timeline-item')) {
            this.animateTimelineItem(entry.target);
          }
          
          if (entry.target.classList.contains('tech-item')) {
            this.animateTechItem(entry.target);
          }
        }
      });
    }, observerOptions);

    // Observe elements
    const elementsToObserve = document.querySelectorAll('.timeline-item, .tech-item, .project-card, .dashboard-card, .certification-card');
    elementsToObserve.forEach(el => {
      el.classList.add('scroll-animate');
      observer.observe(el);
    });
  }

  /**
   * Animate timeline items
   */
  animateTimelineItem(element) {
    const delay = Array.from(element.parentNode.children).indexOf(element) * 200;
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'translateY(0)';
    }, delay);
  }

  /**
   * Animate tech items
   */
  animateTechItem(element) {
    const delay = Array.from(element.parentNode.children).indexOf(element) * 100;
    setTimeout(() => {
      element.style.opacity = '1';
      element.style.transform = 'scale(1)';
    }, delay);
  }

  /**
   * Handle scroll events
   */
  handleScroll() {
    const scrollY = window.scrollY;
    
    // Update navigation
    this.updateActiveNavigation();
    
    // Add/remove scrolled class to nav
    const nav = document.getElementById('nav');
    if (nav) {
      if (scrollY > this.scrollThreshold) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }
    
    // Parallax effect for hero section
    this.updateParallaxEffect(scrollY);
  }

  /**
   * Update active navigation based on scroll position
   */
  updateActiveNavigation() {
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    
    let currentSection = '';
    
    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      if (rect.top <= 100 && rect.bottom >= 100) {
        currentSection = section.id;
      }
    });
    
    if (currentSection && currentSection !== this.currentSection) {
      this.currentSection = currentSection;
      
      navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentSection}`) {
          link.classList.add('active');
        }
      });
    }
  }

  /**
   * Update parallax effect
   */
  updateParallaxEffect(scrollY) {
    const hero = document.querySelector('.hero');
    if (hero) {
      const speed = 0.5;
      hero.style.transform = `translateY(${scrollY * speed}px)`;
    }
  }

  /**
   * Smooth scroll to section
   */
  scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
      const offsetTop = section.offsetTop - 70; // Account for fixed nav
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth'
      });
    }
  }

  /**
   * Setup typewriter effect
   */
  setupTypewriterEffect() {
    const typeText = document.querySelector('.type-text');
    if (typeText) {
      const text = typeText.textContent;
      typeText.textContent = '';
      
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < text.length) {
          typeText.textContent += text.charAt(i);
          i++;
        } else {
          clearInterval(typeInterval);
        }
      }, 100);
    }
  }

  /**
   * Setup glitch text effects
   */
  setupGlitchText() {
    const glitchTexts = document.querySelectorAll('.glitch-text');
    glitchTexts.forEach(text => {
      // Add random glitch effect on hover
      text.addEventListener('mouseenter', () => {
        this.triggerGlitchEffect(text);
      });
    });
  }

  /**
   * Trigger glitch effect on text
   */
  triggerGlitchEffect(element) {
    element.style.animation = 'none';
    setTimeout(() => {
      element.style.animation = 'glitch-1 0.3s ease-in-out';
    }, 10);
  }

  /**
   * Animate hero statistics
   */
  animateHeroStats() {
    const statNumbers = document.querySelectorAll('.stat-number[data-target]');
    
    statNumbers.forEach(stat => {
      const target = parseInt(stat.getAttribute('data-target'));
      const increment = target / 50;
      let current = 0;
      
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          current = target;
          clearInterval(timer);
        }
        
        // Format number based on target
        if (target === 2025) {
          stat.textContent = Math.floor(current);
        } else {
          stat.textContent = target === 100 ? Math.floor(current) : current.toFixed(1);
        }
      }, 50);
    });
  }

  /**
   * Handle initial page load
   */
  handleInitialLoad() {
    // Add loaded class to body
    setTimeout(() => {
      document.body.classList.add('loaded');
    }, 1000);
    
    // Initialize scroll position
    if (window.location.hash) {
      const targetId = window.location.hash.substring(1);
      setTimeout(() => {
        this.scrollToSection(targetId);
      }, 1500);
    }
  }

  /**
   * Destroy the application
   */
  destroy() {
    if (this.letterGlitch) {
      this.letterGlitch.destroy();
    }
    
    // Remove event listeners
    window.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('load', this.handleWindowLoad);
  }
}

// Global scroll function for CTA button
function scrollToSection(sectionId) {
  if (window.portfolioApp) {
    window.portfolioApp.scrollToSection(sectionId);
  }
}

// Initialize the application
window.portfolioApp = new PortfolioApp();

// Export for global access
window.PortfolioApp = PortfolioApp;
