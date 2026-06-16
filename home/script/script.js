import { db, doc, updateDoc }
    from '../../script/firebase.js';

const SUBJECTS = [
    { name: 'إنجليزي',    icon: '🇬🇧' },
    { name: 'رياضة عامة', icon: '📐' },
    { name: 'رياضة خاصة', icon: '📊' },
    { name: 'ميكانيكا',   icon: '⚙️' },
    { name: 'كيمياء',     icon: '🧪' },
    { name: 'فيزياء',     icon: '⚡' },
];
const LEVEL_ICONS = ['1','2','3','4','5','6','7','8','9','10','11','12'];

const SESSION_KEY   = 'sessionToken';
const USER_DOC_ID   = 'userDocId';
const HEARTBEAT_MS  = 5000;    // كل 5 ثواني
const OFFLINE_AFTER = 12000;   // 12 ثانية بدون heartbeat = offline

let heartbeatTimer = null;
let userDocId      = null;

// ── Heartbeat: بيحدّث lastSeen كل 10 ثواني ───────────────
async function sendHeartbeat() {
    if (!userDocId) return;
    try {
        await updateDoc(doc(db, 'users', userDocId), {
            lastSeen: Date.now()
        });
    } catch (e) { console.error('heartbeat error:', e); }
}

// ── Logout ────────────────────────────────────────────────
async function handleLogout() {
    clearInterval(heartbeatTimer);
    // نصفّر الـ lastSeen عشان اللمبة تتطفى فوراً
    try {
        await updateDoc(doc(db, 'users', userDocId), { lastSeen: 0 });
    } catch (e) { /* ignore */ }
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem(USER_DOC_ID);
    window.location.href = '../index.html';
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
            <div class="subject-name">${subject.name}</div>`;
        card.addEventListener('click', () => {
            closeModalDirect();
            const params = new URLSearchParams({ level, subject: subject.name });
            window.location.href = `video/view_video.html?${params.toString()}`;
        });
        grid.appendChild(card);
    });
    document.getElementById('modalOverlay').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeModalDirect() {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.body.style.overflow = '';
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    const loggedInUser = sessionStorage.getItem('loggedInUser');
    const token        = sessionStorage.getItem(SESSION_KEY);
    userDocId          = sessionStorage.getItem(USER_DOC_ID);

    if (!loggedInUser || !token || !userDocId) {
        window.location.href = '../index.html';
        return;
    }

    // أول heartbeat فوري عند الدخول
    await sendHeartbeat();
    heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_MS);

    document.getElementById('userName').textContent = '👤 ' + loggedInUser;
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('modalOverlay').addEventListener('click', e => {
        if (e.target === document.getElementById('modalOverlay')) closeModalDirect();
    });
    document.getElementById('modalCloseBtn').addEventListener('click', closeModalDirect);

    // Build levels
    const grid = document.getElementById('levelsGrid');
    for (let i = 1; i <= 12; i++) {
        const card = document.createElement('div');
        card.className = 'level-card';
        card.innerHTML = `
            <div class="level-icon">${LEVEL_ICONS[i-1]}</div>
            <div class="level-label">مستوى ${i}</div>`;
        card.addEventListener('click', () => openModal(i));
        grid.appendChild(card);
    }
});

export { OFFLINE_AFTER };
