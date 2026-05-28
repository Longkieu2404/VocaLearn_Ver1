// ===== VOCALEARN MAIN APP =====

// ---- STATE ----
let currentPage = 'home';
let editingSetId = null;
let selectedColorIndex = 0;
let studySetId = null;
let studyQueue = [];
let studyIndex = 0;
let studyFlipped = false;
let studyResults = { easy: 0, ok: 0, hard: 0 };
let quizSetId = null;
let quizCards = [];
let quizIndex = 0;
let quizCorrect = 0;
let quizWrong = 0;
let quizResultMap = {};
let quizMode = 'multiple'; // 'multiple' | 'essay'
let quizEssayDirection = 'en2vi'; // 'en2vi' | 'vi2en'
let detailSetId = null;

const COLOR_GRADIENTS = [
  'linear-gradient(90deg,#ff6b6b,#ffd166)',
  'linear-gradient(90deg,#06d6a0,#4cc9f0)',
  'linear-gradient(90deg,#c77dff,#f72585)',
  'linear-gradient(90deg,#ffd166,#06d6a0)',
  'linear-gradient(90deg,#4cc9f0,#c77dff)',
];

// ===== THEME SYSTEM =====
const THEME_KEY = 'vocalearn_theme';

function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved, false);
}

function applyTheme(theme, save = true) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  // Update segmented toggle active state
  const optDark = document.getElementById('themeOptDark');
  const optLight = document.getElementById('themeOptLight');
  if (optDark && optLight) {
    optDark.classList.toggle('active', theme === 'dark');
    optLight.classList.toggle('active', theme === 'light');
  }
  if (save) localStorage.setItem(THEME_KEY, theme);
}

function toggleTheme() {
  const current = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(current === 'dark' ? 'light' : 'dark');
}

function setupThemeToggle() {
  const btn = document.getElementById('themeToggleBtn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    // Allow clicking specific options or the whole button
    const optLight = e.target.closest('.t-light');
    const optDark = e.target.closest('.t-dark');
    if (optLight) { applyTheme('light'); return; }
    if (optDark) { applyTheme('dark'); return; }
    toggleTheme();
  });
}

// Apply theme immediately to avoid flash of dark on light mode
initTheme();

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  checkStreakExpiry();
  setupNav();
  setupColorPicker();
  setupMobileMenu();
  setupThemeToggle();
  renderHome();
  updateStreak();
  setupAutoSaveUI();
  updateTrashBadge();
  setupLoginScreen();
});

// ===== LOGIN SCREEN =====
function setupLoginScreen() {
  const screen = document.getElementById('loginScreen');
  if (!screen) return;

  // Nếu đã chọn offline trước đó → bỏ qua màn login
  if (localStorage.getItem('vocalearn_auth_mode') === 'offline') {
    screen.classList.add('hide');
    setTimeout(() => screen.remove(), 400);
    return;
  }

  // Nút offline
  const btnOffline = document.getElementById('btnLoginOffline');
  if (btnOffline) {
    btnOffline.addEventListener('click', () => {
      localStorage.setItem('vocalearn_auth_mode', 'offline');
      hideLoginScreen();
    });
  }

  // Nút Google (hook sau khi firebase.js export FirebaseAuth)
  const btnGoogle = document.getElementById('btnLoginGoogle');
  if (btnGoogle) {
    btnGoogle.addEventListener('click', async () => {
      if (!window.FirebaseAuth) return;
      btnGoogle.disabled = true;
      btnGoogle.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:20px;height:20px;vertical-align:middle;margin-right:8px" /> ⏳ Đang đăng nhập...';
      const user = await window.FirebaseAuth.signIn();
      if (!user) {
        btnGoogle.disabled = false;
        btnGoogle.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:20px;height:20px;vertical-align:middle;margin-right:8px" /> Đăng nhập bằng Google';
        showNotif('Đăng nhập thất bại hoặc bị huỷ.', '❌');
      }
      // Nếu thành công, onAuthStateChanged trong firebase.js sẽ gọi hideLoginScreen()
    });
  }
}

function hideLoginScreen() {
  const screen = document.getElementById('loginScreen');
  if (!screen) return;
  screen.classList.add('hide');
  setTimeout(() => screen.remove(), 400);
}

function showLoginScreen() {
  if (document.getElementById('loginScreen')) return;
  const div = document.createElement('div');
  div.id = 'loginScreen';
  div.className = 'login-screen';
  div.innerHTML = `
    <div class="login-card">
      <div class="login-logo">
        <span class="login-logo-icon">⚡</span>
        <span class="login-logo-text">VocaLearn</span>
      </div>
      <p class="login-tagline">Học từ vựng thông minh — mọi lúc, mọi nơi</p>
      <div class="login-divider"><span>Chào mừng bạn</span></div>
      <button class="btn-login-google" id="btnLoginGoogle2">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
        Đăng nhập bằng Google
      </button>
      <div class="login-or"><span>hoặc</span></div>
      <button class="btn-login-offline" id="btnLoginOffline2">
        🖥️ Dùng offline (không đồng bộ)
      </button>
      <p class="login-note">
        Đăng nhập để đồng bộ dữ liệu trên nhiều thiết bị.<br>
        Dùng offline sẽ lưu dữ liệu trên máy này.
      </p>
    </div>`;
  document.body.appendChild(div);

  div.querySelector('#btnLoginOffline2').addEventListener('click', () => {
    localStorage.setItem('vocalearn_auth_mode', 'offline');
    hideLoginScreen();
  });

  const btnGoogle2 = div.querySelector('#btnLoginGoogle2');
  btnGoogle2.addEventListener('click', async () => {
    if (!window.FirebaseAuth) return;
    btnGoogle2.disabled = true;
    btnGoogle2.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:20px;height:20px;vertical-align:middle;margin-right:8px" /> ⏳ Đang đăng nhập...';
    const user = await window.FirebaseAuth.signIn();
    if (!user) {
      btnGoogle2.disabled = false;
      btnGoogle2.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:20px;height:20px;vertical-align:middle;margin-right:8px" /> Đăng nhập bằng Google';
      showNotif('Đăng nhập thất bại hoặc bị huỷ.', '❌');
    }
  });
}

// ===== MODAL KẾT QUẢ CHUNG =====
function showResultModal({ correct, wrong, wrongCards = [], onAgain, onHome, title = 'Kết quả kiểm tra' }) {
  const total = correct + wrong;
  const pct = total > 0 ? Math.round(correct / total * 100) : 0;
  const icon = pct >= 80 ? '🏆' : pct >= 60 ? '😊' : '📚';

  document.getElementById('resultIcon').textContent = icon;
  document.getElementById('resultTitle').textContent = title;
  document.getElementById('resultScore').textContent = `${pct}%`;
  document.getElementById('resultCorrect').textContent = correct;
  document.getElementById('resultWrong').textContent = wrong;

  // Danh sách từ sai
  const wrongList = document.getElementById('resultWrongList');
  if (wrongCards.length > 0) {
    wrongList.classList.add('show');
    wrongList.innerHTML = `<div class="mixed-wrong-title">❌ Từ trả lời sai (${wrongCards.length})</div>` +
      wrongCards.map(c => `<div class="mixed-wrong-item"><span class="mwi-word">${c.word}</span><span class="mwi-meaning">${c.meaning}</span></div>`).join('');
  } else {
    wrongList.classList.remove('show');
    wrongList.innerHTML = '';
  }

  // Ẩn nút Làm lại nếu không có callback
  const btnAgain = document.getElementById('resultBtnAgain');
  btnAgain.style.display = onAgain ? '' : 'none';
  btnAgain.onclick = () => { closeResultModal(); onAgain && onAgain(); };
  document.getElementById('resultBtnHome').onclick = () => { closeResultModal(); onHome && onHome(); };

  document.getElementById('modalResult').classList.add('open');
  setTimeout(() => pct >= 60 ? AudioFX.completedPass() : AudioFX.completedFail(), 300);
}

function closeResultModal() {
  document.getElementById('modalResult').classList.remove('open');
}
function showNotif(msg, icon = '💬', buttons = [{ label: 'OK', primary: true }]) {
  return new Promise(resolve => {
    document.getElementById('notifIcon').textContent = icon;
    document.getElementById('notifMsg').innerHTML = msg;
    const actions = document.getElementById('notifActions');
    actions.innerHTML = '';
    buttons.forEach(b => {
      const btn = document.createElement('button');
      btn.className = b.primary ? 'btn-primary' : 'btn-ghost';
      btn.textContent = b.label;
      btn.onclick = () => {
        document.getElementById('notifOverlay').classList.remove('show');
        resolve(b.value ?? b.label);
      };
      actions.appendChild(btn);
    });
    document.getElementById('notifOverlay').classList.add('show');
  });
}

function showConfirm(msg, icon = '❓') {
  return showNotif(msg, icon, [
    { label: 'Hủy', primary: false, value: false },
    { label: 'Đồng ý', primary: true, value: true }
  ]);
}

// ---- NAVIGATION ----
function setupNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      const page = el.dataset.page;
      navigateTo(page);
      // close mobile sidebar
      document.getElementById('sidebar').classList.remove('open');
      document.getElementById('sidebarBackdrop').classList.remove('show');
      document.body.classList.remove('sidebar-open');
    });
  });
  document.getElementById('fabCreate').addEventListener('click', openCreateModal);
  document.getElementById('btnCreateSet').addEventListener('click', openCreateModal);
  document.getElementById('btnSaveSet').addEventListener('click', saveSet);
  document.getElementById('btnShowAnswer').addEventListener('click', showAnswer);
  document.getElementById('btnExitStudy').addEventListener('click', exitStudy);
  document.getElementById('btnStudyAgain').addEventListener('click', () => startStudy(studySetId));
  document.getElementById('btnExitQuiz').addEventListener('click', exitQuiz);
  document.getElementById('btnQuizAgain').addEventListener('click', () => showQuizModeModal(quizSetId));
  document.getElementById('flashcard').addEventListener('click', flipCard);
  document.getElementById('btnNextQuiz').addEventListener('click', nextQuizQuestion);
  document.getElementById('btnReviewNow').addEventListener('click', startReviewSession);
  document.getElementById('btnExitReview').addEventListener('click', exitReview);
  document.getElementById('btnNextReview').addEventListener('click', nextReviewQuestion);
  document.getElementById('btnReviewAgain').addEventListener('click', restartReviewWrong);
  document.getElementById('btnSetName').addEventListener('click', promptSetName);
  document.getElementById('btnExport').addEventListener('click', exportData);
  document.getElementById('btnImport').addEventListener('click', () => document.getElementById('importFileInput').click());
  document.getElementById('importFileInput').addEventListener('change', importData);
  document.getElementById('btnCreateAI').addEventListener('click', openAIModal);
  document.getElementById('btnGenerateAI').addEventListener('click', generateWithAI);
  document.getElementById('btnSaveAISet').addEventListener('click', saveAISet);
  document.getElementById('btnStartMixedQuiz').addEventListener('click', startMixedQuiz);
  document.getElementById('btnExitMixedQuiz').addEventListener('click', exitMixedQuiz);
  document.getElementById('btnNextMixed').addEventListener('click', nextMixedQuestion);
  document.getElementById('btnMixedAgain').addEventListener('click', restartMixedQuiz);
  setupAITabs();
  setupFileUploads();
}

function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(el => {
    el.classList.toggle('active', el.dataset.page === page);
  });
  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');

  if (page === 'home') renderHome();
  else if (page === 'sets') renderSetsPage();
  else if (page === 'study') renderStudyPage();
  else if (page === 'quiz') renderQuizPage();
  else if (page === 'mixedquiz') renderMixedQuizPage();
  else if (page === 'review') {} // review handled separately
  else if (page === 'stats') renderStatsPage();
  else if (page === 'chat') renderChatPage();
  else if (page === 'trash') renderTrashPage();
}

// ---- MOBILE MENU ----
function setupMobileMenu() {
  document.getElementById('menuBtn').addEventListener('click', () => {
    const isOpen = document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarBackdrop').classList.toggle('show', isOpen);
    document.body.classList.toggle('sidebar-open', isOpen);
  });
  document.getElementById('sidebarBackdrop').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarBackdrop').classList.remove('show');
    document.body.classList.remove('sidebar-open');
  });
}

// ---- COLOR PICKER ----
function setupColorPicker() {
  const cp = document.getElementById('colorPicker');
  COLOR_GRADIENTS.forEach((g, i) => {
    const dot = document.createElement('div');
    dot.className = 'color-dot' + (i === 0 ? ' selected' : '');
    dot.style.background = g;
    dot.addEventListener('click', () => {
      cp.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
      dot.classList.add('selected');
      selectedColorIndex = i;
    });
    cp.appendChild(dot);
  });
}

// ---- HELPERS ----
function getAllSets() {
  return [...SAMPLE_SETS, ...Storage.getSets()];
}
function getUserSets() {
  return Storage.getSets();
}
function getSetById(id) {
  return getAllSets().find(s => s.id === id);
}
function getProgress() {
  return Storage.getProgress();
}

function getMasteredCount() {
  const prog = getProgress();
  let count = 0;
  getAllSets().forEach(set => {
    set.cards.forEach(c => {
      if (prog[c.id] && prog[c.id].status === 'mastered') count++;
    });
  });
  return count;
}
function getTotalCards() {
  return getAllSets().reduce((a, s) => a + s.cards.length, 0);
}
function getDueCount() {
  const prog = getProgress();
  let count = 0;
  getAllSets().forEach(set => {
    set.cards.forEach(c => {
      const p = prog[c.id];
      if (p && p.status !== 'new' && SR.isDue(p)) count++;
    });
  });
  return count;
}

// ---- RENDER HOME ----
function renderHome() {
  // Greeting với tên người dùng
  const name = localStorage.getItem('vocalearn_username') || '';
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Chào buổi sáng' : hour < 18 ? 'Chào buổi chiều' : 'Chào buổi tối';
  document.getElementById('homeGreeting').textContent = name ? `${greet}, ${name}! 👋` : 'Xin chào! 👋';
  document.getElementById('totalCards').textContent = getTotalCards();
  document.getElementById('masteredCards').textContent = getMasteredCount();
  document.getElementById('todayStudied').textContent = Storage.getTodayStudied();
  const due = getDueCount();
  document.getElementById('dueReview').textContent = due;
  const hint = document.getElementById('dueHint');
  const banner = document.getElementById('reviewBanner');
  if (due > 0) {
    hint.textContent = 'Học ngay để không quên!';
    hint.style.color = 'var(--pink)';
    banner.style.display = 'flex';
    document.getElementById('reviewBannerSub').textContent =
      `Bạn có ${due} thẻ cần ôn lại hôm nay — hoàn thành để ghi nhớ lâu hơn!`;
  } else {
    const prog = getProgress();
    const hasLearning = getAllSets().some(s => s.cards.some(c => prog[c.id] && prog[c.id].status === 'learning'));
    hint.textContent = hasLearning ? '↑ Sẽ có sau 1–3 ngày' : 'Hãy bắt đầu học!';
    hint.style.color = 'var(--text3)';
    banner.style.display = 'none';
  }

  // Sample sets — ẩn bộ đã thuộc 100%
  const sg = document.getElementById('sampleSets');
  sg.innerHTML = '';
  const visibleSamples = SAMPLE_SETS.filter(s => !isSetFullyMastered(s));
  if (visibleSamples.length === 0) {
    sg.innerHTML = '<p style="color:var(--text3);font-size:0.85rem">🎉 Bạn đã thuộc hết tất cả bộ thẻ mẫu!</p>';
  } else {
    visibleSamples.forEach(s => sg.appendChild(createSetCard(s)));
  }

  // My sets — ẩn bộ đã thuộc 100%
  const mg = document.getElementById('mySetsHome');
  mg.innerHTML = '';
  const userSets = getUserSets();
  const visibleUserSets = userSets.filter(s => !isSetFullyMastered(s));
  if (userSets.length === 0) {
    mg.innerHTML = '<p style="color:var(--text3);font-size:0.9rem">Chưa có bộ thẻ nào. Nhấn + để tạo!</p>';
  } else if (visibleUserSets.length === 0) {
    mg.innerHTML = '<p style="color:var(--text3);font-size:0.85rem">🎉 Bạn đã thuộc hết tất cả bộ thẻ của mình!</p>';
  } else {
    visibleUserSets.forEach(s => mg.appendChild(createSetCard(s)));
  }
}

function updateStreak() {
  const s = Storage.getStreak();
  const prev = parseInt(document.getElementById('streakCount').textContent) || 0;
  document.getElementById('streakCount').textContent = s.count;
  // Phát âm streak khi tăng
  if (s.count > prev && s.count > 1) setTimeout(() => AudioFX.streak(), 600);
}

// Kiểm tra streak có bị ngắt không khi mở app
function checkStreakExpiry() {
  const streak = Storage.getStreak();
  if (!streak.lastDate || streak.count === 0) return;

  const today = getLocalDateStr();
  const yesterday = getLocalDateStr(new Date(Date.now() - 86400000));

  // Nếu lần học cuối không phải hôm nay hoặc hôm qua → đã bị ngắt
  if (streak.lastDate !== today && streak.lastDate !== yesterday) {
    streak.count = 0;
    streak.lastDate = null;
    Storage.saveStreak(streak);
  }
}

// ---- RENDER SETS PAGE ----
function renderSetsPage() {
  const sets = getUserSets();
  const grid = document.getElementById('mySetsPage');
  const empty = document.getElementById('emptySets');
  grid.innerHTML = '';
  if (sets.length === 0) {
    empty.style.display = 'flex';
  } else {
    empty.style.display = 'none';
    sets.forEach(s => grid.appendChild(createSetCard(s)));
  }
}

// ---- SET CARD ----
function createSetCard(set) {
  const prog = getProgress();
  const total = set.cards.length;
  const mastered = set.cards.filter(c => prog[c.id] && prog[c.id].status === 'mastered').length;
  const learning = set.cards.filter(c => prog[c.id] && prog[c.id].status === 'learning').length;
  const pctMastered = total > 0 ? Math.round(mastered / total * 100) : 0;
  const pctLearning = total > 0 ? Math.round(learning / total * 100) : 0;

  const div = document.createElement('div');
  div.className = `set-card set-color-${set.colorIndex || 0}`;
  div.innerHTML = `
    <div class="set-card-name">${set.name}</div>
    <div class="set-card-count">${total} từ vựng</div>
    <div class="set-card-progress">
      <div class="set-card-progress-fill" style="width:${pctMastered + pctLearning}%;opacity:0.5;background:var(--yellow);position:absolute"></div>
      <div class="set-card-progress-fill" style="width:${pctMastered}%"></div>
    </div>
    <div class="set-card-meta">
      <span>${mastered}/${total} đã thuộc${learning > 0 ? ` · <span style="color:var(--yellow)">${learning} đang học</span>` : ''}</span>
      <span style="color:var(--green)">${pctMastered}%</span>
    </div>
    <div class="set-card-actions">
      <button class="sca-btn sca-study" title="Học thẻ">🎴 Học</button>
      <button class="sca-btn sca-quiz" title="Kiểm tra">🧠 Kiểm tra</button>
    </div>
  `;
  div.querySelector('.sca-study').addEventListener('click', e => { e.stopPropagation(); startStudy(set.id); });
  div.querySelector('.sca-quiz').addEventListener('click', e => { e.stopPropagation(); showQuizModeModal(set.id); });
  div.addEventListener('click', () => openDetailModal(set.id));
  return div;
}

// ---- DETAIL MODAL ----
function openDetailModal(setId) {
  detailSetId = setId;
  const set = getSetById(setId);
  if (!set) return;
  document.getElementById('detailSetName').textContent = set.name;
  const prog = getProgress();
  const labelMap = { new: 'Chưa học', learning: 'Đang học', mastered: 'Đã thuộc' };
  const clsMap = { new: 'status-new', learning: 'status-learning', mastered: 'status-mastered' };
  const wrap = document.querySelector('.cards-table-wrap');

  if (window.innerWidth <= 768) {
    // Mobile: card list layout
    wrap.innerHTML = '<div class="cards-mobile-list" id="cardsMobileList"></div>';
    const list = document.getElementById('cardsMobileList');
    set.cards.forEach((c, i) => {
      const p = prog[c.id];
      const status = p ? p.status : 'new';
      const card = document.createElement('div');
      card.className = 'vocab-card-row';
      card.innerHTML = `
        <div class="vcr-top">
          <span class="vcr-num">${i+1}</span>
          <strong class="vcr-word">${c.word}</strong>
          <span class="vcr-phonetic">${c.phonetic || ''}</span>
          <span class="vcr-meaning">${c.meaning}</span>
        </div>
        <div class="vcr-bottom">
          <span class="status-badge ${clsMap[status]}">${labelMap[status]}</span>
          <button class="speak-btn-table" onclick="speakWord('${c.word.replace(/'/g, "\\'")}')">🔊</button>
        </div>`;
      list.appendChild(card);
    });
  } else {
    // Desktop: table layout
    wrap.innerHTML = `<table class="cards-table" id="cardsTable">
      <thead><tr><th>#</th><th>Từ</th><th>Phiên âm</th><th>Nghĩa</th><th>Trạng thái</th><th>Phát âm</th></tr></thead>
      <tbody id="cardsTableBody"></tbody>
    </table>`;
    const tbody = document.getElementById('cardsTableBody');
    set.cards.forEach((c, i) => {
      const p = prog[c.id];
      const status = p ? p.status : 'new';
      tbody.innerHTML += `<tr>
        <td>${i+1}</td>
        <td><strong>${c.word}</strong></td>
        <td style="font-family:'DM Mono',monospace;font-size:0.8rem;color:var(--text2)">${c.phonetic || ''}</td>
        <td>${c.meaning}</td>
        <td><span class="status-badge ${clsMap[status]}">${labelMap[status]}</span></td>
        <td><button class="speak-btn-table" onclick="speakWord('${c.word.replace(/'/g, "\\'")}')">🔊</button></td>
      </tr>`;
    });
  }

  // Buttons
  document.getElementById('btnStudySet').onclick = () => { closeDetailModal(); startStudy(setId); };
  document.getElementById('btnQuizSet').onclick = () => { closeDetailModal(); showQuizModeModal(setId); };

  const isUserSet = !set.isample && !set.issample;
  document.getElementById('btnEditSet').style.display = isUserSet ? '' : 'none';
  document.getElementById('btnDeleteSet').style.display = isUserSet ? '' : 'none';
  document.getElementById('btnEditSet').onclick = () => { closeDetailModal(); openEditModal(setId); };
  document.getElementById('btnDeleteSet').onclick = () => { closeDetailModal(); deleteSet(setId); };

  document.getElementById('modalSetDetail').classList.add('open');
}
function closeDetailModal() {
  document.getElementById('modalSetDetail').classList.remove('open');
}

// ---- CREATE / EDIT MODAL ----
function openCreateModal() {
  editingSetId = null;
  selectedColorIndex = 0;
  document.getElementById('modalTitle').textContent = 'Tạo bộ thẻ mới';
  document.getElementById('setNameInput').value = '';
  document.getElementById('wordsInput').value = '';
  document.querySelectorAll('.color-dot').forEach((d, i) => d.classList.toggle('selected', i === 0));
  document.getElementById('modalCreateSet').classList.add('open');
}
function openEditModal(setId) {
  const set = getSetById(setId);
  if (!set) return;
  editingSetId = setId;
  selectedColorIndex = set.colorIndex || 0;
  document.getElementById('modalTitle').textContent = 'Sửa bộ thẻ';
  document.getElementById('setNameInput').value = set.name;
  document.getElementById('wordsInput').value = set.cards.map(c =>
    `${c.word} | ${c.phonetic || ''} | ${c.meaning} | ${c.example || ''}`
  ).join('\n');
  document.querySelectorAll('.color-dot').forEach((d, i) => d.classList.toggle('selected', i === selectedColorIndex));
  document.getElementById('modalCreateSet').classList.add('open');
}
function closeCreateModal() {
  document.getElementById('modalCreateSet').classList.remove('open');
}

function saveSet() {
  const name = document.getElementById('setNameInput').value.trim();
  const rawWords = document.getElementById('wordsInput').value.trim();
  if (!name) { showNotif('Vui lòng nhập <strong>tên bộ thẻ</strong>!', '✏️'); ; return; }
  if (!rawWords) { showNotif('Vui lòng nhập ít nhất <strong>một từ</strong>!', '📝'); ; return; }

  const setId = editingSetId || ('user_' + Date.now());
  const cards = rawWords.split('\n').filter(l => l.trim()).map((line, i) => {
    const parts = line.split('|').map(p => p.trim());
    return {
      id: `${setId}_card_${i}`,
      word: parts[0] || '',
      phonetic: parts[1] || '',
      meaning: parts[2] || '',
      example: parts[3] || ''
    };
  }).filter(c => c.word && c.meaning);

  if (cards.length === 0) { showNotif('Định dạng: <code>từ | phiên âm | nghĩa | ví dụ</code>', '📋'); ; return; }

  const sets = Storage.getSets();
  if (editingSetId) {
    const idx = sets.findIndex(s => s.id === editingSetId);
    if (idx !== -1) {
      sets[idx] = { ...sets[idx], name, colorIndex: selectedColorIndex, cards };
    }
  } else {
    const newSet = {
      id: setId,
      name, colorIndex: selectedColorIndex, cards
    };
    sets.push(newSet);
  }
  Storage.saveSets(sets);
  closeCreateModal();
  if (currentPage === 'sets') renderSetsPage();
  else renderHome();
}

async function deleteSet(setId) {
  const set = Storage.getSets().find(s => s.id === setId);
  if (!set) return;
  const ok = await showConfirm(
    'Bộ thẻ <strong>"' + set.name + '"</strong> sẽ được chuyển vào 🗑️ Thùng rác.<br><small style="color:var(--text3)">Bạn có thể khôi phục lại trong mục Thùng rác.</small>',
    '🗑️'
  );
  if (!ok) return;
  Trash.moveToTrash(set);
  const sets = Storage.getSets().filter(s => s.id !== setId);
  Storage.saveSets(sets);
  showNotif('Đã chuyển "<strong>' + set.name + '</strong>" vào thùng rác.', '🗑️');
  if (currentPage === 'sets') renderSetsPage();
  else renderHome();
  updateTrashBadge();
}

// ---- STUDY PAGE ----
function isSetFullyMastered(set) {
  const prog = getProgress();
  return set.cards.length > 0 && set.cards.every(c => prog[c.id] && prog[c.id].status === 'mastered');
}

function renderStudyPage() {
  document.getElementById('studySelectSet').style.display = '';
  document.getElementById('studySession').style.display = 'none';
  const grid = document.getElementById('studySets');
  grid.innerHTML = '';

  const allSets = getAllSets();
  const visibleSets = allSets.filter(s => !isSetFullyMastered(s));
  const hiddenCount = allSets.length - visibleSets.length;

  // Show/hide "mastered hidden" notice
  let notice = document.getElementById('studyMasteredNotice');
  if (!notice) {
    notice = document.createElement('p');
    notice.id = 'studyMasteredNotice';
    notice.style.cssText = 'color:var(--text3);font-size:0.85rem;margin-bottom:0.5rem';
    grid.parentNode.insertBefore(notice, grid);
  }
  notice.textContent = hiddenCount > 0
    ? `✅ Đã ẩn ${hiddenCount} bộ thẻ đã thuộc hết. Chỉ hiển thị bộ thẻ chưa học hoặc đang học.`
    : '';

  if (visibleSets.length === 0) {
    grid.innerHTML = '<p style="color:var(--text3);font-size:0.95rem;text-align:center;padding:2rem">🎉 Bạn đã thuộc tất cả bộ thẻ! Tiếp tục ôn tập để duy trì.</p>';
    // Show all sets as fallback
    allSets.forEach(s => {
      const card = createSetCard(s);
      card.onclick = () => startStudy(s.id);
      const quizBtn = card.querySelector('.sca-quiz');
      if (quizBtn) quizBtn.style.display = 'none';
      grid.appendChild(card);
    });
    return;
  }

  visibleSets.forEach(s => {
    const card = createSetCard(s);
    card.addEventListener('click', () => {}, true);
    card.onclick = () => startStudy(s.id);
    const quizBtn = card.querySelector('.sca-quiz');
    if (quizBtn) quizBtn.style.display = 'none';
    grid.appendChild(card);
  });
}

function startStudy(setId) {
  navigateTo('study');
  studySetId = setId;
  const set = getSetById(setId);
  if (!set) return;
  const prog = getProgress();

  // Sort: due cards first, then new cards
  const due = SR.getDueCards(set.cards, prog);
  const newCards = set.cards.filter(c => !prog[c.id] || prog[c.id].status === 'new');
  const all = set.cards;

  // Mix: due + new (limit to 20 per session)
  let queue = [...new Set([...due, ...newCards, ...all].map(c => c.id))]
    .slice(0, 20)
    .map(id => all.find(c => c.id === id))
    .filter(Boolean);

  if (queue.length === 0) queue = all;
  studyQueue = queue;
  studyIndex = 0;
  studyResults = { easy: 0, ok: 0, hard: 0 };
  studyFlipped = false;

  document.getElementById('studySelectSet').style.display = 'none';
  document.getElementById('studySession').style.display = '';
  document.getElementById('studyDone').style.display = 'none';
  document.getElementById('flashcard').style.display = '';
  document.getElementById('ratingBtns').style.display = 'none';
  document.getElementById('showAnswerWrap').style.display = '';

  showStudyCard();
}

function showStudyCard() {
  const card = studyQueue[studyIndex];
  if (!card) return;

  // Reset flip
  studyFlipped = false;
  document.getElementById('flashcardInner').classList.remove('flipped');
  document.getElementById('ratingBtns').style.display = 'none';
  document.getElementById('showAnswerWrap').style.display = '';

  document.getElementById('cardFrontWord').textContent = card.word;
  document.getElementById('cardPhonetic').textContent = card.phonetic || '';
  document.getElementById('cardMeaning').textContent = card.meaning;
  document.getElementById('cardExample').textContent = card.example ? `"${card.example}"` : '';

  // Tự động phát âm khi hiện thẻ mới
  setTimeout(() => speakWord(card.word), 300);

  // Progress
  const pct = Math.round(studyIndex / studyQueue.length * 100);
  document.getElementById('studyProgressFill').style.width = pct + '%';
  document.getElementById('studyProgressText').textContent = `${studyIndex} / ${studyQueue.length}`;
}

function flipCard() {
  if (!studyFlipped) showAnswer();
}

function showAnswer() {
  studyFlipped = true;
  AudioFX.flip();
  document.getElementById('flashcardInner').classList.add('flipped');
  document.getElementById('ratingBtns').style.display = 'flex';
  document.getElementById('showAnswerWrap').style.display = 'none';
}

function rateCard(rating) {
  if (rating === 5) { AudioFX.correct(); studyResults.easy++; }
  else if (rating === 3) { AudioFX.correct(); studyResults.ok++; }
  else { AudioFX.wrong(); studyResults.hard++; }

  const card = studyQueue[studyIndex];
  const prog = getProgress();
  const cardData = prog[card.id] || SR.getDefaultCard(card.id);
  prog[card.id] = SR.update(cardData, rating);
  Storage.saveProgress(prog);

  studyIndex++;
  if (studyIndex >= studyQueue.length) {
    finishStudy();
  } else {
    showStudyCard();
  }
}

function finishStudy() {
  Storage.recordStudyToday(studyQueue.map(c => c.id));
  // Âm thanh hoàn thành: đạt nếu tỉ lệ khó < 40%
  const total = studyResults.easy + studyResults.ok + studyResults.hard;
  const passRate = total > 0 ? (studyResults.easy + studyResults.ok) / total : 0;
  setTimeout(() => passRate >= 0.6 ? AudioFX.completedPass() : AudioFX.completedFail(), 200);

  document.getElementById('flashcard').style.display = 'none';
  document.getElementById('ratingBtns').style.display = 'none';
  document.getElementById('showAnswerWrap').style.display = 'none';
  document.getElementById('studyDone').style.display = 'flex';
  document.getElementById('doneEasy').textContent = studyResults.easy;
  document.getElementById('doneOk').textContent = studyResults.ok;
  document.getElementById('doneHard').textContent = studyResults.hard;
  document.getElementById('studyProgressFill').style.width = '100%';
  document.getElementById('studyProgressText').textContent = `${studyQueue.length} / ${studyQueue.length}`;
  updateStreak();
  if (currentPage === 'home') renderHome();
}

function exitStudy() {
  document.getElementById('studySession').style.display = 'none';
  document.getElementById('studySelectSet').style.display = '';
  navigateTo('home');
}

// ---- QUIZ PAGE ----
function hasStudyHistory(set) {
  const prog = getProgress();
  return set.cards.some(c => prog[c.id] && prog[c.id].status !== 'new');
}

function renderQuizPage() {
  document.getElementById('quizSelectSet').style.display = '';
  document.getElementById('quizSession').style.display = 'none';
  const grid = document.getElementById('quizSets');
  grid.innerHTML = '';

  const studiedSets = getAllSets().filter(s => s.cards.length >= 4 && hasStudyHistory(s));

  if (studiedSets.length === 0) {
    grid.innerHTML = `
      <div style="
        grid-column: 1/-1;
        text-align:center;
        padding: 3rem 1.5rem;
        color: var(--text3);
        background: var(--card);
        border-radius: 16px;
        border: 1.5px dashed var(--border);
      ">
        <div style="font-size:2.5rem;margin-bottom:0.75rem">📖</div>
        <div style="font-size:1.05rem;font-weight:600;color:var(--text2);margin-bottom:0.4rem">Chưa có bộ thẻ nào để kiểm tra</div>
        <div style="font-size:0.88rem;line-height:1.6">
          Hãy <strong style="color:var(--green)">học thẻ</strong> trước — chỉ những bộ thẻ đã học mới xuất hiện tại đây.
        </div>
      </div>`;
    return;
  }

  studiedSets.forEach(s => {
    const card = createSetCard(s);
    card.onclick = () => showQuizModeModal(s.id);
    // Ẩn nút Học trên trang Kiểm tra
    const studyBtn = card.querySelector('.sca-study');
    if (studyBtn) studyBtn.style.display = 'none';
    grid.appendChild(card);
  });
}

function showQuizModeModal(setId) {
  const modal = document.getElementById('quizModeModal');
  modal.style.display = 'flex';
  const closeModal = () => { modal.style.display = 'none'; };
  document.getElementById('btnModeMultiple').onclick = () => {
    closeModal();
    navigateTo('quiz');
    startQuiz(setId, 'multiple');
  };
  document.getElementById('btnModeEssay').onclick = () => {
    closeModal();
    navigateTo('quiz');
    startQuiz(setId, 'essay');
  };
  document.getElementById('btnCancelMode').onclick = closeModal;
  document.getElementById('btnCancelModeBackdrop').onclick = closeModal;
}

function startQuiz(setId, mode) {
  mode = mode || 'multiple';
  navigateTo('quiz');
  quizSetId = setId;
  quizMode = mode;
  const set = getSetById(setId);
  if (!set) return;
  quizCards = shuffle([...set.cards]).slice(0, 15);
  quizIndex = 0; quizCorrect = 0; quizWrong = 0; quizResultMap = {};

  // Direction will be randomized per question in showQuizQuestion

  document.getElementById('quizSelectSet').style.display = 'none';
  document.getElementById('quizSession').style.display = '';
  document.getElementById('quizDone').style.display = 'none';

  showQuizQuestion();
}

function showQuizQuestion() {
  const card = quizCards[quizIndex];
  const fb = document.getElementById('quizFeedback');
  fb.style.display = 'none';
  document.getElementById('btnNextQuiz').style.display = 'none';

  // Tiến độ bắt đầu từ 1 (không phải 0)
  const pct = Math.round((quizIndex + 1) / quizCards.length * 100);
  document.getElementById('quizProgressFill').style.width = pct + '%';
  document.getElementById('quizProgressText').textContent = `${quizIndex + 1} / ${quizCards.length}`;
  document.getElementById('quizScore').textContent = quizCorrect;

  if (quizMode === 'essay') {
    // Essay mode: randomly en→vi or vi→en per question
    quizEssayDirection = Math.random() < 0.5 ? 'en2vi' : 'vi2en';
    document.getElementById('quizOptions').style.display = 'none';
    document.getElementById('quizEssayArea').style.display = '';

    const input = document.getElementById('quizEssayInput');
    input.value = '';
    input.disabled = false;
    input.style.borderColor = '';
    input.style.background = '';
    document.getElementById('btnSubmitEssay').style.display = '';

    if (quizEssayDirection === 'en2vi') {
      document.getElementById('quizQLabel').textContent = 'Nghĩa tiếng Việt của từ này là gì?';
      document.getElementById('quizWord').textContent = card.word;
      document.getElementById('quizPhonetic').textContent = card.phonetic || '';
      document.getElementById('speakQuiz').style.display = '';
      setTimeout(() => speakWord(card.word), 300);
    } else {
      document.getElementById('quizQLabel').textContent = 'Từ tiếng Anh của nghĩa này là gì?';
      document.getElementById('quizWord').textContent = card.meaning;
      document.getElementById('quizPhonetic').textContent = '';
      document.getElementById('speakQuiz').style.display = 'none';
    }

    setTimeout(() => input.focus(), 100);

    const submitBtn = document.getElementById('btnSubmitEssay');
    const newSubmit = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
    newSubmit.addEventListener('click', () => checkEssayAnswer());

    input.onkeydown = (e) => {
      if (e.key === 'Enter' && !input.disabled) checkEssayAnswer();
    };

  } else {
    // Multiple choice mode
    document.getElementById('quizOptions').style.display = '';
    document.getElementById('quizEssayArea').style.display = 'none';
    document.getElementById('quizQLabel').textContent = 'Từ tiếng Anh này nghĩa là gì?';
    document.getElementById('quizWord').textContent = card.word;
    document.getElementById('quizPhonetic').textContent = card.phonetic || '';
    document.getElementById('speakQuiz').style.display = '';
    setTimeout(() => speakWord(card.word), 300);

    // Đáp án sai lấy từ cùng bộ thẻ
    const set = getSetById(quizSetId);
    const otherCards = set.cards.filter(c => c.id !== card.id);
    const wrongOptions = shuffle(otherCards).slice(0, 3).map(c => c.meaning);
    const options = shuffle([card.meaning, ...wrongOptions]);

    const container = document.getElementById('quizOptions');
    container.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.textContent = opt;
      btn.addEventListener('click', () => checkAnswer(opt, card.meaning, container));
      container.appendChild(btn);
    });
  }
}

function normalizeAnswer(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip diacritics for fuzzy
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

function checkEssayAnswer() {
  const card = quizCards[quizIndex];
  const input = document.getElementById('quizEssayInput');
  const userAnswer = input.value.trim();
  if (!userAnswer) return;

  input.disabled = true;
  document.getElementById('btnSubmitEssay').style.display = 'none';

  const correctAnswer = quizEssayDirection === 'en2vi' ? card.meaning : card.word;
  const fb = document.getElementById('quizFeedback');
  fb.style.display = '';

  // Normalize for comparison: strip diacritics, lowercase, trim
  const norm = s => s.toLowerCase().trim().replace(/\s+/g, ' ');
  const normUser = norm(userAnswer);
  const normCorrect = norm(correctAnswer);

  // Accept if exact or if stripped diacritics match
  const isCorrect = normUser === normCorrect ||
    normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);

  // Style the input
  input.style.borderColor = isCorrect ? 'var(--green)' : 'var(--pink)';
  input.style.background = isCorrect ? 'rgba(6,214,160,0.08)' : 'rgba(247,37,133,0.08)';

  const currentCard = quizCards[quizIndex];
  if (currentCard) quizResultMap[currentCard.id] = isCorrect;

  if (isCorrect) {
    quizCorrect++;
    AudioFX.correct();
    fb.className = 'quiz-feedback correct-fb';
    fb.textContent = '✅ Chính xác! Giỏi lắm!';
  } else {
    quizWrong++;
    AudioFX.wrong();
    fb.className = 'quiz-feedback wrong-fb';
    fb.innerHTML = `❌ Sai rồi! Đáp án đúng: <strong>"${correctAnswer}"</strong>`;
  }
  document.getElementById('quizScore').textContent = quizCorrect;

  const isLast = quizIndex === quizCards.length - 1;
  const nextBtn = document.getElementById('btnNextQuiz');
  if (isLast) {
    nextBtn.style.display = 'none';
    setTimeout(() => { quizIndex++; finishQuiz(); }, 1800);
  } else {
    nextBtn.style.display = 'block';
  }
}

function nextQuizQuestion() {
  quizIndex++;
  if (quizIndex >= quizCards.length) {
    finishQuiz();
  } else {
    showQuizQuestion();
  }
}

function checkAnswer(selected, correct, container) {
  const btns = container.querySelectorAll('.quiz-opt');
  btns.forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add('correct');
    if (b.textContent === selected && selected !== correct) b.classList.add('wrong');
  });

  const fb = document.getElementById('quizFeedback');
  fb.style.display = '';
  const isCorrect = selected === correct;

  // Ghi kết quả thẻ hiện tại vào map — dùng quizIndex tại thời điểm trả lời (chưa tăng)
  const currentCard = quizCards[quizIndex];
  if (currentCard) quizResultMap[currentCard.id] = isCorrect;

  if (isCorrect) {
    quizCorrect++;
    AudioFX.correct();
    fb.className = 'quiz-feedback correct-fb';
    fb.textContent = '✅ Chính xác! Giỏi lắm!';
  } else {
    quizWrong++;
    AudioFX.wrong();
    fb.className = 'quiz-feedback wrong-fb';
    fb.textContent = `❌ Sai rồi! Đáp án đúng: "${correct}"`;
  }
  document.getElementById('quizScore').textContent = quizCorrect;

  const isLast = quizIndex === quizCards.length - 1;
  const nextBtn = document.getElementById('btnNextQuiz');
  if (isLast) {
    // Câu cuối: tự động chuyển kết quả sau 1.5 giây
    nextBtn.style.display = 'none';
    setTimeout(() => { quizIndex++; finishQuiz(); }, 1500);
  } else {
    nextBtn.style.display = 'block';
  }
}

function finishQuiz() {
  const total = quizCards.length;
  const pct = Math.round(quizCorrect / total * 100);

  // 1. Cập nhật progress SR cho từng thẻ đã kiểm tra
  const prog = getProgress();
  quizCards.forEach(card => {
    const cardData = prog[card.id] || SR.getDefaultCard(card.id);
    // Thẻ đúng → rating 4, thẻ sai → rating 1
    const wasCorrect = quizResultMap[card.id];
    prog[card.id] = SR.update(cardData, wasCorrect ? 4 : 1);
  });
  Storage.saveProgress(prog);

  // 2. Ghi vào thống kê ngày hôm nay
  Storage.recordStudyToday(quizCards.map(c => c.id));

  // 3. Cập nhật streak
  updateStreak();

  // 4. Lấy danh sách thẻ sai
  const wrongCards = quizCards.filter(c => quizResultMap[c.id] === false);

  // 5. Hiện modal kết quả
  document.getElementById('quizProgressFill').style.width = '100%';
  document.getElementById('quizProgressText').textContent = `${total} / ${total}`;

  showResultModal({
    correct: quizCorrect,
    wrong: quizWrong,
    wrongCards,
    title: 'Kết quả kiểm tra',
    onAgain: () => startQuiz(quizSetId),
    onHome: () => exitQuiz()
  });
}

function exitQuiz() {
  document.getElementById('quizSession').style.display = 'none';
  document.getElementById('quizSelectSet').style.display = '';
  navigateTo('home');
}

// ---- STATS PAGE ----
function renderStatsPage() {
  const prog = getProgress();
  const allSets = getAllSets();

  // Progress rings per set
  const ringsEl = document.getElementById('progressRings');
  ringsEl.innerHTML = '';
  allSets.forEach(set => {
    const total = set.cards.length;
    const mastered = set.cards.filter(c => prog[c.id] && prog[c.id].status === 'mastered').length;
    const learning = set.cards.filter(c => prog[c.id] && prog[c.id].status === 'learning').length;
    const pctMastered = total > 0 ? Math.round(mastered / total * 100) : 0;
    const pctLearning = total > 0 ? Math.round(learning / total * 100) : 0;
    const colors = ['#ff6b6b', '#06d6a0', '#c77dff', '#ffd166', '#4cc9f0'];
    const color = colors[set.colorIndex || 0];
    const label = mastered > 0
      ? `${pctMastered}%`
      : learning > 0
        ? `<span style="color:var(--yellow)">${pctLearning}%</span>`
        : '<span style="color:var(--text3)">0%</span>';
    ringsEl.innerHTML += `
      <div class="progress-ring-item">
        <div class="ring-label" title="${set.name}">${set.name}</div>
        <div class="ring-bar" style="position:relative">
          <div class="ring-fill" style="width:${pctMastered + pctLearning}%;background:${color};opacity:0.35;position:absolute;top:0;left:0;height:100%"></div>
          <div class="ring-fill" style="width:${pctMastered}%;background:${color}"></div>
        </div>
        <div class="ring-pct">${label}</div>
      </div>`;
  });

  // ---- CHART ENGINE (3 chế độ) ----
  const _DAY_NAMES = ['CN','T2','T3','T4','T5','T6','T7'];
  const _MONTH_NAMES = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                        'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
  let _activeChartTab = '7';

  // Màu gradient theo cường độ (0–4)
  function _intensityClass(count, max) {
    if (!count) return 0;
    if (max <= 0) return 1;
    const r = count / max;
    if (r < 0.25) return 1;
    if (r < 0.5)  return 2;
    if (r < 0.75) return 3;
    return 4;
  }

  // ── View 1: Bar chart 7 ngày ──
  function _render7Days() {
    const chartEl = document.getElementById('barChart');
    const titleEl = document.getElementById('chartTitle');
    const monthSel = document.getElementById('chartMonthSelect');
    if (titleEl) titleEl.textContent = 'Lịch sử ôn tập';
    if (monthSel) monthSel.style.display = 'none';

    const data = Storage.getLastNDays(7).map(d => {
      const day = new Date(d.date + 'T00:00:00');
      return { label: _DAY_NAMES[day.getDay()], count: d.count, date: d.date };
    });
    const maxVal = Math.max(...data.map(d => d.count), 1);
    const total  = data.reduce((s, d) => s + d.count, 0);

    chartEl.className = 'bar-chart bar-chart-7';
    chartEl.innerHTML = data.map(d => {
      const pct    = Math.round(d.count / maxVal * 100);
      const isToday = d.date === getLocalDateStr();
      const barH   = d.count > 0 ? Math.max(pct, 8) : 0;
      return `
        <div class="bc7-col${isToday ? ' bc7-today' : ''}">
          <div class="bc7-num">${d.count > 0 ? d.count : ''}</div>
          <div class="bc7-bar-wrap">
            <div class="bc7-fill" style="height:${barH}%"></div>
          </div>
          <div class="bc7-label">${d.label}</div>
        </div>`;
    }).join('');

    // Tổng nhỏ ở góc
    const meta = chartEl.parentElement.querySelector('.chart-meta');
    if (meta) meta.textContent = total ? `Tổng: ${total} lượt trong 7 ngày` : 'Chưa có dữ liệu tuần này';
  }

  // ── View 2: Heatmap 30 ngày (GitHub style) ──
  function _render30Days() {
    const chartEl = document.getElementById('barChart');
    const titleEl = document.getElementById('chartTitle');
    const monthSel = document.getElementById('chartMonthSelect');
    if (titleEl) titleEl.textContent = 'Lịch sử ôn tập';
    if (monthSel) monthSel.style.display = 'none';

    const data = Storage.getLastNDays(30);
    const maxVal = Math.max(...data.map(d => d.count), 1);
    const total  = data.reduce((s, d) => s + d.count, 0);
    const activeDays = data.filter(d => d.count > 0).length;

    // Tính ngày bắt đầu (30 ngày trước), align về đầu tuần
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - 29);

    // Build map ngày → count
    const dayMap = {};
    data.forEach(d => { dayMap[d.date] = d.count; });

    // Tạo grid theo tuần (cột) × ngày trong tuần (hàng)
    // Điền từ ngày đầu tiên, padding đầu bằng null
    const cells = [];
    const startDow = startDate.getDay(); // 0=CN
    for (let i = 0; i < startDow; i++) cells.push(null); // padding
    for (let i = 0; i < 30; i++) {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const key = getLocalDateStr(d);
      cells.push({ date: key, count: dayMap[key] || 0, day: d.getDate(), month: d.getMonth() });
    }
    // Pad cuối để đủ hàng
    while (cells.length % 7 !== 0) cells.push(null);

    // Tách thành các cột (tuần)
    const weeks = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    chartEl.className = 'bar-chart heatmap-30';
    chartEl.innerHTML = `
      <div class="hm-dow-labels">
        ${_DAY_NAMES.map(n => `<div class="hm-dow">${n}</div>`).join('')}
      </div>
      <div class="hm-grid">
        ${weeks.map(week => `
          <div class="hm-week">
            ${week.map(cell => cell === null
              ? '<div class="hm-cell hm-cell-empty"></div>'
              : `<div class="hm-cell hm-i${_intensityClass(cell.count, maxVal)}${cell.date === getLocalDateStr() ? ' hm-today' : ''}" title="${cell.date}: ${cell.count} từ">
                  <span class="hm-tip">${cell.day}/${cell.month+1}: ${cell.count} từ</span>
                  ${cell.count > 0 ? `<span class="hm-count">${cell.count}</span>` : ''}
                </div>`
            ).join('')}
          </div>`
        ).join('')}
      </div>
      <div class="hm-legend">
        <span>Ít</span>
        <div class="hm-cell hm-i0"></div>
        <div class="hm-cell hm-i1"></div>
        <div class="hm-cell hm-i2"></div>
        <div class="hm-cell hm-i3"></div>
        <div class="hm-cell hm-i4"></div>
        <span>Nhiều</span>
      </div>`;

    const meta = chartEl.parentElement.querySelector('.chart-meta');
    if (meta) meta.textContent = total ? `${activeDays} ngày học · ${total} lượt trong 30 ngày` : 'Chưa có dữ liệu 30 ngày này';
  }

  // ── View 3: Lịch tháng ──
  function _renderCalendar(year, month) {
    const chartEl = document.getElementById('barChart');
    if (!chartEl) return;

    const data    = Storage.getMonthData(year, month);
    const maxVal  = Math.max(...data.map(d => d.count), 1);
    const dayMap  = {};
    data.forEach(d => { dayMap[d.day] = d.count; });

    const firstDow  = new Date(year, month, 1).getDay(); // 0=CN
    const daysInMon = new Date(year, month + 1, 0).getDate();
    const todayStr  = getLocalDateStr();
    const todayD    = new Date(todayStr + 'T00:00:00');

    const cells = [];
    for (let i = 0; i < firstDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMon; d++) {
      const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const cnt     = dayMap[d] || 0;
      const isToday = dateStr === todayStr;
      const isFuture = new Date(dateStr + 'T00:00:00') > todayD;
      cells.push({ d, cnt, isToday, isFuture, intensity: _intensityClass(cnt, maxVal) });
    }

    chartEl.className = 'bar-chart cal-grid';
    chartEl.innerHTML = `
      <div class="cal-dow-row">
        ${_DAY_NAMES.map(n => `<div class="cal-dow">${n}</div>`).join('')}
      </div>
      <div class="cal-cells">
        ${cells.map(c => c === null
          ? '<div class="cal-cell cal-empty"></div>'
          : `<div class="cal-cell cal-i${c.intensity}${c.isToday ? ' cal-today' : ''}${c.isFuture ? ' cal-future' : ''}">
              <div class="cal-day">${c.d}</div>
              ${c.cnt > 0 ? `<div class="cal-cnt">${c.cnt}</div>` : ''}
            </div>`
        ).join('')}
      </div>`;

    const total = data.reduce((s, d) => s + d.count, 0);
    const activeDays = data.filter(d => d.count > 0).length;
    const meta = chartEl.parentElement.querySelector('.chart-meta');
    if (meta) meta.textContent = total ? `${activeDays} ngày học · ${total} lượt trong tháng` : 'Chưa có dữ liệu tháng này';
  }

  // ── Dispatcher ──
  function renderChart(tab) {
    const titleEl  = document.getElementById('chartTitle');
    const monthSel = document.getElementById('chartMonthSelect');
    _activeChartTab = tab;

    if (tab === '7') {
      if (monthSel) monthSel.style.display = 'none';
      _render7Days();
    } else if (tab === '30') {
      if (monthSel) monthSel.style.display = 'none';
      _render30Days();
    } else if (tab === 'month') {
      if (monthSel) monthSel.style.display = 'flex';
      if (titleEl) titleEl.textContent = 'Lịch sử ôn tập';

      const selMonth = document.getElementById('monthPickerMonth');
      const selYear  = document.getElementById('monthPickerYear');
      const viewBtn  = document.getElementById('monthPickerViewBtn');

      // Populate selects only once
      if (selMonth && selMonth.options.length === 0) {
        const monthNames = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
                            'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];
        monthNames.forEach((name, i) => {
          const opt = document.createElement('option');
          opt.value = i; // 0-indexed
          opt.textContent = name;
          selMonth.appendChild(opt);
        });
      }
      if (selYear && selYear.options.length === 0) {
        const stats = Storage.getStats();
        const yearSet = new Set();
        Object.keys(stats.daily || {}).forEach(key => yearSet.add(parseInt(key.split('-')[0])));
        yearSet.add(new Date().getFullYear());
        const years = [...yearSet].sort().reverse();
        years.forEach(y => {
          const opt = document.createElement('option');
          opt.value = y;
          opt.textContent = y;
          selYear.appendChild(opt);
        });
      }

      // Set default to current month/year
      const now = new Date();
      if (selMonth) selMonth.value = now.getMonth();
      if (selYear)  selYear.value  = now.getFullYear();

      // Render for current month immediately
      _renderCalendar(now.getFullYear(), now.getMonth());

      // Wire "Xem" button (only once)
      if (viewBtn && !viewBtn._wired) {
        viewBtn._wired = true;
        viewBtn.addEventListener('click', () => {
          const year  = parseInt(selYear.value);
          const month = parseInt(selMonth.value); // 0-indexed
          _renderCalendar(year, month);
          const meta = document.getElementById('barChart').parentElement.querySelector('.chart-meta');
          const data = Storage.getMonthData(year, month);
          const total = data.reduce((s, d) => s + d.count, 0);
          const activeDays = data.filter(d => d.count > 0).length;
          if (meta) meta.textContent = total
            ? `${activeDays} ngày học · ${total} lượt trong tháng`
            : 'Chưa có dữ liệu tháng này';
        });
      }
    }
  }

  // Tab click handlers
  document.querySelectorAll('.chart-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const t = btn.dataset.tab;
      if (t === 'month') {
        const selMonth = document.getElementById('monthPickerMonth');
        const selYear  = document.getElementById('monthPickerYear');
        const viewBtn  = document.getElementById('monthPickerViewBtn');
        if (selMonth) selMonth.innerHTML = '';
        if (selYear)  selYear.innerHTML  = '';
        if (viewBtn)  viewBtn._wired = false;
      }
      localStorage.setItem('vocalearn_chart_tab', t);
      renderChart(t);
    });
  });

  // Restore last selected tab (default '7')
  const _savedTab = localStorage.getItem('vocalearn_chart_tab') || '7';
  const _savedBtn = document.querySelector(`.chart-tab[data-tab="${_savedTab}"]`);
  if (_savedBtn) {
    document.querySelectorAll('.chart-tab').forEach(b => b.classList.remove('active'));
    _savedBtn.classList.add('active');
  }
  renderChart(_savedTab);


    // Due words
  const dueEl = document.getElementById('dueWordsList');
  dueEl.innerHTML = '';
  const dueWords = [];
  allSets.forEach(set => {
    set.cards.forEach(c => {
      const p = prog[c.id];
      if (p && p.status !== 'new') {
        const days = SR.getDaysUntilReview(p);
        dueWords.push({ ...c, days });
      }
    });
  });
  dueWords.sort((a, b) => a.days - b.days).slice(0, 10).forEach(c => {
    const cls = c.days === 0 ? 'due-today' : 'due-soon';
    const label = c.days === 0 ? 'Hôm nay' : `${c.days} ngày nữa`;
    dueEl.innerHTML += `
      <div class="due-word-row">
        <div class="due-word">${c.word}</div>
        <div class="due-meaning">${c.meaning}</div>
        <div class="due-badge ${cls}">${label}</div>
      </div>`;
  });
  if (dueWords.length === 0) {
    dueEl.innerHTML = '<p style="color:var(--text3);padding:1rem 0">Chưa có từ nào cần ôn tập.</p>';
  }
}

// ---- UTILS ----
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Close modals on overlay click
document.getElementById('modalCreateSet').addEventListener('click', e => {
  if (e.target === document.getElementById('modalCreateSet')) closeCreateModal();
});
document.getElementById('modalSetDetail').addEventListener('click', e => {
  if (e.target === document.getElementById('modalSetDetail')) closeDetailModal();
});
document.getElementById('modalAICreate').addEventListener('click', e => {
  if (e.target === document.getElementById('modalAICreate')) closeAIModal();
});

// ======================================================
// CHỨC NĂNG 1: KIỂM TRA TỔNG HỢP
// ======================================================
let mixedSelectedSets = new Set();
let mixedQuizCards = [];
let mixedIndex = 0;
let mixedCorrect = 0;
let mixedWrong = 0;
let mixedResultMap = {};
let mixedWrongCards = [];
let mixedQuizCountTarget = 15;
let mixedQuizModeSelected = 'multiple'; // 'multiple' | 'essay' | 'random'
let mixedCardDirections = []; // per-card direction for essay/random mode

const DOT_COLORS = ['#ff6b6b','#06d6a0','#c77dff','#ffd166','#4cc9f0'];

function renderMixedQuizPage() {
  document.getElementById('mixedQuizConfig').style.display = '';
  document.getElementById('mixedQuizSession').style.display = 'none';
  mixedSelectedSets.clear();

  const list = document.getElementById('mixedSetsList');
  list.innerHTML = '';
  const studiedSetsForMixed = getAllSets().filter(s => s.cards.length >= 4 && hasStudyHistory(s));
  if (studiedSetsForMixed.length === 0) {
    list.innerHTML = `
      <div style="
        text-align:center;
        padding: 2.5rem 1.5rem;
        color: var(--text3);
        background: var(--card);
        border-radius: 16px;
        border: 1.5px dashed var(--border);
      ">
        <div style="font-size:2rem;margin-bottom:0.6rem">📖</div>
        <div style="font-size:0.95rem;font-weight:600;color:var(--text2);margin-bottom:0.35rem">Chưa có bộ thẻ nào</div>
        <div style="font-size:0.85rem;line-height:1.6">Hãy <strong style="color:var(--green)">học thẻ</strong> trước để mở khoá kiểm tra tổng hợp.</div>
      </div>`;
    updateMixedPreview();
    return;
  }
  studiedSetsForMixed.forEach(set => {
    const row = document.createElement('div');
    row.className = 'mixed-set-row';
    row.dataset.id = set.id;
    const dotColor = DOT_COLORS[set.colorIndex || 0];
    row.innerHTML = `
      <div class="mixed-checkbox"></div>
      <div class="mixed-set-dot" style="background:${dotColor}"></div>
      <div class="mixed-set-info">
        <div class="mixed-set-name">${set.name}</div>
        <div class="mixed-set-count">${set.cards.length} từ vựng</div>
      </div>`;
    row.addEventListener('click', () => toggleMixedSet(set.id, row));
    list.appendChild(row);
  });
  updateMixedPreview();
}

function toggleMixedSet(setId, row) {
  if (mixedSelectedSets.has(setId)) {
    mixedSelectedSets.delete(setId);
    row.classList.remove('selected');
    row.querySelector('.mixed-checkbox').textContent = '';
  } else {
    mixedSelectedSets.add(setId);
    row.classList.add('selected');
    row.querySelector('.mixed-checkbox').textContent = '✓';
  }
  updateMixedPreview();
}

function updateMixedPreview() {
  const count = parseInt(document.getElementById('mixedQuizCount').value);
  const preview = document.getElementById('mixedPreview');
  if (mixedSelectedSets.size === 0) {
    preview.innerHTML = '<span style="color:var(--text3)">👆 Chọn ít nhất 2 bộ thẻ để bắt đầu kiểm tra tổng hợp</span>';
    return;
  }
  if (mixedSelectedSets.size === 1) {
    preview.innerHTML = '<span style="color:var(--yellow)">⚠️ Cần chọn thêm ít nhất 1 bộ thẻ nữa để kiểm tra tổng hợp</span>';
    return;
  }
  let total = 0;
  mixedSelectedSets.forEach(id => {
    const s = getSetById(id);
    if (s) total += s.cards.length;
  });
  const actual = Math.min(count, total);
  preview.innerHTML = `
    <span style="color:var(--green)">✅ Đã chọn ${mixedSelectedSets.size} bộ thẻ</span>
    · <strong>${total}</strong> từ có sẵn
    · Sẽ kiểm tra <strong style="color:var(--accent2)">${actual}</strong> câu ngẫu nhiên`;
}

document.getElementById('mixedQuizCount').addEventListener('change', updateMixedPreview);

function startMixedQuiz() {
  if (mixedSelectedSets.size < 2) {
    showNotif('Vui lòng chọn <strong>ít nhất 2 bộ thẻ</strong>!', '⚠️'); ; return;
  }
  mixedQuizCountTarget = parseInt(document.getElementById('mixedQuizCount').value);
  mixedQuizModeSelected = document.getElementById('mixedQuizMode').value;

  // Gom tất cả thẻ từ các bộ được chọn, lưu _setId để lấy đáp án cùng bộ
  let allCards = [];
  mixedSelectedSets.forEach(id => {
    const s = getSetById(id);
    if (s) s.cards.forEach(c => allCards.push({ ...c, _setId: s.id, _setName: s.name, _setColor: DOT_COLORS[s.colorIndex || 0] }));
  });

  mixedQuizCards = shuffle(allCards).slice(0, mixedQuizCountTarget);

  // Assign per-card directions for essay/random
  mixedCardDirections = mixedQuizCards.map(() => {
    if (mixedQuizModeSelected === 'multiple') return null;
    if (mixedQuizModeSelected === 'essay') return Math.random() < 0.5 ? 'en2vi' : 'vi2en';
    // random: randomly pick multiple or essay, and if essay pick direction
    const mode = Math.random() < 0.5 ? 'multiple' : 'essay';
    return mode === 'multiple' ? 'multiple' : (Math.random() < 0.5 ? 'en2vi' : 'vi2en');
  });

  mixedIndex = 0; mixedCorrect = 0; mixedWrong = 0;
  mixedResultMap = {}; mixedWrongCards = [];

  document.getElementById('mixedQuizConfig').style.display = 'none';
  document.getElementById('mixedQuizSession').style.display = '';
  document.getElementById('mixedDone').style.display = 'none';
  showMixedQuestion();
}

function showMixedQuestion() {
  const card = mixedQuizCards[mixedIndex];
  const dir = mixedCardDirections[mixedIndex]; // null | 'en2vi' | 'vi2en' | 'multiple'
  const isEssay = dir === 'en2vi' || dir === 'vi2en';

  document.getElementById('mixedSetLabel').innerHTML =
    `<span style="color:${card._setColor}">● ${card._setName}</span>`;
  document.getElementById('mixedFeedback').style.display = 'none';
  document.getElementById('btnNextMixed').style.display = 'none';

  // Tiến độ bắt đầu từ 1
  const pct = Math.round((mixedIndex + 1) / mixedQuizCards.length * 100);
  document.getElementById('mixedProgressFill').style.width = pct + '%';
  document.getElementById('mixedProgressText').textContent = `${mixedIndex + 1} / ${mixedQuizCards.length}`;
  document.getElementById('mixedScore').textContent = mixedCorrect;

  const speakBtn = document.getElementById('speakMixed');
  const optionsEl = document.getElementById('mixedOptions');
  const essayArea = document.getElementById('mixedEssayArea');

  if (isEssay) {
    optionsEl.style.display = 'none';
    essayArea.style.display = '';

    const input = document.getElementById('mixedEssayInput');
    input.value = '';
    input.disabled = false;
    input.style.borderColor = '';
    input.style.background = '';
    document.getElementById('btnSubmitMixedEssay').style.display = '';

    if (dir === 'en2vi') {
      document.getElementById('mixedSetLabel').innerHTML =
        `<span style="color:${card._setColor}">● ${card._setName}</span> · Nghĩa tiếng Việt là gì?`;
      document.getElementById('mixedWord').textContent = card.word;
      document.getElementById('mixedPhonetic').textContent = card.phonetic || '';
      speakBtn.style.display = '';
      setTimeout(() => speakWord(card.word), 300);
    } else {
      document.getElementById('mixedSetLabel').innerHTML =
        `<span style="color:${card._setColor}">● ${card._setName}</span> · Từ tiếng Anh là gì?`;
      document.getElementById('mixedWord').textContent = card.meaning;
      document.getElementById('mixedPhonetic').textContent = '';
      speakBtn.style.display = 'none';
    }

    setTimeout(() => input.focus(), 100);

    const submitBtn = document.getElementById('btnSubmitMixedEssay');
    const newBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newBtn, submitBtn);
    newBtn.addEventListener('click', () => checkMixedEssayAnswer());
    input.onkeydown = (e) => {
      if (e.key === 'Enter' && !input.disabled) checkMixedEssayAnswer();
    };

  } else {
    // Multiple choice
    essayArea.style.display = 'none';
    optionsEl.style.display = '';
    document.getElementById('mixedSetLabel').innerHTML =
      `<span style="color:${card._setColor}">● ${card._setName}</span> · Nghĩa là gì?`;
    document.getElementById('mixedWord').textContent = card.word;
    document.getElementById('mixedPhonetic').textContent = card.phonetic || '';
    speakBtn.style.display = '';
    setTimeout(() => speakWord(card.word), 300);

    // Đáp án sai: ưu tiên lấy từ CÙNG bộ thẻ với câu hỏi
    const sameSetCards = (getSetById(card._setId || '') || { cards: [] }).cards;
    let wrongPool = sameSetCards.filter(c => c.id !== card.id);

    // Nếu cùng bộ không đủ 3 thì bổ sung từ bộ khác
    if (wrongPool.length < 3) {
      let otherCards = [];
      mixedSelectedSets.forEach(id => {
        const s = getSetById(id);
        if (s) s.cards.forEach(c => { if (c.id !== card.id) otherCards.push(c); });
      });
      const extra = otherCards.filter(c => !wrongPool.find(w => w.id === c.id));
      wrongPool = [...wrongPool, ...shuffle(extra)];
    }

    const wrongOpts = shuffle(wrongPool).slice(0, 3).map(c => c.meaning);
    const options = shuffle([card.meaning, ...wrongOpts]);

    optionsEl.innerHTML = '';
    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.textContent = opt;
      btn.addEventListener('click', () => checkMixedAnswer(opt, card, optionsEl));
      optionsEl.appendChild(btn);
    });
  }
}

function checkMixedEssayAnswer() {
  const card = mixedQuizCards[mixedIndex];
  const dir = mixedCardDirections[mixedIndex];
  const input = document.getElementById('mixedEssayInput');
  const userAnswer = input.value.trim();
  if (!userAnswer) return;

  input.disabled = true;
  document.getElementById('btnSubmitMixedEssay').style.display = 'none';

  const correctAnswer = dir === 'en2vi' ? card.meaning : card.word;

  const norm = s => s.toLowerCase().trim().replace(/\s+/g, ' ');
  const isCorrect = norm(userAnswer) === norm(correctAnswer) ||
    normalizeAnswer(userAnswer) === normalizeAnswer(correctAnswer);

  input.style.borderColor = isCorrect ? 'var(--green)' : 'var(--pink)';
  input.style.background = isCorrect ? 'rgba(6,214,160,0.08)' : 'rgba(247,37,133,0.08)';

  mixedResultMap[card.id] = isCorrect;

  const prog = getProgress();
  const cardData = prog[card.id] || SR.getDefaultCard(card.id);
  prog[card.id] = SR.update(cardData, isCorrect ? 4 : 1);
  Storage.saveProgress(prog);

  if (isCorrect) {
    mixedCorrect++;
    AudioFX.correct();
  } else {
    mixedWrong++;
    AudioFX.wrong();
    mixedWrongCards.push(card);
  }

  const fb = document.getElementById('mixedFeedback');
  fb.style.display = '';
  fb.className = isCorrect ? 'quiz-feedback correct-fb' : 'quiz-feedback wrong-fb';
  fb.innerHTML = isCorrect ? '✅ Chính xác!' : `❌ Sai! Đáp án đúng: <strong>"${correctAnswer}"</strong>`;
  document.getElementById('mixedScore').textContent = mixedCorrect;

  const isLastMixed = mixedIndex === mixedQuizCards.length - 1;
  const nextMixedBtn = document.getElementById('btnNextMixed');
  if (isLastMixed) {
    nextMixedBtn.style.display = 'none';
    setTimeout(() => { mixedIndex++; finishMixedQuiz(); }, 1800);
  } else {
    nextMixedBtn.style.display = 'block';
  }
}

function checkMixedAnswer(selected, card, container) {
  const btns = container.querySelectorAll('.quiz-opt');
  btns.forEach(b => {
    b.disabled = true;
    if (b.textContent === card.meaning) b.classList.add('correct');
    if (b.textContent === selected && selected !== card.meaning) b.classList.add('wrong');
  });

  const isCorrect = selected === card.meaning;
  mixedResultMap[card.id] = isCorrect;

  // Cập nhật SR progress
  const prog = getProgress();
  const cardData = prog[card.id] || SR.getDefaultCard(card.id);
  prog[card.id] = SR.update(cardData, isCorrect ? 4 : 1);
  Storage.saveProgress(prog);

  if (isCorrect) {
    mixedCorrect++;
    AudioFX.correct();
  } else {
    mixedWrong++;
    AudioFX.wrong();
    mixedWrongCards.push(card);
  }

  const fb = document.getElementById('mixedFeedback');
  fb.style.display = '';
  fb.className = isCorrect ? 'quiz-feedback correct-fb' : 'quiz-feedback wrong-fb';
  fb.textContent = isCorrect ? '✅ Chính xác!' : `❌ Sai! Đáp án: "${card.meaning}"`;
  document.getElementById('mixedScore').textContent = mixedCorrect;
  const isLastMixed = mixedIndex === mixedQuizCards.length - 1;
  const nextMixedBtn = document.getElementById('btnNextMixed');
  if (isLastMixed) {
    nextMixedBtn.style.display = 'none';
    setTimeout(() => { mixedIndex++; finishMixedQuiz(); }, 1500);
  } else {
    nextMixedBtn.style.display = 'block';
  }
}

function nextMixedQuestion() {
  mixedIndex++;
  if (mixedIndex >= mixedQuizCards.length) finishMixedQuiz();
  else showMixedQuestion();
}

function finishMixedQuiz() {
  Storage.recordStudyToday(mixedQuizCards.map(c => c.id));
  updateStreak();
  const total = mixedQuizCards.length;
  document.getElementById('mixedProgressFill').style.width = '100%';
  document.getElementById('mixedProgressText').textContent = `${total} / ${total}`;

  showResultModal({
    correct: mixedCorrect,
    wrong: mixedWrong,
    wrongCards: mixedWrongCards,
    title: 'Kết quả kiểm tra tổng hợp',
    onAgain: () => restartMixedQuiz(),
    onHome: () => exitMixedQuiz()
  });
}

function exitMixedQuiz() {
  document.getElementById('mixedQuizSession').style.display = 'none';
  document.getElementById('mixedQuizConfig').style.display = '';
  navigateTo('home');
}

function restartMixedQuiz() {
  startMixedQuiz();
}

// ======================================================
// CHỨC NĂNG 2: TẠO BỘ THẺ BẰNG AI
// ======================================================
let aiCurrentTab = 'text';
let aiImageBase64 = null;
let aiImageMime = 'image/jpeg';
let aiFileText = null;
let aiSelectedColor = 0;

function setupAITabs() {
  document.querySelectorAll('.ai-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.ai-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.ai-tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      aiCurrentTab = tab.dataset.tab;
      document.getElementById('aiTab-' + aiCurrentTab).classList.add('active');
    });
  });
}

function setupFileUploads() {
  // Image upload
  const imageZone = document.getElementById('imageUploadZone');
  const imageInput = document.getElementById('imageFileInput');
  imageZone.addEventListener('click', () => imageInput.click());
  imageZone.addEventListener('dragover', e => { e.preventDefault(); imageZone.style.borderColor = 'var(--accent5)'; });
  imageZone.addEventListener('dragleave', () => { imageZone.style.borderColor = ''; });
  imageZone.addEventListener('drop', e => {
    e.preventDefault(); imageZone.style.borderColor = '';
    if (e.dataTransfer.files[0]) handleImageFile(e.dataTransfer.files[0]);
  });
  imageInput.addEventListener('change', e => { if (e.target.files[0]) handleImageFile(e.target.files[0]); });

  // Text file upload
  const fileZone = document.getElementById('fileUploadZone');
  const fileInput = document.getElementById('textFileInput');
  fileZone.addEventListener('click', () => fileInput.click());
  fileZone.addEventListener('dragover', e => { e.preventDefault(); fileZone.style.borderColor = 'var(--accent5)'; });
  fileZone.addEventListener('dragleave', () => { fileZone.style.borderColor = ''; });
  fileZone.addEventListener('drop', e => {
    e.preventDefault(); fileZone.style.borderColor = '';
    if (e.dataTransfer.files[0]) handleTextFile(e.dataTransfer.files[0]);
  });
  fileInput.addEventListener('change', e => { if (e.target.files[0]) handleTextFile(e.target.files[0]); });
}

function handleImageFile(file) {
  if (file.size > 5 * 1024 * 1024) { showNotif('Ảnh quá lớn! Vui lòng chọn ảnh <strong>nhỏ hơn 5MB</strong>.', '⚠️'); ; return; }
  aiImageMime = file.type || 'image/jpeg';
  const reader = new FileReader();
  reader.onload = e => {
    aiImageBase64 = e.target.result.split(',')[1];
    document.getElementById('previewImg').src = e.target.result;
    document.getElementById('imageUploadZone').style.display = 'none';
    document.getElementById('imagePreview').style.display = 'block';
  };
  reader.readAsDataURL(file);
}

function handleTextFile(file) {
  if (file.size > 2 * 1024 * 1024) { showNotif('File quá lớn! Vui lòng chọn file <strong>nhỏ hơn 2MB</strong>.', '⚠️'); ; return; }
  const reader = new FileReader();
  reader.onload = e => {
    aiFileText = e.target.result;
    document.getElementById('fileName').textContent = file.name;
    document.getElementById('fileUploadZone').style.display = 'none';
    document.getElementById('fileInfo').style.display = 'flex';
  };
  reader.readAsText(file, 'UTF-8');
}

function clearImageUpload() {
  aiImageBase64 = null;
  document.getElementById('imageFileInput').value = '';
  document.getElementById('imageUploadZone').style.display = '';
  document.getElementById('imagePreview').style.display = 'none';
}

function clearFileUpload() {
  aiFileText = null;
  document.getElementById('textFileInput').value = '';
  document.getElementById('fileUploadZone').style.display = '';
  document.getElementById('fileInfo').style.display = 'none';
}

function openAIModal() {
  document.getElementById('modalAICreate').classList.add('open');
  document.getElementById('aiResult').style.display = 'none';
  document.getElementById('aiLoading').style.display = 'none';
  document.getElementById('btnGenerateAI').style.display = '';
  document.getElementById('btnSaveAISet').style.display = 'none';
  // Load API key đã lưu
  const savedKey = localStorage.getItem('vocalearn_gemini_key') || '';
  document.getElementById('geminiApiKey').value = savedKey;
  // Setup color picker inside AI modal
  const cp = document.getElementById('aiColorPicker');
  if (!cp.children.length) {
    COLOR_GRADIENTS.forEach((g, i) => {
      const dot = document.createElement('div');
      dot.className = 'color-dot' + (i === 0 ? ' selected' : '');
      dot.style.background = g;
      dot.addEventListener('click', () => {
        cp.querySelectorAll('.color-dot').forEach(d => d.classList.remove('selected'));
        dot.classList.add('selected');
        aiSelectedColor = i;
      });
      cp.appendChild(dot);
    });
  }
}

function toggleKeyVisibility() {
  const inp = document.getElementById('geminiApiKey');
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

function closeAIModal() {
  document.getElementById('modalAICreate').classList.remove('open');
}

function clearAIResult() {
  document.getElementById('aiResult').style.display = 'none';
  document.getElementById('btnGenerateAI').style.display = '';
  document.getElementById('btnSaveAISet').style.display = 'none';
}

async function generateWithAI() {
  const tab = aiCurrentTab;

  // Validate input
  if (tab === 'text' && !document.getElementById('aiTopicInput').value.trim()) {
    showNotif('Vui lòng nhập <strong>chủ đề</strong> hoặc danh sách từ!', '💡'); ; return;
  }
  if (tab === 'image' && !aiImageBase64) {
    showNotif('Vui lòng <strong>tải lên ảnh</strong>!', '🖼️'); ; return;
  }
  if (tab === 'file' && !aiFileText) {
    showNotif('Vui lòng <strong>tải lên file</strong> văn bản!', '📄'); ; return;
  }

  // Kiểm tra API key
  const apiKey = document.getElementById('geminiApiKey').value.trim();
  if (!apiKey) {
    showNotif('Vui lòng nhập <strong>Gemini API Key</strong>!<br><a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--accent5)">Lấy miễn phí tại đây →</a>', '🔑');
    return;
  }
  // Lưu key để lần sau không phải nhập lại
  localStorage.setItem('vocalearn_gemini_key', apiKey);
  // Đồng bộ key lên Firestore để dùng trên mọi thiết bị
  if (window.FirebaseSync) FirebaseSync.triggerSave();

  // Show loading
  document.getElementById('aiLoading').style.display = 'flex';
  document.getElementById('aiResult').style.display = 'none';
  document.getElementById('btnGenerateAI').style.display = 'none';

  const wordCount = tab === 'file'
    ? document.getElementById('aiFileWordCount').value
    : document.getElementById('aiWordCount').value;

  try {
    let prompt = '';
    let parts = [];

    if (tab === 'text') {
      const topic = document.getElementById('aiTopicInput').value.trim();
      prompt = `Tạo ${wordCount} từ vựng tiếng Anh về chủ đề hoặc danh sách sau: "${topic}".
Yêu cầu: phù hợp với học sinh lớp 6 Việt Nam.
Trả về JSON thuần (không có markdown, không có backtick), định dạng:
{"setName":"Tên bộ thẻ ngắn gọn","cards":[{"word":"...","phonetic":"/.../ ","meaning":"...","example":"..."}]}`;
      parts = [{ text: prompt }];

    } else if (tab === 'image') {
      prompt = `Từ ảnh này, hãy trích xuất hoặc tạo ra ${wordCount} từ vựng tiếng Anh phù hợp với nội dung trong ảnh, dành cho học sinh lớp 6 Việt Nam.
Trả về JSON thuần (không có markdown, không có backtick), định dạng:
{"setName":"Tên bộ thẻ ngắn gọn","cards":[{"word":"...","phonetic":"/.../","meaning":"...","example":"..."}]}`;
      const mimeType = aiImageMime || 'image/jpeg';
      parts = [
        { inlineData: { mimeType, data: aiImageBase64 } },
        { text: prompt }
      ];

    } else {
      const content = aiFileText.slice(0, 4000);
      prompt = `Từ nội dung văn bản sau, hãy trích xuất hoặc tạo ra ${wordCount} từ vựng tiếng Anh quan trọng nhất, phù hợp với học sinh lớp 6 Việt Nam.

Nội dung:
${content}

Trả về JSON thuần (không có markdown, không có backtick), định dạng:
{"setName":"Tên bộ thẻ ngắn gọn","cards":[{"word":"...","phonetic":"/.../","meaning":"...","example":"..."}]}`;
      parts = [{ text: prompt }];
    }

    const MODELS = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash-lite-001',
    ];

    let lastError = null;
    let data = null;

    for (const model of MODELS) {
      try {
        document.getElementById('aiLoadingText').textContent = `AI đang xử lý (${model})...`;
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contents: [{ parts }] })
          }
        );
        if (!response.ok) {
          const errJson = await response.json();
          lastError = errJson.error?.message || `HTTP ${response.status}`;
          // Nếu quota lỗi thì thử model tiếp theo
          if (response.status === 429 || lastError.includes('quota') || lastError.includes('Quota')) continue;
          throw new Error(lastError);
        }
        data = await response.json();
        break; // Thành công — thoát vòng lặp
      } catch (e) {
        lastError = e.message;
        if (e.message.includes('quota') || e.message.includes('Quota') || e.message.includes('429')) continue;
        throw e;
      }
    }

    if (!data) throw new Error(
      'Tất cả model đều hết quota hôm nay.\n' +
      'Quota miễn phí reset lúc 00:00 giờ Thái Bình Dương (khoảng 14:00 giờ VN).\n\n' +
      'Chi tiết: ' + lastError
    );
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Hiển thị kết quả
    document.getElementById('aiSetName').value = parsed.setName || 'Bộ thẻ AI';
    document.getElementById('aiWordsOutput').value = parsed.cards
      .map(c => `${c.word} | ${c.phonetic || ''} | ${c.meaning} | ${c.example || ''}`)
      .join('\n');
    document.getElementById('aiResult').style.display = 'block';
    document.getElementById('aiLoading').style.display = 'none';
    document.getElementById('btnSaveAISet').style.display = '';

  } catch (err) {
    document.getElementById('aiLoading').style.display = 'none';
    document.getElementById('btnGenerateAI').style.display = '';
    const isKeyErr = err.message.includes('API_KEY') || err.message.includes('API key');
    showNotif(
      (isKeyErr
        ? '🔑 API Key không hợp lệ.<br><a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--accent5)">Kiểm tra lại tại đây →</a>'
        : '❌ Lỗi kết nối AI:<br><small>' + err.message + '</small>'),
      isKeyErr ? '🔑' : '❌'
    );
  }
}

function saveAISet() {
  const name = document.getElementById('aiSetName').value.trim();
  const rawWords = document.getElementById('aiWordsOutput').value.trim();
  if (!name || !rawWords) { showNotif('Thiếu <strong>tên</strong> hoặc danh sách từ!', '✏️'); ; return; }

  const setId = 'user_' + Date.now();
  const cards = rawWords.split('\n').filter(l => l.trim()).map((line, i) => {
    const parts = line.split('|').map(p => p.trim());
    return { id: `${setId}_card_${i}`, word: parts[0] || '', phonetic: parts[1] || '', meaning: parts[2] || '', example: parts[3] || '' };
  }).filter(c => c.word && c.meaning);

  if (cards.length === 0) { showNotif('Không có từ hợp lệ!', '❌'); ; return; }

  const sets = Storage.getSets();
  sets.push({ id: setId, name, colorIndex: aiSelectedColor, cards });
  Storage.saveSets(sets);
  closeAIModal();
  navigateTo('sets');
  renderSetsPage();
}

// ======================================================
// CHỨC NĂNG PHÁT ÂM – Web Speech API
// ======================================================
let isSpeaking = false;

function speakWord(word) {
  if (!word || !word.trim()) return;
  if (!window.speechSynthesis) {
    console.warn('Trình duyệt không hỗ trợ phát âm');
    return;
  }

  // Hủy phát âm đang chạy nếu có
  window.speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(word.trim());
  utter.lang = 'en-US';
  utter.rate = 0.85;   // Chậm hơn một chút cho dễ nghe
  utter.pitch = 1;
  utter.volume = 1;

  // Chọn giọng tiếng Anh tốt nhất nếu có
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.lang === 'en-US' && v.name.includes('Google')
  ) || voices.find(v =>
    v.lang === 'en-US'
  ) || voices.find(v =>
    v.lang.startsWith('en')
  );
  if (preferred) utter.voice = preferred;

  utter.onstart = () => {
    isSpeaking = true;
    // Highlight nút đang phát
    document.querySelectorAll('.speak-btn, .speak-btn-quiz').forEach(b => b.classList.remove('speaking'));
  };
  utter.onend = () => { isSpeaking = false; };
  utter.onerror = () => { isSpeaking = false; };

  window.speechSynthesis.speak(utter);
}

// Đảm bảo voices đã load (Chrome cần trigger getVoices() trước)
if (window.speechSynthesis) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    window.speechSynthesis.getVoices(); // trigger load
  });
}

// ======================================================
// HIỆU ỨNG ÂM THANH – Web Audio API (không cần file mp3)
// ======================================================
const AudioFX = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    // Resume nếu bị suspend (Chrome policy)
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Tạo oscillator cơ bản
  function osc(freq, type, start, duration, gainVal, ac) {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = type;
    o.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(gainVal, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    o.start(start);
    o.stop(start + duration + 0.01);
  }

  // ✅ ĐÚNG – giai điệu vui, đi lên (do-mi-sol)
  function correct() {
    const ac = getCtx();
    const t = ac.currentTime;
    const notes = [523, 659, 784]; // C5 E5 G5
    notes.forEach((freq, i) => osc(freq, 'sine', t + i * 0.1, 0.25, 0.3, ac));
    // Thêm tiếng "ding" nhỏ
    osc(1046, 'sine', t + 0.3, 0.4, 0.15, ac);
  }

  // ❌ SAI – đi xuống buồn (sol-mi-do)
  function wrong() {
    const ac = getCtx();
    const t = ac.currentTime;
    osc(392, 'sawtooth', t,        0.15, 0.2, ac); // G4
    osc(330, 'sawtooth', t + 0.15, 0.15, 0.2, ac); // E4
    osc(262, 'sawtooth', t + 0.3,  0.3,  0.2, ac); // C4
  }

  // 🏆 HOÀN THÀNH ĐẠT – fanfare ngắn vui vẻ
  function completedPass() {
    const ac = getCtx();
    const t = ac.currentTime;
    // Chord rải lên
    const melody = [523, 659, 784, 1046, 784, 880, 1046];
    melody.forEach((freq, i) => osc(freq, 'sine', t + i * 0.1, 0.35, 0.25, ac));
    // Bass đệm
    [262, 330].forEach((freq, i) => osc(freq, 'triangle', t + i * 0.2, 0.6, 0.15, ac));
  }

  // 📚 HOÀN THÀNH CHƯA ĐẠT – nhẹ nhàng, khuyến khích
  function completedFail() {
    const ac = getCtx();
    const t = ac.currentTime;
    // Giai điệu buồn nhẹ, không quá tiêu cực
    const melody = [523, 494, 440, 392];
    melody.forEach((freq, i) => osc(freq, 'sine', t + i * 0.18, 0.35, 0.2, ac));
    // Kết thúc bằng nốt hỏi (lên một chút)
    osc(440, 'sine', t + 0.8, 0.4, 0.15, ac);
  }

  // ⭐ FLIP THẺ – tiếng "whoosh" nhẹ
  function flip() {
    const ac = getCtx();
    const t = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.connect(g); g.connect(ac.destination);
    o.type = 'sine';
    o.frequency.setValueAtTime(300, t);
    o.frequency.exponentialRampToValueAtTime(600, t + 0.08);
    g.gain.setValueAtTime(0.15, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.15);
    o.start(t); o.stop(t + 0.2);
  }

  // 🔥 STREAK – tiếng "sparkle" khi streak tăng
  function streak() {
    const ac = getCtx();
    const t = ac.currentTime;
    [800, 1000, 1200, 1600].forEach((freq, i) =>
      osc(freq, 'sine', t + i * 0.07, 0.15, 0.12, ac)
    );
  }

  return { correct, wrong, completedPass, completedFail, flip, streak };
})();

// ======================================================
// ÔN TẬP THEO LỊCH SR
// ======================================================
let reviewCards = [];
let reviewIndex = 0;
let reviewCorrect = 0;
let reviewWrong = 0;
let reviewResultMap = {};
let reviewWrongCards = [];

// Lấy tất cả thẻ đang học/đã thuộc và đến hạn ôn — KHÔNG lấy thẻ 'new'
function getDueReviewCards() {
  const prog = getProgress();
  const due = [];
  getAllSets().forEach(set => {
    set.cards.forEach(c => {
      const p = prog[c.id];
      if (p && (p.status === 'learning' || p.status === 'mastered') && SR.isDue(p)) {
        due.push({ ...c, _setId: set.id, _setName: set.name, _setColor: DOT_COLORS[set.colorIndex || 0] });
      }
    });
  });
  return shuffle(due);
}

function startReviewSession() {
  reviewCards = getDueReviewCards();
  if (reviewCards.length === 0) {
    showNotif('Không còn thẻ nào cần ôn tập hôm nay! 🎉', '✅'); ;
    return;
  }
  reviewIndex = 0; reviewCorrect = 0; reviewWrong = 0;
  reviewResultMap = {}; reviewWrongCards = [];

  // Chuyển sang trang review
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-review').classList.add('active');
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));

  document.getElementById('reviewDone').style.display = 'none';
  document.getElementById('reviewQuizArea').style.display = '';
  showReviewQuestion();
}

function showReviewQuestion() {
  const card = reviewCards[reviewIndex];
  document.getElementById('reviewWord').textContent = card.word;
  document.getElementById('reviewPhonetic').textContent = card.phonetic || '';
  document.getElementById('reviewSetLabel').innerHTML =
    `<span style="color:${card._setColor}">● ${card._setName}</span>`;
  document.getElementById('reviewFeedback').style.display = 'none';
  document.getElementById('btnNextReview').style.display = 'none';

  // Tiến độ bắt đầu từ 1
  const pct = Math.round((reviewIndex + 1) / reviewCards.length * 100);
  document.getElementById('reviewProgressFill').style.width = pct + '%';
  document.getElementById('reviewProgressText').textContent = `${reviewIndex + 1} / ${reviewCards.length}`;
  document.getElementById('reviewScore').textContent = reviewCorrect;

  setTimeout(() => speakWord(card.word), 300);

  // Ưu tiên đáp án sai từ cùng bộ thẻ
  const sameSet = getSetById(card._setId || '') || { cards: [] };
  let wrongPool = sameSet.cards.filter(c => c.id !== card.id);
  if (wrongPool.length < 3) {
    const extra = getAllSets().flatMap(s => s.cards).filter(c => c.id !== card.id && !wrongPool.find(w => w.id === c.id));
    wrongPool = [...wrongPool, ...shuffle(extra)];
  }
  const wrongOpts = shuffle(wrongPool).slice(0, 3).map(c => c.meaning);
  const options = shuffle([card.meaning, ...wrongOpts]);

  const container = document.getElementById('reviewOptions');
  container.innerHTML = '';
  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className = 'quiz-opt';
    btn.textContent = opt;
    btn.addEventListener('click', () => checkReviewAnswer(opt, card, container));
    container.appendChild(btn);
  });
}

function checkReviewAnswer(selected, card, container) {
  const btns = container.querySelectorAll('.quiz-opt');
  btns.forEach(b => {
    b.disabled = true;
    if (b.textContent === card.meaning) b.classList.add('correct');
    if (b.textContent === selected && selected !== card.meaning) b.classList.add('wrong');
  });

  const isCorrect = selected === card.meaning;
  reviewResultMap[card.id] = isCorrect;

  // Cập nhật SR
  const prog = getProgress();
  const cardData = prog[card.id] || SR.getDefaultCard(card.id);
  prog[card.id] = SR.update(cardData, isCorrect ? 4 : 1);
  Storage.saveProgress(prog);

  if (isCorrect) {
    reviewCorrect++;
    AudioFX.correct();
  } else {
    reviewWrong++;
    AudioFX.wrong();
    reviewWrongCards.push(card);
  }

  const fb = document.getElementById('reviewFeedback');
  fb.style.display = '';
  fb.className = isCorrect ? 'quiz-feedback correct-fb' : 'quiz-feedback wrong-fb';
  fb.textContent = isCorrect ? '✅ Chính xác!' : `❌ Đáp án đúng: "${card.meaning}"`;
  document.getElementById('reviewScore').textContent = reviewCorrect;
  const isLastReview = reviewIndex === reviewCards.length - 1;
  const nextReviewBtn = document.getElementById('btnNextReview');
  if (isLastReview) {
    nextReviewBtn.style.display = 'none';
    setTimeout(() => { reviewIndex++; finishReview(); }, 1500);
  } else {
    nextReviewBtn.style.display = 'block';
  }
}

function nextReviewQuestion() {
  reviewIndex++;
  if (reviewIndex >= reviewCards.length) finishReview();
  else showReviewQuestion();
}

function finishReview() {
  Storage.recordStudyToday(reviewCards.map(c => c.id));
  updateStreak();
  const total = reviewCards.length;
  document.getElementById('reviewProgressFill').style.width = '100%';
  document.getElementById('reviewProgressText').textContent = `${total} / ${total}`;

  const hasWrong = reviewWrongCards.length > 0;
  showResultModal({
    correct: reviewCorrect,
    wrong: reviewWrong,
    wrongCards: reviewWrongCards,
    title: 'Kết quả ôn tập',
    onAgain: hasWrong ? () => restartReviewWrong() : null,
    onHome: () => { closeResultModal(); exitReview(); }
  });

  renderHome(); // Cập nhật lại số "Cần ôn tập"
}

function restartReviewWrong() {
  // Chỉ ôn lại các thẻ trả lời sai
  reviewCards = shuffle(reviewWrongCards);
  reviewIndex = 0; reviewCorrect = 0; reviewWrong = 0;
  reviewResultMap = {}; reviewWrongCards = [];
  document.getElementById('reviewDone').style.display = 'none';
  document.getElementById('reviewQuizArea').style.display = '';
  showReviewQuestion();
}

function exitReview() {
  navigateTo('home');
}

// ======================================================
// ĐẶT TÊN NGƯỜI DÙNG
// ======================================================
function promptSetName() {
  const current = localStorage.getItem('vocalearn_username') || '';
  const name = prompt('Nhập tên của bạn:', current);
  if (name === null) return;
  const trimmed = name.trim().slice(0, 30);
  localStorage.setItem('vocalearn_username', trimmed);
  renderHome();
}

// ======================================================
// XUẤT / NHẬP DỮ LIỆU
// ======================================================
function exportData() {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    sets: Storage.getSets(),
    progress: Storage.getProgress(),
    stats: Storage.getStats(),
    streak: Storage.getStreak(),
    username: localStorage.getItem('vocalearn_username') || '',
    chatSessions: JSON.parse(localStorage.getItem('vocalearn_chat_sessions') || '[]')
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vocalearn_backup_${getLocalDateStr()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.sets || !Array.isArray(data.sets)) throw new Error('File không hợp lệ');
      const ok = await showConfirm(
        `Tìm thấy <strong>${data.sets.length} bộ thẻ</strong>.<br>Nhập sẽ <span style="color:var(--pink)">ghi đè</span> dữ liệu hiện tại. Bạn có chắc không?`,
        '📥'
      );
      if (!ok) return;
      Storage.saveSets(data.sets);
      if (data.progress) Storage.saveProgress(data.progress);
      if (data.stats) Storage.saveStats(data.stats);
      if (data.streak) Storage.saveStreak(data.streak);
      if (data.username) localStorage.setItem('vocalearn_username', data.username);
      if (data.trash && Array.isArray(data.trash)) {
        localStorage.setItem('vocalearn_trash', JSON.stringify(data.trash));
        if (typeof AutoSave !== 'undefined') AutoSave.triggerSave();
      }
      if (data.chatSessions && Array.isArray(data.chatSessions)) {
        localStorage.setItem('vocalearn_chat_sessions', JSON.stringify(data.chatSessions));
      }
      renderSetsPage();
      renderHome();
      updateTrashBadge();
      showNotif(`Đã nhập thành công <strong>${data.sets.length} bộ thẻ</strong>!`, '✅');
    } catch (err) {
      showNotif('Lỗi khi đọc file: <br><small>' + err.message + '</small>', '❌');
    }
    e.target.value = '';
  };
  reader.readAsText(file);
}

// ============================================================
// CHAT PAGE
// ============================================================

// ===== CHAT SESSIONS MODULE =====
const ChatSessions = {
  KEY: 'vocalearn_chat_sessions',
  MAX: 60,

  getAll() {
    try { return JSON.parse(localStorage.getItem(this.KEY)) || []; }
    catch { return []; }
  },

  _save(list) {
    localStorage.setItem(this.KEY, JSON.stringify(list));
    if (typeof AutoSave !== 'undefined') AutoSave.triggerSave();
  },

  create() {
    const id = 'cs_' + Date.now();
    const list = this.getAll();
    list.unshift({ id, title: 'Cuộc hội thoại mới', createdAt: new Date().toISOString(), messages: [] });
    if (list.length > this.MAX) list.splice(this.MAX);
    this._save(list);
    return id;
  },

  get(id) {
    return this.getAll().find(s => s.id === id) || null;
  },

  update(id, messages) {
    const list = this.getAll();
    const idx = list.findIndex(s => s.id === id);
    if (idx === -1) return;
    const firstUser = messages.find(m => m.role === 'user');
    if (firstUser && list[idx].title === 'Cuộc hội thoại mới') {
      const raw = firstUser.content.trim().replace(/\n/g, ' ');
      list[idx].title = raw.length > 42 ? raw.slice(0, 42) + '\u2026' : raw;
    }
    list[idx].messages  = messages;
    list[idx].updatedAt = new Date().toISOString();
    this._save(list);
  },

  delete(id) {
    this._save(this.getAll().filter(s => s.id !== id));
  },

  timeAgo(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (m < 1)  return 'Vừa xong';
    if (m < 60) return m + ' phút trước';
    if (h < 24) return h + ' giờ trước';
    if (d < 7)  return d + ' ngày trước';
    return new Date(iso).toLocaleDateString('vi-VN');
  }
};

let chatHistory = []; // {role, content, ts?, _parts?}[]
let chatTyping  = false;
let _currentSessionId = null;

function _saveSession() {
  if (!_currentSessionId) return;
  if (!chatHistory.some(m => m.role === 'user')) return;
  const toSave = chatHistory.map(m => ({ role: m.role, content: m.content, ts: m.ts || new Date().toISOString() }));
  ChatSessions.update(_currentSessionId, toSave);
  _renderHistSidebar();
}

function startNewChat() {
  _saveSession();
  chatHistory = [];
  chatTyping  = false;
  _currentSessionId = ChatSessions.create();
  _showWelcome();
  _renderHistSidebar();
}

function _loadSession(id) {
  _saveSession();
  const sess = ChatSessions.get(id);
  if (!sess) return;
  _currentSessionId = id;
  chatHistory = sess.messages.map(m => ({ role: m.role, content: m.content, ts: m.ts }));
  const box = document.getElementById('chatMessages');
  box.innerHTML = '';
  const username = localStorage.getItem('vocalearn_username') || '';
  const name = username ? ' <strong>' + username + '</strong>' : '';
  box.innerHTML = '<div class="chat-bubble chat-bubble-ai"><div class="chat-avatar">🤖</div><div class="chat-text">Lịch sử hội thoại' + name + ' 📖</div></div>';
  sess.messages.forEach(m => appendBubble(m.role === 'user' ? 'user' : 'ai', m.content));
  box.scrollTop = box.scrollHeight;
  _renderHistSidebar();
}

function _showWelcome() {
  const box = document.getElementById('chatMessages');
  if (!box) return;
  box.innerHTML = '';
  const username = localStorage.getItem('vocalearn_username') || '';
  const greeting = username ? 'Xin chào <strong>' + username + '</strong>!' : 'Xin chào!';
  box.innerHTML = '<div class="chat-bubble chat-bubble-ai"><div class="chat-avatar">🤖</div><div class="chat-text">' + greeting + ' Tôi là trợ lý AI của VocaLearn. Tôi có thể giúp bạn:<br><br>• Giải thích nghĩa và cách dùng từ vựng<br>• Giải thích ngữ pháp tiếng Anh<br>• Gợi ý cách học từ vựng hiệu quả<br>• Đặt câu ví dụ với từ bạn muốn<br><br>Bạn muốn hỏi gì nào? 😊</div></div>';
}

function _renderHistSidebar() {
  const list = document.getElementById('chatHistList');
  if (!list) return;
  const all = ChatSessions.getAll().filter(s => s.messages && s.messages.length > 0);
  if (all.length === 0) {
    list.innerHTML = '<div class="chat-hist-empty">Chưa có lịch sử.<br>Bắt đầu trò chuyện<br>để lưu lại.</div>';
    return;
  }
  list.innerHTML = all.map(s =>
    '<div class="chat-hist-item' + (s.id === _currentSessionId ? ' active' : '') + '" data-id="' + s.id + '">' +
    '<span class="chi-icon">💬</span>' +
    '<div class="chi-body"><div class="chi-title">' + escapeHtml(s.title) + '</div>' +
    '<div class="chi-date">' + ChatSessions.timeAgo(s.updatedAt || s.createdAt) + '</div></div>' +
    '<button class="chi-del" data-del="' + s.id + '" title="Xóa">✕</button></div>'
  ).join('');

  list.querySelectorAll('.chat-hist-item').forEach(el => {
    el.addEventListener('click', e => {
      if (e.target.closest('.chi-del')) return;
      _loadSession(el.dataset.id);
    });
  });
  list.querySelectorAll('.chi-del').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const ok = await showConfirm('Xóa cuộc hội thoại này?', '🗑️');
      if (!ok) return;
      ChatSessions.delete(btn.dataset.del);
      if (btn.dataset.del === _currentSessionId) startNewChat();
      else _renderHistSidebar();
    });
  });
}

function renderChatPage() {
  const savedKey = localStorage.getItem('vocalearn_gemini_key') || '';
  const bar = document.getElementById('chatApiKeyBar');
  if (savedKey) {
    bar.innerHTML = '<span class="chat-apikey-icon">🔑</span><div class="chat-key-saved-badge">✅ Gemini API Key đã được lưu</div><button class="btn-ghost" id="chatApiKeyResetBtn" style="font-size:0.8rem;padding:0.3rem 0.6rem">Đổi key</button>';
    document.getElementById('chatApiKeyResetBtn').onclick = () => {
      localStorage.removeItem('vocalearn_gemini_key');
      if (window.FirebaseSync) FirebaseSync.triggerSave();
      renderChatPage();
    };
  } else {
    document.getElementById('chatApiKeySaveBtn').onclick = () => {
      const key = document.getElementById('chatApiKeyInput').value.trim();
      if (!key.startsWith('AIza')) {
        showNotif('API Key không hợp lệ. Gemini key phải bắt đầu bằng <strong>AIza</strong>', '⚠️');
        return;
      }
      localStorage.setItem('vocalearn_gemini_key', key);
      // Đồng bộ key lên Firestore để dùng trên mọi thiết bị
      if (window.FirebaseSync) FirebaseSync.triggerSave();
      renderChatPage();
      showNotif('Đã lưu Gemini API Key thành công! Đang đồng bộ...', '✅');
    };
    document.getElementById('chatApiKeyInput').onkeydown = e => {
      if (e.key === 'Enter') document.getElementById('chatApiKeySaveBtn').click();
    };
  }

  if (!_currentSessionId) {
    _currentSessionId = ChatSessions.create();
    _showWelcome();
  }

  const btnNew = document.getElementById('btnNewChat');
  if (btnNew && !btnNew._wired) {
    btnNew._wired = true;
    btnNew.addEventListener('click', startNewChat);
  }

  _renderHistSidebar();
  setupChatInput();
  loadModelStatus();

  const btnRefresh = document.getElementById('btnRefreshModels');
  if (btnRefresh) btnRefresh.onclick = () => loadModelStatus(true);
}
async function loadModelStatus(forceRefresh = false) {
  const label = document.getElementById('modelStatusLabel');
  const btn   = document.getElementById('btnRefreshModels');
  if (!label) return;

  const apiKey = localStorage.getItem('vocalearn_gemini_key');
  if (!apiKey) {
    label.textContent = '🔑 Chưa có API key';
    return;
  }

  if (forceRefresh) {
    GeminiModels.clearCache();
    label.textContent = '⏳ Đang tải danh sách model...';
    if (btn) { btn.disabled = true; btn.textContent = '⏳'; }
  }

  try {
    const models = await GeminiModels.getModels(apiKey, forceRefresh);
    const info = GeminiModels.getCacheInfo();
    const ageHr = info ? Math.round(info.age / 3600000) : 0;
    const ageStr = ageHr < 1 ? 'vừa cập nhật' : ageHr + 'h trước';
    label.innerHTML = '✅ <strong>' + models.length + ' model</strong> · ' + ageStr
      + ' <span class="model-list-toggle" onclick="toggleModelList()" style="cursor:pointer;color:var(--blue);font-size:0.8rem">[xem]</span>';
    label.title = models.join(', ');

    // Render model list popup
    let popup = document.getElementById('modelListPopup');
    if (!popup) {
      popup = document.createElement('div');
      popup.id = 'modelListPopup';
      popup.className = 'model-list-popup';
      popup.style.display = 'none';
      document.getElementById('modelStatusBar').appendChild(popup);
    }
    popup.innerHTML = '<strong>Model đang dùng (ưu tiên từ trên):</strong><ol>'
      + models.map(m => '<li>' + m + '</li>').join('') + '</ol>';
  } catch (e) {
    label.textContent = '⚠️ Không tải được model';
  }

  if (btn) { btn.disabled = false; btn.textContent = '🔄'; }
}

function toggleModelList() {
  const popup = document.getElementById('modelListPopup');
  if (popup) popup.style.display = popup.style.display === 'none' ? '' : 'none';
}

// Attached files state
let chatAttachments = []; // [{type, name, mimeType, data}]

function setupChatInput() {
  const input   = document.getElementById('chatInput');
  const sendBtn = document.getElementById('chatSendBtn');
  const attachBtn  = document.getElementById('chatAttachBtn');
  const fileInput  = document.getElementById('chatFileInput');
  if (input._chatReady) return;
  input._chatReady = true;

  // Auto-resize textarea
  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 140) + 'px';
  });

  // Send on Enter (Shift+Enter = newline)
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  });

  sendBtn.addEventListener('click', sendChatMessage);

  // Attach button → open file picker
  attachBtn.addEventListener('click', () => fileInput.click());

  // Handle file selection
  fileInput.addEventListener('change', async () => {
    const files = Array.from(fileInput.files);
    fileInput.value = '';
    for (const file of files) {
      await processAttachFile(file);
    }
  });

  // Drag & drop onto chat area
  const chatWrap = document.querySelector('.chat-wrap');
  chatWrap.addEventListener('dragover', e => { e.preventDefault(); chatWrap.classList.add('drag-over'); });
  chatWrap.addEventListener('dragleave', () => chatWrap.classList.remove('drag-over'));
  chatWrap.addEventListener('drop', async e => {
    e.preventDefault();
    chatWrap.classList.remove('drag-over');
    const files = Array.from(e.dataTransfer.files);
    for (const file of files) await processAttachFile(file);
  });
}

async function processAttachFile(file) {
  const maxMB = 10;
  if (file.size > maxMB * 1024 * 1024) {
    showNotif('File "' + file.name + '" quá lớn (tối đa ' + maxMB + 'MB)', '⚠️');
    return;
  }

  const ext = file.name.split('.').pop().toLowerCase();
  const isImage = file.type.startsWith('image/');
  const isPDF   = file.type === 'application/pdf' || ext === 'pdf';
  const isDocx  = ext === 'docx' || ext === 'doc';
  const isTxt   = ext === 'txt' || file.type === 'text/plain';

  if (!isImage && !isPDF && !isDocx && !isTxt) {
    showNotif('Định dạng "' + ext + '" chưa được hỗ trợ. Dùng: ảnh, PDF, DOCX, TXT', '⚠️');
    return;
  }

  // Show loading chip immediately
  const loadingId = 'attach-loading-' + Date.now();
  const preview = document.getElementById('chatAttachPreview');
  if (preview) {
    preview.style.display = '';
    const chip = document.createElement('div');
    chip.className = 'attach-chip attach-chip-loading';
    chip.id = loadingId;
    chip.innerHTML = '<span class="attach-spinner">⏳</span><span>' + file.name + '</span>';
    preview.appendChild(chip);
    document.getElementById('chatAttachHint').style.display = 'none';
  }

  try {
    if (isImage) {
      // Ảnh → base64, gửi inline tới Gemini
      const base64 = await fileToBase64(file);
      chatAttachments.push({ type: 'image', name: file.name, mimeType: file.type, data: base64 });
      renderAttachPreview();

    } else if (isTxt) {
      const text = await file.text();
      chatAttachments.push({ type: 'text', name: file.name, mimeType: 'text/plain', data: text });
      renderAttachPreview();

    } else if (isPDF) {
      const text = await extractPDFText(file);
      chatAttachments.push({ type: 'text', name: file.name, mimeType: 'application/pdf', data: text });
      renderAttachPreview();

    } else if (isDocx) {
      const text = await extractDocxText(file);
      chatAttachments.push({ type: 'text', name: file.name, mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', data: text });
      renderAttachPreview();
    }
  } catch (err) {
    // show inline error in chip
    const errChip = document.getElementById(loadingId);
    if (errChip) errChip.innerHTML = '<span>❌</span><span style="color:var(--accent)">' + file.name + ': ' + err.message + '</span><button class="attach-remove" onclick="this.parentElement.remove()">✕</button>';
    else showNotif('Không đọc được "' + file.name + '"', '❌');
    return;
  }
  // Remove loading chip (renderAttachPreview will re-render)
  const lc = document.getElementById(loadingId);
  if (lc) lc.remove();
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function extractPDFText(file) {
  // Dùng pdf.js từ CDN
  if (!window.pdfjsLib) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js');
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= Math.min(pdf.numPages, 30); i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    fullText += content.items.map(s => s.str).join(' ') + '\n';
  }
  if (!fullText.trim()) throw new Error('PDF không có text (có thể là ảnh scan)');
  return fullText.trim().slice(0, 15000); // giới hạn token
}

async function extractDocxText(file) {
  // Dùng mammoth.js từ CDN
  if (!window.mammoth) {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js');
  }
  const arrayBuffer = await file.arrayBuffer();
  const result = await window.mammoth.extractRawText({ arrayBuffer });
  if (!result.value.trim()) throw new Error('File Word trống hoặc không đọc được');
  return result.value.trim().slice(0, 15000);
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src="' + src + '"]')) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

function renderAttachPreview() {
  const preview = document.getElementById('chatAttachPreview');
  const hint    = document.getElementById('chatAttachHint');
  if (!chatAttachments.length) {
    preview.style.display = 'none';
    hint.style.display = '';
    return;
  }
  preview.style.display = '';
  hint.style.display = 'none';
  preview.innerHTML = chatAttachments.map((att, i) => {
    if (att.type === 'image') {
      return `<div class="attach-chip attach-chip-img" title="${att.name}">
        <img src="data:${att.mimeType};base64,${att.data}" alt="${att.name}">
        <span>${att.name}</span>
        <button class="attach-remove" onclick="removeAttachment(${i})">✕</button>
      </div>`;
    }
    const icon = att.mimeType.includes('pdf') ? '📑' : att.mimeType.includes('word') ? '📝' : '📄';
    const size = (att.data.length / 1000).toFixed(0);
    return `<div class="attach-chip" title="${att.name}">
      <span class="attach-icon">${icon}</span>
      <div class="attach-info"><span class="attach-name">${att.name}</span><span class="attach-size">${size}k ký tự</span></div>
      <button class="attach-remove" onclick="removeAttachment(${i})">✕</button>
    </div>`;
  }).join('');
}

function removeAttachment(i) {
  chatAttachments.splice(i, 1);
  renderAttachPreview();
}

function sendChatMessage() {
  if (chatTyping) return;
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text && !chatAttachments.length) return;

  const attachSnap = [...chatAttachments];
  chatAttachments = [];
  renderAttachPreview();
  input.value = '';
  input.style.height = 'auto';

  // Build display label for user bubble
  let displayText = text || '(Đính kèm file)';
  if (attachSnap.length) {
    displayText += '\n📎 ' + attachSnap.map(a => a.name).join(', ');
  }
  appendBubble('user', displayText, attachSnap.filter(a => a.type === 'image').map(a => ({ mimeType: a.mimeType, data: a.data })));

  // Build Gemini content parts
  const parts = [];
  // Text files → inject as context text
  const textFiles = attachSnap.filter(a => a.type === 'text');
  let contextBlock = '';
  if (textFiles.length) {
    contextBlock = textFiles.map(f => `\n\n--- NỘI DUNG FILE: ${f.name} ---\n${f.data}\n--- HẾT FILE ---`).join('');
  }
  const fullText = (text || 'Hãy phân tích nội dung file đính kèm.') + contextBlock;
  parts.push({ text: fullText });

  // Images → inline_data
  attachSnap.filter(a => a.type === 'image').forEach(img => {
    parts.push({ inline_data: { mime_type: img.mimeType, data: img.data } });
  });

  chatHistory.push({ role: 'user', content: text || '[File đính kèm]', _parts: parts, ts: new Date().toISOString() });

  // Phát hiện ý định tạo bộ thẻ từ tin nhắn người dùng
  if (text && detectFlashcardIntent(text)) {
    const topic = extractTopicFromMessage(text);
    showTypingIndicator();
    // Đợi một chút rồi hiện xác nhận thay vì gọi chat API
    setTimeout(() => {
      removeTypingIndicator();
      offerFlashcardConfirm(topic);
    }, 500);
    return;
  }

  showTypingIndicator();
  callChatAPI();
}

function appendBubble(role, text, images) {
  const messages = document.getElementById('chatMessages');
  const bubble = document.createElement('div');
  bubble.className = `chat-bubble chat-bubble-${role === 'user' ? 'user' : 'ai'}`;
  let imgHtml = '';
  if (images && images.length) {
    imgHtml = images.map(img => `<img src="data:${img.mimeType};base64,${img.data}" class="chat-inline-img" alt="ảnh đính kèm">`).join('');
  }
  bubble.innerHTML = `
    <div class="chat-avatar">${role === 'user' ? '👤' : '🤖'}</div>
    <div class="chat-text">${imgHtml}${renderMarkdown(text)}</div>
  `;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
  return bubble;
}

function renderMarkdown(text) {
  // Basic markdown: **bold**, *italic*, bullet *, numbered list, code`
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/^\* (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
    .replace(/\n/g, '<br>');
}

function showTypingIndicator() {
  chatTyping = true;
  document.getElementById('chatSendBtn').disabled = true;
  const messages = document.getElementById('chatMessages');
  const typing = document.createElement('div');
  typing.className = 'chat-bubble chat-bubble-ai';
  typing.id = 'chatTypingIndicator';
  typing.innerHTML = `
    <div class="chat-avatar">🤖</div>
    <div class="chat-typing"><span></span><span></span><span></span></div>
  `;
  messages.appendChild(typing);
  messages.scrollTop = messages.scrollHeight;
}

function removeTypingIndicator() {
  chatTyping = false;
  document.getElementById('chatSendBtn').disabled = false;
  const el = document.getElementById('chatTypingIndicator');
  if (el) el.remove();
}

function escapeHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ===== GEMINI MODEL MANAGER =====
const GeminiModels = {
  CACHE_KEY: 'vocalearn_gemini_models',
  CACHE_TTL: 24 * 60 * 60 * 1000, // 24 giờ

  // Fallback cứng khi không fetch được
  FALLBACK: [
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite'
  ],

  // Ưu tiên model nào trước (prefix match, loại trừ model đã khai tử)
  DEPRECATED: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.0'],

  PRIORITY_PREFIXES: [
    'gemini-2.5-flash',
    'gemini-2.5',
    'gemini-2.0-flash-lite',
    'gemini-2.0',
  ],

  _sortModels(names) {
    return names.slice().sort((a, b) => {
      const rankA = this.PRIORITY_PREFIXES.findIndex(p => a.startsWith(p));
      const rankB = this.PRIORITY_PREFIXES.findIndex(p => b.startsWith(p));
      const ra = rankA === -1 ? 999 : rankA;
      const rb = rankB === -1 ? 999 : rankB;
      if (ra !== rb) return ra - rb;
      return a.localeCompare(b);
    });
  },

  // Lấy danh sách model (từ cache hoặc fetch mới)
  async getModels(apiKey, forceRefresh = false) {
    if (!forceRefresh) {
      const cached = this._getCache();
      if (cached) return cached;
    }
    try {
      const models = await this._fetchFromAPI(apiKey);
      this._saveCache(models);
      return models;
    } catch (e) {
      console.warn('GeminiModels fetch failed, using fallback:', e);
      return this.FALLBACK;
    }
  },

  async _fetchFromAPI(apiKey) {
    // Thử cả v1 và v1beta
    for (const ver of ['v1', 'v1beta']) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/${ver}/models?key=${apiKey}&pageSize=50`
        );
        const data = await res.json();
        if (data.error) continue;

        const names = (data.models || [])
          .filter(m => {
            const name = (m.name || '').replace('models/', '');
            const methods = m.supportedGenerationMethods || [];
            return (
              name.includes('gemini') &&
              !name.includes('embedding') &&
              !name.includes('vision') &&
              !name.includes('aqa') &&
              !this.DEPRECATED.some(d => name.startsWith(d)) &&
              methods.includes('generateContent')
            );
          })
          .map(m => m.name.replace('models/', ''));

        if (names.length > 0) return this._sortModels(names);
      } catch (e) { continue; }
    }
    throw new Error('Cannot fetch models from both v1 and v1beta');
  },

  _getCache() {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (!raw) return null;
      const { models, ts } = JSON.parse(raw);
      if (Date.now() - ts > this.CACHE_TTL) return null;
      return models;
    } catch { return null; }
  },

  _saveCache(models) {
    localStorage.setItem(this.CACHE_KEY, JSON.stringify({ models, ts: Date.now() }));
  },

  clearCache() {
    localStorage.removeItem(this.CACHE_KEY);
  },

  getCacheInfo() {
    try {
      const raw = localStorage.getItem(this.CACHE_KEY);
      if (!raw) return null;
      const { models, ts } = JSON.parse(raw);
      return { models, ts, age: Date.now() - ts };
    } catch { return null; }
  }
};

async function callChatAPI() {
  // Dùng chung Gemini key với tính năng tạo bộ thẻ AI
  const apiKey = localStorage.getItem('vocalearn_gemini_key');
  if (!apiKey) {
    removeTypingIndicator();
    appendErrorBubble('Vui lòng nhập Gemini API Key để sử dụng trợ lý AI.<br><a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--blue)">Lấy miễn phí tại đây →</a>');
    return;
  }

  const allSets = getAllSets();
  const prog = getProgress();
  const masteredCount = getMasteredCount();
  const totalCount = getTotalCards();

  // Build full structured vocabulary context grouped by set
  const setsContext = [];
  allSets.forEach(function(s) {
    var cards = s.cards.map(function(c) {
      var p = prog[c.id];
      var status = p ? p.status : 'new';
      return '    - ' + c.word
        + (c.phonetic ? ' ' + c.phonetic : '')
        + ': ' + c.meaning
        + (c.example ? ' | Ví dụ: ' + c.example : '')
        + ' [' + status + ']';
    });
    if (cards.length > 0) {
      setsContext.push('Bộ thẻ "' + s.name + '" (' + cards.length + ' từ):\n' + cards.join('\n'));
    }
  });

  var systemPrompt = 'Bạn là trợ lý AI của VocaLearn – ứng dụng học từ vựng tiếng Anh. Hãy trả lời bằng tiếng Việt, thân thiện và dễ hiểu.\n\n'
    + 'Nhiệm vụ: giải thích từ vựng, ngữ pháp tiếng Anh, gợi ý mẹo học, đặt câu ví dụ.\n\n'
    + 'QUAN TRỌNG: Khi người dùng hỏi về một từ hoặc bộ thẻ cụ thể, hãy ưu tiên dùng đúng dữ liệu từ vựng bên dưới của họ (nghĩa, phiên âm, ví dụ) thay vì tự nghĩ ra.\n\n'
    + '=== DỮ LIỆU TỪ VỰNG CỦA NGƯỜI DÙNG ===\n'
    + '- Tổng: ' + totalCount + ' từ | Đã thuộc: ' + masteredCount + ' từ\n'
    + '- Trạng thái: new = chưa học, learning = đang học, mastered = đã thuộc\n\n'
    + setsContext.join('\n\n')
    + '\n\nTrả lời ngắn gọn, súc tích. Dùng emoji vừa phải để tạo cảm giác thân thiện.';

  // Build Gemini contents — support multipart (text + images) when _parts present
  const contents = chatHistory.map(function(m) {
    return {
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: m._parts || [{ text: m.content }]
    };
  });

  // Lấy danh sách model tự động (có cache 24h)
  const MODELS = await GeminiModels.getModels(apiKey);

  // Nhúng system prompt vào message đầu làm fallback nếu system_instruction không được hỗ trợ
  const contentsWithSystem = [
    { role: 'user', parts: [{ text: '(Hướng dẫn hệ thống – hãy tuân theo): ' + systemPrompt + '\n\n---\nBắt đầu hội thoại.' }] },
    { role: 'model', parts: [{ text: 'Đã hiểu! Tôi sẵn sàng hỗ trợ bạn.' }] },
    ...contents
  ];

  for (let mi = 0; mi < MODELS.length; mi++) {
    const model = MODELS[mi];
    // Thử cả v1 và v1beta cho mỗi model
    let succeeded = false;
    for (const apiVer of ['v1', 'v1beta']) {
      try {
        const response = await fetch(
          'https://generativelanguage.googleapis.com/' + apiVer + '/models/' + model + ':generateContent?key=' + apiKey,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemPrompt }] },
              contents: contents,
              generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
            })
          // Note: if system_instruction fails (400), we retry below with embedded system prompt
          }
        );

        const data = await response.json();

        if (data.error) {
          const code = data.error.code;
          const msg  = data.error.message || '';
          // Model không tồn tại hoặc không hỗ trợ version API này → thử version kia
          if (msg.includes('not found') || msg.includes('not supported') || msg.includes('does not exist')) break;
          // Rate limit → thử model tiếp theo
          if (code === 429) break;
          // Key bị khoá hoặc không có quyền
          if (code === 403 || msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
            removeTypingIndicator();
            appendErrorBubble('🔑 Gemini API Key không hợp lệ hoặc đã bị thu hồi.<br><a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--blue)">Kiểm tra lại tại đây →</a>');
            return;
          }
          console.warn('[VocaLearn] API error', code, msg, 'model:', model, 'ver:', apiVer);
          // 400: thử lại không dùng system_instruction, nhúng vào contents
          if (code === 400) {
            try {
              const r2 = await fetch(
                'https://generativelanguage.googleapis.com/' + apiVer + '/models/' + model + ':generateContent?key=' + apiKey,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    contents: contentsWithSystem,
                    generationConfig: { maxOutputTokens: 1000, temperature: 0.7 }
                  })
                }
              );
              const d2 = await r2.json();
              if (!d2.error) {
                const reply2 = (d2.candidates && d2.candidates[0] && d2.candidates[0].content && d2.candidates[0].content.parts
                  ? d2.candidates[0].content.parts.map(function(p) { return p.text || ''; }).join('') : '');
                removeTypingIndicator();
                chatHistory.push({ role: 'assistant', content: reply2, ts: new Date().toISOString() });
                appendBubble('ai', reply2);
                _saveSession();
                return;
              }
            } catch(e2) {}
            break; // thử model tiếp
          }
          // Lỗi khác → thử version kia
          continue;
        }

        // Thành công
        const reply = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts
          ? data.candidates[0].content.parts.map(function(p) { return p.text || ''; }).join('')
          : '');
        removeTypingIndicator();
        chatHistory.push({ role: 'assistant', content: reply, ts: new Date().toISOString() });
        appendBubble('ai', reply);
        _saveSession();
        return;

      } catch (err) {
        // Network error, thử version kia
        continue;
      }
    }
  }

  // Tất cả đều thất bại
  removeTypingIndicator();
  GeminiModels.clearCache(); // Xóa cache để lần sau fetch lại
  appendErrorBubble('Không gửi được tin nhắn 😓 Vui lòng nhấn 🔄 để thử lại. <button onclick="sendChatMessage()" style="margin-left:8px;padding:3px 10px;border-radius:6px;border:1px solid var(--blue);background:transparent;color:var(--blue);cursor:pointer;font-size:0.85rem">🔄 Thử lại</button>');
}

// ===== AUTO FLASHCARD OFFER FROM CHAT =====
// ===== CHAT → FLASHCARD: CHỈ KHI NGƯỜI DÙNG YÊU CẦU =====

// Từ khoá nhận diện ý định tạo bộ thẻ từ tin nhắn người dùng
function detectFlashcardIntent(text) {
  const lower = text.toLowerCase();
  const keywords = [
    'tạo bộ thẻ', 'tao bo the', 'tạo thẻ', 'tao the',
    'tạo flashcard', 'tao flashcard',
    'tạo từ vựng', 'tao tu vung',
    'tạo set', 'tao set',
    'tạo bộ từ', 'tao bo tu',
    'create flashcard', 'make flashcard', 'create set',
    'generate flashcard', 'generate vocabulary',
    'tạo bộ học', 'cho tôi bộ thẻ', 'cho mình bộ thẻ',
    'tạo cho tôi', 'tạo cho mình', 'tạo giúp tôi', 'tạo giúp mình'
  ];
  return keywords.some(k => lower.includes(k));
}

// Trích xuất chủ đề từ tin nhắn người dùng
function extractTopicFromMessage(text) {
  // Thử lấy phần sau các mẫu "tạo bộ thẻ về X", "chủ đề X", v.v.
  const patterns = [
    /(?:tạo|tao)\s+(?:bộ\s+thẻ|thẻ|flashcard|từ\s+vựng|bộ\s+từ|set|bộ\s+học)\s+(?:về|chủ\s+đề|topic|với\s+chủ\s+đề|liên\s+quan\s+đến|về\s+chủ\s+đề)?\s*["""'']?([^"""''.,!?\n]+)/i,
    /(?:về|chủ\s+đề|topic)\s+["""'']?([^"""''.,!?\n]+)/i,
    /(?:create|make|generate)\s+(?:flashcard|set|vocabulary)\s+(?:about|on|for)\s+([^.,!?\n]+)/i,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m && m[1] && m[1].trim().length > 1) return m[1].trim();
  }
  return null;
}

// Hỏi xác nhận + cho phép chỉnh sửa chủ đề trước khi tạo
function offerFlashcardConfirm(topic) {
  const messages = document.getElementById('chatMessages');
  const offerId = 'chatFlashcardOffer_' + Date.now();
  const inputId = 'chatFlashcardTopicInput_' + Date.now();
  const offerEl = document.createElement('div');
  offerEl.className = 'chat-bubble chat-bubble-ai';
  offerEl.id = offerId;

  const placeholder = topic || '';
  offerEl.innerHTML = `
    <div class="chat-avatar">🤖</div>
    <div class="chat-offer-box">
      <div class="chat-offer-text">📚 Bạn muốn tạo bộ thẻ từ vựng về chủ đề gì? Hãy xác nhận hoặc chỉnh sửa bên dưới:</div>
      <input id="${inputId}" class="chat-offer-input" type="text" placeholder="Nhập chủ đề (vd: Animals, Weather, School...)" value="${placeholder.replace(/"/g, '&quot;')}" />
      <div class="chat-offer-actions">
        <button class="btn-offer-yes" id="${offerId}_btnYes">📚 Tạo bộ thẻ</button>
        <button class="btn-offer-no" id="${offerId}_btnNo">Huỷ</button>
      </div>
    </div>
  `;
  messages.appendChild(offerEl);
  messages.scrollTop = messages.scrollHeight;

  // Gán sự kiện sau khi DOM đã render
  document.getElementById(offerId + '_btnNo').onclick = function() {
    offerEl.remove();
  };
  document.getElementById(offerId + '_btnYes').onclick = function() {
    const inputEl = document.getElementById(inputId);
    const finalTopic = inputEl ? inputEl.value.trim() : '';
    if (!finalTopic) {
      inputEl.style.borderColor = 'var(--pink)';
      inputEl.placeholder = 'Vui lòng nhập chủ đề!';
      inputEl.focus();
      return;
    }
    generateFlashcardsFromChat(offerId, finalTopic);
  };
  // Enter để xác nhận
  const inputEl = document.getElementById(inputId);
  if (inputEl) {
    inputEl.focus();
    inputEl.onkeydown = function(e) {
      if (e.key === 'Enter') document.getElementById(offerId + '_btnYes').click();
    };
  }
}

async function generateFlashcardsFromChat(offerId, topic) {
  const offerEl = document.getElementById(offerId);
  if (offerEl) offerEl.remove();

  const apiKey = localStorage.getItem('vocalearn_gemini_key');
  if (!apiKey) {
    appendErrorBubble('Vui lòng nhập Gemini API Key để tạo bộ thẻ.<br><a href="https://aistudio.google.com/app/apikey" target="_blank" style="color:var(--blue)">Lấy miễn phí tại đây →</a>');
    return;
  }

  // Loading bubble
  const messages = document.getElementById('chatMessages');
  const loadingEl = document.createElement('div');
  loadingEl.className = 'chat-bubble chat-bubble-ai';
  loadingEl.id = 'chatFlashcardLoading';
  loadingEl.innerHTML = `
    <div class="chat-avatar">🤖</div>
    <div class="chat-text">📚 Đang tạo bộ thẻ từ vựng... <span class="chat-typing"><span></span><span></span><span></span></span></div>
  `;
  messages.appendChild(loadingEl);
  messages.scrollTop = messages.scrollHeight;

  // Prompt: ưu tiên topic rõ ràng, fallback lịch sử chat
  let prompt;
  if (topic && topic.trim()) {
    prompt = `Tạo 10 từ vựng tiếng Anh về chủ đề "${topic.trim()}", phù hợp với học sinh lớp 6 Việt Nam.\nTrả về JSON thuần (không markdown, không backtick), định dạng:\n{"setName":"Tên bộ thẻ ngắn gọn","cards":[{"word":"...","phonetic":"/.../","meaning":"...","example":"..."}]}`;
  } else {
    const recentHistory = chatHistory.slice(-4).map(m => m.role + ': ' + m.content).join('\n');
    prompt = `Dựa trên hội thoại sau, tạo 10 từ vựng tiếng Anh phù hợp nhất, dành cho học sinh lớp 6 Việt Nam:\n\n${recentHistory}\n\nTrả về JSON thuần (không markdown, không backtick), định dạng:\n{"setName":"Tên bộ thẻ ngắn gọn","cards":[{"word":"...","phonetic":"/.../","meaning":"...","example":"..."}]}`;
  }

  const MODELS = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.0-flash-lite-001'];
  let data = null;
  for (const model of MODELS) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { maxOutputTokens: 2048, temperature: 0.7 }
          })
        }
      );
      const json = await response.json();
      if (!json.error) { data = json; break; }
      if (json.error.code === 429) continue;
      throw new Error(json.error.message);
    } catch(e) {
      if (e.message && (e.message.includes('429') || e.message.includes('quota'))) continue;
      break;
    }
  }

  const loadingRemove = document.getElementById('chatFlashcardLoading');
  if (loadingRemove) loadingRemove.remove();

  if (!data) {
    appendErrorBubble('❌ Không thể tạo bộ thẻ. Vui lòng thử lại sau.');
    return;
  }

  try {
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    // Làm sạch: bỏ markdown fence, lấy phần JSON đầu tiên hợp lệ
    let clean = raw.replace(/```json|```/g, '').trim();
    // Nếu JSON bị cắt, thử tự đóng ngoặc
    try {
      JSON.parse(clean);
    } catch(_) {
      // Thử tìm và đóng JSON object
      const objStart = clean.indexOf('{');
      if (objStart !== -1) {
        clean = clean.slice(objStart);
        // Đếm ngoặc để tự đóng nếu bị truncate
        let depth = 0, i = 0, lastValid = 0;
        for (; i < clean.length; i++) {
          if (clean[i] === '{') depth++;
          else if (clean[i] === '}') { depth--; if (depth === 0) { lastValid = i; break; } }
        }
        if (depth > 0) {
          // Cắt tại card cuối hợp lệ và đóng JSON
          const lastCard = clean.lastIndexOf('},', i);
          if (lastCard > 0) clean = clean.slice(0, lastCard + 1) + ']}';
          else clean = clean + '}]}'.repeat(depth);
        } else if (lastValid > 0) {
          clean = clean.slice(0, lastValid + 1);
        }
      }
    }

    const parsed = JSON.parse(clean);

    const setId = 'chat_' + Date.now();
    const colorIndex = Math.floor(Math.random() * 6);
    const cards = (parsed.cards || []).map((c, i) => ({
      id: `${setId}_card_${i}`,
      word: c.word || '',
      phonetic: c.phonetic || '',
      meaning: c.meaning || '',
      example: c.example || ''
    })).filter(c => c.word && c.meaning);

    if (cards.length === 0) { appendErrorBubble('❌ Không có từ hợp lệ nào được tạo.'); return; }

    const sets = Storage.getSets();
    sets.push({ id: setId, name: parsed.setName || 'Bộ thẻ từ Chat', colorIndex, cards });
    Storage.saveSets(sets);

    const preview = cards.slice(0, 3).map(c => `<li><strong>${c.word}</strong> – ${c.meaning}</li>`).join('');
    const resultEl = document.createElement('div');
    resultEl.className = 'chat-bubble chat-bubble-ai';
    resultEl.innerHTML = `
      <div class="chat-avatar">🤖</div>
      <div class="chat-text">
        ✅ Đã tạo bộ thẻ <strong>"${parsed.setName || 'Bộ thẻ từ Chat'}"</strong> với <strong>${cards.length} từ</strong>!<br>
        <ul style="margin:8px 0 8px 16px;padding:0">${preview}${cards.length > 3 ? '<li style="opacity:0.6">...và ' + (cards.length - 3) + ' từ khác</li>' : ''}</ul>
        <button onclick="navigateTo('sets');renderSetsPage();" style="margin-top:6px;padding:6px 14px;border-radius:8px;border:none;background:var(--accent);color:#fff;cursor:pointer;font-size:0.9rem">📂 Xem bộ thẻ ngay →</button>
      </div>
    `;
    messages.appendChild(resultEl);
    messages.scrollTop = messages.scrollHeight;
  } catch(e) {
    appendErrorBubble('❌ Lỗi khi phân tích kết quả AI: ' + e.message);
  }
}

function appendErrorBubble(msg) {
  const messages = document.getElementById('chatMessages');
  const el = document.createElement('div');
  el.className = 'chat-bubble chat-bubble-ai';
  el.innerHTML = `
    <div class="chat-avatar">🤖</div>
    <div class="chat-error">⚠️ ${msg}</div>
  `;
  messages.appendChild(el);
  messages.scrollTop = messages.scrollHeight;
}

// ===== FIREBASE AUTH UI =====
function setupAutoSaveUI() {
  // Firebase auth UI – được khởi tạo từ firebase.js sau khi module load
  // Hàm này để trống; logic nằm trong setupFirebaseUI() được gọi từ firebase.js
}

function setupFirebaseUI() {
  const btnLogin  = document.getElementById('btnFirebaseLogin');
  const btnLogout = document.getElementById('btnFirebaseLogout');
  const note      = document.getElementById('autosaveNote');
  if (!btnLogin) return;

  const btnSync   = document.getElementById('btnFirebaseSync');

  function updateUI(user) {
    if (user) {
      btnLogin.style.display  = 'none';
      btnLogout.style.display = '';
      btnSync.style.display   = '';
      note.textContent = '✔ Đăng nhập: ' + (user.displayName || user.email);
    } else {
      btnLogin.style.display  = '';
      btnLogout.style.display = 'none';
      btnSync.style.display   = 'none';
      note.textContent = 'Đồng bộ dữ liệu trên mọi thiết bị';
      const el = document.getElementById('autosaveStatus');
      if (el) { el.innerHTML = '<span>☁️</span><span>Chưa đăng nhập</span>'; el.className = 'autosave-status'; }
    }
  }

  // ── Theo dõi trạng thái đăng nhập ─────────────────────────────────────────
  FirebaseAuth.onStateChange(async (user) => {
    updateUI(user);
    if (user) {
      localStorage.setItem('vocalearn_auth_mode', 'google');

      // pull() kéo data từ Firestore về (hoặc push lên nếu lần đầu)
      // Sau khi pull() hoàn tất mới render UI và ẩn màn login
      const ok = await FirebaseSync.pull();
      if (ok) {
        // Ẩn màn hình đăng nhập SAU KHI data đã được apply vào localStorage
        if (typeof hideLoginScreen === 'function') hideLoginScreen();
        renderHome();
        updateStreak();
        updateTrashBadge();
      }
    } else {
      FirebaseSync.stopListening();
    }
  });

  btnLogin.addEventListener('click', async () => {
    btnLogin.disabled = true;
    btnLogin.textContent = '⏳ Đang đăng nhập...';
    const user = await FirebaseAuth.signIn();
    btnLogin.disabled = false;
    btnLogin.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:16px;height:16px;vertical-align:middle;margin-right:4px;">Đăng nhập Google';
    if (!user) showNotif('Đăng nhập thất bại hoặc bị huỷ.', '❌');
  });

  btnLogout.addEventListener('click', async () => {
    const ok = await showConfirm('Đăng xuất khỏi tài khoản Google?<br><small style="opacity:.7">Dữ liệu vẫn còn trên thiết bị này. Đăng nhập lại để đồng bộ tiếp.</small>', '👋');
    if (!ok) return;

    // Dừng real-time listener trước khi sign out
    FirebaseSync.stopListening();

    await FirebaseAuth.signOut();

    // Xóa cờ auth_mode để màn hình login hiện lại
    localStorage.removeItem('vocalearn_auth_mode');

    // Hiện màn hình đăng nhập (dữ liệu local GIỮ NGUYÊN)
    if (typeof showLoginScreen === 'function') showLoginScreen();
  });

  // Nút đồng bộ thủ công
  if (btnSync) {
    btnSync.addEventListener('click', async () => {
      btnSync.disabled = true;
      btnSync.textContent = '⏳';
      const ok = await FirebaseSync.pull();
      if (ok) {
        renderHome();
        updateStreak();
        updateTrashBadge();
        if (typeof renderSetsPage === 'function') {
          const pageSets = document.getElementById('page-sets');
          if (pageSets && pageSets.classList.contains('active')) renderSetsPage();
        }
      }
      btnSync.disabled = false;
      btnSync.textContent = '🔄 Sync';
    });
  }
}

// ===== TRASH PAGE =====
function updateTrashBadge() {
  const badge = document.getElementById('trashBadge');
  if (!badge) return;
  const count = Trash.count();
  badge.textContent = count > 0 ? count : '';
  badge.style.display = count > 0 ? 'inline-flex' : 'none';
}

function renderTrashPage() {
  updateTrashBadge();
  const items = Trash.getAll();
  const container = document.getElementById('trashList');
  const empty = document.getElementById('trashEmpty');
  const btnEmpty = document.getElementById('btnEmptyTrash');

  if (!container) return;

  if (items.length === 0) {
    container.innerHTML = '';
    empty.style.display = '';
    btnEmpty.style.display = 'none';
    return;
  }

  empty.style.display = 'none';
  btnEmpty.style.display = '';

  container.innerHTML = items.map(set => {
    const deletedAt = set._deletedAt ? new Date(set._deletedAt) : null;
    const timeStr = deletedAt ? deletedAt.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '';
    return `
      <div class="trash-card" data-id="${set.id}">
        <div class="trash-card-info">
          <div class="trash-card-name">${set.name}</div>
          <div class="trash-card-meta">${set.cards.length} từ · Đã xóa: ${timeStr}</div>
        </div>
        <div class="trash-card-actions">
          <button class="btn-restore" onclick="restoreSet('${set.id}')">↩ Khôi phục</button>
          <button class="btn-delete-perm" onclick="deletePermanently('${set.id}')">🗑 Xóa vĩnh viễn</button>
        </div>
      </div>`;
  }).join('');
}

async function restoreSet(setId) {
  const set = Trash.restore(setId);
  if (!set) return;
  const sets = Storage.getSets();
  sets.push(set);
  Storage.saveSets(sets);
  showNotif('Đã khôi phục bộ thẻ <strong>"' + set.name + '"</strong>!', '✅');
  renderTrashPage();
}

async function deletePermanently(setId) {
  const item = Trash.getAll().find(s => s.id === setId);
  if (!item) return;
  const ok = await showConfirm(
    'Xóa vĩnh viễn <strong>"' + item.name + '"</strong>?<br><small style="color:var(--accent)">Hành động này không thể hoàn tác.</small>',
    '⚠️'
  );
  if (!ok) return;
  Trash.deletePermanently(setId);
  showNotif('Đã xóa vĩnh viễn bộ thẻ.', '🗑️');
  renderTrashPage();
}

async function emptyTrash() {
  const count = Trash.count();
  if (count === 0) return;
  const ok = await showConfirm(
    'Xóa vĩnh viễn <strong>tất cả ' + count + ' bộ thẻ</strong> trong thùng rác?<br><small style="color:var(--accent)">Hành động này không thể hoàn tác.</small>',
    '⚠️'
  );
  if (!ok) return;
  Trash.emptyAll();
  showNotif('Đã làm trống thùng rác.', '🗑️');
  renderTrashPage();
}