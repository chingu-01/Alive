/**
 * Popup Script - Handles Parent Mode, Child Mode, parent login, and OTP reset.
 */
const EMAIL_OTP_CONFIG = {
    DEMO_MODE: true, // Set to false and add credentials below for production
    serviceId: 'YOUR_EMAILJS_SERVICE_ID',
    templateId: 'YOUR_EMAILJS_TEMPLATE_ID',
    publicKey: 'YOUR_EMAILJS_PUBLIC_KEY'
};

const STORAGE_KEYS = [
    'activeMode',
    'tabLimit',
    'tabSwitches',
    'openTabs',
    'extraTabs',
    'tabOpenCount',
    'tabOpenHistory',
    'visitedTabs',
    'siteHistory',
    'lastViolation',
    'parentPasswordHash',
    'parentPasswordSalt',
    'parentEmail',
    'passwordResetOtpHash',
    'passwordResetOtpSalt',
    'passwordResetOtpExpiresAt',
    'passwordResetOtpEmail'
];
const OTP_EXPIRY_MS = 5 * 60 * 1000;

const parentModeBtn = document.getElementById('parentModeBtn');
const childModeBtn = document.getElementById('childModeBtn');
const modeHelp = document.getElementById('modeHelp');
const parentView = document.getElementById('parentView');
const childView = document.getElementById('childView');

const tabLimitInput = document.getElementById('tabLimitInput');
const decreaseBtn = document.getElementById('decreaseLimit');
const increaseBtn = document.getElementById('increaseLimit');
const tabLimitHelp = document.getElementById('tabLimitHelp');
const tabSwitchCount = document.getElementById('tabSwitchCount');
const openTabCount = document.getElementById('openTabCount');
const tabsOpenedCount = document.getElementById('tabsOpenedCount');
const sitesVisitedCount = document.getElementById('sitesVisitedCount');
const parentLimitValue = document.getElementById('parentLimitValue');
const extraTabsCount = document.getElementById('extraTabsCount');
const tabOpenHistoryContainer = document.getElementById('tabOpenHistoryContainer');
const openTabsList = document.getElementById('openTabsList');
const tabLimitWarning = document.getElementById('tabLimitWarning');
const extraTabMessage = document.getElementById('extraTabMessage');
const recoveryEmailInput = document.getElementById('recoveryEmailInput');
const saveRecoveryEmailBtn = document.getElementById('saveRecoveryEmailBtn');
const recoveryEmailStatus = document.getElementById('recoveryEmailStatus');

const childStatusCard = document.getElementById('childStatusCard');
const childStatusTitle = document.getElementById('childStatusTitle');
const childStatusDetail = document.getElementById('childStatusDetail');
const childOpenTabs = document.getElementById('childOpenTabs');

const childTabLimit = document.getElementById('childTabLimit');
const passwordModal = document.getElementById('passwordModal');
const passwordModalTitle = document.getElementById('passwordModalTitle');
const passwordModalHelp = document.getElementById('passwordModalHelp');
const parentPasswordInput = document.getElementById('parentPasswordInput');
const confirmParentPasswordInput = document.getElementById('confirmParentPasswordInput');
const parentEmailInput = document.getElementById('parentEmailInput');
const otpInput = document.getElementById('otpInput');
const passwordError = document.getElementById('passwordError');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');
const cancelPasswordBtn = document.getElementById('cancelPasswordBtn');
const submitPasswordBtn = document.getElementById('submitPasswordBtn');

const requestOtpBtn = document.getElementById('requestOtpBtn');
const verifyOtpBtn = document.getElementById('verifyOtpBtn');
const cancelOtpBtn = document.getElementById('cancelOtpBtn');
const recoveryOtpInput = document.getElementById('recoveryOtpInput');
const otpError = document.getElementById('otpError');
const otpRecoveryContent = document.getElementById('otpRecoveryContent');
const otpEntryContent = document.getElementById('otpEntryContent');
const demoOtpDisplay = document.getElementById('demoOtpDisplay');
const demoOtpCode = document.getElementById('demoOtpCode');

let parentUnlocked = false;
let passwordModalMode = 'login';
let otpRecoveryMode = 'request';

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadAndDisplayData();
    // Update stats in real-time every 500ms for live values
    setInterval(loadAndDisplayData, 500);
});

async function loadAndDisplayData() {
    try {
        const data = await chrome.storage.local.get(STORAGE_KEYS);
       const mode = parentUnlocked && data.activeMode === 'parent' ? 'parent' : 'child';
        if (data.activeMode !== mode) {
            await chrome.storage.local.set({ activeMode: mode });
        }
        const tabLimit = Number(data.tabLimit) || 4;
        const openTabs = await getCurrentOpenTabs(data.openTabs);
        const tabSwitches = Number(data.tabSwitches) || 0;
        const tabOpenHistory = data.tabOpenHistory || [];
        const visitedTabs = data.visitedTabs || [];

        renderMode(mode);
        updateTabLimit(tabLimit);
        updateRecoveryEmail(data.parentEmail || '');

        tabSwitchCount.textContent = tabSwitches;
        openTabCount.textContent = openTabs.length;
        tabsOpenedCount.textContent = tabOpenHistory.length || Number(data.tabOpenCount) || 0;
        sitesVisitedCount.textContent = visitedTabs.length;
        parentLimitValue.textContent = tabLimit;
        extraTabsCount.textContent = Math.max(openTabs.length - tabLimit, 0);
        

        displayTabLimitWarning(openTabs.length, tabLimit);
        displayOpenTabs(openTabs, tabLimit);
        displayTabOpenHistory(tabOpenHistory);
        displayChildStatus(openTabs.length, tabLimit);
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

async function getCurrentOpenTabs(storedTabs) {
    try {
        const tabs = await chrome.tabs.query({});
        return tabs.map(tab => normalizeTab(tab));
    } catch (error) {
        console.error('Error querying tabs:', error);
        return (storedTabs || []).map(tab => normalizeTab(tab));
    }
}

function normalizeTab(tab) {
    if (typeof tab === 'string') {
        return {
            url: tab,
            title: tab,
            windowId: '',
            index: 0,
            active: false
        };
    }

    return {
        id: tab.id,
        url: tab.url || 'about:blank',
        title: tab.title || tab.url || 'Unknown tab',
        windowId: tab.windowId ?? '',
        index: tab.index ?? 0,
        active: Boolean(tab.active)
    };
}

function renderMode(mode) {
    const isParent = mode === 'parent';
    parentModeBtn.classList.toggle('active', isParent);
    childModeBtn.classList.toggle('active', !isParent);
    parentModeBtn.setAttribute('aria-selected', String(isParent));
    childModeBtn.setAttribute('aria-selected', String(!isParent));
    parentView.classList.toggle('hidden', !isParent);
    childView.classList.toggle('hidden', isParent);
    modeHelp.textContent = isParent
        ? 'Parent Mode can set limits and review complete activity.'
        : 'Child Mode only shows whether the parent tab limit is being violated.';
}

function updateTabLimit(limit) {
    tabLimitInput.value = limit;
    tabLimitHelp.textContent = `Maximum ${limit} tab${limit === 1 ? '' : 's'} allowed`;
    childTabLimit.textContent = limit;
}

function updateRecoveryEmail(email) {
    if (document.activeElement !== recoveryEmailInput) {
        recoveryEmailInput.value = email;
    }

    recoveryEmailStatus.textContent = email
        ? `OTP recovery email saved: ${maskEmail(email)}`
        : 'Used only for forgot password OTP.';
}

function displayTabLimitWarning(currentTabCount, tabLimit) {
    const extraCount = Math.max(currentTabCount - tabLimit, 0);
    if (extraCount > 0) {
        tabLimitWarning.style.display = 'flex';
        extraTabMessage.textContent = `${currentTabCount} tabs are open. Close ${extraCount} extra tab${extraCount === 1 ? '' : 's'} to return to the ${tabLimit} tab limit.`;
    } else {
        tabLimitWarning.style.display = 'none';
    }
}

function displayOpenTabs(tabs, tabLimit) {
    if (!tabs || tabs.length === 0) {
        openTabsList.innerHTML = '<div class="empty-state">No tabs open</div>';
        return;
    }

    openTabsList.innerHTML = tabs
        .map((tab, index) => {
            const url = tab.url || 'about:blank';
            const title = tab.title || url;
            const isExtra = index >= tabLimit;
            const activeClass = tab.active ? ' active-tab' : '';
            const extraClass = isExtra ? ' extra-tab' : '';
            const badge = isExtra ? `+${index - tabLimit + 1}` : index + 1;

            return `
                <div class="tab-item${extraClass}${activeClass}">
                    <div class="tab-number">${badge}</div>
                    <div class="tab-details">
                        <div class="tab-title">${escapeHtml(title)}</div>
                        <a class="tab-url" href="${escapeAttribute(url)}" target="_blank" title="${escapeAttribute(url)}">${escapeHtml(url)}</a>
                    </div>
                </div>
            `;
        })
        .join('');
}

function displayTabOpenHistory(history) {
    // Tab history is immutable - displays all visited tabs in chronological order
    if (!history || history.length === 0) {
        tabOpenHistoryContainer.innerHTML = '<div class="empty-state">No tab opening data yet</div>';
        return;
    }

    const fullHistory = [...history].reverse();
    tabOpenHistoryContainer.innerHTML = fullHistory
        .map((entry, index) => {
            const url = entry.url || 'about:blank';
            const title = entry.title || url;
            const time = formatDateTime(entry.timestamp);

            return `
                <div class="history-item">
                    <div class="history-number">${fullHistory.length - index}</div>
                    <div class="history-details">
                        <div class="history-title">${escapeHtml(title)}</div>
                        <a class="history-url" href="${escapeAttribute(url)}" target="_blank" title="${escapeAttribute(url)}">${escapeHtml(url)}</a>
                        
                    </div>
                </div>
            `;
        })
        .join('');
}

function displayChildStatus(currentTabCount, tabLimit) {
    const extraCount = Math.max(currentTabCount - tabLimit, 0);
    childOpenTabs.textContent = currentTabCount;
    childTabLimit.textContent = tabLimit;
    childStatusCard.classList.toggle('violating', extraCount > 0);
    childStatusTitle.textContent = extraCount > 0 ? 'Tab limit violated' : 'Within tab limit';
    childStatusDetail.textContent = extraCount > 0
        ? `${currentTabCount} of ${tabLimit} tabs open. Close ${extraCount} extra tab${extraCount === 1 ? '' : 's'}.`
        : `${currentTabCount} of ${tabLimit} tabs open`;
}

function setupEventListeners() {
    parentModeBtn.addEventListener('click', requestParentAccess);
    childModeBtn.addEventListener('click', () => {
        parentUnlocked = false;
        setMode('child');
    });
    decreaseBtn.addEventListener('click', async () => {
        const currentLimit = Number(tabLimitInput.value) || 4;
        await setTabLimit(Math.max(currentLimit - 1, 1));
    });

    increaseBtn.addEventListener('click', async () => {
        const currentLimit = Number(tabLimitInput.value) || 4;
        await setTabLimit(Math.min(currentLimit + 1, 20));
    });

    tabLimitInput.addEventListener('change', async (event) => {
        const value = Number(event.target.value) || 4;
        await setTabLimit(Math.min(Math.max(value, 1), 20));
    });

    saveRecoveryEmailBtn.addEventListener('click', saveRecoveryEmail);
    requestOtpBtn.addEventListener('click', requestRecoveryOtp);
    verifyOtpBtn.addEventListener('click', verifyRecoveryOtp);
    cancelOtpBtn.addEventListener('click', cancelOtpRecovery);
    recoveryOtpInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            verifyRecoveryOtp();
        }
        if (event.key === 'Escape') {
            cancelOtpRecovery();
        }
    });
    cancelPasswordBtn.addEventListener('click', closePasswordModal);
    submitPasswordBtn.addEventListener('click', submitPasswordModal);
    forgotPasswordBtn.addEventListener('click', startForgotPasswordFlow);
    parentPasswordInput.addEventListener('keydown', handlePasswordKeydown);
    confirmParentPasswordInput.addEventListener('keydown', handlePasswordKeydown);
    parentEmailInput.addEventListener('keydown', handlePasswordKeydown);
    otpInput.addEventListener('keydown', handlePasswordKeydown);
    passwordModal.addEventListener('click', (event) => {
        if (event.target === passwordModal) {
            closePasswordModal();
        }
    });

    async function setTabLimit(limit) {
    await chrome.storage.local.set({ tabLimit: limit });
    updateTabLimit(limit);
    loadAndDisplayData();
}

async function saveRecoveryEmail() {
    const email = recoveryEmailInput.value.trim().toLowerCase();

    if (!isValidEmail(email)) {
        recoveryEmailStatus.textContent = 'Enter a valid parent email address.';
        recoveryEmailStatus.classList.add('error-text');
        return;
    }

    await chrome.storage.local.set({ parentEmail: email });
    recoveryEmailStatus.classList.remove('error-text');
    recoveryEmailStatus.textContent = `OTP recovery email saved: ${maskEmail(email)}`;
}

}


async function setMode(mode) {
    await chrome.storage.local.set({ activeMode: mode });
    renderMode(mode);
    loadAndDisplayData();
}
async function requestParentAccess() {
    if (parentUnlocked) {
        await setMode('parent');
        return;
    }

    const credentials = await chrome.storage.local.get(['parentPasswordHash', 'parentPasswordSalt']);
    const hasPassword = Boolean(credentials.parentPasswordHash && credentials.parentPasswordSalt);
    openPasswordModal(hasPassword ? 'login' : 'setup');
}

function openPasswordModal(mode, message = '') {
    passwordModalMode = mode;
    passwordError.textContent = '';
    parentPasswordInput.value = '';
    confirmParentPasswordInput.value = '';
    parentEmailInput.value = '';
    otpInput.value = '';
    setModalBusy(false);

    parentPasswordInput.classList.add('hidden');
    confirmParentPasswordInput.classList.add('hidden');
    parentEmailInput.classList.add('hidden');
    otpInput.classList.add('hidden');
    forgotPasswordBtn.classList.add('hidden');

    if (mode === 'setup') {
        passwordModalTitle.textContent = 'Set Parent Password';
        passwordModalHelp.textContent = 'Create a password and recovery email for OTP reset.';
        parentPasswordInput.placeholder = 'Create password';
        parentPasswordInput.autocomplete = 'new-password';
        parentPasswordInput.classList.remove('hidden');
        confirmParentPasswordInput.classList.remove('hidden');
        parentEmailInput.classList.remove('hidden');
        submitPasswordBtn.textContent = 'Save Password';
        }
         if (mode === 'otp') {
        passwordModalTitle.textContent = 'Verify OTP';
        passwordModalHelp.textContent = message || 'Enter the OTP sent to the parent email.';
        otpInput.classList.remove('hidden');
        submitPasswordBtn.textContent = 'Verify OTP';
    }

    if (mode === 'reset') {
        passwordModalTitle.textContent = 'Reset Parent Password';
        passwordModalHelp.textContent = 'Enter a new parent password.';
        parentPasswordInput.placeholder = 'New password';
        parentPasswordInput.autocomplete = 'new-password';
        parentPasswordInput.classList.remove('hidden');
        confirmParentPasswordInput.classList.remove('hidden');
        submitPasswordBtn.textContent = 'Save New Password';
    }

    if (mode === 'login') {
        passwordModalTitle.textContent = 'Parent Login';
        passwordModalHelp.textContent = 'Enter the parent password to unlock Parent Mode.';
        parentPasswordInput.placeholder = 'Parent password';
        parentPasswordInput.autocomplete = 'current-password';
        parentPasswordInput.classList.remove('hidden');
        forgotPasswordBtn.classList.remove('hidden');
        submitPasswordBtn.textContent = 'Unlock';
    }

    passwordModal.classList.remove('hidden');
    getFirstVisibleModalInput().focus();
}

function closePasswordModal() {
    passwordModal.classList.add('hidden');
    passwordError.textContent = '';
    setModalBusy(false);
}

async function submitPasswordModal() {
    if (passwordModalMode === 'setup') {
        await submitPasswordSetup();
        return;
    }

    if (passwordModalMode === 'login') {
        await submitPasswordLogin();
        return;
    }

    if (passwordModalMode === 'otp') {
        await submitOtpVerification();
        return;
    }

        if (passwordModalMode === 'reset') {
        await submitPasswordReset();
    }
}

       async function submitPasswordSetup() {
    const password = parentPasswordInput.value.trim();
    const confirmation = confirmParentPasswordInput.value.trim();
    const email = parentEmailInput.value.trim().toLowerCase();

        if (!validateNewPassword(password, confirmation)) {
        return;
    }

    if (!password) {
        passwordError.textContent = 'Enter the parent password.';
        return;
    }
    if (!isValidEmail(email)) {
        passwordError.textContent = 'Enter a valid parent email for OTP recovery.';
        return;
    }

    await saveParentPassword(password);
    await chrome.storage.local.set({ parentEmail: email });
    parentUnlocked = true;
    closePasswordModal();
    await setMode('parent');
}

async function submitPasswordLogin() {
    const password = parentPasswordInput.value.trim();

    const isValid = await verifyParentPassword(password);
    if (!isValid) {
        passwordError.textContent = 'Incorrect password.';
        parentPasswordInput.select();
        return;
    }

    parentUnlocked = true;
    closePasswordModal();
    await setMode('parent');
}
async function startForgotPasswordFlow() {
    const data = await chrome.storage.local.get(['parentEmail']);
    const email = data.parentEmail || '';

    if (!isValidEmail(email)) {
        passwordError.textContent = 'No recovery email is saved. Login once and save the parent email.';
        return;
    }

    const otp = createOtp();
    const otpSalt = createRandomSalt();
    const otpHash = await hashPassword(otp, otpSalt);

    setModalBusy(true, 'Sending OTP...');

    try {
        await sendOtpToEmail(email, otp);
        await chrome.storage.local.set({
            passwordResetOtpHash: otpHash,
            passwordResetOtpSalt: otpSalt,
            passwordResetOtpExpiresAt: Date.now() + OTP_EXPIRY_MS,
            passwordResetOtpEmail: email
        });
        openPasswordModal('otp', `OTP sent to ${maskEmail(email)}. It expires in 5 minutes.`);
    } catch (error) {
        passwordError.textContent = error.message;
        setModalBusy(false);
    }
}

async function submitOtpVerification() {
    const otp = otpInput.value.trim();

    if (!/^\d{6}$/.test(otp)) {
        passwordError.textContent = 'Enter the 6-digit OTP.';
        return;
    }

    const data = await chrome.storage.local.get([
        'passwordResetOtpHash',
        'passwordResetOtpSalt',
        'passwordResetOtpExpiresAt'
    ]);

    if (!data.passwordResetOtpHash || !data.passwordResetOtpSalt || !data.passwordResetOtpExpiresAt) {
        passwordError.textContent = 'No OTP request found. Use Forgot password again.';
        return;
    }

    if (Date.now() > Number(data.passwordResetOtpExpiresAt)) {
        await clearOtpReset();
        passwordError.textContent = 'OTP expired. Use Forgot password again.';
        return;
    }

    const otpHash = await hashPassword(otp, data.passwordResetOtpSalt);
    if (otpHash !== data.passwordResetOtpHash) {
        passwordError.textContent = 'Incorrect OTP.';
        otpInput.select();
        return;
    }

    openPasswordModal('reset');
}

async function submitPasswordReset() {
    const password = parentPasswordInput.value.trim();
    const confirmation = confirmParentPasswordInput.value.trim();

    if (!validateNewPassword(password, confirmation)) {
        return;
    }

    await saveParentPassword(password);
    await clearOtpReset();
    parentUnlocked = true;
    closePasswordModal();
    await setMode('parent');
}

function validateNewPassword(password, confirmation) {
    if (password.length < 4) {
        passwordError.textContent = 'Use at least 4 characters.';
        return false;
    }

    if (password !== confirmation) {
        passwordError.textContent = 'Passwords do not match.';
        return false;
    }

    return true;
}


function handlePasswordKeydown(event) {
    if (event.key === 'Enter') {
        submitPasswordModal();
    }

    if (event.key === 'Escape') {
        closePasswordModal();
    }
}

async function saveParentPassword(password) {
    const salt = createRandomSalt();
    const hash = await hashPassword(password, salt);

    await chrome.storage.local.set({
        parentPasswordSalt: salt,
        parentPasswordHash: hash
    });
}

async function verifyParentPassword(password) {
    const credentials = await chrome.storage.local.get(['parentPasswordHash', 'parentPasswordSalt']);

    if (!credentials.parentPasswordHash || !credentials.parentPasswordSalt) {
        return false;
    }

    const hash = await hashPassword(password, credentials.parentPasswordSalt);
    return hash === credentials.parentPasswordHash;
}

async function requestRecoveryOtp() {
    const data = await chrome.storage.local.get(['parentEmail']);
    const email = data.parentEmail || 'demo@test.com';

    // In demo mode, generate 4-digit code. In production, 6-digit code
    const isDemo = EMAIL_OTP_CONFIG.DEMO_MODE;
    const otp = isDemo ? createDemoOtp() : createOtp();
    const otpSalt = createRandomSalt();
    const otpHash = await hashPassword(otp, otpSalt);

    requestOtpBtn.disabled = true;
    requestOtpBtn.textContent = isDemo ? 'Demo Code Generated' : 'Sending OTP...';

    try {
        if (!isDemo) {
            // Production: Send email via EmailJS
            if (!isValidEmail(email)) {
                otpError.textContent = 'No recovery email saved. Save the parent email first.';
                requestOtpBtn.disabled = false;
                requestOtpBtn.textContent = 'Request OTP to Reset Password';
                return;
            }
            await sendOtpToEmail(email, otp);
        }

        // Save OTP to storage
        await chrome.storage.local.set({
            passwordResetOtpHash: otpHash,
            passwordResetOtpSalt: otpSalt,
            passwordResetOtpExpiresAt: Date.now() + OTP_EXPIRY_MS,
            passwordResetOtpEmail: email
        });

        // Show OTP entry form
        otpRecoveryContent.classList.add('hidden');
        otpEntryContent.classList.remove('hidden');
        
        if (isDemo) {
            // Demo mode: Show the OTP code
            demoOtpDisplay.classList.remove('hidden');
            demoOtpCode.textContent = otp;
            otpError.textContent = `📝 Demo mode: Use the code above to reset your password.`;
            otpError.style.color = '#f59e0b';
        } else {
            // Production: Message about email
            demoOtpDisplay.classList.add('hidden');
            otpError.textContent = `OTP sent to ${maskEmail(email)}. It expires in 5 minutes.`;
            otpError.style.color = '#22c55e';
        }
        
        recoveryOtpInput.focus();
    } catch (error) {
        otpError.textContent = error.message;
        otpError.style.color = '';
        demoOtpDisplay.classList.add('hidden');
    } finally {
        requestOtpBtn.disabled = false;
        requestOtpBtn.textContent = 'Request OTP to Reset Password';
    }
}

async function verifyRecoveryOtp() {
    const otp = recoveryOtpInput.value.trim();
    const isDemo = EMAIL_OTP_CONFIG.DEMO_MODE;

    // In demo mode, accept 4 digits. In production, 6 digits
    const otpRegex = isDemo ? /^\d{4}$/ : /^\d{6}$/;
    const otpLength = isDemo ? '4-digit' : '6-digit';

    if (!otpRegex.test(otp)) {
        otpError.textContent = `Enter the ${otpLength} OTP.`;
        otpError.style.color = '';
        return;
    }

    const data = await chrome.storage.local.get([
        'passwordResetOtpHash',
        'passwordResetOtpSalt',
        'passwordResetOtpExpiresAt'
    ]);

    if (!data.passwordResetOtpHash || !data.passwordResetOtpSalt || !data.passwordResetOtpExpiresAt) {
        otpError.textContent = 'No OTP request found. Request OTP again.';
        otpError.style.color = '';
        return;
    }

    if (Date.now() > Number(data.passwordResetOtpExpiresAt)) {
        await clearOtpReset();
        otpError.textContent = 'OTP expired. Request OTP again.';
        otpError.style.color = '';
        cancelOtpRecovery();
        return;
    }

    const otpHash = await hashPassword(otp, data.passwordResetOtpSalt);
    if (otpHash !== data.passwordResetOtpHash) {
        otpError.textContent = 'Incorrect OTP. Try again.';
        otpError.style.color = '';
        recoveryOtpInput.select();
        return;
    }

    // OTP verified successfully
    otpError.textContent = '✅ OTP verified! Proceeding to password reset...';
    otpError.style.color = '#22c55e';
    
    // Brief delay before opening reset modal
    setTimeout(() => {
        openPasswordModal('reset');
    }, 500);
}

function cancelOtpRecovery() {
    otpRecoveryContent.classList.remove('hidden');
    otpEntryContent.classList.add('hidden');
    demoOtpDisplay.classList.add('hidden');
    recoveryOtpInput.value = '';
    otpError.textContent = '';
    otpError.style.color = '';
}

async function sendOtpToEmail(email, otp) {
    if (!isEmailOtpConfigured()) {
        throw new Error('Email OTP is not configured. Add EmailJS serviceId, templateId, and publicKey in popup.js.');
    }

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            service_id: EMAIL_OTP_CONFIG.serviceId,
            template_id: EMAIL_OTP_CONFIG.templateId,
            user_id: EMAIL_OTP_CONFIG.publicKey,
            template_params: {
                to_email: email,
                parent_email: email,
                otp,
                passcode: otp,
                app_name: 'Attenova'
            }
        })
    });

    if (!response.ok) {
        throw new Error('Could not send OTP email. Check the EmailJS configuration.');
    }
}

function isEmailOtpConfigured() {
    return Boolean(
        EMAIL_OTP_CONFIG.serviceId &&
        EMAIL_OTP_CONFIG.templateId &&
        EMAIL_OTP_CONFIG.publicKey &&
        !EMAIL_OTP_CONFIG.serviceId.startsWith('YOUR_') &&
        !EMAIL_OTP_CONFIG.templateId.startsWith('YOUR_') &&
        !EMAIL_OTP_CONFIG.publicKey.startsWith('YOUR_')
    );
}

async function clearOtpReset() {
    await chrome.storage.local.remove([
        'passwordResetOtpHash',
        'passwordResetOtpSalt',
        'passwordResetOtpExpiresAt',
        'passwordResetOtpEmail'
    ]);
}

function getFirstVisibleModalInput() {
    return [parentPasswordInput, confirmParentPasswordInput, parentEmailInput, otpInput]
        .find(input => !input.classList.contains('hidden'));
}

function setModalBusy(isBusy, text = '') {
    submitPasswordBtn.disabled = isBusy;
    cancelPasswordBtn.disabled = isBusy;
    forgotPasswordBtn.disabled = isBusy;

    if (text) {
        passwordError.textContent = text;
    }
}

function createOtp() {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    return String(bytes[0] % 1000000).padStart(6, '0');
}

function createDemoOtp() {
    // Demo OTP Code - Always use 0837 for demo purposes
    return '0837';
}

function createRandomSalt() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return bytesToBase64(bytes);
}

async function hashPassword(password, salt) {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return bytesToBase64(new Uint8Array(digest));
}

function bytesToBase64(bytes) {
    let binary = '';
    bytes.forEach(byte => {
        binary += String.fromCharCode(byte);
    });
    return btoa(binary);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function maskEmail(email) {
    const [name, domain] = email.split('@');
    if (!name || !domain) return email;
    const visible = name.slice(0, Math.min(2, name.length));
    return `${visible}${'*'.repeat(Math.max(name.length - visible.length, 2))}@${domain}`;
}

function escapeHtml(text) {
    return String(text).replace(/[&<>"']/g, character => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[character]));
}

function escapeAttribute(text) {
    return escapeHtml(text).replace(/`/g, '&#096;');
}

function formatDateTime(timestamp) {
    if (!timestamp) return 'Unknown time';
    return new Date(timestamp).toLocaleString();
}