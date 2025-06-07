/**
 * Dashboard Manager - Handles visitor analytics and feedback display
 * Stores data in localStorage for client-side persistence
 */

class DashboardManager {
  constructor() {
    this.storageKeys = {
      visitors: 'portfolio_visitors',
      sessions: 'portfolio_sessions',
      feedback: 'portfolio_feedback',
      lastVisit: 'portfolio_last_visit'
    };
    
    this.currentSession = this.generateSessionId();
    this.visitStartTime = Date.now();
    this.sessionStartTime = null;
    this.sessionInterval = null;
    this.feedbackCount = 0;
    
    this.init();
    this.updateFeedbackCount();
  }

  /**
   * Initialize the dashboard
   */
  init() {
    this.recordVisit();
    this.updateDashboard();
    this.setupEventListeners();
    this.startSessionTracking();
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Record a new visit
   */
  recordVisit() {
    try {
      // Get existing data
      const visitors = this.getVisitorData();
      const sessions = this.getSessionData();
      const now = new Date();
      
      // Check if this is a new visitor (based on last visit being more than 30 minutes ago)
      const lastVisit = localStorage.getItem(this.storageKeys.lastVisit);
      const isNewVisitor = !lastVisit || (now.getTime() - parseInt(lastVisit)) > (30 * 60 * 1000);
      
      if (isNewVisitor) {
        visitors.totalVisits++;
        visitors.uniqueVisitors++;
      }
      
      // Record session data
      const sessionData = {
        id: this.currentSession,
        timestamp: now.toISOString(),
        userAgent: navigator.userAgent,
        referrer: document.referrer || 'direct',
        screenResolution: `${screen.width}x${screen.height}`,
        startTime: this.visitStartTime
      };
      
      sessions.push(sessionData);
      
      // Keep only last 100 sessions
      if (sessions.length > 100) {
        sessions.splice(0, sessions.length - 100);
      }
      
      // Update storage
      localStorage.setItem(this.storageKeys.visitors, JSON.stringify(visitors));
      localStorage.setItem(this.storageKeys.sessions, JSON.stringify(sessions));
      localStorage.setItem(this.storageKeys.lastVisit, now.getTime().toString());
      
      console.log('Visit recorded:', { isNewVisitor, sessionId: this.currentSession });
    } catch (error) {
      console.error('Error recording visit:', error);
    }
  }

  /**
   * Get visitor data from storage
   */
  getVisitorData() {
    try {
      const data = localStorage.getItem(this.storageKeys.visitors);
      return data ? JSON.parse(data) : {
        totalVisits: 0,
        uniqueVisitors: 0,
        firstVisit: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting visitor data:', error);
      return { totalVisits: 0, uniqueVisitors: 0, firstVisit: new Date().toISOString() };
    }
  }

  /**
   * Get session data from storage
   */
  getSessionData() {
    try {
      const data = localStorage.getItem(this.storageKeys.sessions);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting session data:', error);
      return [];
    }
  }

  /**
   * Get feedback data from storage
   */
  getFeedbackData() {
    try {
      const data = localStorage.getItem(this.storageKeys.feedback);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting feedback data:', error);
      return [];
    }
  }

  /**
   * Update the dashboard display
   */
  updateDashboard() {
    const visitorData = this.getVisitorData();
    const feedbackData = this.getFeedbackData();
    const sessions = this.getSessionData();
    
    // Update visitor count
    const visitorCountElement = document.getElementById('visitor-count');
    if (visitorCountElement) {
      this.animateCounter(visitorCountElement, visitorData.totalVisits);
    }
    
    // Update feedback count
    const feedbackCountElement = document.getElementById('feedback-count');
    if (feedbackCountElement) {
      this.animateCounter(feedbackCountElement, feedbackData.length);
    }
    
    // Update last visit
    const lastVisitElement = document.getElementById('last-visit');
    if (lastVisitElement) {
      const lastSession = sessions[sessions.length - 2]; // Previous session (current is last)
      if (lastSession) {
        const lastVisitDate = new Date(lastSession.timestamp);
        lastVisitElement.textContent = this.formatRelativeTime(lastVisitDate);
      } else {
        lastVisitElement.textContent = 'First Visit';
      }
    }
    
    // Update feedback list
    this.updateFeedbackList(feedbackData);
  }

  /**
   * Animate counter numbers
   */
  animateCounter(element, target) {
    const start = parseInt(element.textContent) || 0;
    const increment = Math.max(1, Math.ceil((target - start) / 20));
    let current = start;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      element.textContent = current;
    }, 50);
  }

  /**
   * Update feedback list display
   */
  updateFeedbackList(feedbackData) {
    const feedbackContainer = document.getElementById('feedback-items');
    if (!feedbackContainer) return;
    
    if (feedbackData.length === 0) {
      feedbackContainer.innerHTML = '<p class="no-feedback">No feedback received yet.</p>';
      return;
    }
    
    // Sort feedback by timestamp (newest first)
    const sortedFeedback = feedbackData.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    // Show only the last 5 feedback items
    const recentFeedback = sortedFeedback.slice(0, 5);
    
    feedbackContainer.innerHTML = recentFeedback.map(feedback => `
      <div class="feedback-item">
        <div class="feedback-item-header">
          <span class="feedback-item-name">${this.escapeHtml(feedback.name)}</span>
          <span class="feedback-item-date">${this.formatRelativeTime(new Date(feedback.timestamp))}</span>
        </div>
        <div class="feedback-item-message">${this.escapeHtml(feedback.message)}</div>
      </div>
    `).join('');
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSecs < 60) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.recordSessionEnd();
      } else {
        this.recordSessionStart();
      }
    });
    
    // Track beforeunload
    window.addEventListener('beforeunload', () => {
      this.recordSessionEnd();
    });
    
    // Refresh dashboard when feedback is updated
    window.addEventListener('feedbackUpdated', () => {
      this.updateDashboard();
    });
  }

  /**
   * Start session tracking
   */
  startSessionTracking() {
    // Update session data every 30 seconds
    this.sessionInterval = setInterval(() => {
      this.updateSessionData();
    }, 30000);
  }

  /**
   * Record session start
   */
  recordSessionStart() {
    this.sessionStartTime = Date.now();
  }

  /**
   * Record session end
   */
  recordSessionEnd() {
    if (this.sessionStartTime) {
      const sessionDuration = Date.now() - this.sessionStartTime;
      this.updateSessionDuration(sessionDuration);
    }
  }

  /**
   * Update session data
   */
  updateSessionData() {
    try {
      const sessions = this.getSessionData();
      const currentSessionIndex = sessions.findIndex(s => s.id === this.currentSession);
      
      if (currentSessionIndex !== -1) {
        sessions[currentSessionIndex].lastActivity = new Date().toISOString();
        sessions[currentSessionIndex].duration = Date.now() - this.visitStartTime;
        
        localStorage.setItem(this.storageKeys.sessions, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error updating session data:', error);
    }
  }

  /**
   * Update session duration
   */
  updateSessionDuration(duration) {
    try {
      const sessions = this.getSessionData();
      const currentSessionIndex = sessions.findIndex(s => s.id === this.currentSession);
      
      if (currentSessionIndex !== -1) {
        sessions[currentSessionIndex].totalDuration = duration;
        sessions[currentSessionIndex].endTime = Date.now();
        
        localStorage.setItem(this.storageKeys.sessions, JSON.stringify(sessions));
      }
    } catch (error) {
      console.error('Error updating session duration:', error);
    }
  }

  /**
   * Get analytics summary
   */
  getAnalyticsSummary() {
    const visitors = this.getVisitorData();
    const sessions = this.getSessionData();
    const feedback = this.getFeedbackData();
    
    return {
      totalVisits: visitors.totalVisits,
      uniqueVisitors: visitors.uniqueVisitors,
      totalFeedback: feedback.length,
      averageSessionDuration: this.calculateAverageSessionDuration(sessions),
      topReferrers: this.getTopReferrers(sessions),
      visitTrends: this.getVisitTrends(sessions)
    };
  }

  /**
   * Calculate average session duration
   */
  calculateAverageSessionDuration(sessions) {
    const validSessions = sessions.filter(s => s.duration && s.duration > 0);
    if (validSessions.length === 0) return 0;
    
    const totalDuration = validSessions.reduce((sum, s) => sum + s.duration, 0);
    return Math.round(totalDuration / validSessions.length / 1000); // Return in seconds
  }

  /**
   * Get top referrers
   */
  getTopReferrers(sessions) {
    const referrers = {};
    sessions.forEach(session => {
      const ref = session.referrer || 'direct';
      referrers[ref] = (referrers[ref] || 0) + 1;
    });
    
    return Object.entries(referrers)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([referrer, count]) => ({ referrer, count }));
  }

  /**
   * Get visit trends (last 7 days)
   */
  getVisitTrends(sessions) {
    const last7Days = {};
    const today = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days[dateStr] = 0;
    }
    
    // Count sessions by date
    sessions.forEach(session => {
      const sessionDate = new Date(session.timestamp).toISOString().split('T')[0];
      if (last7Days.hasOwnProperty(sessionDate)) {
        last7Days[sessionDate]++;
      }
    });
    
    return Object.entries(last7Days).map(([date, count]) => ({ date, count }));
  }

  /**
   * Export analytics data
   */
  exportData() {
    const data = {
      visitors: this.getVisitorData(),
      sessions: this.getSessionData(),
      feedback: this.getFeedbackData(),
      summary: this.getAnalyticsSummary(),
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  }

  /**
   * Clear all analytics data
   */
  clearData() {
    if (confirm('Are you sure you want to clear all analytics data? This action cannot be undone.')) {
      Object.values(this.storageKeys).forEach(key => {
        localStorage.removeItem(key);
      });
      
      this.updateDashboard();
      console.log('Analytics data cleared');
    }
  }

  /**
   * Destroy the dashboard manager
   */
  destroy() {
    if (this.sessionInterval) {
      clearInterval(this.sessionInterval);
    }
    
    this.recordSessionEnd();
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  }
}

// Export for global access
window.DashboardManager = DashboardManager;
