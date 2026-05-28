// ===== FIREBASE MODULE =====
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
  initializeFirestore, persistentLocalCache, persistentSingleTabManager,
  doc, getDoc, setDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const app  = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);

// Dùng persistentLocalCache thay enableIndexedDbPersistence (đã deprecated)
// → tự động cache offline vào IndexedDB, không cần gọi thêm gì
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentSingleTabManager() })
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

  getUser() { return auth.currentUser; },

  onStateChange(callback) {
    return onAuthStateChanged(auth, callback);
  }
};

// ===== FIRESTORE SYNC =====
const FirebaseSync = {
  _saveTimer:     null,
  _isSyncing:     false,
  _isPulling:     false,   // đang pull → listener không re-render
  _unsubSnapshot: null,    // hủy real-time listener
  _lastServerData: null,   // snapshot server cuối cùng đã áp dụng

  _userDocRef() {
    const user = auth.currentUser;
    if (!user) return null;
    return doc(db, "users", user.uid);
  },

  // ── Ghi data từ Firestore vào localStorage (không qua Storage wrapper) ────
  _applyToLocal(data) {
    if (data.sets         !== undefined) localStorage.setItem('vocalearn_sets',           JSON.stringify(data.sets));
    if (data.progress     !== undefined) localStorage.setItem('vocalearn_progress',       JSON.stringify(data.progress));
    if (data.stats        !== undefined) localStorage.setItem('vocalearn_stats',          JSON.stringify(data.stats));
    if (data.streak       !== undefined) localStorage.setItem('vocalearn_streak',         JSON.stringify(data.streak));
    if (data.username     !== undefined) localStorage.setItem('vocalearn_username',       data.username);
    if (data.trash        !== undefined) localStorage.setItem('vocalearn_trash',          JSON.stringify(data.trash));
    if (data.chatSessions !== undefined) localStorage.setItem('vocalearn_chat_sessions',  JSON.stringify(data.chatSessions));
    if (data.geminiKey    !== undefined) localStorage.setItem('vocalearn_gemini_key',     data.geminiKey);
  },

  // ── Xóa toàn bộ dữ liệu local ────────────────────────────────────────────
  _clearLocal() {
    localStorage.setItem('vocalearn_sets',      JSON.stringify([]));
    localStorage.setItem('vocalearn_progress',  JSON.stringify({}));
    localStorage.setItem('vocalearn_stats',     JSON.stringify({ daily: {}, sessions: [] }));
    localStorage.setItem('vocalearn_streak',    JSON.stringify({ count: 0, lastDate: null }));
    localStorage.removeItem('vocalearn_trash');
    localStorage.removeItem('vocalearn_username');
    localStorage.removeItem('vocalearn_chat_sessions');
    localStorage.removeItem('vocalearn_gemini_key');
    localStorage.removeItem('vocalearn_gemini_models');
  },

  // ── Re-render toàn bộ UI sau khi áp data mới ─────────────────────────────
  _rerender() {
    if (typeof renderHome       === 'function') renderHome();
    if (typeof updateStreak     === 'function') updateStreak();
    if (typeof updateTrashBadge === 'function') updateTrashBadge();
  },

  // ── Lắng nghe real-time thay đổi từ Firestore ────────────────────────────
  startListening() {
    this.stopListening();
    const ref = this._userDocRef();
    if (!ref) return;

    this._unsubSnapshot = onSnapshot(ref, (snap) => {
      // Bỏ qua khi đang pull (tránh render 2 lần)
      if (this._isPulling) return;
      if (!snap.exists()) return;

      // Chỉ xử lý data đến từ server thật (không phải write pending của mình)
      if (snap.metadata.hasPendingWrites) return;

      const data = snap.data();

      // So sánh updatedAt để tránh áp lại đúng data mình vừa push
      const newTs = data.updatedAt?.seconds;
      if (this._lastServerTs && newTs === this._lastServerTs) return;
      this._lastServerTs = newTs;

      this._applyToLocal(data);
      this._updateStatus('synced');
      this._rerender();
    }, (err) => {
      if (err.code === 'unavailable') {
        this._updateStatus('offline');
      } else {
        console.error("Listener lỗi:", err);
        this._updateStatus('error');
      }
    });
  },

  stopListening() {
    if (this._unsubSnapshot) {
      this._unsubSnapshot();
      this._unsubSnapshot = null;
    }
    clearTimeout(this._saveTimer);
  },

  // ── Pull: kéo data từ Firestore về, rồi bắt đầu real-time listener ───────
  async pull() {
    const ref  = this._userDocRef();
    const user = auth.currentUser;
    if (!ref || !user) return false;

    // Dừng listener cũ trước khi pull để tránh race condition với cache snapshot
    this.stopListening();
    this._isPulling = true;

    // Kiểm tra data local thuộc tài khoản nào
    const ownerUid            = localStorage.getItem('vocalearn_owner_uid');
    const localBelongsToOther = ownerUid && ownerUid !== user.uid;

    if (localBelongsToOther) this._clearLocal();
    localStorage.setItem('vocalearn_owner_uid', user.uid);

    let success = false;
    try {
      this._updateStatus('syncing');
      const snap = await getDoc(ref);

      if (!snap.exists()) {
        if (localBelongsToOther) {
          // Tài khoản mới, local vừa xóa → tạo document trống
          await setDoc(ref, {
            sets: [], progress: {}, stats: { daily: {}, sessions: [] },
            streak: { count: 0, lastDate: null }, trash: [],
            username: '', chatSessions: [], geminiKey: '',
            updatedAt: serverTimestamp(), version: 3
          });
        } else {
          // Tài khoản mới, local là của họ → push lên
          await this.push();
        }
      } else {
        const data = snap.data();
        this._lastServerTs = data.updatedAt?.seconds;
        this._applyToLocal(data);
      }

      this._updateStatus('synced');
      success = true;
      return true;
    } catch (e) {
      console.error("Lỗi pull:", e);
      this._updateStatus('offline');
      success = true; // vẫn mở app được nhờ cache
      return true;
    } finally {
      // Phải set _isPulling = false TRƯỚC khi startListening
      // để listener không bị block ngay lúc khởi tạo
      this._isPulling = false;
      if (success) {
        // Delay nhỏ để tránh snapshot cache từ IndexedDB ghi đè data vừa pull
        setTimeout(() => this.startListening(), 300);
      }
    }
  },

  // ── Push: đẩy data local lên Firestore ───────────────────────────────────
  async push() {
    const ref = this._userDocRef();
    if (!ref || this._isSyncing) return false;
    this._isSyncing = true;
    try {
      this._updateStatus('syncing');
      const data = {
        sets:         Storage.getSets(),
        progress:     Storage.getProgress(),
        stats:        Storage.getStats(),
        streak:       Storage.getStreak(),
        trash:        Trash.getAll(),
        username:     localStorage.getItem('vocalearn_username')               || '',
        chatSessions: JSON.parse(localStorage.getItem('vocalearn_chat_sessions') || '[]'),
        geminiKey:    localStorage.getItem('vocalearn_gemini_key')             || '',
        updatedAt:    serverTimestamp(),
        version:      3
      };
      await setDoc(ref, data, { merge: true });
      this._lastServerTs = null; // reset để listener nhận lại đúng
      this._updateStatus('synced');
      return true;
    } catch (e) {
      console.error("Lỗi push:", e);
      this._updateStatus('offline');
      return false;
    } finally {
      this._isSyncing = false;
    }
  },

  // ── Debounce push sau mỗi thay đổi ───────────────────────────────────────
  triggerSave() {
    if (!auth.currentUser) return;
    this._updateStatus('pending');
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this.push(), 2000);
  },

  // ── Cập nhật trạng thái sync trên UI ─────────────────────────────────────
  _updateStatus(state) {
    const el = document.getElementById('autosaveStatus');
    if (!el) return;
    const map = {
      off:     { icon: '☁️', text: 'Chưa đăng nhập',              cls: '' },
      offline: { icon: '📴', text: 'Offline — sync khi có mạng',  cls: 'autosave-pending' },
      pending: { icon: '⏳', text: 'Đang chờ đồng bộ...',         cls: 'autosave-pending' },
      syncing: { icon: '🔄', text: 'Đang đồng bộ...',             cls: 'autosave-pending' },
      synced:  { icon: '✅', text: 'Đã đồng bộ Firebase',         cls: 'autosave-ok'      },
      error:   { icon: '❌', text: 'Lỗi đồng bộ',                 cls: 'autosave-err'     }
    };
    const s = map[state] || map.off;
    el.innerHTML = `<span>${s.icon}</span><span>${s.text}</span>`;
    el.className = 'autosave-status ' + s.cls;
  }
};

// ===== PATCH Storage & Trash để tự động triggerSave =====
window.FirebaseAuth = FirebaseAuth;
window.FirebaseSync = FirebaseSync;

const _origSaveSets     = Storage.saveSets.bind(Storage);
const _origSaveProgress = Storage.saveProgress.bind(Storage);
const _origSaveStats    = Storage.saveStats.bind(Storage);
const _origSaveStreak   = Storage.saveStreak.bind(Storage);
const _origTrashSave    = Trash._save.bind(Trash);

Storage.saveSets     = (v) => { _origSaveSets(v);     FirebaseSync.triggerSave(); };
Storage.saveProgress = (v) => { _origSaveProgress(v); FirebaseSync.triggerSave(); };
Storage.saveStats    = (v) => { _origSaveStats(v);    FirebaseSync.triggerSave(); };
Storage.saveStreak   = (v) => { _origSaveStreak(v);   FirebaseSync.triggerSave(); };
Trash._save          = (v) => { _origTrashSave(v);    FirebaseSync.triggerSave(); };

// Gọi setupFirebaseUI sau khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setupFirebaseUI());
} else {
  setupFirebaseUI();
}