// ===== STORAGE MODULE =====

// Helper: lấy ngày local dạng YYYY-MM-DD (không dùng toISOString vì đó là UTC)
function getLocalDateStr(date) {
  const d = date || new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const Storage = {
  KEY_SETS: 'vocalearn_sets',
  KEY_PROGRESS: 'vocalearn_progress',
  KEY_STATS: 'vocalearn_stats',
  KEY_STREAK: 'vocalearn_streak',

  getSets() {
    try { return JSON.parse(localStorage.getItem(this.KEY_SETS)) || []; }
    catch { return []; }
  },
  saveSets(sets) {
    localStorage.setItem(this.KEY_SETS, JSON.stringify(sets));
    if (typeof AutoSave !== 'undefined') AutoSave.triggerSave();
  },
  getProgress() {
    try { return JSON.parse(localStorage.getItem(this.KEY_PROGRESS)) || {}; }
    catch { return {}; }
  },
  saveProgress(prog) {
    localStorage.setItem(this.KEY_PROGRESS, JSON.stringify(prog));
    if (typeof AutoSave !== 'undefined') AutoSave.triggerSave();
  },
  getStats() {
    try { return JSON.parse(localStorage.getItem(this.KEY_STATS)) || { daily: {}, sessions: [] }; }
    catch { return { daily: {}, sessions: [] }; }
  },
  saveStats(stats) {
    localStorage.setItem(this.KEY_STATS, JSON.stringify(stats));
    if (typeof AutoSave !== 'undefined') AutoSave.triggerSave();
  },
  getStreak() {
    try { return JSON.parse(localStorage.getItem(this.KEY_STREAK)) || { count: 0, lastDate: null }; }
    catch { return { count: 0, lastDate: null }; }
  },
  saveStreak(s) {
    localStorage.setItem(this.KEY_STREAK, JSON.stringify(s));
    if (typeof AutoSave !== 'undefined') AutoSave.triggerSave();
  },
  recordStudyToday(cardIds) {
    const stats = this.getStats();
    const today = getLocalDateStr();

    // cardIds có thể là mảng ID hoặc số nguyên (legacy). Chuẩn hoá thành mảng.
    const ids = Array.isArray(cardIds) ? cardIds : [];
    const legacyCount = typeof cardIds === 'number' ? cardIds : 0;

    if (ids.length > 0) {
      // Gộp unique IDs học trong ngày
      if (!stats.dailyCards) stats.dailyCards = {};
      const existing = new Set(stats.dailyCards[today] || []);
      ids.forEach(id => existing.add(id));
      stats.dailyCards[today] = [...existing];
      stats.daily[today] = existing.size;
    } else if (legacyCount > 0) {
      // Fallback: không có IDs thì cộng dồn như cũ (tránh mất dữ liệu cũ)
      stats.daily[today] = (stats.daily[today] || 0) + legacyCount;
    }

    this.saveStats(stats);

    // Update streak — dùng local date
    const streak = this.getStreak();
    const yesterday = getLocalDateStr(new Date(Date.now() - 86400000));
    if (streak.lastDate === today) {
      // Đã tính hôm nay rồi, bỏ qua
    } else if (streak.lastDate === yesterday) {
      streak.count++;
      streak.lastDate = today;
    } else {
      // Bỏ lỡ ngày hoặc mới bắt đầu
      streak.count = 1;
      streak.lastDate = today;
    }
    this.saveStreak(streak);
  },
  getTodayStudied() {
    const stats = this.getStats();
    const today = getLocalDateStr();
    return stats.daily[today] || 0;
  },
  getLast7Days() {
    return this.getLastNDays(7);
  },

  getLastNDays(n) {
    const stats = this.getStats();
    const result = [];
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = getLocalDateStr(d);
      result.push({ date: key, count: stats.daily[key] || 0 });
    }
    return result;
  },

  // Trả về dữ liệu theo từng ngày trong tháng year-month (0-indexed)
  getMonthData(year, month) {
    const stats = this.getStats();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      result.push({ date: key, day: d, count: stats.daily[key] || 0 });
    }
    return result;
  },

  // Danh sách các tháng có dữ liệu (không rỗng), trả về [{year, month, label}]
  getAvailableMonths() {
    const stats = this.getStats();
    const set = new Set();
    Object.keys(stats.daily).forEach(key => {
      const [y, m] = key.split('-');
      set.add(`${y}-${m}`);
    });
    // Luôn có tháng hiện tại
    const now = new Date();
    set.add(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
    const months = [...set].sort().reverse().slice(0, 12); // 12 tháng gần nhất
    return months.map(s => {
      const [y, m] = s.split('-').map(Number);
      const names = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                     'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
      return { year: y, month: m - 1, label: `${names[m - 1]} ${y}` };
    });
  }
};

// ===== TRASH MODULE =====
const Trash = {
  KEY: 'vocalearn_trash',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },

  _save(items) {
    localStorage.setItem(this.KEY, JSON.stringify(items));
    if (typeof AutoSave !== 'undefined') AutoSave.triggerSave();
  },

  // Chuyển bộ thẻ vào thùng rác
  moveToTrash(set) {
    const items = this.getAll();
    items.unshift({ ...set, _deletedAt: new Date().toISOString() });
    this._save(items);
  },

  // Khôi phục bộ thẻ
  restore(setId) {
    const items = this.getAll();
    const idx = items.findIndex(s => s.id === setId);
    if (idx === -1) return null;
    const [set] = items.splice(idx, 1);
    this._save(items);
    delete set._deletedAt;
    return set;
  },

  // Xóa vĩnh viễn 1 bộ thẻ
  deletePermanently(setId) {
    const items = this.getAll().filter(s => s.id !== setId);
    this._save(items);
  },

  // Xóa toàn bộ thùng rác
  emptyAll() {
    this._save([]);
  },

  count() {
    return this.getAll().length;
  }
};

// ===== AUTO-SAVE TO FILE (File System Access API) =====
const AutoSave = {
  _fileHandle: null,      // FileSystemFileHandle được chọn
  _saveTimer: null,       // debounce timer
  _supported: typeof window !== 'undefined' && 'showSaveFilePicker' in window,
  _KEY_AUTOSAVE: 'vocalearn_autosave_enabled',

  isSupported() {
    return 'showSaveFilePicker' in window;
  },

  isEnabled() {
    return !!this._fileHandle;
  },

  // Người dùng chọn file lưu (gọi 1 lần)
  async setupFile() {
    if (!this.isSupported()) return false;
    try {
      this._fileHandle = await window.showSaveFilePicker({
        suggestedName: 'vocalearn_data.json',
        types: [{ description: 'VocaLearn Data', accept: { 'application/json': ['.json'] } }]
      });
      localStorage.setItem(this._KEY_AUTOSAVE, '1');
      await this._writeNow(); // lưu ngay lập tức
      return true;
    } catch (e) {
      return false; // user cancelled
    }
  },

  // Ghi dữ liệu ngay
  async _writeNow() {
    if (!this._fileHandle) return;
    try {
      const data = {
        version: 1,
        savedAt: new Date().toISOString(),
        sets: Storage.getSets(),
        trash: Trash.getAll(),
        progress: Storage.getProgress(),
        stats: Storage.getStats(),
        streak: Storage.getStreak(),
        username: localStorage.getItem('vocalearn_username') || '',
        chatSessions: JSON.parse(localStorage.getItem('vocalearn_chat_sessions') || '[]')
      };
      const writable = await this._fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();
      AutoSave._updateStatusUI('saved');
    } catch (e) {
      console.warn('AutoSave write failed:', e);
      AutoSave._updateStatusUI('error');
    }
  },

  // Gọi sau mỗi thay đổi — debounce 1.5s để không ghi liên tục
  triggerSave() {
    if (!this._fileHandle) return;
    AutoSave._updateStatusUI('pending');
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => AutoSave._writeNow(), 1500);
  },

  // Tắt auto-save
  disable() {
    this._fileHandle = null;
    localStorage.removeItem(this._KEY_AUTOSAVE);
    clearTimeout(this._saveTimer);
    AutoSave._updateStatusUI('off');
  },

  _updateStatusUI(state) {
    const el = document.getElementById('autosaveStatus');
    if (!el) return;
    const map = {
      off:     { icon: '💾', text: 'Chưa bật tự động lưu', cls: '' },
      pending: { icon: '⏳', text: 'Đang chờ lưu...', cls: 'autosave-pending' },
      saved:   { icon: '✅', text: 'Đã lưu vào ổ cứng', cls: 'autosave-ok' },
      error:   { icon: '❌', text: 'Lưu thất bại', cls: 'autosave-err' }
    };
    const s = map[state] || map.off;
    el.innerHTML = `<span>${s.icon}</span><span>${s.text}</span>`;
    el.className = 'autosave-status ' + s.cls;
  }
};
