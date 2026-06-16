import { db, collection, getDocs, query, where }
    from './firebase.js';

const SESSION_KEY   = 'sessionToken';
const USER_DOC_ID   = 'userDocId';
const OFFLINE_AFTER = 12000;   // 12 ثانية بدون heartbeat = offline

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
        const q    = query(collection(db, 'users'),
                           where('phone',    '==', phone),
                           where('password', '==', password));
        const snap = await getDocs(q);

        if (snap.empty) {
            showMessage('رقم التليفون أو كلمة السر غلط', 'error');
            return;
        }

        const userDoc = snap.docs[0];
        const user    = userDoc.data();
        const docId   = userDoc.id;

        // ── Check 3: هل الحساب مستخدم دلوقتي؟ ───────────
        // بنشوف lastSeen — لو من أقل من 25 ثانية = حد شغال
        const lastSeen = user.lastSeen || 0;
        const isOnline = (Date.now() - lastSeen) < OFFLINE_AFTER;

        if (isOnline) {
            showMessage('الحساب ده مفتوح على جهاز تاني دلوقتي!', 'error');
            return;
        }

        // ── Claim session ────────────────────────────────
        const token = generateToken();
        sessionStorage.setItem(SESSION_KEY,    token);
        sessionStorage.setItem('loggedInUser', user.name);
        sessionStorage.setItem(USER_DOC_ID,    docId);

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
