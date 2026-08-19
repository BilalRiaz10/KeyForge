
(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Character Set Definitions
  // --------------------------------------------------------------------------
  const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  const AMBIGUOUS_CHARS = ['0', 'O', '1', 'l', 'I'];

  // --------------------------------------------------------------------------
  // 2. DOM Elements
  // --------------------------------------------------------------------------
  const passwordOutput = document.getElementById('password-output');
  const btnGenerate = document.getElementById('btn-generate');
  const btnMainGenerate = document.getElementById('btn-main-generate');
  const btnCopy = document.getElementById('btn-copy');
  const copyText = document.getElementById('copy-text');
  const toast = document.getElementById('toast');
  const themeToggleBtn = document.getElementById('theme-toggle');

  const lengthSlider = document.getElementById('length-slider');
  const lengthValDisplay = document.getElementById('length-val');

  const chkUppercase = document.getElementById('chk-uppercase');
  const chkLowercase = document.getElementById('chk-lowercase');
  const chkNumbers = document.getElementById('chk-numbers');
  const chkSymbols = document.getElementById('chk-symbols');
  const chkExcludeAmbiguous = document.getElementById('chk-exclude-ambiguous');

  const strengthLabel = document.getElementById('strength-label');
  const entropyDisplay = document.getElementById('entropy-display');
  const strengthBar = document.getElementById('strength-bar');
  const warningBanner = document.getElementById('warning-banner');

  // --------------------------------------------------------------------------
  // 3. Cryptographically Secure Random Utilities
  // --------------------------------------------------------------------------
  
  /**
   * Generates a cryptographically secure random integer between 0 (inclusive) and max (exclusive).
   * Prevents modulo bias using rejection sampling.
   * @param {number} max
   * @returns {number}
   */
  function getRandomInt(max) {
    if (max <= 0) return 0;
    const array = new Uint32Array(1);
    const maxUint32 = 0xFFFFFFFF;
    const limit = maxUint32 - (maxUint32 % max);
    let rand;
    
    do {
      window.crypto.getRandomValues(array);
      rand = array[0];
    } while (rand >= limit);
    
    return rand % max;
  }

  /**
   * Cryptographically secure Fisher-Yates array shuffle.
   * @param {Array} array
   * @returns {Array}
   */
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  // --------------------------------------------------------------------------
  // 4. Password Generation Logic
  // --------------------------------------------------------------------------

  /**
   * Filters out ambiguous characters from a string pool.
   * @param {string} pool
   * @returns {string}
   */
  function filterAmbiguous(pool) {
    return pool
      .split('')
      .filter(char => !AMBIGUOUS_CHARS.includes(char))
      .join('');
  }

  /**
   * Main password generation function.
   */
  function generatePassword() {
    const length = parseInt(lengthSlider.value, 10);
    const excludeAmbiguous = chkExcludeAmbiguous.checked;

    // Collect enabled character pools
    const activePools = [];

    if (chkUppercase.checked) {
      const pool = excludeAmbiguous ? filterAmbiguous(CHAR_SETS.uppercase) : CHAR_SETS.uppercase;
      if (pool.length > 0) activePools.push(pool);
    }
    if (chkLowercase.checked) {
      const pool = excludeAmbiguous ? filterAmbiguous(CHAR_SETS.lowercase) : CHAR_SETS.lowercase;
      if (pool.length > 0) activePools.push(pool);
    }
    if (chkNumbers.checked) {
      const pool = excludeAmbiguous ? filterAmbiguous(CHAR_SETS.numbers) : CHAR_SETS.numbers;
      if (pool.length > 0) activePools.push(pool);
    }
    if (chkSymbols.checked) {
      const pool = excludeAmbiguous ? filterAmbiguous(CHAR_SETS.symbols) : CHAR_SETS.symbols;
      if (pool.length > 0) activePools.push(pool);
    }

    // Edge case: No pools selected
    if (activePools.length === 0) {
      handleNoSelectionState();
      return;
    } else {
      clearNoSelectionState();
    }

    // Combine all active pools into one character set
    const combinedPool = activePools.join('');
    const passwordChars = [];

    // Ensure at least one character from each selected option is included
    activePools.forEach(pool => {
      const randIdx = getRandomInt(pool.length);
      passwordChars.push(pool[randIdx]);
    });

    // Fill remaining length from combined pool
    for (let i = passwordChars.length; i < length; i++) {
      const randIdx = getRandomInt(combinedPool.length);
      passwordChars.push(combinedPool[randIdx]);
    }

    // Cryptographically shuffle to avoid predictable character positions
    shuffleArray(passwordChars);

    const resultPassword = passwordChars.join('');

    // Update UI display
    passwordOutput.value = resultPassword;

    // Calculate & update strength & entropy
    const totalPoolSize = new Set(combinedPool.split('')).size;
    updateStrengthAndEntropy(length, totalPoolSize, activePools.length);
  }

  // --------------------------------------------------------------------------
  // 5. Strength & Entropy Calculation
  // --------------------------------------------------------------------------

  /**
   * Calculates entropy in bits: E = length * log2(poolSize)
   * @param {number} length
   * @param {number} poolSize
   * @returns {number}
   */
  function calculateEntropy(length, poolSize) {
    if (poolSize <= 0 || length <= 0) return 0;
    return length * Math.log2(poolSize);
  }

  /**
   * Determines strength rating based on entropy, length, and variety.
   * @param {number} entropy
   * @param {number} length
   * @param {number} activePoolCount
   */
  function updateStrengthAndEntropy(length, poolSize, activePoolCount) {
    const entropy = calculateEntropy(length, poolSize);
    const roundedEntropy = Math.round(entropy);

    entropyDisplay.textContent = `${roundedEntropy} bits entropy`;

    let label = 'Weak';
    let colorVar = 'var(--strength-weak)';
    let percentage = 25;

    if (entropy < 40 || length < 10 || activePoolCount < 2) {
      label = 'Weak';
      colorVar = 'var(--strength-weak)';
      percentage = 25;
    } else if (entropy < 60) {
      label = 'Medium';
      colorVar = 'var(--strength-medium)';
      percentage = 50;
    } else if (entropy < 80) {
      label = 'Strong';
      colorVar = 'var(--strength-strong)';
      percentage = 75;
    } else {
      label = 'Very Strong';
      colorVar = 'var(--strength-very-strong)';
      percentage = 100;
    }

    strengthLabel.textContent = label;
    strengthBar.style.width = `${percentage}%`;
    strengthBar.style.backgroundColor = colorVar;
  }

  // --------------------------------------------------------------------------
  // 6. UI Handlers & State Updates
  // --------------------------------------------------------------------------

  function handleNoSelectionState() {
    passwordOutput.value = '';
    passwordOutput.placeholder = 'Select at least 1 option';
    warningBanner.hidden = false;
    btnCopy.disabled = true;
    btnMainGenerate.disabled = true;
    btnGenerate.disabled = true;
    strengthLabel.textContent = 'None';
    entropyDisplay.textContent = '0 bits entropy';
    strengthBar.style.width = '0%';
  }

  function clearNoSelectionState() {
    passwordOutput.placeholder = 'Click Generate';
    warningBanner.hidden = true;
    btnCopy.disabled = false;
    btnMainGenerate.disabled = false;
    btnGenerate.disabled = false;
  }

  function triggerGenerateAnimation() {
    btnGenerate.classList.add('spinning');
    setTimeout(() => {
      btnGenerate.classList.remove('spinning');
    }, 400);
  }

  /**
   * Copies current password to clipboard.
   */
  async function copyToClipboard() {
    const textToCopy = passwordOutput.value;
    if (!textToCopy) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        // Fallback for older browsers
        passwordOutput.select();
        document.execCommand('copy');
      }

      showCopyFeedback();
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  }

  function showCopyFeedback() {
    btnCopy.classList.add('copied');
    copyText.textContent = 'Copied!';
    toast.classList.add('show');

    setTimeout(() => {
      btnCopy.classList.remove('copied');
      copyText.textContent = 'Copy';
      toast.classList.remove('show');
    }, 2000);
  }

  /**
   * Updates slider visual track gradient.
   */
  function updateSliderFill() {
    const min = parseInt(lengthSlider.min, 10);
    const max = parseInt(lengthSlider.max, 10);
    const val = parseInt(lengthSlider.value, 10);
    const percentage = ((val - min) / (max - min)) * 100;
    
    // Dynamic theme color selection for slider fill
    const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    const trackColor = getComputedStyle(document.documentElement).getPropertyValue('--input-border').trim();
    
    lengthSlider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percentage}%, ${trackColor} ${percentage}%, ${trackColor} 100%)`;
  }

  // --------------------------------------------------------------------------
  // 7. Theme Switcher Logic
  // --------------------------------------------------------------------------
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
    updateSliderFill();
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateSliderFill();
  }

  // --------------------------------------------------------------------------
  // 8. Event Listeners Initialization
  // --------------------------------------------------------------------------
  function initEventListeners() {
    // Slider inputs
    lengthSlider.addEventListener('input', (e) => {
      lengthValDisplay.textContent = e.target.value;
      updateSliderFill();
      generatePassword();
    });

    // Checkbox toggles
    [chkUppercase, chkLowercase, chkNumbers, chkSymbols, chkExcludeAmbiguous].forEach(chk => {
      chk.addEventListener('change', generatePassword);
    });

    // Buttons
    btnGenerate.addEventListener('click', () => {
      triggerGenerateAnimation();
      generatePassword();
    });

    btnMainGenerate.addEventListener('click', () => {
      triggerGenerateAnimation();
      generatePassword();
    });

    btnCopy.addEventListener('click', copyToClipboard);

    themeToggleBtn.addEventListener('click', toggleTheme);

    // Watch for OS theme preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        updateSliderFill();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 9. App Initialization
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initEventListeners();
    updateSliderFill();
    generatePassword(); // Initial password on load
  });

})();
