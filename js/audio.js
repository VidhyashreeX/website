/**
 * Audio Manager - Handles Mission Impossible theme audio and sound effects
 * Uses Web Audio API for better control and cyberpunk sound effects
 */

class AudioManager {
  constructor() {
    this.audioContext = null;
    this.isSupported = false;
    this.isPlaying = false;
    this.currentSource = null;
    this.audioBuffer = null;
    this.gainNode = null;
    
    // Mission Impossible theme data (simplified version)
    this.missionTheme = {
      notes: [
        { freq: 622.25, duration: 0.3 }, // D#5
        { freq: 466.16, duration: 0.3 }, // A#4
        { freq: 622.25, duration: 0.3 }, // D#5
        { freq: 466.16, duration: 0.3 }, // A#4
        { freq: 622.25, duration: 0.3 }, // D#5
        { freq: 466.16, duration: 0.3 }, // A#4
        { freq: 554.37, duration: 0.6 }, // C#5
        { freq: 0, duration: 0.2 },      // Rest
        { freq: 622.25, duration: 0.3 }, // D#5
        { freq: 466.16, duration: 0.3 }, // A#4
        { freq: 622.25, duration: 0.3 }, // D#5
        { freq: 466.16, duration: 0.3 }, // A#4
        { freq: 622.25, duration: 0.3 }, // D#5
        { freq: 466.16, duration: 0.3 }, // A#4
        { freq: 554.37, duration: 0.6 }, // C#5
      ]
    };
    
    this.init();
  }

  /**
   * Initialize the audio manager
   */
  init() {
    this.checkAudioSupport();
    this.setupEventListeners();
    console.log('Audio manager initialized');
  }

  /**
   * Check Web Audio API support
   */
  checkAudioSupport() {
    try {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      this.isSupported = true;
      console.log('Web Audio API supported');
    } catch (error) {
      console.warn('Web Audio API not supported:', error);
      this.isSupported = false;
    }
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    const audioButton = document.getElementById('audio-button');
    if (audioButton) {
      audioButton.addEventListener('click', () => this.toggleMissionTheme());
    }

    // Handle audio context state
    if (this.audioContext) {
      document.addEventListener('click', () => this.resumeAudioContext(), { once: true });
      document.addEventListener('keydown', () => this.resumeAudioContext(), { once: true });
    }
  }

  /**
   * Resume audio context (required for autoplay policies)
   */
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('Audio context resumed');
      } catch (error) {
        console.error('Failed to resume audio context:', error);
      }
    }
  }

  /**
   * Toggle Mission Impossible theme
   */
  async toggleMissionTheme() {
    if (!this.isSupported) {
      this.showAudioError('Audio not supported in this browser');
      return;
    }

    const button = document.getElementById('audio-button');
    const statusText = button.querySelector('.audio-status');

    if (this.isPlaying) {
      this.stopAudio();
      this.updateButtonState(button, statusText, false);
    } else {
      try {
        await this.resumeAudioContext();
        this.playMissionTheme();
        this.updateButtonState(button, statusText, true);
      } catch (error) {
        console.error('Failed to play audio:', error);
        this.showAudioError('Failed to play audio');
      }
    }
  }

  /**
   * Play Mission Impossible theme
   */
  async playMissionTheme() {
    if (!this.audioContext) return;

    try {
      // Stop any currently playing audio
      this.stopAudio();

      // Create gain node for volume control
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);

      this.isPlaying = true;
      
      // Play the theme
      await this.playNoteSequence(this.missionTheme.notes);
      
    } catch (error) {
      console.error('Error playing mission theme:', error);
      this.isPlaying = false;
    }
  }

  /**
   * Play a sequence of notes
   */
  async playNoteSequence(notes) {
    let currentTime = this.audioContext.currentTime;
    
    for (const note of notes) {
      if (!this.isPlaying) break; // Stop if user clicked stop
      
      if (note.freq > 0) {
        this.playNote(note.freq, currentTime, note.duration);
      }
      
      currentTime += note.duration;
    }
    
    // Schedule stop
    setTimeout(() => {
      if (this.isPlaying) {
        this.stopAudio();
        const button = document.getElementById('audio-button');
        const statusText = button.querySelector('.audio-status');
        this.updateButtonState(button, statusText, false);
      }
    }, currentTime * 1000 - this.audioContext.currentTime * 1000);
  }

  /**
   * Play a single note
   */
  playNote(frequency, startTime, duration) {
    if (!this.audioContext || !this.gainNode) return;

    // Create oscillator
    const oscillator = this.audioContext.createOscillator();
    const noteGain = this.audioContext.createGain();
    
    // Connect nodes
    oscillator.connect(noteGain);
    noteGain.connect(this.gainNode);
    
    // Configure oscillator
    oscillator.type = 'triangle'; // Warmer sound than sine
    oscillator.frequency.setValueAtTime(frequency, startTime);
    
    // Configure envelope (attack, decay, sustain, release)
    const attackTime = 0.05;
    const decayTime = 0.1;
    const sustainLevel = 0.7;
    const releaseTime = 0.1;
    
    noteGain.gain.setValueAtTime(0, startTime);
    noteGain.gain.linearRampToValueAtTime(0.8, startTime + attackTime);
    noteGain.gain.linearRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime);
    noteGain.gain.setValueAtTime(sustainLevel, startTime + duration - releaseTime);
    noteGain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    // Start and stop oscillator
    oscillator.start(startTime);
    oscillator.stop(startTime + duration);
  }

  /**
   * Stop audio playback
   */
  stopAudio() {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
      } catch (error) {
        // Ignore errors when stopping already stopped sources
      }
      this.currentSource = null;
    }
    
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
    
    this.isPlaying = false;
  }

  /**
   * Update button state
   */
  updateButtonState(button, statusText, isPlaying) {
    if (!button || !statusText) return;

    if (isPlaying) {
      statusText.textContent = 'STOP_THEME';
      button.classList.add('playing');
      
      // Add pulsing animation
      button.style.animation = 'pulse 1s infinite';
      
      // Change icon color
      const icon = button.querySelector('.mission-icon');
      if (icon) {
        icon.style.filter = 'brightness(0) invert(1)';
      }
    } else {
      statusText.textContent = 'PLAY_THEME';
      button.classList.remove('playing');
      
      // Remove animation
      button.style.animation = '';
      
      // Reset icon color
      const icon = button.querySelector('.mission-icon');
      if (icon) {
        icon.style.filter = 'brightness(0)';
      }
    }
  }

  /**
   * Show audio error message
   */
  showAudioError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message error audio-error';
    errorDiv.innerHTML = `
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    `;

    const audioButton = document.getElementById('audio-button');
    if (audioButton) {
      audioButton.parentNode.insertBefore(errorDiv, audioButton.nextSibling);
      
      setTimeout(() => {
        errorDiv.remove();
      }, 3000);
    }
  }

  /**
   * Create cyberpunk sound effects
   */
  playGlitchEffect() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();
    
    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // Random frequency for glitch effect
    const baseFreq = 200 + Math.random() * 400;
    oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(baseFreq * 0.5, this.audioContext.currentTime + 0.1);
    
    // Configure filter for digital distortion
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
    
    // Quick envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
    
    oscillator.type = 'square';
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.1);
  }

  /**
   * Play typing sound effect
   */
  playTypingSound() {
    if (!this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    
    // High frequency click
    oscillator.frequency.setValueAtTime(2000 + Math.random() * 1000, this.audioContext.currentTime);
    oscillator.type = 'square';
    
    // Very short envelope
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.02);
    
    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + 0.02);
  }

  /**
   * Play notification sound
   */
  playNotificationSound() {
    if (!this.audioContext) return;

    // Two-tone notification
    const frequencies = [800, 1200];
    
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      const startTime = this.audioContext.currentTime + (index * 0.1);
      
      oscillator.frequency.setValueAtTime(freq, startTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.2);
      
      oscillator.start(startTime);
      oscillator.stop(startTime + 0.2);
    });
  }

  /**
   * Set master volume
   */
  setVolume(volume) {
    if (this.gainNode) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.audioContext.currentTime);
    }
  }

  /**
   * Get audio status
   */
  getStatus() {
    return {
      isSupported: this.isSupported,
      isPlaying: this.isPlaying,
      contextState: this.audioContext ? this.audioContext.state : 'unavailable'
    };
  }

  /**
   * Add sound effects to UI elements
   */
  addSoundEffects() {
    // Add typing sounds to form inputs
    const inputs = document.querySelectorAll('input[type="text"], input[type="email"], textarea');
    inputs.forEach(input => {
      input.addEventListener('keydown', () => {
        if (Math.random() > 0.8) { // Random typing sounds
          this.playTypingSound();
        }
      });
    });

    // Add hover sounds to buttons
    const buttons = document.querySelectorAll('.cta-button, .submit-btn, .cyber-button');
    buttons.forEach(button => {
      button.addEventListener('mouseenter', () => {
        this.playGlitchEffect();
      });
    });

    // Add notification sound to form submissions
    window.addEventListener('feedbackUpdated', () => {
      this.playNotificationSound();
    });
  }

  /**
   * Destroy the audio manager
   */
  destroy() {
    this.stopAudio();
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    console.log('Audio manager destroyed');
  }
}

// Export for global access
window.AudioManager = AudioManager;
