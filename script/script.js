const ACTIVE_KEY = 'activeSession';
const TIMEOUT_MS = 15000; // 15 seconds — same as home.js

function generateToken() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function handleLogin() {
    const phone     = document.getElementById('phone').value.trim();
    const password  = document.getElementById('password').value.trim();

    // Reset message
    showMessage('', '');

    if (!phone || !password) {
        showMessage('من فضلك ادخل رقم التليفون وكلمة السر', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user  = users.find(u => u.phone === phone && u.password === password);

    if (!user) {
        showMessage('رقم التليفون أو كلمة السر غلط', 'error');
        return;
    }

    // ── Single-device check ──────────────────────────────
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw) {
        const active = JSON.parse(raw);
        const isStale = Date.now() - active.timestamp > TIMEOUT_MS;
        if (!isStale && active.user === user.name) {
            // Active session exists on another device
            showMessage('الحساب ده مفتوح على جهاز تاني دلوقتي!', 'error');
            return;
        }
    }

    // ── Claim session ────────────────────────────────────
    const token = generateToken();
    sessionStorage.setItem('sessionToken',  token);
    sessionStorage.setItem('loggedInUser',  user.name);
    localStorage.setItem(ACTIVE_KEY, JSON.stringify({
        token,
        user:      user.name,
        timestamp: Date.now()
    }));

    showMessage('تم الدخول بنجاح! جاري التحويل...', 'success');
    setTimeout(() => {
        window.location.href = 'home/home.html';
    }, 800);
}

function showMessage(text, type) {
    const el = document.getElementById('message');
    if (!text) {
        el.className = 'message hidden';
        el.textContent = '';
        return;
    }
    el.textContent  = text;
    el.className    = 'message ' + type;
}

document.addEventListener('DOMContentLoaded', () => {
    ['phone', 'password'].forEach(id => {
        document.getElementById(id).addEventListener('keydown', e => {
            if (e.key === 'Enter') handleLogin();
        });
    });
});
