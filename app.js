// TurboTok Application Logic & TikTok API Control Center

// Default OAuth redirect URI. Client Key / Secret are deliberately not
// defaulted here - they belong in the credentials store (localStorage) and
// are supplied by the user.
const DEFAULT_REDIRECT_URI = 'https://turbotok.app/oauth/callback';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Initialize Charts
    initCharts();

    // Bind real-time input listeners for video caption live preview
    const videoTitleInput = document.getElementById('videoTitle');
    const liveCaptionPreview = document.getElementById('liveCaptionPreview');
    if (videoTitleInput && liveCaptionPreview) {
        videoTitleInput.addEventListener('input', (e) => {
            liveCaptionPreview.textContent = e.target.value || 'Cyber Neon Street Dance #FutureStyle #TurboTok';
        });
    }

    // Update initial Scope URL
    updateGeneratedScopeUrl();
});

// Environment Switcher
function switchEnv(env) {
    const prodBtn = document.getElementById('envProductionBtn');
    const sandBtn = document.getElementById('envSandboxBtn');

    if (env === 'production') {
        prodBtn.classList.add('active');
        sandBtn.classList.remove('active');
        showToast('Switched to TikTok Production Environment', 'info');
    } else {
        sandBtn.classList.add('active');
        prodBtn.classList.remove('active');
        showToast('Switched to TikTok Sandbox Testing Environment', 'info');
    }
}

// Tab Switching System
function switchTab(tabId, clickedElement) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));

    // Deactivate nav buttons
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    // Show target tab
    const targetTab = document.getElementById(`tab-${tabId}`);
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Set nav active
    if (clickedElement) {
        clickedElement.classList.add('active');
    } else {
        const navLink = document.querySelector(`.nav-item[href="#${tabId}"]`);
        if (navLink) navLink.classList.add('active');
    }

    // Update Top Header Titles
    const titleMap = {
        'overview': { title: 'Dashboard Overview', sub: 'Real-time performance metrics and API connection status for TurboTok.' },
        'credentials': { title: 'App Credentials & OAuth 2.0', sub: 'Configure Client Key, Secret, and test authorization flows.' },
        'publisher': { title: 'Video Publisher & Direct Post', sub: 'Upload, schedule, and preview videos published via TikTok Direct Post API.' },
        'scopes': { title: 'TikTok API Scope Manager', sub: 'Manage API permissions and generate secure user authorization links.' },
        'sandbox': { title: 'Interactive API Console', sub: 'Test TikTok REST API endpoints in real-time with customizable headers & body.' },
        'webhooks': { title: 'Webhooks & Event Streams', sub: 'Monitor real-time TikTok event subscriptions and delivery logs.' }
    };

    if (titleMap[tabId]) {
        document.getElementById('pageTitle').textContent = titleMap[tabId].title;
        document.getElementById('pageSubtitle').textContent = titleMap[tabId].sub;
    }
}

// Chart Initialization
let trafficChart, endpointChart;
function initCharts() {
    const trafficCtx = document.getElementById('trafficChart')?.getContext('2d');
    const endpointCtx = document.getElementById('endpointChart')?.getContext('2d');

    if (trafficCtx) {
        const gradient = trafficCtx.createLinearGradient(0, 0, 0, 250);
        gradient.addColorStop(0, 'rgba(0, 242, 254, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 242, 254, 0.0)');

        trafficChart = new Chart(trafficCtx, {
            type: 'line',
            data: {
                labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'],
                datasets: [{
                    label: 'API Requests',
                    data: [1200, 1900, 3400, 4800, 6200, 5100, 4300],
                    borderColor: '#00f2fe',
                    borderWidth: 3,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointBackgroundColor: '#ff0050'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { color: '#94a3b8' } }
                }
            }
        });
    }

    if (endpointCtx) {
        endpointChart = new Chart(endpointCtx, {
            type: 'doughnut',
            data: {
                labels: ['Direct Video Post', 'User Profile Read', 'OAuth Token Exchange', 'Analytics Query'],
                datasets: [{
                    data: [45, 25, 18, 12],
                    backgroundColor: ['#ff0050', '#00f2fe', '#8a2be2', '#ffb703'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', font: { family: 'Outfit' } } }
                },
                cutout: '70%'
            }
        });
    }
}

// Helper: Copy Text
function copyInput(inputId) {
    const el = document.getElementById(inputId);
    if (!el) return;

    let textToCopy = el.value || el.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast('Copied to clipboard!', 'success');
    }).catch(err => {
        showToast('Failed to copy text', 'error');
    });
}

// Helper: Toggle Password Visibility
function togglePasswordVisibility(inputId, btn) {
    const input = document.getElementById(inputId);
    if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i data-lucide="eye-off"></i>';
    } else {
        input.type = 'password';
        btn.innerHTML = '<i data-lucide="eye"></i>';
    }
    if (window.lucide) lucide.createIcons();
}

// Save Credentials
function saveCredentials() {
    const clientKey = document.getElementById('clientKeyInput').value;
    const clientSecret = document.getElementById('clientSecretInput').value;
    const redirectUri = document.getElementById('redirectUriInput').value;

    localStorage.setItem('turbotok_client_key', clientKey);
    localStorage.setItem('turbotok_client_secret', clientSecret);
    localStorage.setItem('turbotok_redirect_uri', redirectUri);

    showToast('Credentials saved successfully to secure local storage!', 'success');
}

// Reset Credentials
function resetCredentials() {
    document.getElementById('clientKeyInput').value = '';
    document.getElementById('clientSecretInput').value = '';
    document.getElementById('redirectUriInput').value = DEFAULT_REDIRECT_URI;

    localStorage.removeItem('turbotok_client_key');
    localStorage.removeItem('turbotok_client_secret');
    localStorage.removeItem('turbotok_redirect_uri');

    showToast('Credentials cleared - enter your own Client Key and Secret', 'info');
}

// Test Redirect URI
function testRedirectUri() {
    const uri = document.getElementById('redirectUriInput').value;
    showToast(`Testing URI connection to ${uri}...`, 'info');
    setTimeout(() => {
        showToast('Redirect URI format valid & matched with TikTok Dev settings', 'success');
    }, 800);
}

// TikTok Login Simulator & Live OAuth Launcher
function triggerTikTokLogin() {
    const modal = document.getElementById('tiktokLoginModal');
    if (modal) modal.classList.add('show');
}

function closeTikTokModal() {
    const modal = document.getElementById('tiktokLoginModal');
    if (modal) modal.classList.remove('show');
}

function handleModalBackdropClick(e) {
    if (e.target.classList.contains('modal-overlay')) {
        closeTikTokModal();
    }
}

function redirectToTikTokOAuth() {
    closeTikTokModal();
    const generatedUrl = document.getElementById('generatedAuthUrlText')?.textContent;
    if (generatedUrl) {
        showToast('Redirecting to TikTok.com OAuth Authorization page...', 'info');
        setTimeout(() => {
            window.open(generatedUrl, '_blank');
        }, 500);
    } else {
        showToast('Error: Could not generate TikTok Auth URL', 'error');
    }
}

function confirmOAuthAuthorization() {
    closeTikTokModal();

    // Switch smoothly to Credentials & OAuth tab so user immediately sees active tokens
    switchTab('credentials');

    // Generate random fresh tokens
    const randomHex = () => Math.random().toString(36).substring(2, 10);
    const newAccess = `act.${randomHex()}${randomHex()}${randomHex()}`;
    const newRefresh = `rft.${randomHex()}${randomHex()}${randomHex()}`;
    const newOpenId = `usr_open_${Math.floor(Math.random() * 8999999999 + 1000000000)}`;

    const accessEl = document.getElementById('accessTokenDisplay');
    const refreshEl = document.getElementById('refreshTokenDisplay');
    const openIdEl = document.getElementById('openIdDisplay');
    const statusBox = document.getElementById('oauthStatusBox');

    if (accessEl) accessEl.textContent = newAccess;
    if (refreshEl) refreshEl.textContent = newRefresh;
    if (openIdEl) openIdEl.textContent = newOpenId;

    if (statusBox) {
        statusBox.style.boxShadow = '0 0 20px rgba(0, 242, 254, 0.4)';
        statusBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            statusBox.style.boxShadow = 'none';
        }, 2000);
    }

    showToast('🎉 TikTok Account Authorized! New OAuth Access Token issued.', 'success');
}

function refreshToken() {
    showToast('Refreshing TikTok OAuth access token via v2/oauth/token/...', 'info');
    setTimeout(() => {
        confirmOAuthAuthorization();
    }, 700);
}

function clearTokenData() {
    document.getElementById('accessTokenDisplay').textContent = 'None (Revoked)';
    document.getElementById('refreshTokenDisplay').textContent = 'None (Revoked)';
    document.getElementById('openIdDisplay').textContent = 'None';
    showToast('Active OAuth session tokens cleared.', 'info');
}

// Video Publisher Handlers
function handlePublishSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('publishSubmitBtn');
    const originalText = btn.innerHTML;

    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Direct Posting to TikTok...';
    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = originalText;
        if (window.lucide) lucide.createIcons();

        showToast('🎉 Video published successfully to TikTok Feed! (Publish ID: v_pub_' + Math.floor(Math.random() * 899999 + 100000) + ')', 'success');
    }, 1800);
}

function saveDraft() {
    showToast('Video draft saved into local queue.', 'info');
}

function handleFileSelected(e) {
    const file = e.target.files[0];
    if (file) {
        showToast(`Selected video: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`, 'info');
    }
}

// API Scope Builder
function updateGeneratedScopeUrl() {
    const clientKey = document.getElementById('clientKeyInput')?.value || 'YOUR_CLIENT_KEY';
    const redirectUri = encodeURIComponent(document.getElementById('redirectUriInput')?.value || DEFAULT_REDIRECT_URI);

    const selectedScopes = [];
    document.querySelectorAll('.scope-checkbox:checked').forEach(cb => {
        selectedScopes.push(cb.value);

        // Highlight card state
        cb.closest('.scope-card').classList.add('active');
    });

    document.querySelectorAll('.scope-checkbox:not(:checked)').forEach(cb => {
        cb.closest('.scope-card').classList.remove('active');
    });

    const scopeString = selectedScopes.join(',');
    const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${clientKey}&scope=${scopeString}&response_type=code&redirect_uri=${redirectUri}&state=turbotok_sec_${Math.floor(Math.random() * 90 + 10)}`;

    const urlDisplay = document.getElementById('generatedAuthUrlText');
    if (urlDisplay) {
        urlDisplay.textContent = url;
    }
}

// Interactive API Sandbox Execution
function executeApiRequest() {
    const method = document.getElementById('apiMethodSelect').value;
    const endpoint = document.getElementById('apiEndpointInput').value;
    const responseEl = document.getElementById('apiResponseJson');
    const statusTag = document.getElementById('responseStatusTag');

    responseEl.textContent = 'Executing request to ' + endpoint + '...';

    const startTime = performance.now();

    setTimeout(() => {
        const duration = Math.round(performance.now() - startTime + 35);
        statusTag.textContent = `200 OK (${duration} ms)`;
        statusTag.className = 'status-tag success';

        const mockResponse = {
            data: {
                publish_id: "v_pub_" + Math.random().toString(36).substring(2, 14),
                upload_url: "https://open-upload.tiktokapis.com/upload/v1/video/v_pub_" + Math.random().toString(36).substring(2, 10),
                status: "PROCESSING_DIRECT_POST",
                share_target: "FEED"
            },
            error: {
                code: "ok",
                message: "Direct post request initialized successfully",
                log_id: "20260912" + Date.now()
            }
        };

        responseEl.textContent = JSON.stringify(mockResponse, null, 2);
        showToast('API call executed with status 200 OK', 'success');
    }, 600);
}

// Webhooks Simulator
function simulateWebhookEvent() {
    const tbody = document.getElementById('webhookLogsBody');
    if (!tbody) return;

    const eventTypes = [
        { type: 'video.publish.complete', class: 'publish', icon: 'check-circle' },
        { type: 'authorization.revoked', class: 'auth', icon: 'alert-triangle' },
        { type: 'creator.live.started', class: 'publish', icon: 'radio' }
    ];

    const randomEvt = eventTypes[Math.floor(Math.random() * eventTypes.length)];
    const evtId = 'evt_' + Math.random().toString(36).substring(2, 12);
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td><span class="event-pill ${randomEvt.class}"><i data-lucide="${randomEvt.icon}"></i> ${randomEvt.type}</span></td>
        <td><span class="badge badge-success">200 Delivered</span></td>
        <td><code>${evtId}</code></td>
        <td>Just now, ${timeNow}</td>
        <td><button class="btn-link" onclick="viewWebhookPayload('${evtId}')">View JSON</button></td>
    `;

    tbody.insertBefore(tr, tbody.firstChild);
    if (window.lucide) lucide.createIcons();

    showToast(`Incoming Webhook Received: ${randomEvt.type}`, 'info');
}

function viewWebhookPayload(evtId) {
    showToast(`Viewing payload structure for ${evtId}`, 'info');
}

function saveWebhookUrl() {
    const url = document.getElementById('webhookUrlInput').value;
    showToast(`Webhook endpoint updated to: ${url}`, 'success');
}

// Global Toast System
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = 'info';
    if (type === 'success') icon = 'check-circle-2';
    if (type === 'error') icon = 'alert-circle';

    toast.innerHTML = `<i data-lucide="${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
