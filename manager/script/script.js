let editingIndex = -1;

// عند تحميل الصفحة، نسحب البيانات من السحاب بدل المتصفح
document.addEventListener("DOMContentLoaded", renderUsers);
document.addEventListener("DOMContentLoaded", renderVideos);

// --- وظائف المستخدمين (Firebase) ---

async function renderUsers() {
  const listEl = document.getElementById("usersList");
  const countEl = document.getElementById("userCount");

  try {
    // سحب المستخدمين من Firebase
    const querySnapshot = await window.getDocs(
      window.collection(window.db, "users"),
    );
    const users = [];
    querySnapshot.forEach((doc) => {
      users.push({ id: doc.id, ...doc.data() });
    });

    countEl.textContent = users.length;

    if (users.length === 0) {
      listEl.innerHTML = '<p class="empty-msg">لا يوجد مستخدمين بعد</p>';
      return;
    }

    listEl.innerHTML = users
      .map(
        (user) => `
            <div class="user-item">
                <div class="user-info">
                    <span class="user-name">👤 ${escapeHtml(user.name)}</span>
                    <span class="user-details">📞 ${escapeHtml(user.phone)} &nbsp;|&nbsp; 🔑 ${escapeHtml(user.password)}</span>
                </div>
                <div class="user-actions">
                    <button class="delete-btn" onclick="deleteUserFromCloud('${user.id}', '${user.name}')">🗑️ حذف</button>
                </div>
            </div>
        `,
      )
      .join("");
  } catch (e) {
    console.error("Error loading users:", e);
  }
}

async function saveUser() {
  const name = document.getElementById("inputName").value.trim();
  const phone = document.getElementById("inputPhone").value.trim();
  const password = document.getElementById("inputPassword").value.trim();

  // التأكد من البيانات (شغلك القديم)
  if (!name || !phone || !password) {
    showFormMessage("من فضلك ادخل كل البيانات", "error");
    return;
  }
  if (!/^01[0-9]{9}$/.test(phone)) {
    showFormMessage("رقم التليفون غير صحيح", "error");
    return;
  }

  try {
    // الحفظ في السحاب
    await window.addDoc(window.collection(window.db, "users"), {
      name,
      phone,
      password,
      createdAt: new Date(),
    });
    showFormMessage("تم إضافة المستخدم بنجاح ✅", "success");
    clearForm();
    renderUsers();
  } catch (e) {
    showFormMessage("خطأ في الاتصال بالسيرفر", "error");
  }
}

// دالة الحذف من السحاب
async function deleteUserFromCloud(id, name) {
  if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
  try {
    await window.deleteDoc(window.doc(window.db, "users", id));
    renderUsers();
  } catch (e) {
    alert("فشل الحذف");
  }
}

// --- وظائف الفيديوهات (Firebase) ---

async function renderVideos() {
  const listEl = document.getElementById("videosList");
  const countEl = document.getElementById("videoCount");

  const querySnapshot = await window.getDocs(
    window.collection(window.db, "videos"),
  );
  const videos = [];
  querySnapshot.forEach((doc) => {
    videos.push({ id: doc.id, ...doc.data() });
  });

  countEl.textContent = videos.length;
  if (videos.length === 0) {
    listEl.innerHTML = '<p class="empty-msg">لا يوجد فيديوهات بعد</p>';
    return;
  }

  listEl.innerHTML = videos
    .map(
      (v) => `
        <div class="user-item">
            <div class="user-info">
                <span class="user-name">🎬 مستوى ${escapeHtml(v.level)} — ${escapeHtml(v.subject)}</span>
                <span class="user-details">🔑 URL: ${escapeHtml(v.url)}</span>
            </div>
            <div class="user-actions">
                <button class="delete-btn" onclick="deleteVideoFromCloud('${v.id}')">🗑️ حذف</button>
            </div>
        </div>
    `,
    )
    .join("");
}

async function saveVideo() {
  const level = document.getElementById("videoLevel").value.trim();
  const subject = document.getElementById("videoSubject").value.trim();
  const url = document.getElementById("videoUrl").value.trim();

  if (!level || !subject || !url) {
    showVideoMessage("أكمل بيانات الفيديو", "error");
    return;
  }

  await window.addDoc(window.collection(window.db, "videos"), {
    level,
    subject,
    url,
    createdAt: new Date(),
  });
  showVideoMessage("تم إضافة الفيديو بنجاح ✅", "success");
  clearVideoForm();
  renderVideos();
}

async function deleteVideoFromCloud(id) {
  if (!confirm("حذف الفيديو؟")) return;
  await window.deleteDoc(window.doc(window.db, "videos", id));
  renderVideos();
}

// --- الدوال المساعدة (سيبها زي ما هي) ---
function clearForm() {
  document.getElementById("inputName").value = "";
  document.getElementById("inputPhone").value = "";
  document.getElementById("inputPassword").value = "";
}
function clearVideoForm() {
  document.getElementById("videoLevel").value = "";
  document.getElementById("videoSubject").value = "";
  document.getElementById("videoUrl").value = "";
}
function showFormMessage(text, type) {
  const el = document.getElementById("formMessage");
  el.textContent = text;
  el.className = "form-message " + type;
  setTimeout(() => (el.className = "form-message hidden"), 3000);
}
function showVideoMessage(text, type) {
  const el = document.getElementById("videoFormMessage");
  el.textContent = text;
  el.className = "form-message " + type;
  setTimeout(() => (el.className = "form-message hidden"), 3000);
}
function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        m
      ],
  );
}
