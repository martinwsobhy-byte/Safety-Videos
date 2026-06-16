import { db, collection, getDocs, query, where, doc, updateDoc }
    from '../../../script/firebase.js';

// ── Session constants ─────────────────────────────────────
const SESSION_KEY   = 'sessionToken';
const USER_DOC_ID   = 'userDocId';
const HEARTBEAT_MS  = 5000;
const OFFLINE_AFTER = 12000;

let heartbeatTimer = null;
let userDocId      = null;

// ── Heartbeat: بيحدّث lastSeen كل 5 ثواني ────────────────
async function sendHeartbeat() {
    if (!userDocId) return;
    try {
        await updateDoc(doc(db, 'users', userDocId), { lastSeen: Date.now() });
    } catch (e) { console.error('heartbeat error:', e); }
}

// ── Navigation ────────────────────────────────────────────
function goBack() {
    window.location.href = '../home.html';
}

function getParams() {
    const p = new URLSearchParams(window.location.search);
    return { level: p.get('level') || '', subject: p.get('subject') || '' };
}

// ── Load video from Firestore ─────────────────────────────
async function loadVideo(level, subject) {
    const q    = query(collection(db, 'videos'),
                       where('level',   '==', String(level)),
                       where('subject', '==', subject));
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return snap.docs[0].data();
}

// ── Render Mux iframe ─────────────────────────────────────
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

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    const token        = sessionStorage.getItem(SESSION_KEY);
    userDocId          = sessionStorage.getItem(USER_DOC_ID);

    // التحقق من الـ session فقط — بدون localStorage أو kickOut
    if (!loggedInUser || !token || !userDocId) {
        window.location.href = '../../index.html';
        return;
    }

    // استمر في الـ heartbeat لتحديث lastSeen
    await sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_MS);

    document.getElementById('userName').textContent = '👤 ' + loggedInUser;
    document.getElementById('backBtn').addEventListener('click', goBack);

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
