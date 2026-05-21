// ── Subjects ──────────────────────────────────────────────
const SUBJECTS = [
    { name: 'إنجليزي',      icon: '🇬🇧' },
    { name: 'رياضة عامة',   icon: '📐' },
    { name: 'رياضة خاصة',   icon: '📊' },
    { name: 'ميكانيكا',     icon: '⚙️' },
    { name: 'كيمياء',       icon: '🧪' },
    { name: 'فيزياء',       icon: '⚡' },
];

// Level icons (1–12)
const LEVEL_ICONS = ['1','2','3','4','5','6','7','8','9','10','11','12'];

// ── Session / Device Lock ──────────────────────────────────
const SESSION_KEY   = 'sessionToken';   // stored in sessionStorage (this tab)
const ACTIVE_KEY    = 'activeSession';  // stored in localStorage  (shared across tabs/devices)
const HEARTBEAT_MS  = 5000;             // refresh every 5 s
const TIMEOUT_MS    = 15000;            // session expires after 15 s of no heartbeat

let heartbeatTimer  = null;
let watchdogTimer   = null;
let myToken         = null;

function generateToken() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function claimSession(userName) {
    myToken = generateToken();
    sessionStorage.setItem(SESSION_KEY, myToken);
    localStorage.setItem(ACTIVE_KEY, JSON.stringify({
        token:     myToken,
        user:      userName,
        timestamp: Date.now()
    }));
}

function refreshHeartbeat() {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) { kickOut(); return; }
    const active = JSON.parse(raw);
    if (active.token !== myToken) { kickOut(); return; }
    // Still ours — update timestamp
    active.timestamp = Date.now();
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
}

function watchSession() {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) { kickOut(); return; }
    const active = JSON.parse(raw);
    if (active.token !== myToken) { kickOut(); return; }
    // Check if our own heartbeat is stale (shouldn't happen, but safety net)
    if (Date.now() - active.timestamp > TIMEOUT_MS) { kickOut(); return; }
}

function kickOut() {
    clearInterval(heartbeatTimer);
    clearInterval(watchdogTimer);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('loggedInUser');
    alert('تم تسجيل الدخول من جهاز آخر. سيتم تسجيل خروجك الآن.');
    window.location.href = '../index.html';
}

function handleLogout() {
    clearInterval(heartbeatTimer);
    clearInterval(watchdogTimer);
    // Remove active session only if it's ours
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw) {
        const active = JSON.parse(raw);
        if (active.token === myToken) {
            localStorage.removeItem(ACTIVE_KEY);
        }
    }
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('loggedInUser');
    window.location.href = '../index.html';
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = sessionStorage.getItem('loggedInUser');

    if (!loggedInUser) {
        window.location.href = '../index.html';
        return;
    }

    // Check if another device already has an active session
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw) {
        const active = JSON.parse(raw);
        const isStale = Date.now() - active.timestamp > TIMEOUT_MS;
        if (!isStale && active.user === loggedInUser) {
            // There's a live session — check if it's ours (same tab reload)
            const myExistingToken = sessionStorage.getItem(SESSION_KEY);
            if (myExistingToken && myExistingToken === active.token) {
                // Same tab — reclaim
                myToken = myExistingToken;
            } else {
                // Different device/tab — kick the old one by overwriting
                claimSession(loggedInUser);
            }
        } else {
            claimSession(loggedInUser);
        }
    } else {
        claimSession(loggedInUser);
    }

    // Start heartbeat & watchdog
    heartbeatTimer = setInterval(refreshHeartbeat, HEARTBEAT_MS);
    watchdogTimer  = setInterval(watchSession,     HEARTBEAT_MS + 1000);

    // Display user name
    document.getElementById('userName').textContent = '👤 ' + loggedInUser;

    // Build levels
    buildLevels();
});

// ── Build Levels ──────────────────────────────────────────
function buildLevels() {
    const grid = document.getElementById('levelsGrid');
    grid.innerHTML = '';

    for (let i = 1; i <= 12; i++) {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.innerHTML = `
            <div class="level-icon">${LEVEL_ICONS[i - 1]}</div>
            <div class="level-label">مستوى ${i}</div>
        `;
        card.addEventListener('click', () => openModal(i));
        grid.appendChild(card);
    }
}

// ── Modal ─────────────────────────────────────────────────
function openModal(level) {
    document.getElementById('modalTitle').textContent = `مستوى ${level} — اختر المادة`;

    const grid = document.getElementById('subjectsGrid');
    grid.innerHTML = '';

    SUBJECTS.forEach(subject => {
        const card = document.createElement('div');
        card.className = 'subject-card';
        card.innerHTML = `
            <div class="subject-icon">${subject.icon}</div>
            <div class="subject-name">${subject.name}</div>
        `;
        card.addEventListener('click', () => {
            closeModalDirect();
            // Navigate to video viewer
            const params = new URLSearchParams({ level, subject: subject.name });
            window.location.href = `video/view_video.html?${params.toString()}`;
        });
        grid.appendChild(card);
    });

    document.getElementById('modalOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModal(event) {
    // Close only if clicking the overlay background
    if (event.target === document.getElementById('modalOverlay')) {
        closeModalDirect();
    }
}

function closeModalDirect() {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.body.style.overflow = '';
}
