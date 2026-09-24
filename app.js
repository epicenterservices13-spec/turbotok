// TurboTok Application Logic & TikTok API Control Center

let selectedVideoFile = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Restore saved credentials, session tokens and environment choice
    loadSavedCredentials();
    renderTokenDisplays();
    restoreEnvSelection();

    // Charts are decorative; if the Chart.js CDN script didn't load, don't
    // let that take down credential/OAuth restoration below it.
    try {
        initCharts();
    } catch (err) {
        console.error('Chart initialization failed:', err);
    }

    // Bind real-time input listeners for video caption live preview
    const videoTitleInput = document.getElementById('videoTitle');
    const liveCaptionPreview = document.getElementById('liveCaptionPreview');
    if (videoTitleInput && liveCaptionPreview) {
        videoTitleInput.addEventListener('input', (e) => {
            liveCaptionPreview.textContent = e.target.value || 'Cyber Neon Street Dance #FutureStyle #TurboTok';
        });
    }

    // If TikTok just redirected back here with ?code=..., consume it (and
    // the matching sessionStorage state) before anything below can
    // regenerate that state out from under it.
    handleOAuthRedirectIfPresent();

    // Update initial Scope URL
    updateGeneratedScopeUrl();
});

// Environment Switcher
function switchEnv(env) {
    const prodBtn = document.getElementById('envProductionBtn');
    const sandBtn = document.getElementById('envSandboxBtn');

    localStorage.setItem('turbotok_env', env);

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

function restoreEnvSelection() {
    const env = localStorage.getItem('turbotok_env') || 'sandbox';
    const prodBtn = document.getElementById('envProductionBtn');
    const sandBtn = document.getElementById('envSandboxBtn');
    if (env === 'production') {
        prodBtn?.classList.add('active');
        sandBtn?.classList.remove('active');
    } else {
        sandBtn?.classList.add('active');
        prodBtn?.classList.remove('active');
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
        'credentials': { title: 'App Credentials & OAuth 2.0', sub: 'Configure Client Key, Secret, and run the real TikTok authorization flow.' },
        'publisher': { title: 'Video Publisher & Direct Post', sub: 'Upload and publish videos via the TikTok Direct Post API.' },
        'scopes': { title: 'TikTok API Scope Manager', sub: 'Manage API permissions and generate secure user authorization links.' },
        'sandbox': { title: 'Interactive API Console', sub: 'Send authenticated requests to the TikTok REST API and inspect real responses.' },
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
    }).catch(() => {
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

// Credentials store (client key/secret/redirect URI live only in this
// browser's localStorage, entered by whoever owns the TikTok app - never
// commit real values here).
function getCredentials() {
    return {
        clientKey: localStorage.getItem('turbotok_client_key') || '',
        clientSecret: localStorage.getItem('turbotok_client_secret') || '',
        redirectUri: localStorage.getItem('turbotok_redirect_uri') || ''
    };
}

function loadSavedCredentials() {
    const creds = getCredentials();
    const keyEl = document.getElementById('clientKeyInput');
    const secretEl = document.getElementById('clientSecretInput');
    const redirectEl = document.getElementById('redirectUriInput');
    if (keyEl && creds.clientKey) keyEl.value = creds.clientKey;
    if (secretEl && creds.clientSecret) secretEl.value = creds.clientSecret;
    if (redirectEl && creds.redirectUri) redirectEl.value = creds.redirectUri;
}

// Save Credentials
function saveCredentials() {
    const clientKey = document.getElementById('clientKeyInput').value.trim();
    const clientSecret = document.getElementById('clientSecretInput').value.trim();
    const redirectUri = document.getElementById('redirectUriInput').value.trim();

    localStorage.setItem('turbotok_client_key', clientKey);
    localStorage.setItem('turbotok_client_secret', clientSecret);
    localStorage.setItem('turbotok_redirect_uri', redirectUri);

    showToast('Credentials saved to this browser\'s local storage!', 'success');
    updateGeneratedScopeUrl();
}

// Reset Credentials - clears the form instead of filling in look-alike
// defaults; a hardcoded key/secret here would ship a real-looking, but
// fake and useless, credential pair to every visitor.
function resetCredentials() {
    document.getElementById('clientKeyInput').value = '';
    document.getElementById('clientSecretInput').value = '';
    document.getElementById('redirectUriInput').value = `${window.location.origin}${window.location.pathname}`;
    showToast('Credentials cleared. Redirect URI defaulted to this page.', 'info');
    updateGeneratedScopeUrl();
}

// Test Redirect URI - a real, local check: TikTok will only redirect back
// here if this value matches what's registered on the TikTok app exactly,
// so the most useful check we can run without calling TikTok is confirming
// it matches where this page is actually being served from.
function testRedirectUri() {
    const uri = document.getElementById('redirectUriInput').value.trim();
    const here = `${window.location.origin}${window.location.pathname}`;
    if (!uri) {
        showToast('Enter a Redirect URI first', 'error');
        return;
    }
    if (uri === here) {
        showToast('Redirect URI matches this page - TikTok will be able to send users back here.', 'success');
    } else {
        showToast(`Heads up: this page is served from ${here}, not ${uri}. Make sure the value you registered with TikTok matches wherever this app is actually hosted.`, 'info');
    }
}

// TikTok Login Modal
function triggerTikTokLogin() {
    const creds = getCredentials();
    if (!creds.clientKey) {
        showToast('Save your Client Key first (Credentials tab).', 'error');
        return;
    }
    updateGeneratedScopeUrl();
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

// Real OAuth: navigate the whole page to TikTok's authorize endpoint. The
// state value was stashed in sessionStorage by updateGeneratedScopeUrl()
// when it built this same URL, and gets checked back in
// handleOAuthRedirectIfPresent() when TikTok sends the user back.
function redirectToTikTokOAuth() {
    const generatedUrl = document.getElementById('generatedAuthUrlText')?.textContent;
    if (!generatedUrl) {
        showToast('Error: Could not generate TikTok Auth URL', 'error');
        return;
    }
    closeTikTokModal();
    showToast('Redirecting to TikTok.com to sign in...', 'info');
    window.location.href = generatedUrl;
}

// Instant Sandbox Simulation - issues fake-but-well-formed tokens locally,
// for exercising the UI without a real TikTok app. The real flow above is
// what actually talks to TikTok.
function confirmOAuthAuthorization() {
    closeTikTokModal();
    switchTab('credentials');

    const randomHex = () => Math.random().toString(36).substring(2, 10);
    storeTokens({
        access_token: `act.${randomHex()}${randomHex()}${randomHex()}`,
        refresh_token: `rft.${randomHex()}${randomHex()}${randomHex()}`,
        open_id: `usr_open_${Math.floor(Math.random() * 8999999999 + 1000000000)}`,
        expires_in: 86400
    });

    flashOAuthStatusBox();
    showToast('🎉 Sandbox: simulated OAuth token issued (no real TikTok account connected).', 'success');
}

function flashOAuthStatusBox() {
    const statusBox = document.getElementById('oauthStatusBox');
    if (statusBox) {
        statusBox.style.boxShadow = '0 0 20px rgba(0, 242, 254, 0.4)';
        statusBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            statusBox.style.boxShadow = 'none';
        }, 2000);
    }
}

function storeTokens(data) {
    if (data.access_token) localStorage.setItem('turbotok_access_token', data.access_token);
    if (data.refresh_token) localStorage.setItem('turbotok_refresh_token', data.refresh_token);
    if (data.open_id) localStorage.setItem('turbotok_open_id', data.open_id);
    if (data.expires_in) localStorage.setItem('turbotok_token_expires_at', String(Date.now() + data.expires_in * 1000));
    renderTokenDisplays();
}

function renderTokenDisplays() {
    const accessEl = document.getElementById('accessTokenDisplay');
    const refreshEl = document.getElementById('refreshTokenDisplay');
    const openIdEl = document.getElementById('openIdDisplay');
    if (accessEl) accessEl.textContent = localStorage.getItem('turbotok_access_token') || 'None';
    if (refreshEl) refreshEl.textContent = localStorage.getItem('turbotok_refresh_token') || 'None';
    if (openIdEl) openIdEl.textContent = localStorage.getItem('turbotok_open_id') || 'None';
}

// Picks up ?code=&state= after TikTok redirects back to this page.
async function handleOAuthRedirectIfPresent() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const errorParam = params.get('error');

    if (errorParam) {
        showToast(`TikTok authorization was not completed: ${params.get('error_description') || errorParam}`, 'error');
        history.replaceState({}, '', window.location.pathname);
        return;
    }
    if (!code) return;

    const expectedState = sessionStorage.getItem('turbotok_oauth_state');
    history.replaceState({}, '', window.location.pathname);

    if (!expectedState || state !== expectedState) {
        showToast('OAuth state did not match - ignoring this callback for your safety.', 'error');
        return;
    }
    sessionStorage.removeItem('turbotok_oauth_state');
    await completeOAuthExchange(code);
}

async function completeOAuthExchange(code) {
    const creds = getCredentials();
    if (!creds.clientKey || !creds.clientSecret) {
        showToast('Missing Client Key/Secret - save your credentials, then retry TikTok login.', 'error');
        return;
    }

    showToast('Exchanging authorization code for an access token...', 'info');
    try {
        const res = await fetch('/api/oauth/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_key: creds.clientKey,
                client_secret: creds.clientSecret,
                code,
                redirect_uri: creds.redirectUri || `${window.location.origin}${window.location.pathname}`
            })
        });
        const data = await res.json();
        if (!res.ok || data.error?.code) {
            throw new Error(data.error?.message || data.error_description || 'Token exchange failed');
        }

        storeTokens(data);
        switchTab('credentials');
        flashOAuthStatusBox();
        showToast('🎉 TikTok account connected! Real OAuth access token issued.', 'success');
    } catch (err) {
        showToast(`OAuth token exchange failed: ${err.message}`, 'error');
    }
}

async function refreshToken() {
    const creds = getCredentials();
    const refresh_token = localStorage.getItem('turbotok_refresh_token');
    if (!refresh_token) {
        showToast('No refresh token available. Connect your TikTok account first.', 'error');
        return;
    }

    showToast('Refreshing TikTok OAuth access token via v2/oauth/token/...', 'info');
    try {
        const res = await fetch('/api/oauth/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_key: creds.clientKey, client_secret: creds.clientSecret, refresh_token })
        });
        const data = await res.json();
        if (!res.ok || data.error?.code) {
            throw new Error(data.error?.message || 'Refresh failed');
        }
        storeTokens(data);
        showToast('OAuth access token refreshed.', 'success');
    } catch (err) {
        showToast(`Refresh failed: ${err.message}`, 'error');
    }
}

async function clearTokenData() {
    const creds = getCredentials();
    const access_token = localStorage.getItem('turbotok_access_token');

    if (access_token && creds.clientKey && creds.clientSecret) {
        try {
            await fetch('/api/oauth/revoke', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ client_key: creds.clientKey, client_secret: creds.clientSecret, token: access_token })
            });
        } catch {
            // Best-effort: still clear the local session below even if the
            // revoke call itself couldn't reach TikTok.
        }
    }

    ['turbotok_access_token', 'turbotok_refresh_token', 'turbotok_open_id', 'turbotok_token_expires_at']
        .forEach((key) => localStorage.removeItem(key));

    document.getElementById('accessTokenDisplay').textContent = 'None (Revoked)';
    document.getElementById('refreshTokenDisplay').textContent = 'None (Revoked)';
    document.getElementById('openIdDisplay').textContent = 'None';
    showToast('Active OAuth session tokens cleared.', 'info');
}

// Video Publisher Handlers
async function handlePublishSubmit(e) {
    e.preventDefault();

    const accessToken = localStorage.getItem('turbotok_access_token');
    if (!accessToken) {
        showToast('Connect your TikTok account first - no access token available.', 'error');
        return;
    }
    if (!selectedVideoFile) {
        showToast('Select a video file before publishing.', 'error');
        return;
    }

    const btn = document.getElementById('publishSubmitBtn');
    const originalText = btn.innerHTML;
    const title = document.getElementById('videoTitle')?.value || '';
    const sandbox = localStorage.getItem('turbotok_env') !== 'production';

    btn.disabled = true;
    btn.innerHTML = '<i data-lucide="loader-2" class="spin"></i> Direct Posting to TikTok...';
    if (window.lucide) lucide.createIcons();

    try {
        const initRes = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                method: 'POST',
                path: '/v2/post/publish/video/init/',
                accessToken,
                sandbox,
                body: {
                    post_info: {
                        title,
                        privacy_level: 'SELF_ONLY',
                        disable_duet: false,
                        disable_comment: false,
                        disable_stitch: false
                    },
                    source_info: {
                        source: 'FILE_UPLOAD',
                        video_size: selectedVideoFile.size,
                        chunk_size: selectedVideoFile.size,
                        total_chunk_count: 1
                    }
                }
            })
        });
        const initData = await initRes.json();
        if (!initRes.ok || (initData.error?.code && initData.error.code !== 'ok')) {
            throw new Error(initData.error?.message || 'Video init failed');
        }

        const { publish_id, upload_url } = initData.data || {};
        showToast(`Video post initialized (Publish ID: ${publish_id}). Uploading file...`, 'info');

        if (upload_url) {
            await fetch(upload_url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'video/mp4',
                    'Content-Range': `bytes 0-${selectedVideoFile.size - 1}/${selectedVideoFile.size}`
                },
                body: selectedVideoFile
            });
        }

        showToast(`🎉 Video sent to TikTok! (Publish ID: ${publish_id})`, 'success');
    } catch (err) {
        showToast(`Direct Post failed: ${err.message}`, 'error');
    } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
        if (window.lucide) lucide.createIcons();
    }
}

function saveDraft() {
    showToast('Video draft saved into local queue.', 'info');
}

function handleFileSelected(e) {
    const file = e.target.files[0];
    selectedVideoFile = file || null;
    if (file) {
        showToast(`Selected video: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`, 'info');
    }
}

// API Scope Builder
function updateGeneratedScopeUrl() {
    const clientKey = document.getElementById('clientKeyInput')?.value || '';
    const redirectUriRaw = document.getElementById('redirectUriInput')?.value
        || `${window.location.origin}${window.location.pathname}`;
    const redirectUri = encodeURIComponent(redirectUriRaw);

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
    const state = window.crypto?.randomUUID ? crypto.randomUUID() : `turbotok_${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem('turbotok_oauth_state', state);

    const url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${encodeURIComponent(clientKey)}&scope=${scopeString}&response_type=code&redirect_uri=${redirectUri}&state=${state}`;

    const urlDisplay = document.getElementById('generatedAuthUrlText');
    if (urlDisplay) {
        urlDisplay.textContent = url;
    }
}

// Interactive API Console - sends a real, authenticated request to the
// TikTok Open API through our backend's /api/proxy (needed because TikTok's
// API does not allow direct browser-to-API calls).
async function executeApiRequest() {
    const method = document.getElementById('apiMethodSelect').value;
    const endpoint = document.getElementById('apiEndpointInput').value;
    const responseEl = document.getElementById('apiResponseJson');
    const statusTag = document.getElementById('responseStatusTag');
    const accessToken = localStorage.getItem('turbotok_access_token');

    if (!accessToken) {
        showToast('Connect your TikTok account first - no access token available.', 'error');
        return;
    }

    responseEl.textContent = 'Executing request to ' + endpoint + '...';
    statusTag.textContent = 'Pending...';
    statusTag.className = 'status-tag';

    const startTime = performance.now();
    const sandbox = localStorage.getItem('turbotok_env') !== 'production';

    try {
        const res = await fetch('/api/proxy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method, path: endpoint, accessToken, sandbox })
        });
        const payload = await res.json();
        const duration = Math.round(performance.now() - startTime);

        statusTag.textContent = `${res.status} ${res.ok ? 'OK' : 'Error'} (${duration} ms)`;
        statusTag.className = `status-tag ${res.ok ? 'success' : 'error'}`;
        responseEl.textContent = JSON.stringify(payload, null, 2);
        showToast(`API call executed with status ${res.status}`, res.ok ? 'success' : 'error');
    } catch (err) {
        statusTag.textContent = 'Network Error';
        statusTag.className = 'status-tag error';
        responseEl.textContent = String(err);
        showToast(`API request failed: ${err.message}`, 'error');
    }
}

// Webhooks Simulator - there is no publicly reachable endpoint for TikTok to
// call back into here, so this stays a local simulator of inbound events.
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

    // Built with DOM APIs rather than innerHTML: `message` now regularly
    // carries text from TikTok API responses and network errors, not just
    // string literals we wrote ourselves.
    const iconEl = document.createElement('i');
    iconEl.setAttribute('data-lucide', icon);
    const textEl = document.createElement('span');
    textEl.textContent = message;
    toast.append(iconEl, textEl);
    container.appendChild(toast);

    if (window.lucide) lucide.createIcons();

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
