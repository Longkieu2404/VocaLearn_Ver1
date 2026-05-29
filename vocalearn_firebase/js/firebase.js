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
  doc, getDoc, getDocFromServer, setDoc, onSnapshot, serverTimestamp,
  enableNetwork, disableNetwork
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
  _lastServerTs:     null,
  _needsPushOnLogin: false,
  _isOnline:         navigator.onLine,
  // [FIX] Track xem có thay đổi offline chưa được sync lên không
  _hasPendingOfflineWrites: false,

  _userDocRef() {
    const user = auth.currentUser;
    if (!user) return null;
    return doc(db, "users", user.uid);
  },

  // ── Ghi data từ Firestore vào localStorage (không qua Storage wrapper) ────
  _applyToLocal(data) {
    if (data.sets         !== undefined) localStorage.setItem('vocalearn_sets',           JSON.stringify(data.sets));
    if (data.progress     !== undefined) localStorage.setItem('vocalearn_progress',       JSON.stringify(data.progress));
    if (data.stats        !== undefined) {
      // Merge stats.daily VÀ stats.dailyCards: giữ lại dữ liệu local, không để server ghi đè
      try {
        const localStats  = JSON.parse(localStorage.getItem('vocalearn_stats')) || { daily: {}, dailyCards: {}, sessions: [] };
        const serverStats = data.stats;
        // Merge daily counts (local thắng nếu cùng ngày)
        const mergedDaily = Object.assign({}, serverStats.daily || {}, localStats.daily || {});
        // Merge dailyCards (ID arrays): gộp union của cả 2 phía cho mỗi ngày
        const mergedDailyCards = Object.assign({}, serverStats.dailyCards || {});
        const localDailyCards = localStats.dailyCards || {};
        Object.keys(localDailyCards).forEach(date => {
          const srvIds = new Set(mergedDailyCards[date] || []);
          (localDailyCards[date] || []).forEach(id => srvIds.add(id));
          mergedDailyCards[date] = [...srvIds];
          // Đảm bảo daily count khớp với số ID thực tế
          mergedDaily[date] = mergedDailyCards[date].length;
        });
        const mergedStats = { ...serverStats, daily: mergedDaily, dailyCards: mergedDailyCards };
        localStorage.setItem('vocalearn_stats', JSON.stringify(mergedStats));
      } catch { localStorage.setItem('vocalearn_stats', JSON.stringify(data.stats)); }
    }
    if (data.streak       !== undefined) {
      // Merge streak: so sánh lastDate, count, VÀ rebuild từ stats.daily để phục hồi streak bị mất
      try {
        const localStreak  = JSON.parse(localStorage.getItem('vocalearn_streak')) || { count: 0, lastDate: null };
        const serverStreak = data.streak;
        // So sánh theo lastDate trước (ngày gần hơn = đáng tin hơn), rồi mới theo count
        const locDate = localStreak.lastDate || '';
        const srvDate = serverStreak.lastDate || '';
        let best;
        if (locDate > srvDate) best = localStreak;
        else if (srvDate > locDate) best = serverStreak;
        else best = (localStreak.count >= serverStreak.count) ? localStreak : serverStreak;
        // Rebuild streak từ stats.daily để phục hồi trường hợp streak bị reset sai
        const mergedStatsRaw = localStorage.getItem('vocalearn_stats');
        if (mergedStatsRaw) {
          try {
            const daily = JSON.parse(mergedStatsRaw).daily || {};
            const rebuilt = FirebaseSync._rebuildStreak(daily);
            if (rebuilt.count > best.count) best = rebuilt;
          } catch {}
        }
        localStorage.setItem('vocalearn_streak', JSON.stringify(best));
      } catch { localStorage.setItem('vocalearn_streak', JSON.stringify(data.streak)); }
    }
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

  // Rebuild streak bằng cách đếm ngày liên tiếp có dữ liệu trong stats.daily
  _rebuildStreak(daily) {
    const toStr = (d) => {
      return d.getFullYear() + '-' +
        String(d.getMonth()+1).padStart(2,'0') + '-' +
        String(d.getDate()).padStart(2,'0');
    };
    // Thử đếm từ hôm nay
    let d = new Date(); let count = 0;
    while (daily[toStr(d)] > 0) { count++; d.setDate(d.getDate()-1); }
    if (count > 0) return { count, lastDate: toStr(new Date()) };
    // Nếu hôm nay chưa học, thử từ hôm qua (streak vẫn hợp lệ)
    d = new Date(); d.setDate(d.getDate()-1);
    while (daily[toStr(d)] > 0) { count++; d.setDate(d.getDate()-1); }
    const lastDate = count > 0 ? toStr(new Date(Date.now() - 86400000)) : null;
    return { count, lastDate };
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

      // [FIX] Nếu có pending offline writes chưa push xong → KHÔNG áp data từ server
      // vì data server lúc này vẫn là phiên bản cũ (trước khi offline)
      if (this._hasPendingOfflineWrites) return;

      // Bỏ qua data từ cache local khi đang online
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
    const isFirstLoginOnDevice = !ownerUid;
    const localBelongsToOther  = !!(ownerUid && ownerUid !== user.uid);

    if (isFirstLoginOnDevice) this._needsPushOnLogin = true;
    if (localBelongsToOther)  { this._clearLocal(); this._needsPushOnLogin = false; }

    localStorage.setItem('vocalearn_owner_uid', user.uid);

    try {
      this._updateStatus('syncing');
      const snap = await getDocFromServer(ref);

      if (this._needsPushOnLogin) {
        // Lần đầu đăng nhập trên thiết bị này: ưu tiên local, merge rồi push
        if (snap.exists()) {
          const srv     = snap.data();
          const srvSets = srv.sets || [];
          const locSets = Storage.getSets();
          const locIds  = new Set(locSets.map(s => s.id));

          const merged = [...locSets, ...srvSets.filter(s => !locIds.has(s.id))];
          const mergedProg = Object.assign({}, srv.progress || {}, Storage.getProgress());
          const locStreak = Storage.getStreak();
          const srvStreak = srv.streak || { count: 0, lastDate: null };
          const locDate2 = locStreak.lastDate || '';
          const srvDate2 = srvStreak.lastDate || '';
          let mergedStreak;
          if (locDate2 > srvDate2) mergedStreak = locStreak;
          else if (srvDate2 > locDate2) mergedStreak = srvStreak;
          else mergedStreak = (locStreak.count >= srvStreak.count) ? locStreak : srvStreak;
          // Rebuild từ stats để phục hồi streak bị reset sai
          const rebuiltOnLogin = FirebaseSync._rebuildStreak(mergedStats.daily || {});
          if (rebuiltOnLogin.count > mergedStreak.count) mergedStreak = rebuiltOnLogin;
          // Merge stats.daily VÀ dailyCards: gộp dữ liệu cả 2 phía, local thắng nếu trùng ngày
          const locStats = Storage.getStats();
          const srvStats = srv.stats || { daily: {}, dailyCards: {}, sessions: [] };
          const mergedDaily = Object.assign({}, srvStats.daily || {}, locStats.daily || {});
          const mergedDailyCards2 = Object.assign({}, srvStats.dailyCards || {});
          const locDailyCards = locStats.dailyCards || {};
          Object.keys(locDailyCards).forEach(date => {
            const srvIds = new Set(mergedDailyCards2[date] || []);
            (locDailyCards[date] || []).forEach(id => srvIds.add(id));
            mergedDailyCards2[date] = [...srvIds];
            mergedDaily[date] = mergedDailyCards2[date].length;
          });
          const mergedStats = { ...srvStats, daily: mergedDaily, dailyCards: mergedDailyCards2 };

          localStorage.setItem('vocalearn_sets',     JSON.stringify(merged));
          localStorage.setItem('vocalearn_progress', JSON.stringify(mergedProg));
          localStorage.setItem('vocalearn_streak',   JSON.stringify(mergedStreak));
          localStorage.setItem('vocalearn_stats',    JSON.stringify(mergedStats));
          this._lastServerTs = srv.updatedAt?.seconds;
        }
        await this.push();
        this._needsPushOnLogin = false;

      } else if (!snap.exists()) {
        // Document chưa tồn tại → push local lên
        await this.push();

      } else if (this._hasPendingOfflineWrites) {
        // [FIX] Có thay đổi offline chưa sync → PUSH local lên, không pull về
        // Đây là trường hợp: đang offline → thay đổi dữ liệu → có mạng trở lại
        console.log('[VocaLearn] Có pending offline writes → push local lên Firebase');
        await this.push();
        // push() sẽ reset _hasPendingOfflineWrites về false

      } else {
        // Trường hợp bình thường (không có thay đổi offline):
        // pull data mới nhất từ Firebase về
        const data = snap.data();
        this._lastServerTs = data.updatedAt?.seconds;
        this._applyToLocal(data);
      }

      // Sau khi data Firebase đã load xong, kiểm tra streak expiry với data chính xác
      if (typeof checkStreakExpiry === 'function') {
        // Tạm thời cho phép reset (bỏ qua guard Firebase mode) bằng cách dùng flag
        window._firebaseDataLoaded = true;
        checkStreakExpiry();
        window._firebaseDataLoaded = false;
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
      // [FIX] Push thành công → reset flag pending offline writes
      this._hasPendingOfflineWrites = false;
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

    // [FIX] Đánh dấu có pending write ngay khi người dùng thay đổi dữ liệu.
    // Flag này sẽ bảo vệ dữ liệu offline: khi có mạng trở lại, pull() sẽ
    // PUSH local lên thay vì ghi đè bằng data cũ từ Firebase.
    this._hasPendingOfflineWrites = true;

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

// ===== NETWORK RECONNECT: auto push offline data trước, rồi mới startListening =====
window.addEventListener('online', async () => {
  console.log('[VocaLearn] Network online — đồng bộ lại...');
  FirebaseSync._isOnline = true;
  FirebaseSync._updateStatus('syncing');

  if (!auth.currentUser) return;

  // [FIX] Nếu có pending offline writes → push ngay lập tức (không qua debounce)
  // trước khi pull() để đảm bảo data local được lưu lên Firebase
  if (FirebaseSync._hasPendingOfflineWrites) {
    console.log('[VocaLearn] Pushing offline changes to Firebase...');
    await FirebaseSync.push();
  }

  // Sau khi push xong (hoặc không có pending writes), pull() sẽ xử lý đúng
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
});

// Gọi setupFirebaseUI sau khi DOM sẵn sàng
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setupFirebaseUI());
} else {
  setupFirebaseUI();
}