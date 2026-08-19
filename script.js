
(function () {
  'use strict';

  // --------------------------------------------------------------------------
  // 1. Constants & Definitions
  // --------------------------------------------------------------------------
  const CHAR_SETS = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  };

  const AMBIGUOUS_CHARS = ['0', 'O', '1', 'l', 'I'];

  const PRESETS = {
    basic: { length: 10, uppercase: true, lowercase: true, numbers: true, symbols: false, excludeAmbiguous: false, reqUpper: 0, reqLower: 0, reqNum: 0, reqSym: 0 },
    strong: { length: 16, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false, reqUpper: 0, reqLower: 0, reqNum: 0, reqSym: 0 },
    maximum: { length: 32, uppercase: true, lowercase: true, numbers: true, symbols: true, excludeAmbiguous: false, reqUpper: 0, reqLower: 0, reqNum: 0, reqSym: 0 }
  };

  const MAX_HISTORY_ITEMS = 10;

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
  const btnToggleVisibility = document.getElementById('btn-toggle-visibility');
  const eyeIcon = btnToggleVisibility ? btnToggleVisibility.querySelector('.eye-icon') : null;
  const eyeOffIcon = btnToggleVisibility ? btnToggleVisibility.querySelector('.eye-off-icon') : null;

  const lengthSlider = document.getElementById('length-slider');
  const lengthValDisplay = document.getElementById('length-val');

  const chkUppercase = document.getElementById('chk-uppercase');
  const chkLowercase = document.getElementById('chk-lowercase');
  const chkNumbers = document.getElementById('chk-numbers');
  const chkSymbols = document.getElementById('chk-symbols');
  const chkExcludeAmbiguous = document.getElementById('chk-exclude-ambiguous');

  const reqUppercase = document.getElementById('req-uppercase');
  const reqLowercase = document.getElementById('req-lowercase');
  const reqNumbers = document.getElementById('req-numbers');
  const reqSymbols = document.getElementById('req-symbols');

  const strengthLabel = document.getElementById('strength-label');
  const entropyDisplay = document.getElementById('entropy-display');
  const strengthBar = document.getElementById('strength-bar');
  const warningBanner = document.getElementById('warning-banner');

  // Checklist items
  const checkLength = document.getElementById('check-length');
  const checkUppercase = document.getElementById('check-uppercase');
  const checkLowercase = document.getElementById('check-lowercase');
  const checkNumbers = document.getElementById('check-numbers');
  const checkSymbols = document.getElementById('check-symbols');
  const checkVariety = document.getElementById('check-variety');

  // Presets
  const presetButtons = document.querySelectorAll('.preset-btn');

  // History
  const chkEnableHistory = document.getElementById('chk-enable-history');
  const btnClearHistory = document.getElementById('btn-clear-history');
  const historyList = document.getElementById('history-list');
  const historyEmptyMsg = document.getElementById('history-empty-msg');
  const confirmModal = document.getElementById('confirm-modal');
  const btnModalCancel = document.getElementById('btn-modal-cancel');
  const btnModalConfirm = document.getElementById('btn-modal-confirm');

  // --------------------------------------------------------------------------
  // 3. Cryptographically Secure Random Utilities
  // --------------------------------------------------------------------------
  
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

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = getRandomInt(i + 1);
      const temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
    return array;
  }

  function filterAmbiguous(pool) {
    return pool
      .split('')
      .filter(char => !AMBIGUOUS_CHARS.includes(char))
      .join('');
  }

  // --------------------------------------------------------------------------
  // 4. Password Generation Logic
  // --------------------------------------------------------------------------
  function generatePassword(saveToHistory = true) {
    const length = parseInt(lengthSlider.value, 10);
    const excludeAmbiguous = chkExcludeAmbiguous.checked;

    const minUpper = parseInt(reqUppercase ? reqUppercase.value : '0', 10) || 0;
    const minLower = parseInt(reqLowercase ? reqLowercase.value : '0', 10) || 0;
    const minNum = parseInt(reqNumbers ? reqNumbers.value : '0', 10) || 0;
    const minSym = parseInt(reqSymbols ? reqSymbols.value : '0', 10) || 0;

    const upperPool = chkUppercase.checked ? (excludeAmbiguous ? filterAmbiguous(CHAR_SETS.uppercase) : CHAR_SETS.uppercase) : '';
    const lowerPool = chkLowercase.checked ? (excludeAmbiguous ? filterAmbiguous(CHAR_SETS.lowercase) : CHAR_SETS.lowercase) : '';
    const numPool = chkNumbers.checked ? (excludeAmbiguous ? filterAmbiguous(CHAR_SETS.numbers) : CHAR_SETS.numbers) : '';
    const symPool = chkSymbols.checked ? (excludeAmbiguous ? filterAmbiguous(CHAR_SETS.symbols) : CHAR_SETS.symbols) : '';

    const activePools = [];
    if (upperPool) activePools.push({ name: 'upper', pool: upperPool, min: minUpper });
    if (lowerPool) activePools.push({ name: 'lower', pool: lowerPool, min: minLower });
    if (numPool) activePools.push({ name: 'num', pool: numPool, min: minNum });
    if (symPool) activePools.push({ name: 'sym', pool: symPool, min: minSym });

    if (activePools.length === 0) {
      handleNoSelectionState();
      return;
    } else {
      clearNoSelectionState();
    }

    const combinedPool = activePools.map(p => p.pool).join('');
    const passwordChars = [];

    // 1. Satisfy explicit minimum requirements
    activePools.forEach(p => {
      const requiredCount = Math.max(p.min, 1); // at least 1 if checked, or specified min
      for (let i = 0; i < requiredCount; i++) {
        const randIdx = getRandomInt(p.pool.length);
        passwordChars.push(p.pool[randIdx]);
      }
    });

    // 2. Fill remaining characters from combined active pool
    while (passwordChars.length < length) {
      const randIdx = getRandomInt(combinedPool.length);
      passwordChars.push(combinedPool[randIdx]);
    }

    // If requirements exceeded requested length, truncate gracefully
    if (passwordChars.length > length) {
      passwordChars.length = length;
    }

    // 3. Cryptographically shuffle to prevent predictable patterns
    shuffleArray(passwordChars);

    const resultPassword = passwordChars.join('');
    passwordOutput.value = resultPassword;

    // Calculate strength and update checklist
    const totalPoolSize = new Set(combinedPool.split('')).size;
    const strengthInfo = updateStrengthAndEntropy(length, totalPoolSize, activePools.length);
    updateChecklist(resultPassword, length);

    // Save to history if opt-in is active
    if (saveToHistory) {
      addPasswordToHistory(resultPassword, strengthInfo.label);
    }
  }

  // --------------------------------------------------------------------------
  // 5. Strength, Entropy & Checklist Analysis
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

    return { label, entropy: roundedEntropy };
  }

  function updateChecklist(pwd, length) {
    const hasUpper = /[A-Z]/.test(pwd);
    const hasLower = /[a-z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSym = /[^A-Za-z0-9]/.test(pwd);
    const varietyCount = [hasUpper, hasLower, hasNum, hasSym].filter(Boolean).length;

    toggleCheckItem(checkLength, length >= 12);
    toggleCheckItem(checkUppercase, hasUpper);
    toggleCheckItem(checkLowercase, hasLower);
    toggleCheckItem(checkNumbers, hasNum);
    toggleCheckItem(checkSymbols, hasSym);
    toggleCheckItem(checkVariety, varietyCount >= 3);
  }

  function toggleCheckItem(el, isActive) {
    if (!el) return;
    if (isActive) {
      el.classList.add('active');
      const icon = el.querySelector('.check-icon');
      if (icon) icon.textContent = '✓';
    } else {
      el.classList.remove('active');
      const icon = el.querySelector('.check-icon');
      if (icon) icon.textContent = '•';
    }
  }

  // --------------------------------------------------------------------------
  // 6. UI Handlers & State Updates
  // --------------------------------------------------------------------------
  function handleNoSelectionState() {
    passwordOutput.value = '';
    passwordOutput.placeholder = 'Select at least 1 option';
    warningBanner.hidden = false;
    warningBanner.style.display = 'flex';
    btnCopy.disabled = true;
    btnMainGenerate.disabled = true;
    btnGenerate.disabled = true;
    strengthLabel.textContent = 'None';
    entropyDisplay.textContent = '0 bits entropy';
    strengthBar.style.width = '0%';

    [checkLength, checkUppercase, checkLowercase, checkNumbers, checkSymbols, checkVariety].forEach(el => {
      toggleCheckItem(el, false);
    });
  }

  function clearNoSelectionState() {
    passwordOutput.placeholder = 'Click Generate';
    warningBanner.hidden = true;
    warningBanner.style.display = 'none';
    btnCopy.disabled = false;
    btnMainGenerate.disabled = false;
    btnGenerate.disabled = false;
  }

  function triggerGenerateAnimation() {
    btnGenerate.classList.add('spinning');
    setTimeout(() => {
      btnGenerate.classList.remove('spinning');
    }, 350);
  }

  async function copyToClipboard(textToCopy) {
    const text = typeof textToCopy === 'string' ? textToCopy : passwordOutput.value;
    if (!text) return;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const temp = document.createElement('textarea');
        temp.value = text;
        document.body.appendChild(temp);
        temp.select();
        document.execCommand('copy');
        document.body.removeChild(temp);
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
    }, 1800);
  }

  function updateSliderFill() {
    const min = parseInt(lengthSlider.min, 10);
    const max = parseInt(lengthSlider.max, 10);
    const val = parseInt(lengthSlider.value, 10);
    const percentage = ((val - min) / (max - min)) * 100;
    
    const activeColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#6366f1';
    const trackColor = getComputedStyle(document.documentElement).getPropertyValue('--input-border').trim() || '#1e293b';
    
    lengthSlider.style.background = `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${percentage}%, ${trackColor} ${percentage}%, ${trackColor} 100%)`;
  }

  function togglePasswordVisibility() {
    if (passwordOutput.type === 'password') {
      passwordOutput.type = 'text';
      if (eyeIcon) eyeIcon.style.display = 'block';
      if (eyeOffIcon) eyeOffIcon.style.display = 'none';
      btnToggleVisibility.setAttribute('aria-label', 'Hide password');
    } else {
      passwordOutput.type = 'password';
      if (eyeIcon) eyeIcon.style.display = 'none';
      if (eyeOffIcon) eyeOffIcon.style.display = 'block';
      btnToggleVisibility.setAttribute('aria-label', 'Show password');
    }
  }

  // --------------------------------------------------------------------------
  // 7. Presets Management
  // --------------------------------------------------------------------------
  function applyPreset(presetName) {
    const preset = PRESETS[presetName];
    if (!preset) return;

    lengthSlider.value = preset.length;
    lengthValDisplay.textContent = preset.length;
    chkUppercase.checked = preset.uppercase;
    chkLowercase.checked = preset.lowercase;
    chkNumbers.checked = preset.numbers;
    chkSymbols.checked = preset.symbols;
    chkExcludeAmbiguous.checked = preset.excludeAmbiguous;

    if (reqUppercase) reqUppercase.value = preset.reqUpper;
    if (reqLowercase) reqLowercase.value = preset.reqLower;
    if (reqNumbers) reqNumbers.value = preset.reqNum;
    if (reqSymbols) reqSymbols.value = preset.reqSym;

    setActivePresetButton(presetName);
    updateSliderFill();
    triggerGenerateAnimation();
    generatePassword();
  }

  function setActivePresetButton(presetName) {
    presetButtons.forEach(btn => {
      if (btn.getAttribute('data-preset') === presetName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }

  function handleCustomAdjustment() {
    setActivePresetButton('custom');
  }

  // --------------------------------------------------------------------------
  // 8. Stepper Controls for Minimum Requirements
  // --------------------------------------------------------------------------
  function handleStepperChange(targetId, delta) {
    const targetInput = document.getElementById(targetId);
    if (!targetInput) return;

    let currentVal = parseInt(targetInput.value, 10) || 0;
    let newVal = Math.max(0, Math.min(64, currentVal + delta));

    // Check sum of requirements against password length
    const curUpper = targetId === 'req-uppercase' ? newVal : (parseInt(reqUppercase?.value, 10) || 0);
    const curLower = targetId === 'req-lowercase' ? newVal : (parseInt(reqLowercase?.value, 10) || 0);
    const curNum = targetId === 'req-numbers' ? newVal : (parseInt(reqNumbers?.value, 10) || 0);
    const curSym = targetId === 'req-symbols' ? newVal : (parseInt(reqSymbols?.value, 10) || 0);
    const totalReq = curUpper + curLower + curNum + curSym;

    const currentLength = parseInt(lengthSlider.value, 10);
    if (totalReq > currentLength) {
      lengthSlider.value = totalReq;
      lengthValDisplay.textContent = totalReq;
      updateSliderFill();
    }

    targetInput.value = newVal;

    // Auto-check corresponding checkbox if req > 0
    if (newVal > 0) {
      if (targetId === 'req-uppercase') chkUppercase.checked = true;
      if (targetId === 'req-lowercase') chkLowercase.checked = true;
      if (targetId === 'req-numbers') chkNumbers.checked = true;
      if (targetId === 'req-symbols') chkSymbols.checked = true;
    }

    handleCustomAdjustment();
    generatePassword();
  }

  // --------------------------------------------------------------------------
  // 9. Password History Storage & Modal
  // --------------------------------------------------------------------------
  function getHistory() {
    try {
      const stored = localStorage.getItem('keyforge_history');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(historyArray) {
    try {
      localStorage.setItem('keyforge_history', JSON.stringify(historyArray));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  function addPasswordToHistory(password, strength) {
    if (!chkEnableHistory.checked || !password) return;

    let history = getHistory();
    // Prepend new entry
    history.unshift({
      pwd: password,
      strength: strength,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    });

    if (history.length > MAX_HISTORY_ITEMS) {
      history = history.slice(0, MAX_HISTORY_ITEMS);
    }

    saveHistory(history);
    renderHistory();
  }

  function renderHistory() {
    if (!chkEnableHistory.checked) {
      historyEmptyMsg.textContent = 'History is disabled. Check "Auto-save" to store generated passwords locally.';
      historyEmptyMsg.style.display = 'block';
      historyList.innerHTML = '';
      btnClearHistory.disabled = true;
      return;
    }

    const history = getHistory();
    if (history.length === 0) {
      historyEmptyMsg.textContent = 'No passwords in history yet.';
      historyEmptyMsg.style.display = 'block';
      historyList.innerHTML = '';
      btnClearHistory.disabled = true;
      return;
    }

    historyEmptyMsg.style.display = 'none';
    btnClearHistory.disabled = false;
    historyList.innerHTML = '';

    history.forEach((item, index) => {
      const li = document.createElement('li');
      li.className = 'history-item';

      const pwdSpan = document.createElement('span');
      pwdSpan.className = 'history-pwd';
      pwdSpan.textContent = item.pwd;
      pwdSpan.title = `${item.pwd} (${item.strength} • ${item.time})`;

      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'history-actions';

      const copyBtn = document.createElement('button');
      copyBtn.type = 'button';
      copyBtn.className = 'history-action-btn';
      copyBtn.title = 'Copy';
      copyBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
        </svg>
      `;
      copyBtn.addEventListener('click', () => {
        copyToClipboard(item.pwd);
      });

      const delBtn = document.createElement('button');
      delBtn.type = 'button';
      delBtn.className = 'history-action-btn';
      delBtn.title = 'Delete';
      delBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 6 6 18"/>
          <path d="m6 6 12 12"/>
        </svg>
      `;
      delBtn.addEventListener('click', () => {
        deleteHistoryItem(index);
      });

      actionsDiv.appendChild(copyBtn);
      actionsDiv.appendChild(delBtn);

      li.appendChild(pwdSpan);
      li.appendChild(actionsDiv);
      historyList.appendChild(li);
    });
  }

  function deleteHistoryItem(index) {
    const history = getHistory();
    history.splice(index, 1);
    saveHistory(history);
    renderHistory();
  }

  function clearAllHistory() {
    saveHistory([]);
    renderHistory();
    closeClearModal();
  }

  function openClearModal() {
    if (confirmModal) {
      confirmModal.style.display = 'flex';
      confirmModal.setAttribute('aria-hidden', 'false');
    }
  }

  function closeClearModal() {
    if (confirmModal) {
      confirmModal.style.display = 'none';
      confirmModal.setAttribute('aria-hidden', 'true');
    }
  }

  // --------------------------------------------------------------------------
  // 10. Theme Switcher Logic
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
  // 11. Event Listeners Initialization
  // --------------------------------------------------------------------------
  function initEventListeners() {
    // Slider inputs
    lengthSlider.addEventListener('input', (e) => {
      lengthValDisplay.textContent = e.target.value;
      updateSliderFill();
      handleCustomAdjustment();
      generatePassword();
    });

    // Checkbox toggles
    [chkUppercase, chkLowercase, chkNumbers, chkSymbols, chkExcludeAmbiguous].forEach(chk => {
      chk.addEventListener('change', () => {
        handleCustomAdjustment();
        generatePassword();
      });
    });

    // Preset Buttons
    presetButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const preset = btn.getAttribute('data-preset');
        if (preset === 'custom') {
          setActivePresetButton('custom');
        } else {
          applyPreset(preset);
        }
      });
    });

    // Stepper Buttons (+ / -)
    document.querySelectorAll('.stepper-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetId = btn.getAttribute('data-target');
        const step = parseInt(btn.getAttribute('data-step'), 10) || 0;
        handleStepperChange(targetId, step);
      });
    });

    // Password Visibility Toggle
    if (btnToggleVisibility) {
      btnToggleVisibility.addEventListener('click', togglePasswordVisibility);
    }

    // Action Buttons
    btnGenerate.addEventListener('click', () => {
      triggerGenerateAnimation();
      generatePassword();
    });

    btnMainGenerate.addEventListener('click', () => {
      triggerGenerateAnimation();
      generatePassword();
    });

    btnCopy.addEventListener('click', () => copyToClipboard());

    themeToggleBtn.addEventListener('click', toggleTheme);

    // History opt-in
    chkEnableHistory.addEventListener('change', (e) => {
      localStorage.setItem('keyforge_history_optin', e.target.checked ? 'true' : 'false');
      renderHistory();
      if (e.target.checked && passwordOutput.value) {
        addPasswordToHistory(passwordOutput.value, strengthLabel.textContent);
      }
    });

    // History modal
    btnClearHistory.addEventListener('click', openClearModal);
    btnModalCancel.addEventListener('click', closeClearModal);
    btnModalConfirm.addEventListener('click', clearAllHistory);

    if (confirmModal) {
      confirmModal.addEventListener('click', (e) => {
        if (e.target === confirmModal) closeClearModal();
      });
    }

    // Keyboard Shortcuts (Ctrl+Enter / Cmd+Enter)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        triggerGenerateAnimation();
        generatePassword();
      }
      if (e.key === 'Escape' && confirmModal && confirmModal.style.display !== 'none') {
        closeClearModal();
      }
    });

    // Watch OS theme preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem('theme')) {
        document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        updateSliderFill();
      }
    });
  }

  // --------------------------------------------------------------------------
  // 12. App Initialization
  // --------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    initTheme();

    // Restore history opt-in preference
    const savedOptIn = localStorage.getItem('keyforge_history_optin') === 'true';
    chkEnableHistory.checked = savedOptIn;

    initEventListeners();
    updateSliderFill();
    renderHistory();
    generatePassword(false); // Initial password generation on load
  });

})();
