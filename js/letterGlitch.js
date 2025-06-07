/**
 * Letter Glitch Effect - Vanilla JavaScript Implementation
 * Converted from React component to create Matrix-style background effect
 */

class LetterGlitch {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) {
      console.error(`Canvas element with id "${canvasId}" not found`);
      return;
    }

    // Configuration options
    this.config = {
      glitchColors: options.glitchColors || ['#2b4539', '#61dca3', '#61b3dc'],
      glitchSpeed: options.glitchSpeed || 50,
      centerVignette: options.centerVignette || false,
      outerVignette: options.outerVignette || true,
      smooth: options.smooth || true,
      fontSize: options.fontSize || 16,
      charWidth: options.charWidth || 10,
      charHeight: options.charHeight || 20
    };

    // State variables
    this.context = null;
    this.letters = [];
    this.grid = { columns: 0, rows: 0 };
    this.animationId = null;
    this.lastGlitchTime = Date.now();
    this.isRunning = false;

    // Character set for the glitch effect
    this.lettersAndSymbols = [
      'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
      'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
      '!', '@', '#', '$', '&', '*', '(', ')', '-', '_', '+', '=', '/',
      '[', ']', '{', '}', ';', ':', '<', '>', ',', '0', '1', '2', '3',
      '4', '5', '6', '7', '8', '9'
    ];

    this.init();
  }

  /**
   * Initialize the letter glitch effect
   */
  init() {
    this.context = this.canvas.getContext('2d');
    if (!this.context) {
      console.error('Failed to get 2D context from canvas');
      return;
    }

    this.setupCanvas();
    this.setupEventListeners();
    this.start();
  }

  /**
   * Setup canvas and initial grid
   */
  setupCanvas() {
    this.resizeCanvas();
    this.context.font = `${this.config.fontSize}px monospace`;
    this.context.textBaseline = 'top';
  }

  /**
   * Setup event listeners for responsive behavior
   */
  setupEventListeners() {
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.stop();
        this.resizeCanvas();
        this.start();
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    
    // Store the handler for cleanup
    this.resizeHandler = handleResize;
  }

  /**
   * Resize canvas to fit parent container
   */
  resizeCanvas() {
    const parent = this.canvas.parentElement;
    if (!parent) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = parent.getBoundingClientRect();

    // Set canvas size
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    // Set display size
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;

    // Scale context for high DPI displays
    if (this.context) {
      this.context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // Calculate grid and initialize letters
    const { columns, rows } = this.calculateGrid(rect.width, rect.height);
    this.initializeLetters(columns, rows);
  }

  /**
   * Calculate grid dimensions based on canvas size
   */
  calculateGrid(width, height) {
    const columns = Math.ceil(width / this.config.charWidth);
    const rows = Math.ceil(height / this.config.charHeight);
    return { columns, rows };
  }

  /**
   * Initialize the letters array with random characters and colors
   */
  initializeLetters(columns, rows) {
    this.grid = { columns, rows };
    const totalLetters = columns * rows;
    
    this.letters = Array.from({ length: totalLetters }, () => ({
      char: this.getRandomChar(),
      color: this.getRandomColor(),
      targetColor: this.getRandomColor(),
      colorProgress: 1
    }));
  }

  /**
   * Get a random character from the character set
   */
  getRandomChar() {
    return this.lettersAndSymbols[Math.floor(Math.random() * this.lettersAndSymbols.length)];
  }

  /**
   * Get a random color from the glitch colors
   */
  getRandomColor() {
    return this.config.glitchColors[Math.floor(Math.random() * this.config.glitchColors.length)];
  }

  /**
   * Convert hex color to RGB object
   */
  hexToRgb(hex) {
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => {
      return r + r + g + g + b + b;
    });

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Interpolate between two colors
   */
  interpolateColor(start, end, factor) {
    const result = {
      r: Math.round(start.r + (end.r - start.r) * factor),
      g: Math.round(start.g + (end.g - start.g) * factor),
      b: Math.round(start.b + (end.b - start.b) * factor)
    };
    return `rgb(${result.r}, ${result.g}, ${result.b})`;
  }

  /**
   * Update letters with new characters and colors
   */
  updateLetters() {
    if (!this.letters || this.letters.length === 0) return;

    const updateCount = Math.max(1, Math.floor(this.letters.length * 0.05));

    for (let i = 0; i < updateCount; i++) {
      const index = Math.floor(Math.random() * this.letters.length);
      if (!this.letters[index]) continue;

      this.letters[index].char = this.getRandomChar();
      this.letters[index].targetColor = this.getRandomColor();

      if (!this.config.smooth) {
        this.letters[index].color = this.letters[index].targetColor;
        this.letters[index].colorProgress = 1;
      } else {
        this.letters[index].colorProgress = 0;
      }
    }
  }

  /**
   * Handle smooth color transitions
   */
  handleSmoothTransitions() {
    let needsRedraw = false;
    
    this.letters.forEach((letter) => {
      if (letter.colorProgress < 1) {
        letter.colorProgress += 0.05;
        if (letter.colorProgress > 1) letter.colorProgress = 1;

        const startRgb = this.hexToRgb(letter.color);
        const endRgb = this.hexToRgb(letter.targetColor);
        
        if (startRgb && endRgb) {
          letter.color = this.interpolateColor(startRgb, endRgb, letter.colorProgress);
          needsRedraw = true;
        }
      }
    });

    return needsRedraw;
  }

  /**
   * Draw all letters on the canvas
   */
  drawLetters() {
    if (!this.context || this.letters.length === 0) return;

    const { width, height } = this.canvas.getBoundingClientRect();
    this.context.clearRect(0, 0, width, height);

    // Draw letters
    this.letters.forEach((letter, index) => {
      const x = (index % this.grid.columns) * this.config.charWidth;
      const y = Math.floor(index / this.grid.columns) * this.config.charHeight;
      
      this.context.fillStyle = letter.color;
      this.context.fillText(letter.char, x, y);
    });

    // Draw vignette effects
    this.drawVignettes(width, height);
  }

  /**
   * Draw vignette effects
   */
  drawVignettes(width, height) {
    if (this.config.outerVignette) {
      const gradient = this.context.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 2
      );
      gradient.addColorStop(0.6, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(0,0,0,1)');
      
      this.context.fillStyle = gradient;
      this.context.fillRect(0, 0, width, height);
    }

    if (this.config.centerVignette) {
      const gradient = this.context.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) / 3
      );
      gradient.addColorStop(0, 'rgba(0,0,0,0.8)');
      gradient.addColorStop(0.6, 'rgba(0,0,0,0)');
      
      this.context.fillStyle = gradient;
      this.context.fillRect(0, 0, width, height);
    }
  }

  /**
   * Animation loop
   */
  animate() {
    if (!this.isRunning) return;

    const now = Date.now();
    let shouldRedraw = false;

    // Update letters based on glitch speed
    if (now - this.lastGlitchTime >= this.config.glitchSpeed) {
      this.updateLetters();
      shouldRedraw = true;
      this.lastGlitchTime = now;
    }

    // Handle smooth transitions
    if (this.config.smooth) {
      if (this.handleSmoothTransitions()) {
        shouldRedraw = true;
      }
    }

    // Redraw if needed
    if (shouldRedraw) {
      this.drawLetters();
    }

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  /**
   * Start the animation
   */
  start() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.lastGlitchTime = Date.now();
    this.animate();
  }

  /**
   * Stop the animation
   */
  stop() {
    this.isRunning = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Update font if fontSize changed
    if (newConfig.fontSize) {
      this.context.font = `${this.config.fontSize}px monospace`;
    }
  }

  /**
   * Destroy the instance and clean up resources
   */
  destroy() {
    this.stop();
    
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    
    // Clear canvas
    if (this.context) {
      const { width, height } = this.canvas.getBoundingClientRect();
      this.context.clearRect(0, 0, width, height);
    }
    
    // Clear references
    this.canvas = null;
    this.context = null;
    this.letters = [];
    this.resizeHandler = null;
  }
}

// Export for use in other scripts
window.LetterGlitch = LetterGlitch;
