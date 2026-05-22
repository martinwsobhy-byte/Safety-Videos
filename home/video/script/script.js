import { db, collection, getDocs, query, where }
    from '../../../script/firebase.js';

// ── Session constants ─────────────────────────────────────
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

function goBack() {
    window.location.href = '../home.html';
}

function getParams() {
    const p = new URLSearchParams(window.location.search);
    return { level: p.get('level') || '', subject: p.get('subject') || '' };
}

// ── Load video from Firestore ──────────────────────────────
async function loadVideo(level, subject) {
    const q    = query(collection(db, 'videos'),
                       where('level',   '==', String(level)),
                       where('subject', '==', subject));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data();
}

// ── Render Mux iframe ──────────────────────────────────────
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

    if (videoData.title) {
        titleEl.textContent = videoData.title;
        descEl.textContent  = videoData.desc || '';
        infoEl.classList.remove('hidden');
    }
}

// ── Init ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    if (!loggedInUser) { window.location.href = '../../index.html'; return; }

    myToken = sessionStorage.getItem(SESSION_KEY);
    if (!myToken) { window.location.href = '../../index.html'; return; }

    const raw = localStorage.getItem(ACTIVE_KEY);
    if (!raw) { kickOut(); return; }
    const active = JSON.parse(raw);
    if (active.token !== myToken) { kickOut(); return; }

    heartbeatTimer = setInterval(refreshHeartbeat, HEARTBEAT_MS);
    watchdogTimer  = setInterval(watchSession,     HEARTBEAT_MS + 1000);

    document.getElementById('userName').textContent = '👤 ' + loggedInUser;
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = '../home.html';
    });

    const { level, subject } = getParams();
    if (!level || !subject) { goBack(); return; }

    document.getElementById('breadcrumbText').innerHTML =
        `الرئيسية &rsaquo; <span>مستوى ${level}</span> &rsaquo; <span class="current">${subject}</span>`;
    document.title = `مستوى ${level} — ${subject}`;

    try {
        const videoData = await loadVideo(level, subject);
        renderVideo(videoData);
    } catch (err) {
        console.error(err);
        document.getElementById('loadingState').classList.add('hidden');
        document.getElementById('noVideoState').classList.remove('hidden');
    }
});
