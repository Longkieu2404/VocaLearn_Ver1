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
import { initializeApp }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged }
  from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, doc, getDoc, setDoc, onSnapshot,
  serverTimestamp, enableIndexedDbPersistence
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);
const db   = getFirestore(app);

// ===== OFFLINE PERSISTENCE =====
// Lưu cache Firestore vào IndexedDB → app dùng được khi mất mạng
enableIndexedDbPersistence(db).catch(err => {
  if (err.code === 'failed-precondition') {
    // Nhiều tab mở cùng lúc → chỉ tab đầu tiên được offline
    console.warn('Firebase offline: chỉ hỗ trợ 1 tab cùng lúc');
  } else if (err.code === 'unimplemented') {
    // Trình duyệt không hỗ trợ
    console.warn('Firebase offline: trình duyệt không hỗ trợ IndexedDB');
  }
});

// ===== AUTH =====
const FirebaseAuth = {
  provider: new GoogleAuthProvider(),

  async signIn() {
    try {
      const result = await signInWithPopup(auth, this.provider);
      return result.user;
    } catch (e) {
      console.error("Đăng nhập thất bại:", e);
      return null;
    }
  },

  async signOut() {
    await signOut(auth);
  },

  getUser() {
    return auth.currentUser;
  },

  onStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }
};

// ===== FIRESTORE SYNC =====
const FirebaseSync = {
  _saveTimer:      null,
  _isSyncing:      false,
  _unsubSnapshot:  null,   // hàm hủy real-time listener
  _ignoreNext:     false,  // tránh vòng lặp write→listen→write

  _userDocRef() {
    const user = auth.currentUser;
    if (!user) return null;
    return doc(db, "users", user.uid);
  },

  // ── Bắt đầu lắng nghe real-time ──────────────────────────────────────────
  startListening() {
    this.stopListening(); // hủy listener cũ nếu có
    const ref = this._userDocRef();
    if (!ref) return;

    this._unsubSnapshot = onSnapshot(ref,
      { includeMetadataChanges: true },
      (snap) => {
        // Bỏ qua nếu đang push (tự mình vừa ghi) hoặc không có dữ liệu
        if (this._ignoreNext) { this._ignoreNext = false; return; }
        if (!snap.exists()) return;

        // Chỉ áp dụng khi dữ liệu đến từ server (không phải cache local)
        const fromServer = !snap.metadata.hasPendingWrites;
        if (!fromServer) return;

        const data = snap.data();
        this._applyToLocal(data);
        this._updateStatus('synced');

        // Re-render UI
        if (typeof renderHome         === 'function') renderHome();
        if (typeof updateStreak       === 'function') updateStreak();
        if (typeof updateTrashBadge   === 'function') updateTrashBadge();
      },
      (err) => {
        // Mất mạng → Firestore tự dùng cache, listener tự resume khi có mạng lại
        if (err.code === 'unavailable') {
          this._updateStatus('offline');
        } else {
          console.error("Lỗi real-time listener:", err);
          this._updateStatus('error');
        }
      }
    );
  },

  // ── Dừng lắng nghe real-time ─────────────────────────────────────────────
  stopListening() {
    if (this._unsubSnapshot) {
      this._unsubSnapshot();
      this._unsubSnapshot = null;
    }
    clearTimeout(this._saveTimer);
  },

  // ── Áp dữ liệu Firestore vào localStorage (không trigger push ngược lại) ─
  _applyToLocal(data) {
    // Tạm thời bỏ qua các trigger từ Storage.save* để không push ngược lại
    FirebaseSync._ignoreNext = true;

    const origPatch = FirebaseSync._ignoreNext; // giữ flag
    // Ghi thẳng vào localStorage không qua wrapper (tránh triggerSave)
    if (data.sets)         localStorage.setItem('vocalearn_sets',          JSON.stringify(data.sets));
    if (data.progress)     localStorage.setItem('vocalearn_progress',      JSON.stringify(data.progress));
    if (data.stats)        localStorage.setItem('vocalearn_stats',         JSON.stringify(data.stats));
    if (data.streak)       localStorage.setItem('vocalearn_streak',        JSON.stringify(data.streak));
    if (data.username)     localStorage.setItem('vocalearn_username',      data.username);
    if (data.trash)        localStorage.setItem('vocalearn_trash',         JSON.stringify(data.trash));
    if (data.chatSessions) localStorage.setItem('vocalearn_chat_sessions', JSON.stringify(data.chatSessions));
    if (data.geminiKey)    localStorage.setItem('vocalearn_gemini_key',    data.geminiKey);
  },

  // ── Xóa toàn bộ dữ liệu local (dùng khi đổi tài khoản) ─────────────────
  _clearLocal() {
    localStorage.setItem('vocalearn_sets',          JSON.stringify([]));
    localStorage.setItem('vocalearn_progress',      JSON.stringify({}));
    localStorage.setItem('vocalearn_stats',         JSON.stringify({ daily: {}, sessions: [] }));
    localStorage.setItem('vocalearn_streak',        JSON.stringify({ count: 0, lastDate: null }));
    localStorage.removeItem('vocalearn_trash');
    localStorage.removeItem('vocalearn_username');
    localStorage.removeItem('vocalearn_chat_sessions');
    localStorage.removeItem('vocalearn_gemini_key');
    localStorage.removeItem('vocalearn_gemini_models');
  },

  // ── Pull lần đầu khi login ────────────────────────────────────────────────
  async pull() {
    const ref  = this._userDocRef();
    const user = auth.currentUser;
    if (!ref || !user) return false;

    // Kiểm tra xem local data thuộc tài khoản nào
    const ownerUid = localStorage.getItem('vocalearn_owner_uid');
    const localBelongsToOther = ownerUid && ownerUid !== user.uid;

    if (localBelongsToOther) {
      // Dữ liệu local là của tài khoản khác → xóa sạch, không push lên
      this._clearLocal();
    }

    // Đánh dấu local thuộc tài khoản hiện tại
    localStorage.setItem('vocalearn_owner_uid', user.uid);

    try {
      this._updateStatus('syncing');
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        // Tài khoản này chưa có data trên Firestore
        if (localBelongsToOther) {
          // Vừa xóa local → tạo document trống, không push rác lên
          await setDoc(ref, {
            sets: [], progress: {}, stats: { daily: {}, sessions: [] },
            streak: { count: 0, lastDate: null }, trash: [],
            username: '', chatSessions: [], geminiKey: '',
            updatedAt: serverTimestamp(), version: 3
          });
        } else {
          // Tài khoản mới hoàn toàn, local là của chính họ → push lên
          await this.push();
        }
      } else {
        // Có data trên Firestore → kéo về (cloud là nguồn sự thật)
        this._applyToLocal(snap.data());
      }

      this.startListening();
      this._updateStatus('synced');
      return true;
    } catch (e) {
      console.error("Lỗi tải dữ liệu:", e);
      this.startListening();
      this._updateStatus('offline');
      return true;
    }
  },

  // ── Push dữ liệu local lên Firestore ─────────────────────────────────────
  async push() {
    const ref = this._userDocRef();
    if (!ref) return false;
    if (this._isSyncing) return false;
    this._isSyncing = true;
    try {
      this._updateStatus('syncing');
      this._ignoreNext = true; // báo listener bỏ qua echo này
      const data = {
        sets:         Storage.getSets(),
        progress:     Storage.getProgress(),
        stats:        Storage.getStats(),
        streak:       Storage.getStreak(),
        trash:        Trash.getAll(),
        username:     localStorage.getItem('vocalearn_username')      || '',
        chatSessions: JSON.parse(localStorage.getItem('vocalearn_chat_sessions') || '[]'),
        geminiKey:    localStorage.getItem('vocalearn_gemini_key')    || '',
        updatedAt:    serverTimestamp(),
        version:      3
      };
      await setDoc(ref, data, { merge: true });
      this._updateStatus('synced');
      return true;
    } catch (e) {
      console.error("Lỗi lưu dữ liệu:", e);
      // Mất mạng → Firestore tự queue, tự push lại khi online
      this._updateStatus('offline');
      return false;
    } finally {
      this._isSyncing = false;
    }
  },

  // ── Gọi sau mỗi thay đổi — debounce 2s ──────────────────────────────────
  triggerSave() {
    if (!auth.currentUser) return; // offline mode → không push
    this._updateStatus('pending');
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.push(), 2000);
  },

  // ── Cập nhật UI trạng thái ────────────────────────────────────────────────
  _updateStatus(state) {
    const el = document.getElementById('autosaveStatus');
    if (!el) return;
    const map = {
      off:     { icon: '☁️',  text: 'Chưa đăng nhập',         cls: '' },
      offline: { icon: '📴',  text: 'Offline — sẽ sync khi có mạng', cls: 'autosave-pending' },
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

// ===== HOOK VÀO Storage & Trash =====
window.FirebaseAuth = FirebaseAuth;
window.FirebaseSync = FirebaseSync;

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
