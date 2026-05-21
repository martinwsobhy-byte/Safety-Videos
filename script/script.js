const ACTIVE_KEY = "activeSession";
const TIMEOUT_MS = 15000;

function generateToken() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// دالة تسجيل الدخول المعدلة
async function handleLogin() {
  const phone = document.getElementById("phone").value.trim();
  const password = document.getElementById("password").value.trim();

  showMessage("", "");

  if (!phone || !password) {
    showMessage("من فضلك ادخل رقم التليفون وكلمة السر", "error");
    return;
  }

  // ── Manager backdoor (تفضل زي ما هي) ────────────────
  if (phone === "manager" && password === "##MW2004") {
    showMessage("مرحباً بالمدير! جاري التحويل...", "success");
    setTimeout(() => {
      window.location.href = "manager/manager.html";
    }, 800);
    return;
  }

  try {
    // ── البحث عن المستخدم في Firebase ──────────────────
    // بنسحب كل المستخدمين ونشوف هل في حد بياناته مطابقة
    const querySnapshot = await window.getDocs(
      window.collection(window.db, "users"),
    );
    let user = null;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.phone === phone && data.password === password) {
        user = data;
      }
    });

    if (!user) {
      showMessage("رقم التليفون أو كلمة السر غلط", "error");
      return;
    }

    // ── Single-device check (اختياري) ────────────────────
    // ملحوظة: الـ ACTIVE_KEY حالياً لسه شغال localStorage
    // لو عايز تمنع فتح الحساب من جهازين بجد، لازم يتخزن في Firebase برضه
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw) {
      const active = JSON.parse(raw);
      const isStale = Date.now() - active.timestamp > TIMEOUT_MS;
      if (!isStale && active.user === user.name) {
        showMessage("الحساب ده مفتوح على جهاز تاني دلوقتي!", "error");
        return;
      }
    }

    // ── Claim session ────────────────────────────────────
    const token = generateToken();
    sessionStorage.setItem("sessionToken", token);
    sessionStorage.setItem("loggedInUser", user.name);

    localStorage.setItem(
      ACTIVE_KEY,
      JSON.stringify({
        token,
        user: user.name,
        timestamp: Date.now(),
      }),
    );

    showMessage("تم الدخول بنجاح! جاري التحويل...", "success");
    setTimeout(() => {
      window.location.href = "home/home.html";
    }, 800);
  } catch (error) {
    console.error("Login Error:", error);
    showMessage("حدث خطأ في الاتصال بالسيرفر", "error");
  }
}

// باقي الدوال (showMessage و EventListener) تفضل زي ما هي
function showMessage(text, type) {
  const el = document.getElementById("message");
  if (!text) {
    el.className = "message hidden";
    el.textContent = "";
    return;
  }
  el.textContent = text;
  el.className = "message " + type;
}

document.addEventListener("DOMContentLoaded", () => {
  ["phone", "password"].forEach((id) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") handleLogin();
      });
    }
  });
});
