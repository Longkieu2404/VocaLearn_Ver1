// ===== FIREBASE MODULE =====
// Hướng dẫn cấu hình:
// 1. Vào https://console.firebase.google.com/ → Tạo project mới
// 2. Project Settings → Thêm web app → Copy firebaseConfig vào bên dưới
// 3. Authentication → Sign-in method → Bật Google
// 4. Firestore Database → Create database (chọn production mode)
// 5. Firestore → Rules → Dán rules từ file firestore.rules

// ⚠️ THAY THẾ ĐOẠN NÀY bằng config của project Firebase của bạn
const FIREBASE_CONFIG = {
  apiKey:            "AIzaSyBnM_4SgFek2PdjKAIWj0sXWnrhz5PzYQ0",
  authDomain:        "vocalearn-3a4f2.firebaseapp.com",
  projectId:         "vocalearn-3a4f2",
  storageBucket:     "vocalearn-3a4f2.firebasestorage.app",
  messagingSenderId: "904250085974",
  appId:             "1:904250085974:web:28d08a71893526486521f7",
  measurementId:     "G-8PEK5H6Z71"
};

// ===== KHỞI TẠO FIREBASE =====
import { initializeApp }                            from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
                                                    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, serverTimestamp }
                                                    from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);

// ===== AUTH =====
const FirebaseAuth = {
  provider: new GoogleAuthProvider(),

  // Đăng nhập bằng Google
  async signIn() {
    try {
      const result = await signInWithPopup(auth, this.provider);
      return result.user;
    } catch (e) {
      console.error("Đăng nhập thất bại:", e);
      return null;
    }
  },

  // Đăng xuất
  async signOut() {
    await signOut(auth);
  },

  // Lấy user hiện tại (null nếu chưa đăng nhập)
  getUser() {
    return auth.currentUser;
  },

  // Lắng nghe thay đổi trạng thái đăng nhập
  onStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }
};

// ===== FIRESTORE SYNC =====
const FirebaseSync = {
  _saveTimer: null,
  _isSyncing: false,

  // Đường dẫn document của user trên Firestore
  _userDocRef() {
    const user = auth.currentUser;
    if (!user) return null;
    return doc(db, "users", user.uid);
  },

  // Tải dữ liệu từ Firestore về localStorage
  async pull() {
    const ref = this._userDocRef();
    if (!ref) return false;
    try {
      this._updateStatus('syncing');
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        // Lần đầu đăng nhập → đẩy dữ liệu local lên
        await this.push();
        return true;
      }
      const data = snap.data();

      // Ghi vào localStorage
      if (data.sets)         Storage.saveSets(data.sets);
      if (data.progress)     Storage.saveProgress(data.progress);
      if (data.stats)        Storage.saveStats(data.stats);
      if (data.streak)       Storage.saveStreak(data.streak);
      if (data.username)     localStorage.setItem('vocalearn_username', data.username);
      if (data.trash)        localStorage.setItem('vocalearn_trash', JSON.stringify(data.trash));
      if (data.chatSessions) localStorage.setItem('vocalearn_chat_sessions', JSON.stringify(data.chatSessions));
      if (data.geminiKey)    localStorage.setItem('vocalearn_gemini_key', data.geminiKey);

      this._updateStatus('synced');
      return true;
    } catch (e) {
      console.error("Lỗi tải dữ liệu:", e);
      this._updateStatus('error');
      return false;
    }
  },

  // Đẩy dữ liệu từ localStorage lên Firestore
  async push() {
    const ref = this._userDocRef();
    if (!ref) return false;
    if (this._isSyncing) return false;
    this._isSyncing = true;
    try {
      this._updateStatus('syncing');
      const data = {
        sets:         Storage.getSets(),
        progress:     Storage.getProgress(),
        stats:        Storage.getStats(),
        streak:       Storage.getStreak(),
        trash:        Trash.getAll(),
        username:     localStorage.getItem('vocalearn_username') || '',
        chatSessions: JSON.parse(localStorage.getItem('vocalearn_chat_sessions') || '[]'),
        geminiKey:    localStorage.getItem('vocalearn_gemini_key') || '',
        updatedAt:    serverTimestamp(),
        version:      2
      };
      await setDoc(ref, data, { merge: true });
      this._updateStatus('synced');
      return true;
    } catch (e) {
      console.error("Lỗi lưu dữ liệu:", e);
      this._updateStatus('error');
      return false;
    } finally {
      this._isSyncing = false;
    }
  },

  // Gọi sau mỗi thay đổi — debounce 2s
  triggerSave() {
    if (!auth.currentUser) return;
    this._updateStatus('pending');
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.push(), 2000);
  },

  // Cập nhật UI trạng thái sync
  _updateStatus(state) {
    const el = document.getElementById('autosaveStatus');
    if (!el) return;
    const map = {
      off:     { icon: '☁️',  text: 'Chưa đăng nhập',         cls: '' },
      pending: { icon: '⏳',  text: 'Đang chờ đồng bộ...',    cls: 'autosave-pending' },
      syncing: { icon: '🔄',  text: 'Đang đồng bộ...',        cls: 'autosave-pending' },
      synced:  { icon: '✅',  text: 'Đã đồng bộ Firebase',    cls: 'autosave-ok' },
      error:   { icon: '❌',  text: 'Lỗi đồng bộ',            cls: 'autosave-err' }
    };
    const s = map[state] || map.off;
    el.innerHTML = `<span>${s.icon}</span><span>${s.text}</span>`;
    el.className = 'autosave-status ' + s.cls;
  }
};

// ===== HOOK VÀO AutoSave (tương thích ngược) =====
// Patch AutoSave.triggerSave → gọi FirebaseSync.triggerSave thay thế
// Được gọi sau khi DOM đã sẵn sàng (DOMContentLoaded đã chạy)
window.FirebaseAuth = FirebaseAuth;
window.FirebaseSync = FirebaseSync;

// Patch AutoSave để storage.js tự động trigger Firebase sync
const _origSaveSets     = Storage.saveSets.bind(Storage);
const _origSaveProgress = Storage.saveProgress.bind(Storage);
const _origSaveStats    = Storage.saveStats.bind(Storage);
const _origSaveStreak   = Storage.saveStreak.bind(Storage);

Storage.saveSets = function(sets) {
  _origSaveSets(sets);
  FirebaseSync.triggerSave();
};
Storage.saveProgress = function(prog) {
  _origSaveProgress(prog);
  FirebaseSync.triggerSave();
};
Storage.saveStats = function(stats) {
  _origSaveStats(stats);
  FirebaseSync.triggerSave();
};
Storage.saveStreak = function(s) {
  _origSaveStreak(s);
  FirebaseSync.triggerSave();
};

// Patch Trash._save để đồng bộ khi xóa/khôi phục
const _origTrashSave = Trash._save.bind(Trash);
Trash._save = function(items) {
  _origTrashSave(items);
  FirebaseSync.triggerSave();
};

// Gọi setupFirebaseUI sau khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setupFirebaseUI());
} else {
  setupFirebaseUI();
}