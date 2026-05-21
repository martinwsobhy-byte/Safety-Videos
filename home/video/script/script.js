// ── Seed: إنجليزي مستوى 1 ─────────────────────────────────
(function seedVideos() {
    const SEED_KEY = 'seedDone_v1';
    if (localStorage.getItem(SEED_KEY)) return;

    const existing = JSON.parse(localStorage.getItem('videos') || '[]');
    const seeds = [
        {
            level:   '1',
            subject: 'إنجليزي',
            url:     'QSwmlTxtgrA9owlJOj54dUJSAOwAHLEnPB02MujH4iXE',
            title:   'إنجليزي — مستوى 1',
            desc:    ''
        }
        // أضف المزيد هنا بنفس الشكل
    ];

    seeds.forEach(seed => {
        const exists = existing.some(v => v.level === seed.level && v.subject === seed.subject);
        if (!exists) existing.push(seed);
    });

    localStorage.setItem('videos', JSON.stringify(existing));
    localStorage.setItem(SEED_KEY, '1');
})();

// ── Session constants (must match home/script/script.js) ──
const SESSION_KEY  = 'sessionToken';
const ACTIVE_KEY   = 'activeSession';
const HEARTBEAT_MS = 5000;
const TIMEOUT_MS   = 15000;

let heartbeatTimer = null;
let watchdogTimer  = null;
let myToken        = null;

// ── Session helpers ────────────────────────────────────────
function refreshHeartbeat() {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) { kickOut(); return; }
    const active = JSON.parse(raw);
    if (active.token !== myToken) { kickOut(); return; }
    active.timestamp = Date.now();
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(active));
}

function watchSession() {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) { kickOut(); return; }
    const active = JSON.parse(raw);
    if (active.token !== myToken) { kickOut(); return; }
    if (Date.now() - active.timestamp > TIMEOUT_MS) { kickOut(); return; }
}

function kickOut() {
    clearInterval(heartbeatTimer);
    clearInterval(watchdogTimer);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('loggedInUser');
    alert('تم تسجيل الدخول من جهاز آخر. سيتم تسجيل خروجك الآن.');
    window.location.href = '../../index.html';
}

// ── Navigation ─────────────────────────────────────────────
function goBack() {
    window.location.href = '../home.html';
}

// ── URL params ─────────────────────────────────────────────
function getParams() {
    const p = new URLSearchParams(window.location.search);
    return {
        level:   p.get('level')   || '',
        subject: p.get('subject') || ''
    };
}

// ── Video loader ───────────────────────────────────────────
function loadVideo(level, subject) {
    const videos = JSON.parse(localStorage.getItem('videos') || '[]');
    return videos.find(v =>
        String(v.level) === String(level) &&
        v.subject === subject
    ) || null;
}

/**
 * يشغّل الفيديو باستخدام Mux iframe player.
 * videoData.url = Mux Playback ID
 */
function renderVideo(videoData) {
    const wrapper   = document.getElementById('videoWrapper');
    const loadingEl = document.getElementById('loadingState');
    const noVideoEl = document.getElementById('noVideoState');
    const infoEl    = document.getElementById('videoInfo');
    const titleEl   = document.getElementById('videoTitle');
    const descEl    = document.getElementById('videoDesc');

    loadingEl.classList.add('hidden');

    if (!videoData || !videoData.url) {
        noVideoEl.classList.remove('hidden');
        return;
    }

    const playbackId = videoData.url.trim();
    const videoTitle = encodeURIComponent(videoData.title || document.title);

    // ── Mux iframe player ────────────────────────────────
    const iframe = document.createElement('iframe');
    iframe.src = `https://player.mux.com/${playbackId}?metadata-video-title=${videoTitle}`;
    iframe.style.width        = '100%';
    iframe.style.height       = '100%';
    iframe.style.border       = 'none';
    iframe.style.borderRadius = '12px';
    iframe.allow = 'accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;';
    iframe.allowFullscreen = true;
    iframe.setAttribute('allowfullscreen', '');

    wrapper.appendChild(iframe);

    // Show info card
    if (videoData.title) {
        titleEl.textContent = videoData.title;
        descEl.textContent  = videoData.desc || '';
        infoEl.classList.remove('hidden');
    }
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // ── Auth check ──
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = '../../index.html';
        return;
    }

    // ── Session token ──
    myToken = sessionStorage.getItem(SESSION_KEY);
    if (!myToken) {
        window.location.href = '../../index.html';
        return;
    }

    // Verify token matches active session
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) { kickOut(); return; }
    const active = JSON.parse(raw);
    if (active.token !== myToken) { kickOut(); return; }

    // Start heartbeat
    heartbeatTimer = setInterval(refreshHeartbeat, HEARTBEAT_MS);
    watchdogTimer  = setInterval(watchSession,     HEARTBEAT_MS + 1000);

    // ── Display user name ──
    document.getElementById('userName').textContent = '👤 ' + loggedInUser;

    // ── Read URL params ──
    const { level, subject } = getParams();

    if (!level || !subject) {
        goBack();
        return;
    }

    // ── Breadcrumb ──
    document.getElementById('breadcrumbText').innerHTML =
        `الرئيسية &rsaquo; <span>مستوى ${level}</span> &rsaquo; <span class="current">${subject}</span>`;

    // ── Page title ──
    document.title = `مستوى ${level} — ${subject}`;

    // ── Load video ──
    const videoData = loadVideo(level, subject);
    renderVideo(videoData);
});
