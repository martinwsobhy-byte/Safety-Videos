import { db, collection, getDocs, addDoc, updateDoc,
         deleteDoc, doc, query, where, onSnapshot }
    from '../../script/firebase.js';

// ══════════════════════════════════════════════════════════
// USERS — Realtime listener
// ══════════════════════════════════════════════════════════

let editingDocId = null;

const OFFLINE_AFTER = 12000;

function isOnline(u) {
    return u.lastSeen && (Date.now() - u.lastSeen) < OFFLINE_AFTER;
}

let _cachedUsers = [];

function startUsersListener() {
    onSnapshot(collection(db, 'users'), (snap) => {
        _cachedUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        renderUsers(_cachedUsers);
    });

    // بيعيد رسم اللمبات كل 3 ثواني
    setInterval(() => {
        if (_cachedUsers.length > 0) renderUsers(_cachedUsers);
    }, 3000);
}

function renderUsers(users) {
    const listEl  = document.getElementById('usersList');
    const countEl = document.getElementById('userCount');
    countEl.textContent = users.length;

    if (users.length === 0) {
        listEl.innerHTML = '<p class="empty-msg">لا يوجد مستخدمين بعد</p>';
        return;
    }

    listEl.innerHTML = users.map(u => `
        <div class="user-item">
            <div class="user-info">
                <div class="user-name-row">
                    <span class="status-dot ${isOnline(u) ? 'online' : 'offline'}"
                          title="${isOnline(u) ? 'مستخدم دلوقتي' : 'غير متصل'}"></span>
                    <span class="user-name">👤 ${escapeHtml(u.name)}</span>
                </div>
                <span class="user-details">📞 ${escapeHtml(u.phone)} &nbsp;|&nbsp; 🔑 ${escapeHtml(u.password)}</span>
            </div>
            <div class="user-actions">
                <button class="edit-btn"   onclick="startEdit('${u.id}','${escapeHtml(u.name)}','${escapeHtml(u.phone)}','${escapeHtml(u.password)}')">✏️ تعديل</button>
                <button class="delete-btn" onclick="deleteUser('${u.id}','${escapeHtml(u.name)}')">🗑️ حذف</button>
            </div>
        </div>`).join('');
}

async function saveUser() {
    const name     = document.getElementById('inputName').value.trim();
    const phone    = document.getElementById('inputPhone').value.trim();
    const password = document.getElementById('inputPassword').value.trim();

    if (!name || !phone || !password) { showFormMessage('من فضلك ادخل كل البيانات', 'error'); return; }
    if (!/^01[0-9]{9}$/.test(phone))  { showFormMessage('رقم التليفون غير صحيح', 'error'); return; }

    try {
        if (editingDocId === null) {
            const q    = query(collection(db, 'users'), where('phone', '==', phone));
            const snap = await getDocs(q);
            if (!snap.empty) { showFormMessage('رقم التليفون ده موجود بالفعل', 'error'); return; }

            // active=0 عند الإضافة
            await addDoc(collection(db, 'users'), { name, phone, password, active: 0 });
            showFormMessage('تم إضافة المستخدم بنجاح ✅', 'success');
        } else {
            const q    = query(collection(db, 'users'), where('phone', '==', phone));
            const snap = await getDocs(q);
            const dup  = snap.docs.find(d => d.id !== editingDocId);
            if (dup) { showFormMessage('رقم التليفون ده موجود بالفعل', 'error'); return; }

            await updateDoc(doc(db, 'users', editingDocId), { name, phone, password });
            showFormMessage('تم تعديل بيانات المستخدم بنجاح ✅', 'success');
            cancelEdit();
        }
        clearForm();
    } catch (err) {
        console.error(err);
        showFormMessage('حدث خطأ، حاول تاني', 'error');
    }
}

function startEdit(id, name, phone, password) {
    editingDocId = id;
    document.getElementById('inputName').value     = name;
    document.getElementById('inputPhone').value    = phone;
    document.getElementById('inputPassword').value = password;
    document.getElementById('formTitle').textContent = `تعديل بيانات: ${name}`;
    document.getElementById('cancelBtn').classList.remove('hidden');
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
}

function cancelEdit() {
    editingDocId = null;
    clearForm();
    document.getElementById('formTitle').textContent = 'إضافة مستخدم جديد';
    document.getElementById('cancelBtn').classList.add('hidden');
}

async function deleteUser(id, name) {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    try {
        await deleteDoc(doc(db, 'users', id));
        if (editingDocId === id) cancelEdit();
    } catch (err) { console.error(err); }
}

function clearForm() {
    document.getElementById('inputName').value     = '';
    document.getElementById('inputPhone').value    = '';
    document.getElementById('inputPassword').value = '';
}

function showFormMessage(text, type) {
    const el = document.getElementById('formMessage');
    el.textContent = text;
    el.className   = 'form-message ' + type;
    setTimeout(() => { el.className = 'form-message hidden'; }, 3000);
}

// ══════════════════════════════════════════════════════════
// VIDEOS
// ══════════════════════════════════════════════════════════

let editingVideoDocId = null;

async function loadVideos() {
    const snap   = await getDocs(collection(db, 'videos'));
    const videos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderVideos(videos);
}

function renderVideos(videos) {
    const listEl  = document.getElementById('videosList');
    const countEl = document.getElementById('videoCount');
    countEl.textContent = videos.length;

    if (videos.length === 0) {
        listEl.innerHTML = '<p class="empty-msg">لا يوجد فيديوهات بعد</p>';
        return;
    }

    listEl.innerHTML = videos.map(v => `
        <div class="user-item">
            <div class="user-info">
                <span class="user-name">🎬 مستوى ${escapeHtml(v.level)} — ${escapeHtml(v.subject)}</span>
                ${v.title ? `<span class="user-details">📌 ${escapeHtml(v.title)}</span>` : ''}
                <span class="user-details video-url-preview" title="${escapeHtml(v.url)}">🔑 ${escapeHtml(v.url.length > 50 ? v.url.slice(0,50)+'...' : v.url)}</span>
            </div>
            <div class="user-actions">
                <button class="edit-btn"   onclick="startVideoEdit('${v.id}')">✏️ تعديل</button>
                <button class="delete-btn" onclick="deleteVideo('${v.id}','${escapeHtml(v.level)}','${escapeHtml(v.subject)}')">🗑️ حذف</button>
            </div>
        </div>`).join('');

    window._videos = videos;
}

async function saveVideo() {
    const level   = document.getElementById('videoLevel').value.trim();
    const subject = document.getElementById('videoSubject').value.trim();
    const url     = document.getElementById('videoUrl').value.trim();
    const title   = document.getElementById('videoTitle').value.trim();
    const desc    = document.getElementById('videoDesc').value.trim();

    if (!level || !subject || !url) {
        showVideoMessage('من فضلك اختر المستوى والمادة وادخل Playback ID', 'error'); return;
    }

    try {
        if (editingVideoDocId === null) {
            const q    = query(collection(db, 'videos'), where('level','==',level), where('subject','==',subject));
            const snap = await getDocs(q);
            if (!snap.empty) { showVideoMessage('في فيديو بالفعل لنفس المستوى والمادة', 'error'); return; }
            await addDoc(collection(db, 'videos'), { level, subject, url, title, desc });
            showVideoMessage('تم إضافة الفيديو بنجاح ✅', 'success');
        } else {
            const q    = query(collection(db, 'videos'), where('level','==',level), where('subject','==',subject));
            const snap = await getDocs(q);
            const dup  = snap.docs.find(d => d.id !== editingVideoDocId);
            if (dup) { showVideoMessage('في فيديو بالفعل لنفس المستوى والمادة', 'error'); return; }
            await updateDoc(doc(db, 'videos', editingVideoDocId), { level, subject, url, title, desc });
            showVideoMessage('تم تعديل الفيديو بنجاح ✅', 'success');
            cancelVideoEdit();
        }
        clearVideoForm();
        loadVideos();
    } catch (err) {
        console.error(err);
        showVideoMessage('حدث خطأ، حاول تاني', 'error');
    }
}

function startVideoEdit(id) {
    const v = (window._videos || []).find(x => x.id === id);
    if (!v) return;
    editingVideoDocId = id;
    document.getElementById('videoLevel').value   = v.level;
    document.getElementById('videoSubject').value = v.subject;
    document.getElementById('videoUrl').value     = v.url;
    document.getElementById('videoTitle').value   = v.title || '';
    document.getElementById('videoDesc').value    = v.desc  || '';
    document.getElementById('videoFormTitle').textContent = `تعديل فيديو: مستوى ${v.level} — ${v.subject}`;
    document.getElementById('cancelVideoBtn').classList.remove('hidden');
    document.getElementById('videoFormTitle').scrollIntoView({ behavior: 'smooth' });
}

function cancelVideoEdit() {
    editingVideoDocId = null;
    clearVideoForm();
    document.getElementById('videoFormTitle').textContent = 'إضافة فيديو جديد';
    document.getElementById('cancelVideoBtn').classList.add('hidden');
}

async function deleteVideo(id, level, subject) {
    if (!confirm(`هل أنت متأكد من حذف فيديو مستوى ${level} — ${subject}؟`)) return;
    try {
        await deleteDoc(doc(db, 'videos', id));
        if (editingVideoDocId === id) cancelVideoEdit();
        loadVideos();
    } catch (err) { console.error(err); }
}

function clearVideoForm() {
    ['videoLevel','videoSubject','videoUrl','videoTitle','videoDesc']
        .forEach(id => { document.getElementById(id).value = ''; });
}

function showVideoMessage(text, type) {
    const el = document.getElementById('videoFormMessage');
    el.textContent = text;
    el.className   = 'form-message ' + type;
    setTimeout(() => { el.className = 'form-message hidden'; }, 3500);
}

// ── Shared ────────────────────────────────────────────────
function escapeHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    startUsersListener();
    loadVideos();

    document.getElementById('saveBtn').addEventListener('click', saveUser);
    document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
    document.getElementById('saveVideoBtn').addEventListener('click', saveVideo);
    document.getElementById('cancelVideoBtn').addEventListener('click', cancelVideoEdit);
});

window.startEdit      = startEdit;
window.deleteUser     = deleteUser;
window.startVideoEdit = startVideoEdit;
window.deleteVideo    = deleteVideo;
