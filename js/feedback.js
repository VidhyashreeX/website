/**
 * Feedback Manager - Handles feedback form submissions and storage
 * Integrates with the dashboard system for analytics
 */

class FeedbackManager {
  constructor() {
    this.storageKey = 'portfolio_feedback';
    this.maxFeedbackItems = 100;
    
    this.init();
  }

  /**
   * Initialize the feedback manager
   */
  init() {
    this.setupEventListeners();
    console.log('Feedback manager initialized');
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen for form submissions
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleSubmission(e.target);
      });
    }

    // Real-time validation
    this.setupValidation();
  }

  /**
   * Setup real-time form validation
   */
  setupValidation() {
    const nameField = document.getElementById('feedback-name');
    const emailField = document.getElementById('feedback-email');
    const messageField = document.getElementById('feedback-message');

    if (nameField) {
      nameField.addEventListener('blur', () => this.validateName(nameField));
      nameField.addEventListener('input', () => this.clearFieldError(nameField));
    }

    if (emailField) {
      emailField.addEventListener('blur', () => this.validateEmail(emailField));
      emailField.addEventListener('input', () => this.clearFieldError(emailField));
    }

    if (messageField) {
      messageField.addEventListener('blur', () => this.validateMessage(messageField));
      messageField.addEventListener('input', () => this.clearFieldError(messageField));
    }
  }

  /**
   * Validate name field
   */
  validateName(field) {
    const value = field.value.trim();
    if (!value) {
      this.showFieldError(field, 'Name is required');
      return false;
    }
    if (value.length < 2) {
      this.showFieldError(field, 'Name must be at least 2 characters');
      return false;
    }
    if (value.length > 50) {
      this.showFieldError(field, 'Name must be less than 50 characters');
      return false;
    }
    this.clearFieldError(field);
    return true;
  }

  /**
   * Validate email field
   */
  validateEmail(field) {
    const value = field.value.trim();
    if (!value) {
      this.showFieldError(field, 'Email is required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      this.showFieldError(field, 'Please enter a valid email address');
      return false;
    }
    
    this.clearFieldError(field);
    return true;
  }

  /**
   * Validate message field
   */
  validateMessage(field) {
    const value = field.value.trim();
    if (!value) {
      this.showFieldError(field, 'Message is required');
      return false;
    }
    if (value.length < 10) {
      this.showFieldError(field, 'Message must be at least 10 characters');
      return false;
    }
    if (value.length > 1000) {
      this.showFieldError(field, 'Message must be less than 1000 characters');
      return false;
    }
    this.clearFieldError(field);
    return true;
  }

  /**
   * Show field error
   */
  showFieldError(field, message) {
    this.clearFieldError(field);
    
    field.classList.add('error');
    const errorDiv = document.createElement('div');
    errorDiv.className = 'field-error';
    errorDiv.textContent = message;
    errorDiv.style.color = 'hsl(var(--error-red))';
    errorDiv.style.fontSize = '0.8rem';
    errorDiv.style.marginTop = '0.25rem';
    
    field.parentNode.appendChild(errorDiv);
  }

  /**
   * Clear field error
   */
  clearFieldError(field) {
    field.classList.remove('error');
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
      existingError.remove();
    }
  }

  /**
   * Handle form submission
   */
  handleSubmission(form) {
    const submitButton = form.querySelector('.submit-btn');
    const originalText = submitButton.querySelector('span').textContent;
    
    // Show loading state
    this.setSubmitLoading(submitButton, true);
    
    setTimeout(() => {
      try {
        const feedbackData = this.extractFormData(form);
        
        // Validate all fields
        if (!this.validateForm(feedbackData)) {
          this.setSubmitLoading(submitButton, false, originalText);
          return;
        }
        
        // Submit feedback
        const success = this.submitFeedback(feedbackData);
        
        if (success) {
          this.handleSubmissionSuccess(form);
          this.showSuccessMessage('Feedback transmitted successfully! Thank you for your input.');
        } else {
          this.handleSubmissionError();
        }
        
        this.setSubmitLoading(submitButton, false, originalText);
        
      } catch (error) {
        console.error('Error submitting feedback:', error);
        this.handleSubmissionError();
        this.setSubmitLoading(submitButton, false, originalText);
      }
    }, 1000); // Simulate processing time for better UX
  }

  /**
   * Extract form data
   */
  extractFormData(form) {
    const formData = new FormData(form);
    return {
      name: document.getElementById('feedback-name').value.trim(),
      email: document.getElementById('feedback-email').value.trim(),
      message: document.getElementById('feedback-message').value.trim(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      id: this.generateFeedbackId()
    };
  }

  /**
   * Generate unique feedback ID
   */
  generateFeedbackId() {
    return 'feedback_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Validate entire form
   */
  validateForm(data) {
    const nameField = document.getElementById('feedback-name');
    const emailField = document.getElementById('feedback-email');
    const messageField = document.getElementById('feedback-message');
    
    let isValid = true;
    
    if (!this.validateName(nameField)) isValid = false;
    if (!this.validateEmail(emailField)) isValid = false;
    if (!this.validateMessage(messageField)) isValid = false;
    
    return isValid;
  }

  /**
   * Submit feedback to storage
   */
  submitFeedback(feedbackData) {
    try {
      // Send feedback to backend server
      fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Dispatch event for dashboard update
          window.dispatchEvent(new CustomEvent('feedbackUpdated', {
            detail: { feedback: feedbackData, total: 1 }
          }));
          console.log('Feedback submitted successfully:', feedbackData.id);
        } else {
          throw new Error(data.message);
        }
      })
      .catch(error => {
        console.error('Error submitting feedback:', error);
        throw error;
      });
      
      return true;
      
    } catch (error) {
      console.error('Error saving feedback:', error);
      return false;
    }
  }

  /**
   * Get feedback data from storage
   */
  getFeedbackData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting feedback data:', error);
      return [];
    }
  }

  /**
   * Set submit button loading state
   */
  setSubmitLoading(button, isLoading, originalText = 'TRANSMIT_FEEDBACK') {
    const span = button.querySelector('span');
    const icon = button.querySelector('i');
    
    if (isLoading) {
      span.textContent = 'TRANSMITTING...';
      icon.className = 'fas fa-spinner fa-spin';
      button.disabled = true;
      button.style.opacity = '0.7';
    } else {
      span.textContent = originalText;
      icon.className = 'fas fa-paper-plane';
      button.disabled = false;
      button.style.opacity = '1';
    }
  }

  /**
   * Handle successful submission
   */
  handleSubmissionSuccess(form) {
    // Reset form
    form.reset();
    
    // Clear any existing errors
    const errorElements = form.querySelectorAll('.field-error');
    errorElements.forEach(el => el.remove());
    
    const fields = form.querySelectorAll('input, textarea');
    fields.forEach(field => field.classList.remove('error'));
    
    // Add success animation to form
    form.style.animation = 'scaleIn 0.3s ease-out';
  }

  /**
   * Handle submission error
   */
  handleSubmissionError() {
    this.showErrorMessage('System error - Unable to transmit feedback. Please try again later.');
  }

  /**
   * Show success message
   */
  showSuccessMessage(text) {
    this.showMessage(text, 'success');
  }

  /**
   * Show error message
   */
  showErrorMessage(text) {
    this.showMessage(text, 'error');
  }

  /**
   * Show message to user
   */
  showMessage(text, type = 'info') {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.feedback-message');
    existingMessages.forEach(msg => msg.remove());
    
    const message = document.createElement('div');
    message.className = `message feedback-message ${type}`;
    message.innerHTML = `
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${text}</span>
    `;

    // Insert message
    const form = document.getElementById('feedback-form');
    if (form) {
      form.parentNode.insertBefore(message, form);
      
      // Add entrance animation
      message.style.animation = 'fadeInUp 0.5s ease-out';
      
      // Remove message after 5 seconds
      setTimeout(() => {
        message.style.animation = 'fadeOut 0.5s ease-out';
        setTimeout(() => {
          message.remove();
        }, 500);
      }, 5000);
    }
  }

  /**
   * Get feedback statistics
   */
  getFeedbackStats() {
    const feedback = this.getFeedbackData();
    
    return {
      total: feedback.length,
      thisMonth: this.getFeedbackByMonth(feedback, new Date()),
      averageLength: this.getAverageMessageLength(feedback),
      responseRate: this.calculateResponseRate(feedback)
    };
  }

  /**
   * Get feedback by month
   */
  getFeedbackByMonth(feedback, date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    
    return feedback.filter(item => {
      const itemDate = new Date(item.timestamp);
      return itemDate.getFullYear() === year && itemDate.getMonth() === month;
    }).length;
  }

  /**
   * Get average message length
   */
  getAverageMessageLength(feedback) {
    if (feedback.length === 0) return 0;
    
    const totalLength = feedback.reduce((sum, item) => sum + item.message.length, 0);
    return Math.round(totalLength / feedback.length);
  }

  /**
   * Calculate response rate (placeholder for future email integration)
   */
  calculateResponseRate(feedback) {
    // This would be implemented when email integration is added
    return 0;
  }

  /**
   * Export feedback data
   */
  exportFeedback() {
    const feedback = this.getFeedbackData();
    const stats = this.getFeedbackStats();
    
    const exportData = {
      feedback: feedback,
      statistics: stats,
      exportDate: new Date().toISOString(),
      totalItems: feedback.length
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-feedback-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all feedback data
   */
  clearFeedback() {
    if (confirm('Are you sure you want to clear all feedback data? This action cannot be undone.')) {
      localStorage.removeItem(this.storageKey);
      
      // Dispatch event for dashboard update
      window.dispatchEvent(new CustomEvent('feedbackUpdated', {
        detail: { feedback: null, total: 0 }
      }));
      
      console.log('Feedback data cleared');
    }
  }

  /**
   * Search feedback
   */
  searchFeedback(query) {
    const feedback = this.getFeedbackData();
    const searchTerm = query.toLowerCase();
    
    return feedback.filter(item => 
      item.name.toLowerCase().includes(searchTerm) ||
      item.email.toLowerCase().includes(searchTerm) ||
      item.message.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Get recent feedback
   */
  getRecentFeedback(limit = 5) {
    const feedback = this.getFeedbackData();
    return feedback
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);
  }

  /**
   * Destroy the feedback manager
   */
  destroy() {
    // Remove event listeners
    const feedbackForm = document.getElementById('feedback-form');
    if (feedbackForm) {
      feedbackForm.removeEventListener('submit', this.handleSubmission);
    }
    
    console.log('Feedback manager destroyed');
  }
}

// Export for global access
window.FeedbackManager = FeedbackManager;
