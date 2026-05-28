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
  doc, getDoc, getDocFromServer, setDoc, onSnapshot, serverTimestamp
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
  _saveTimer:        null,
  _isSyncing:        false,
  _isPulling:        false,
  _unsubSnapshot:    null,
  _lastServerData:   null,
  _lastServerTs:     null,
  _needsPushOnLogin: false, // flag: lần đầu đăng nhập trên thiết bị → phải push local lên
  _isOnline:         navigator.onLine,

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

      // Bỏ qua data từ cache local khi đang online
      // (tránh áp dữ liệu cũ từ IndexedDB lên sau khi đã pull xong)
      if (snap.metadata.fromCache && this._isOnline) return;

      // Chỉ xử lý data đến từ server thật (không phải write pending của mình)
      if (snap.metadata.hasPendingWrites) return;

      const data = snap.data();

      // So sánh updatedAt để tránh áp lại đúng data mình vừa push
      const newTs = data.updatedAt?.seconds;
      if (this._lastServerTs && newTs && newTs <= this._lastServerTs) return;
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

    this.stopListening();
    this._isPulling = true;

    const ownerUid            = localStorage.getItem('vocalearn_owner_uid');
    const isFirstLoginOnDevice = !ownerUid;          // chưa từng đăng nhập trên thiết bị này
    const localBelongsToOther  = !!(ownerUid && ownerUid !== user.uid);

    // Đặt flag TRƯỚC khi đặt ownerUid, để lần pull() thứ 2 (do onAuthStateChanged fire 2 lần)
    // vẫn biết phải push local chứ không pull về ghi đè
    if (isFirstLoginOnDevice) this._needsPushOnLogin = true;
    if (localBelongsToOther)  { this._clearLocal(); this._needsPushOnLogin = false; }

    localStorage.setItem('vocalearn_owner_uid', user.uid);

    try {
      this._updateStatus('syncing');
      const snap = await getDocFromServer(ref);

      if (this._needsPushOnLogin) {
        // Lần đầu đăng nhập trên thiết bị này (offline-first hoặc thiết bị mới):
        // ƯU TIÊN data local, push lên Firebase.
        // Nếu Firebase đã có data từ thiết bị khác → merge rồi mới push.
        if (snap.exists()) {
          const srv     = snap.data();
          const srvSets = srv.sets || [];
          const locSets = Storage.getSets();
          const locIds  = new Set(locSets.map(s => s.id));

          // Giữ tất cả sets. Nếu trùng id, local thắng (mới hơn).
          const merged = [...locSets, ...srvSets.filter(s => !locIds.has(s.id))];
          // Progress: merge cả 2, local thắng khi trùng key
          const mergedProg = Object.assign({}, srv.progress || {}, Storage.getProgress());
          // Stats: giữ local (mới nhất)
          // Streak: giữ local nếu count cao hơn, ngược lại giữ server
          const locStreak = Storage.getStreak();
          const srvStreak = srv.streak || { count: 0, lastDate: null };
          const mergedStreak = (locStreak.count >= srvStreak.count) ? locStreak : srvStreak;

          localStorage.setItem('vocalearn_sets',     JSON.stringify(merged));
          localStorage.setItem('vocalearn_progress', JSON.stringify(mergedProg));
          localStorage.setItem('vocalearn_streak',   JSON.stringify(mergedStreak));
          this._lastServerTs = srv.updatedAt?.seconds;
        }
        // Push local (sau khi đã merge nếu cần) lên Firebase
        await this.push();
        this._needsPushOnLogin = false; // đã push xong, reset flag

      } else if (!snap.exists()) {
        // Đã từng login trên thiết bị này, nhưng document không tồn tại
        await this.push();
      } else {
        // Trường hợp bình thường: pull data mới nhất từ Firebase về
        const data = snap.data();
        this._lastServerTs = data.updatedAt?.seconds;
        this._applyToLocal(data);
      }

      this._updateStatus('synced');
      return true;
    } catch (e) {
      console.error('Lỗi pull:', e);
      this._updateStatus('offline');
      return true;
    } finally {
      this._isPulling = false;
      setTimeout(() => this.startListening(), 100);
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
      // KHÔNG reset _lastServerTs về null — listener sẽ so sánh đúng timestamp từ server
      // để tránh áp lại data mình vừa push (gây hiển thị dữ liệu cũ)
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
    // Khi offline, Firestore SDK tự giữ write trong queue → vẫn gọi push()
    // SDK sẽ tự thực thi khi có lại mạng
    this._updateStatus(this._isOnline ? 'pending' : 'offline');
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

// ===== NETWORK RECONNECT: auto pull + restart listener khi có lại mạng =====
window.addEventListener('online', async () => {
  console.log('[VocaLearn] Network online — đồng bộ lại...');
  FirebaseSync._isOnline = true;
  FirebaseSync._updateStatus('syncing');

  if (!auth.currentUser) return;

  // Pull data mới nhất từ server, sau đó startListening() sẽ được gọi bên trong pull()
  const ok = await FirebaseSync.pull();
  if (ok) {
    if (typeof renderHome       === 'function') renderHome();
    if (typeof updateStreak     === 'function') updateStreak();
    if (typeof updateTrashBadge === 'function') updateTrashBadge();
  }
});

window.addEventListener('offline', () => {
  console.log('[VocaLearn] Network offline.');
  FirebaseSync._isOnline = false;
  FirebaseSync._updateStatus('offline');
  // Không stopListening() — Firestore SDK tự xử lý offline queue
  // Listener sẽ tự reconnect khi online trở lại
});

// Gọi setupFirebaseUI sau khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setupFirebaseUI());
} else {
  setupFirebaseUI();
}