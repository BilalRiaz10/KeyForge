/**
 * ============================================================================
 * KEYFORGE - SCRIPT (Version 2 Upgrade)
 * Professional, client-side, cryptographically secure password utility.
 * ============================================================================
 */

(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Constants & Character Sets
  // --------------------------------------------------------------------------
  const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  const AMBIGUOUS_CHARS = ['0', 'O', '1', 'l', 'I'];

  const PRESETS = {
    basic: {
      length: 12,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: false,
      excludeAmbiguous: true,
      reqUppercase: 0,
      reqLowercase: 0,
      reqNumbers: 0,
      reqSymbols: 0
    },
    strong: {
      length: 16,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: true,
      reqUppercase: 0,
      reqLowercase: 0,
      reqNumbers: 0,
      reqSymbols: 0
    },
    maximum: {
      length: 32,
      uppercase: true,
      lowercase: true,
      numbers: true,
      symbols: true,
      excludeAmbiguous: true,
      reqUppercase: 0,
      reqLowercase: 0,
      reqNumbers: 0,
      reqSymbols: 0
    }
  };

  // --------------------------------------------------------------------------
  // 2. Application State
  // --------------------------------------------------------------------------
  let currentPasswordString = '';
  let isPasswordMasked = false;
  let historyEnabled = false;
  let historyList = [];
  let currentActivePreset = 'custom';
  let toastTimer = null;

  // --------------------------------------------------------------------------
  // 3. DOM Elements
  // --------------------------------------------------------------------------
  const passwordOutput = document.getElementById('password-output');
  const btnToggleVisibility = document.getElementById('btn-toggle-visibility');
  const eyeIcon = btnToggleVisibility ? btnToggleVisibility.querySelector('.eye-icon') : null;
  const eyeOffIcon = btnToggleVisibility ? btnToggleVisibility.querySelector('.eye-off-icon') : null;

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

  const reqUppercaseInput = document.getElementById('req-uppercase');
  const reqLowercaseInput = document.getElementById('req-lowercase');
  const reqNumbersInput = document.getElementById('req-numbers');
  const reqSymbolsInput = document.getElementById('req-symbols');

  const presetButtons = document.querySelectorAll('.preset-btn');
  const stepperButtons = document.querySelectorAll('.stepper-btn');

  const strengthLabel = document.getElementById('strength-label');
  const entropyDisplay = document.getElementById('entropy-display');
  const strengthBar = document.getElementById('strength-bar');
  const warningBanner = document.getElementById('warning-banner');
  const warningText = document.getElementById('warning-text');

  // History DOM
  const chkEnableHistory = document.getElementById('chk-enable-history');
  const historyListEl = document.getElementById('history-list');
  const historyEmptyMsg = document.getElementById('history-empty-msg');
  const btnClearHistory = document.getElementById('btn-clear-history');

  // Modal DOM
  const confirmModal = document.getElementById('confirm-modal');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalConfirm = document.getElementById('btn-modal-confirm');

  // Checklist DOM
  const checkLength = document.getElementById('check-length');
  const checkUppercase = document.getElementById('check-uppercase');
  const checkLowercase = document.getElementById('check-lowercase');
  const checkNumbers = document.getElementById('check-numbers');
  const checkSymbols = document.getElementById('check-symbols');
  const checkVariety = document.getElementById('check-variety');

  // --------------------------------------------------------------------------
  // 4. Cryptographically Secure Random Utilities
  // --------------------------------------------------------------------------
  
  /**
   * Generates a cryptographically secure random integer between 0 (inclusive) and max (exclusive).
   * Uses Web Crypto API rejection sampling to eliminate modulo bias.
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
  function secureShuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  // --------------------------------------------------------------------------
  // 5. Validation & Helper Functions
  // --------------------------------------------------------------------------

  function filterAmbiguous(pool) {
    return pool
      .split('')
      .filter(char => !AMBIGUOUS_CHARS.includes(char))
      .join('');
  }

  /**
   * Validates character options and minimum requirements.
   * @returns {{ valid: boolean, errorMsg: string }}
   */
  function validateRequirements() {
    const length = parseInt(lengthSlider.value, 10);

    const reqUp = parseInt(reqUppercaseInput.value, 10) || 0;
    const reqLow = parseInt(reqLowercaseInput.value, 10) || 0;
    const reqNum = parseInt(reqNumbersInput.value, 10) || 0;
    const reqSym = parseInt(reqSymbolsInput.value, 10) || 0;

    // Check if any character set is enabled
    if (!chkUppercase.checked && !chkLowercase.checked && !chkNumbers.checked && !chkSymbols.checked) {
      return { valid: false, errorMsg: 'Please select at least one character type.' };
    }

    // Check if requirements are active on disabled categories
    if (reqUp > 0 && !chkUppercase.checked) {
      return { valid: false, errorMsg: 'Uppercase is required, but Uppercase is disabled.' };
    }
    if (reqLow > 0 && !chkLowercase.checked) {
      return { valid: false, errorMsg: 'Lowercase is required, but Lowercase is disabled.' };
    }
    if (reqNum > 0 && !chkNumbers.checked) {
      return { valid: false, errorMsg: 'Numbers are required, but Numbers category is disabled.' };
    }
    if (reqSym > 0 && !chkSymbols.checked) {
      return { valid: false, errorMsg: 'Symbols are required, but Symbols category is disabled.' };
    }

    // Check if total minimum requirements exceed length
    const totalReq = reqUp + reqLow + reqNum + reqSym;
    if (totalReq > length) {
      return { valid: false, errorMsg: `Minimum requirements (${totalReq}) exceed password length (${length}).` };
    }

    return { valid: true, errorMsg: '' };
  }

  function handleValidationError(msg) {
    currentPasswordString = '';
    passwordOutput.value = '';
    passwordOutput.placeholder = 'Invalid configuration';
    warningText.textContent = msg;
    warningBanner.hidden = false;
    warningBanner.style.display = 'flex';

    btnCopy.disabled = true;
    btnMainGenerate.disabled = true;
    btnGenerate.disabled = true;

    strengthLabel.textContent = 'Invalid';
    entropyDisplay.textContent = '0 bits entropy';
    strengthBar.style.width = '0%';
    resetChecklist();
  }

  function clearValidationError() {
    passwordOutput.placeholder = 'Click Generate';
    warningBanner.hidden = true;
    warningBanner.style.display = 'none';

    btnCopy.disabled = false;
    btnMainGenerate.disabled = false;
    btnGenerate.disabled = false;
  }

  // --------------------------------------------------------------------------
  // 6. Main Password Generation Engine
  // --------------------------------------------------------------------------
  function generatePassword() {
    const validation = validateRequirements();
    if (!validation.valid) {
      handleValidationError(validation.errorMsg);
      return;
    }
    clearValidationError();

    const length = parseInt(lengthSlider.value, 10);
    const excludeAmbiguous = chkExcludeAmbiguous.checked;

    // Build available pools
    const pools = {};
    if (chkUppercase.checked) pools.uppercase = excludeAmbiguous ? filterAmbiguous(CHAR_SETS.uppercase) : CHAR_SETS.uppercase;
    if (chkLowercase.checked) pools.lowercase = excludeAmbiguous ? filterAmbiguous(CHAR_SETS.lowercase) : CHAR_SETS.lowercase;
    if (chkNumbers.checked) pools.numbers = excludeAmbiguous ? filterAmbiguous(CHAR_SETS.numbers) : CHAR_SETS.numbers;
    if (chkSymbols.checked) pools.symbols = excludeAmbiguous ? filterAmbiguous(CHAR_SETS.symbols) : CHAR_SETS.symbols;

    const activePoolKeys = Object.keys(pools);
    const passwordChars = [];

    // 1. Satisfy explicit minimum requirements
    const reqCounts = {
      uppercase: parseInt(reqUppercaseInput.value, 10) || 0,
      lowercase: parseInt(reqLowercaseInput.value, 10) || 0,
      numbers: parseInt(reqNumbersInput.value, 10) || 0,
      symbols: parseInt(reqSymbolsInput.value, 10) || 0
    };

    Object.keys(reqCounts).forEach(type => {
      const count = reqCounts[type];
      if (count > 0 && pools[type]) {
        for (let i = 0; i < count; i++) {
          const randIdx = getRandomInt(pools[type].length);
          passwordChars.push(pools[type][randIdx]);
        }
      }
    });

    // 2. Guarantee at least 1 character from each enabled pool if not already added by requirements
    activePoolKeys.forEach(type => {
      if (!reqCounts[type] || reqCounts[type] <= 0) {
        if (passwordChars.length < length && pools[type]) {
          const randIdx = getRandomInt(pools[type].length);
          passwordChars.push(pools[type][randIdx]);
        }
      }
    });

    // 3. Fill remaining positions up to requested length from combined pool
    const combinedPool = Object.values(pools).join('');
    while (passwordChars.length < length) {
      const randIdx = getRandomInt(combinedPool.length);
      passwordChars.push(combinedPool[randIdx]);
    }

    // 4. Securely shuffle final array using Web Crypto API Fisher-Yates
    secureShuffle(passwordChars);

    // Save actual raw password string
    currentPasswordString = passwordChars.join('');

    // Update Display (respect masking)
    renderPasswordDisplay();

    // Calculate strength, entropy, and update checklist
    const totalPoolSize = new Set(combinedPool.split('')).size;
    updateStrengthAndEntropy(length, totalPoolSize, activePoolKeys.length);
    runPasswordAnalysis(currentPasswordString, activePoolKeys.length);

    // Save to history if opt-in enabled
    if (historyEnabled) {
      addPasswordToHistory(currentPasswordString);
    }

    // Save persistent settings
    saveSettings();
  }

  function renderPasswordDisplay() {
    if (!currentPasswordString) {
      passwordOutput.value = '';
      return;
    }

    if (isPasswordMasked) {
      passwordOutput.value = '•'.repeat(currentPasswordString.length);
    } else {
      passwordOutput.value = currentPasswordString;
    }
  }

  function togglePasswordVisibility() {
    isPasswordMasked = !isPasswordMasked;
    if (btnToggleVisibility) {
      btnToggleVisibility.setAttribute('aria-label', isPasswordMasked ? 'Show password' : 'Hide password');
      if (eyeIcon && eyeOffIcon) {
        eyeIcon.style.display = isPasswordMasked ? 'none' : 'block';
        eyeOffIcon.style.display = isPasswordMasked ? 'block' : 'none';
      }
    }
    renderPasswordDisplay();
  }

  // --------------------------------------------------------------------------
  // 7. Strength & Analysis Checklist Engine
  // --------------------------------------------------------------------------

  function calculateEntropy(length, poolSize) {
    if (poolSize <= 0 || length <= 0) return 0;
    return length * Math.log2(poolSize);
  }

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

  function setCheckitemState(el, passed, passText, warnText) {
    if (!el) return;
    const icon = el.querySelector('.check-icon');
    const text = el.querySelector('.check-text');

    if (passed) {
      el.className = 'checklist-item pass';
      if (icon) icon.textContent = '✓';
      if (text) text.textContent = passText;
    } else {
      el.className = 'checklist-item warn';
      if (icon) icon.textContent = '⚠';
      if (text) text.textContent = warnText;
    }
  }

  function resetChecklist() {
    setCheckitemState(checkLength, false, 'Good password length', 'Increase length');
    setCheckitemState(checkUppercase, false, 'Contains uppercase letters', 'Add uppercase');
    setCheckitemState(checkLowercase, false, 'Contains lowercase letters', 'Add lowercase');
    setCheckitemState(checkNumbers, false, 'Contains numbers', 'Add numbers');
    setCheckitemState(checkSymbols, false, 'Contains symbols', 'Add symbols');
    setCheckitemState(checkVariety, false, 'Good character variety', 'Use more types');
  }

  function runPasswordAnalysis(password, activePoolCount) {
    if (!password) {
      resetChecklist();
      return;
    }

    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSym = /[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password);

    setCheckitemState(checkLength, password.length >= 12, 'Good password length (12+)', 'Increase password length');
    setCheckitemState(checkUppercase, hasUpper, 'Contains uppercase letters', 'Add uppercase letters');
    setCheckitemState(checkLowercase, hasLower, 'Contains lowercase letters', 'Add lowercase letters');
    setCheckitemState(checkNumbers, hasNum, 'Contains numbers', 'Add numbers');
    setCheckitemState(checkSymbols, hasSym, 'Contains symbols', 'Add symbols');
    setCheckitemState(checkVariety, activePoolCount >= 3, 'Good character variety', 'Use more character types');
  }

  // --------------------------------------------------------------------------
  // 8. Presets Engine
  // --------------------------------------------------------------------------

  function applyPreset(presetKey) {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    currentActivePreset = presetKey;
    updatePresetButtonsUI();

    lengthSlider.value = preset.length;
    lengthValDisplay.textContent = preset.length;

    chkUppercase.checked = preset.uppercase;
    chkLowercase.checked = preset.lowercase;
    chkNumbers.checked = preset.numbers;
    chkSymbols.checked = preset.symbols;
    chkExcludeAmbiguous.checked = preset.excludeAmbiguous;

    reqUppercaseInput.value = preset.reqUppercase;
    reqLowercaseInput.value = preset.reqLowercase;
    reqNumbersInput.value = preset.reqNumbers;
    reqSymbolsInput.value = preset.reqSymbols;

    updateSliderFill();
    generatePassword();
  }

  function setCustomPreset() {
    currentActivePreset = 'custom';
    updatePresetButtonsUI();
  }

  function updatePresetButtonsUI() {
    presetButtons.forEach(btn => {
      if (btn.dataset.preset === currentActivePreset) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  // --------------------------------------------------------------------------
  // 9. Password History Engine (Opt-in)
  // --------------------------------------------------------------------------

  function loadHistory() {
    try {
      const savedHistory = localStorage.getItem('keyforge_history');
      if (savedHistory) {
        historyList = JSON.parse(savedHistory) || [];
      }
      const savedEnabled = localStorage.getItem('keyforge_history_enabled');
      historyEnabled = savedEnabled === 'true';
    } catch (e) {
      console.warn('localStorage read error:', e);
      historyList = [];
      historyEnabled = false;
    }

    chkEnableHistory.checked = historyEnabled;
    renderHistory();
  }

  function saveHistoryToStorage() {
    try {
      localStorage.setItem('keyforge_history', JSON.stringify(historyList));
      localStorage.setItem('keyforge_history_enabled', historyEnabled.toString());
    } catch (e) {
      console.warn('localStorage write error:', e);
    }
  }

  function addPasswordToHistory(pwd) {
    if (!pwd || !historyEnabled) return;

    // Deduplicate
    historyList = historyList.filter(item => item !== pwd);
    // Add to front
    historyList.unshift(pwd);
    // Limit max 10
    if (historyList.length > 10) {
      historyList = historyList.slice(0, 10);
    }

    saveHistoryToStorage();
    renderHistory();
  }

  function removeHistoryItem(index) {
    historyList.splice(index, 1);
    saveHistoryToStorage();
    renderHistory();
    showToast('Removed from history');
  }

  function clearHistory() {
    historyList = [];
    saveHistoryToStorage();
    renderHistory();
    showToast('History cleared');
  }

  function renderHistory() {
    if (!historyEnabled) {
      historyEmptyMsg.textContent = 'History disabled';
      historyEmptyMsg.style.display = 'block';
      historyListEl.innerHTML = '';
      btnClearHistory.disabled = true;
      return;
    }

    if (historyList.length === 0) {
      historyEmptyMsg.textContent = 'No history yet';
      historyEmptyMsg.style.display = 'block';
      historyListEl.innerHTML = '';
      btnClearHistory.disabled = true;
      return;
    }

    historyEmptyMsg.style.display = 'none';
    btnClearHistory.disabled = false;
    historyListEl.innerHTML = '';

    historyList.forEach((pwd, idx) => {
      const li = document.createElement('li');
      li.className = 'history-item';

      const pwdSpan = document.createElement('span');
      pwdSpan.className = 'history-item-pwd';
      pwdSpan.textContent = pwd;

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'history-actions';

      const btnCopyItem = document.createElement('button');
      btnCopyItem.className = 'history-action-btn';
      btnCopyItem.textContent = 'Copy';
      btnCopyItem.title = 'Copy password';
      btnCopyItem.addEventListener('click', () => {
        copyTextToClipboard(pwd, 'Copied from history!');
      });

      const btnDelItem = document.createElement('button');
      btnDelItem.className = 'history-action-btn delete-btn';
      btnDelItem.textContent = '×';
      btnDelItem.title = 'Delete item';
      btnDelItem.addEventListener('click', () => {
        removeHistoryItem(idx);
      });

      actionsDiv.appendChild(btnCopyItem);
      actionsDiv.appendChild(btnDelItem);
      li.appendChild(pwdSpan);
      li.appendChild(actionsDiv);

      historyListEl.appendChild(li);
    });
  }

  // --------------------------------------------------------------------------
  // 10. Modal Confirmation Overlay
  // --------------------------------------------------------------------------

  function openConfirmModal() {
    if (confirmModal) {
      confirmModal.style.display = 'flex';
      confirmModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeConfirmModal() {
    if (confirmModal) {
      confirmModal.style.display = 'none';
      confirmModal.setAttribute('aria-hidden', 'true');
    }
  }

  // --------------------------------------------------------------------------
  // 11. Clipboard & Toast Notifications
  // --------------------------------------------------------------------------

  async function copyTextToClipboard(text, successMsg = 'Copied to clipboard!') {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }
      showToast(successMsg);
    } catch (err) {
      console.error('Copy failed:', err);
      showToast('Unable to copy automatically');
    }
  }

  function copyCurrentPassword() {
    if (!currentPasswordString) return;
    btnCopy.classList.add('copied');
    copyText.textContent = 'Copied!';
    copyTextToClipboard(currentPasswordString, 'Copied to clipboard!');

    setTimeout(() => {
      btnCopy.classList.remove('copied');
      copyText.textContent = 'Copy';
    }, 2000);
  }

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2200);
  }

  // --------------------------------------------------------------------------
  // 12. Settings Persistence & Theme Logic
  // --------------------------------------------------------------------------

  function saveSettings() {
    try {
      const settings = {
        length: lengthSlider.value,
        uppercase: chkUppercase.checked,
        lowercase: chkLowercase.checked,
        numbers: chkNumbers.checked,
        symbols: chkSymbols.checked,
        excludeAmbiguous: chkExcludeAmbiguous.checked,
        reqUppercase: reqUppercaseInput.value,
        reqLowercase: reqLowercaseInput.value,
        reqNumbers: reqNumbersInput.value,
        reqSymbols: reqSymbolsInput.value,
        preset: currentActivePreset
      };
      localStorage.setItem('keyforge_settings', JSON.stringify(settings));
    } catch (e) {
      console.warn('localStorage save settings error:', e);
    }
  }

  function loadSettings() {
    try {
      const saved = localStorage.getItem('keyforge_settings');
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.length) lengthSlider.value = settings.length;
        if (settings.uppercase !== undefined) chkUppercase.checked = settings.uppercase;
        if (settings.lowercase !== undefined) chkLowercase.checked = settings.lowercase;
        if (settings.numbers !== undefined) chkNumbers.checked = settings.numbers;
        if (settings.symbols !== undefined) chkSymbols.checked = settings.symbols;
        if (settings.excludeAmbiguous !== undefined) chkExcludeAmbiguous.checked = settings.excludeAmbiguous;

        if (settings.reqUppercase !== undefined) reqUppercaseInput.value = settings.reqUppercase;
        if (settings.reqLowercase !== undefined) reqLowercaseInput.value = settings.reqLowercase;
        if (settings.reqNumbers !== undefined) reqNumbersInput.value = settings.reqNumbers;
        if (settings.reqSymbols !== undefined) reqSymbolsInput.value = settings.reqSymbols;

        if (settings.preset) currentActivePreset = settings.preset;
      }
    } catch (e) {
      console.warn('localStorage load settings error:', e);
    }

    lengthValDisplay.textContent = lengthSlider.value;
    updatePresetButtonsUI();
  }

  function updateSliderFill() {
    const min = parseInt(lengthSlider.min, 10);
    const max = parseInt(lengthSlider.max, 10);
    const val = parseInt(lengthSlider.value, 10);
    const percentage = ((val - min) / (max - min)) * 100;
    
    const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    const trackColor = getComputedStyle(document.documentElement).getPropertyValue('--input-border').trim();
    
    lengthSlider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percentage}%, ${trackColor} ${percentage}%, ${trackColor} 100%)`;
  }

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

  function triggerGenerateAnimation() {
    btnGenerate.classList.add('spinning');
    setTimeout(() => {
      btnGenerate.classList.remove('spinning');
    }, 400);
  }

  // --------------------------------------------------------------------------
  // 13. Event Listeners Initializer
  // --------------------------------------------------------------------------

  function initEventListeners() {
    // Slider
    lengthSlider.addEventListener('input', (e) => {
      lengthValDisplay.textContent = e.target.value;
      updateSliderFill();
      setCustomPreset();
      generatePassword();
    });

    // Checkboxes
    [chkUppercase, chkLowercase, chkNumbers, chkSymbols, chkExcludeAmbiguous].forEach(chk => {
      chk.addEventListener('change', () => {
        setCustomPreset();
        generatePassword();
      });
    });

    // Requirement Stepper buttons
    stepperButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const targetId = btn.dataset.target;
        const step = parseInt(btn.dataset.step, 10);
        const input = document.getElementById(targetId);
        if (input) {
          let val = (parseInt(input.value, 10) || 0) + step;
          if (val < 0) val = 0;
          if (val > 64) val = 64;
          input.value = val;
          setCustomPreset();
          generatePassword();
        }
      });
    });

    // Direct requirement number input
    [reqUppercaseInput, reqLowercaseInput, reqNumbersInput, reqSymbolsInput].forEach(input => {
      input.addEventListener('input', () => {
        setCustomPreset();
        generatePassword();
      });
    });

    // Preset buttons
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const presetKey = btn.dataset.preset;
        if (presetKey === 'custom') {
          setCustomPreset();
        } else {
          applyPreset(presetKey);
        }
      });
    });

    // Action buttons
    btnGenerate.addEventListener('click', () => {
      triggerGenerateAnimation();
      generatePassword();
    });

    btnMainGenerate.addEventListener('click', () => {
      triggerGenerateAnimation();
      generatePassword();
    });

    btnCopy.addEventListener('click', copyCurrentPassword);

    if (btnToggleVisibility) {
      btnToggleVisibility.addEventListener('click', togglePasswordVisibility);
    }

    themeToggleBtn.addEventListener('click', toggleTheme);

    // History listeners
    chkEnableHistory.addEventListener('change', (e) => {
      historyEnabled = e.target.checked;
      saveHistoryToStorage();
      renderHistory();
      if (historyEnabled && currentPasswordString) {
        addPasswordToHistory(currentPasswordString);
      }
    });

    btnClearHistory.addEventListener('click', openConfirmModal);
    btnModalCancel.addEventListener('click', closeConfirmModal);
    btnModalConfirm.addEventListener('click', () => {
      clearHistory();
      closeConfirmModal();
    });

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        triggerGenerateAnimation();
        generatePassword();
      } else if (e.key === 'Escape') {
        closeConfirmModal();
        if (toast) toast.classList.remove('show');
      }
    });

    // OS Theme preference watch
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        updateSliderFill();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 14. Application Entry Point
  // --------------------------------------------------------------------------

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    loadSettings();
    loadHistory();
    initEventListeners();
    updateSliderFill();
    generatePassword(); // Initial generation on load
  });

})();
