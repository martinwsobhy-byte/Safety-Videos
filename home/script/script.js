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

const SESSION_KEY  = 'sessionToken';
const USER_DOC_ID  = 'userDocId';

let heartbeatTimer = null;
let userDocId      = null;

// ── Active flag helpers ───────────────────────────────────
async function setActive(value) {
    if (!userDocId) return;
    try {
        await updateDoc(doc(db, 'users', userDocId), { active: value });
    } catch (e) { console.error('setActive error:', e); }
}

// ── Heartbeat — يحافظ على الـ active=1 كل 10 ثواني ──────
// (حماية إضافية لو النت انقطع وعاد تاني)
function startHeartbeat() {
    heartbeatTimer = setInterval(() => setActive(1), 10000);
}

// ── Logout ────────────────────────────────────────────────
async function handleLogout() {
    clearInterval(heartbeatTimer);
    await setActive(0);
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem(USER_DOC_ID);
    window.location.href = '../index.html';
}

// ── إغلاق المتصفح / reload ────────────────────────────────
// sendBeacon بيضمن إن الطلب يوصل حتى لو الصفحة اتقفلت
window.addEventListener('beforeunload', () => {
    if (!userDocId) return;
    // Firestore REST API — بنستخدمه لأن fetch العادي ممكن يتقطع
    const url = `https://firestore.googleapis.com/v1/projects/safety-videos-2026/databases/(default)/documents/users/${userDocId}?updateMask.fieldPaths=active`;
    const body = JSON.stringify({
        fields: { active: { integerValue: 0 } }
    });
    navigator.sendBeacon(url + '&key=AIzaSyAgWbT7YyrSFflL9thn1px2cuUwPpynZ00', new Blob([body], { type: 'application/json' }));
});

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

    // Set active = 1 in Firestore
    await setActive(1);
    startHeartbeat();

    document.getElementById('userName').textContent = '👤 ' + loggedInUser;
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    document.getElementById('modalOverlay').addEventListener('click', e => {
        if (e.target === document.getElementById('modalOverlay')) closeModalDirect();
    });
    document.getElementById('modalCloseBtn').addEventListener('click', closeModalDirect);

    // Build levels grid
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
