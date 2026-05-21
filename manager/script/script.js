let editingIndex = -1; // -1 means adding new, otherwise editing existing

// Load users list on page load
document.addEventListener('DOMContentLoaded', renderUsers);

function getUsers() {
    return JSON.parse(localStorage.getItem('users') || '[]');
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function renderUsers() {
    const users = getUsers();
    const listEl = document.getElementById('usersList');
    const countEl = document.getElementById('userCount');

    countEl.textContent = users.length;

    if (users.length === 0) {
        listEl.innerHTML = '<p class="empty-msg">لا يوجد مستخدمين بعد</p>';
        return;
    }

    listEl.innerHTML = users.map((user, index) => `
        <div class="user-item">
            <div class="user-info">
                <span class="user-name">👤 ${escapeHtml(user.name)}</span>
                <span class="user-details">📞 ${escapeHtml(user.phone)} &nbsp;|&nbsp; 🔑 ${escapeHtml(user.password)}</span>
            </div>
            <div class="user-actions">
                <button class="edit-btn" onclick="startEdit(${index})">✏️ تعديل</button>
                <button class="delete-btn" onclick="deleteUser(${index})">🗑️ حذف</button>
            </div>
        </div>
    `).join('');
}

function saveUser() {
    const name = document.getElementById('inputName').value.trim();
    const phone = document.getElementById('inputPhone').value.trim();
    const password = document.getElementById('inputPassword').value.trim();

    if (!name || !phone || !password) {
        showFormMessage('من فضلك ادخل كل البيانات', 'error');
        return;
    }

    if (!/^01[0-9]{9}$/.test(phone)) {
        showFormMessage('رقم التليفون غير صحيح (مثال: 01xxxxxxxxx)', 'error');
        return;
    }

    const users = getUsers();

    if (editingIndex === -1) {
        // Check for duplicate phone
        const exists = users.find(u => u.phone === phone);
        if (exists) {
            showFormMessage('رقم التليفون ده موجود بالفعل', 'error');
            return;
        }
        users.push({ name, phone, password });
        showFormMessage('تم إضافة المستخدم بنجاح ✅', 'success');
    } else {
        // Check for duplicate phone (excluding current user)
        const exists = users.find((u, i) => u.phone === phone && i !== editingIndex);
        if (exists) {
            showFormMessage('رقم التليفون ده موجود بالفعل', 'error');
            return;
        }
        users[editingIndex] = { name, phone, password };
        showFormMessage('تم تعديل بيانات المستخدم بنجاح ✅', 'success');
        cancelEdit();
    }

    saveUsers(users);
    renderUsers();
    clearForm();
}

function startEdit(index) {
    const users = getUsers();
    const user = users[index];

    editingIndex = index;

    document.getElementById('inputName').value = user.name;
    document.getElementById('inputPhone').value = user.phone;
    document.getElementById('inputPassword').value = user.password;

    document.getElementById('formTitle').textContent = `تعديل بيانات: ${user.name}`;
    document.getElementById('cancelBtn').classList.remove('hidden');

    // Scroll to form
    document.querySelector('.form-card').scrollIntoView({ behavior: 'smooth' });
    hideFormMessage();
}

function cancelEdit() {
    editingIndex = -1;
    clearForm();
    document.getElementById('formTitle').textContent = 'إضافة مستخدم جديد';
    document.getElementById('cancelBtn').classList.add('hidden');
    hideFormMessage();
}

function deleteUser(index) {
    const users = getUsers();
    const user = users[index];

    if (!confirm(`هل أنت متأكد من حذف "${user.name}"؟`)) return;

    users.splice(index, 1);
    saveUsers(users);
    renderUsers();

    // If we were editing this user, cancel edit
    if (editingIndex === index) cancelEdit();
}

function clearForm() {
    document.getElementById('inputName').value = '';
    document.getElementById('inputPhone').value = '';
    document.getElementById('inputPassword').value = '';
}

function showFormMessage(text, type) {
    const el = document.getElementById('formMessage');
    el.textContent = text;
    el.className = 'form-message ' + type;
    setTimeout(() => hideFormMessage(), 3000);
}

function hideFormMessage() {
    const el = document.getElementById('formMessage');
    el.className = 'form-message hidden';
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ══════════════════════════════════════════════════════════
// VIDEO MANAGEMENT
// ══════════════════════════════════════════════════════════

let editingVideoIndex = -1;

document.addEventListener('DOMContentLoaded', renderVideos);

function getVideos() {
    return JSON.parse(localStorage.getItem('videos') || '[]');
}

function saveVideos(videos) {
    localStorage.setItem('videos', JSON.stringify(videos));
}

function renderVideos() {
    const videos  = getVideos();
    const listEl  = document.getElementById('videosList');
    const countEl = document.getElementById('videoCount');

    countEl.textContent = videos.length;

    if (videos.length === 0) {
        listEl.innerHTML = '<p class="empty-msg">لا يوجد فيديوهات بعد</p>';
        return;
    }

    listEl.innerHTML = videos.map((v, index) => `
        <div class="user-item">
            <div class="user-info">
                <span class="user-name">🎬 مستوى ${escapeHtml(v.level)} — ${escapeHtml(v.subject)}</span>
                ${v.title ? `<span class="user-details">📌 ${escapeHtml(v.title)}</span>` : ''}
                <span class="user-details video-url-preview" title="${escapeHtml(v.url)}">🔑 ${escapeHtml(v.url.length > 50 ? v.url.slice(0, 50) + '...' : v.url)}</span>
            </div>
            <div class="user-actions">
                <button class="edit-btn" onclick="startVideoEdit(${index})">✏️ تعديل</button>
                <button class="delete-btn" onclick="deleteVideo(${index})">🗑️ حذف</button>
            </div>
        </div>
    `).join('');
}

function saveVideo() {
    const level   = document.getElementById('videoLevel').value.trim();
    const subject = document.getElementById('videoSubject').value.trim();
    const url     = document.getElementById('videoUrl').value.trim();
    const title   = document.getElementById('videoTitle').value.trim();
    const desc    = document.getElementById('videoDesc').value.trim();

    if (!level || !subject || !url) {
        showVideoMessage('من فضلك اختر المستوى والمادة وادخل رابط الفيديو', 'error');
        return;
    }

    const videos = getVideos();

    if (editingVideoIndex === -1) {
        // Check duplicate
        const exists = videos.find(v => v.level === level && v.subject === subject);
        if (exists) {
            showVideoMessage('في فيديو بالفعل لنفس المستوى والمادة — عدّله من القائمة', 'error');
            return;
        }
        videos.push({ level, subject, url, title, desc });
        showVideoMessage('تم إضافة الفيديو بنجاح ✅', 'success');
    } else {
        // Check duplicate excluding current
        const exists = videos.find((v, i) => v.level === level && v.subject === subject && i !== editingVideoIndex);
        if (exists) {
            showVideoMessage('في فيديو بالفعل لنفس المستوى والمادة', 'error');
            return;
        }
        videos[editingVideoIndex] = { level, subject, url, title, desc };
        showVideoMessage('تم تعديل الفيديو بنجاح ✅', 'success');
        cancelVideoEdit();
    }

    saveVideos(videos);
    renderVideos();
    clearVideoForm();
}

function startVideoEdit(index) {
    const videos = getVideos();
    const v = videos[index];

    editingVideoIndex = index;

    document.getElementById('videoLevel').value   = v.level;
    document.getElementById('videoSubject').value = v.subject;
    document.getElementById('videoUrl').value     = v.url;
    document.getElementById('videoTitle').value   = v.title || '';
    document.getElementById('videoDesc').value    = v.desc  || '';

    document.getElementById('videoFormTitle').textContent = `تعديل فيديو: مستوى ${v.level} — ${v.subject}`;
    document.getElementById('cancelVideoBtn').classList.remove('hidden');

    document.getElementById('videoFormTitle').scrollIntoView({ behavior: 'smooth' });
    hideVideoMessage();
}

function cancelVideoEdit() {
    editingVideoIndex = -1;
    clearVideoForm();
    document.getElementById('videoFormTitle').textContent = 'إضافة فيديو جديد';
    document.getElementById('cancelVideoBtn').classList.add('hidden');
    hideVideoMessage();
}

function deleteVideo(index) {
    const videos = getVideos();
    const v = videos[index];
    if (!confirm(`هل أنت متأكد من حذف فيديو مستوى ${v.level} — ${v.subject}؟`)) return;
    videos.splice(index, 1);
    saveVideos(videos);
    renderVideos();
    if (editingVideoIndex === index) cancelVideoEdit();
}

function clearVideoForm() {
    document.getElementById('videoLevel').value   = '';
    document.getElementById('videoSubject').value = '';
    document.getElementById('videoUrl').value     = '';
    document.getElementById('videoTitle').value   = '';
    document.getElementById('videoDesc').value    = '';
}

function showVideoMessage(text, type) {
    const el = document.getElementById('videoFormMessage');
    el.textContent = text;
    el.className = 'form-message ' + type;
    setTimeout(() => hideVideoMessage(), 3500);
}

function hideVideoMessage() {
    document.getElementById('videoFormMessage').className = 'form-message hidden';
}
