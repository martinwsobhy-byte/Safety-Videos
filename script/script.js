import { db, collection, getDocs, query, where }
    from './firebase.js';

const ACTIVE_KEY = 'activeSession';
const TIMEOUT_MS = 15000;

function generateToken() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

async function handleLogin() {
    const phone    = document.getElementById('phone').value.trim();
    const password = document.getElementById('password').value.trim();

    showMessage('', '');

    if (!phone || !password) {
        showMessage('من فضلك ادخل رقم التليفون وكلمة السر', 'error');
        return;
    }

    // ── Manager backdoor ────────────────────────────────
    if (phone === 'manager' && password === '##MW2004') {
        showMessage('مرحباً بالمدير! جاري التحويل...', 'success');
        setTimeout(() => { window.location.href = 'manager/manager.html'; }, 800);
        return;
    }

    // ── Firestore login ──────────────────────────────────
    try {
        const q   = query(collection(db, 'users'),
                          where('phone',    '==', phone),
                          where('password', '==', password));
        const snap = await getDocs(q);

        if (snap.empty) {
            showMessage('رقم التليفون أو كلمة السر غلط', 'error');
            return;
        }

        const user = snap.docs[0].data();

        // ── Single-device check ──────────────────────────
        const raw = localStorage.getItem(ACTIVE_KEY);
        if (raw) {
            const active   = JSON.parse(raw);
            const isStale  = Date.now() - active.timestamp > TIMEOUT_MS;
            if (!isStale && active.user === user.name) {
                showMessage('الحساب ده مفتوح على جهاز تاني دلوقتي!', 'error');
                return;
            }
        }

        // ── Claim session ────────────────────────────────
        const token = generateToken();
        sessionStorage.setItem('sessionToken',  token);
        sessionStorage.setItem('loggedInUser',  user.name);
        localStorage.setItem(ACTIVE_KEY, JSON.stringify({
            token,
            user:      user.name,
            timestamp: Date.now()
        }));

        showMessage('تم الدخول بنجاح! جاري التحويل...', 'success');
        setTimeout(() => { window.location.href = 'home/home.html'; }, 800);

    } catch (err) {
        console.error(err);
        showMessage('حدث خطأ في الاتصال، حاول تاني', 'error');
    }
}

function showMessage(text, type) {
    const el = document.getElementById('message');
    if (!text) { el.className = 'message hidden'; el.textContent = ''; return; }
    el.textContent = text;
    el.className   = 'message ' + type;
}

document.addEventListener('DOMContentLoaded', () => {
    ['phone', 'password'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') handleLogin();
        });
    });
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
});
