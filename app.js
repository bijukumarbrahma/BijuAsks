/* ══════════════════════════════════════════════════
   BIJUASKS — app.js
   Full quiz logic: questions, timer, score,
   leaderboard, dark mode, confetti, sounds
══════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────
    BACKEND CONFIGURATION
    Set API_BASE_URL to your backend URL.
    For local development: 'http://localhost:8000'
    For production: your Render deployment URL
 ───────────────────────────────────────────────── */
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8000';
const USE_BACKEND = window.USE_BACKEND !== false;

const bannedWords = ["sex", "fuck", "bitch", "ass", "xxx"];

const QUESTIONS_PER_QUIZ = 10;
const TIMER_SECONDS = 15;
const SKIP_PENALTY = 1;
const CATEGORY_LABELS = { tech:'💻 Tech', science:'🔬 Science', general:'🌍 General', math:'🔢 Math', random:'🎲 Random' };

// Open Trivia DB category mapping
const OPENTDB_CATEGORIES = {
  random: null,           // No category = random
  tech: 18,              // Science: Computers
  science: 17,           // Science & Nature
  general: 9,            // General Knowledge
  math: 19               // Science: Mathematics
};

/* ─────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────── */
let state = {
  userName: '',
  category: 'random',
  questions: [],
  currentIndex: 0,
  score: 0,
  correctCount: 0,
  wrongCount: 0,
  skippedCount: 0,
  timerInterval: null,
  timeLeft: TIMER_SECONDS,
  answered: false,
};

/* ─────────────────────────────────────────────────
   DOM REFERENCES
───────────────────────────────────────────────── */
const $ = id => document.getElementById(id);

const screens = {
  landing:  $('landingScreen'),
  loading:  $('loadingScreen'),
  quiz:     $('quizScreen'),
  result:   $('resultScreen'),
};

/* ─────────────────────────────────────────────────
   SOUND ENGINE (Web Audio API — no files needed)
───────────────────────────────────────────────── */
const AudioCtx = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function ensureAudio() {
  if (!audioCtx) audioCtx = new AudioCtx();
}

function playTone(freq, type, duration, gain = 0.18) {
  try {
    ensureAudio();
    const osc = audioCtx.createOscillator();
    const g   = audioCtx.createGain();
    osc.connect(g);
    g.connect(audioCtx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    g.gain.setValueAtTime(gain, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (_) {}
}

function soundCorrect() {
  playTone(523.25, 'sine', 0.15);
  setTimeout(() => playTone(659.25, 'sine', 0.2), 80);
}

function soundWrong() {
  playTone(220, 'sawtooth', 0.2, 0.1);
}

function soundTick() {
  playTone(880, 'sine', 0.05, 0.06);
}

/* ─────────────────────────────────────────────────
   DARK MODE
───────────────────────────────────────────────── */
const themeToggle  = $('themeToggle');
const themeIcon    = themeToggle.querySelector('.theme-icon');

function setTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeIcon.textContent = dark ? '☀' : '☽';
  localStorage.setItem('bijuAsks_dark', dark ? '1' : '0');
}

// Restore from storage
const savedDark = localStorage.getItem('bijuAsks_dark');
if (savedDark === '1') setTheme(true);

themeToggle.addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  setTheme(!isDark);
});

/* ─────────────────────────────────────────────────
   UTILITY HELPERS
───────────────────────────────────────────────── */

/** Fisher-Yates shuffle */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Show a screen, hide others */
function showScreen(name) {
  Object.entries(screens).forEach(([key, el]) => {
    if (key === name) {
      el.classList.remove('hidden');
    } else {
      el.classList.add('hidden');
    }
  });
}

/** Format date DD MMM */
function fmtDate(ts) {
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { day:'2-digit', month:'short' });
}

/* ─────────────────────────────────────────────────
    LEADERBOARD (Backend API)
    Fetches fresh from database, no caching
 ───────────────────────────────────────────────── */

async function getGlobalLeaderboard() {
  // Always fetch fresh from backend API
  if (USE_BACKEND) {
    try {
      const response = await fetch(`${API_BASE_URL}/leaderboard.php?_=${Date.now()}`, {
        cache: 'no-store'
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.leaderboard) {
          return data.leaderboard;
        }
      }
    } catch (err) {
      console.warn('Leaderboard API failed:', err.message);
    }
  }
  
  return [];
}

async function saveToLeaderboard(name, score, total) {
  // Save to backend API only (no localStorage caching)
  if (USE_BACKEND) {
    try {
      const response = await fetch(`${API_BASE_URL}/submit_score.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player_name: name, score, total })
      });
      if (response.ok) {
        console.log('Score saved to backend');
      }
    } catch (err) {
      console.warn('Backend save failed:', err.message);
    }
  }
}

async function renderLeaderboard() {
  const list  = $('leaderboardList');
  const empty = $('leaderboardEmpty');
  list.innerHTML = '<li class="lb-loading">⏳ Loading global scores…</li>';
  empty.classList.add('hidden');

  let lb = await getGlobalLeaderboard();

  list.innerHTML = '';
  if (!lb.length) { empty.classList.remove('hidden'); return; }
  empty.classList.add('hidden');

  const medals = ['🥇','🥈','🥉'];
  lb.forEach((entry, i) => {
    const li = document.createElement('li');
    const pct = Math.round((entry.score / entry.total) * 100);
    li.innerHTML = `
      <span class="lb-rank">${medals[i] || i + 1}</span>
      <span class="lb-name">${escHtml(entry.name)}</span>
      <span class="lb-score">${entry.score}/${entry.total} <small class="lb-pct">(${pct}%)</small></span>
      <span class="lb-date">${fmtDate(entry.timestamp || entry.ts)}</span>
    `;
    list.appendChild(li);
  });
}

// Patch openLeaderboard to handle async renderLeaderboard
async function openLeaderboard() {
  $('leaderboardModal').classList.remove('hidden');
  await renderLeaderboard();
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ─────────────────────────────────────────────────
   LAST SCORE BANNER
───────────────────────────────────────────────── */
function refreshLastScoreBanner() {
  const last = localStorage.getItem('bijuAsks_lastScore');
  const banner = $('lastScoreBanner');
  if (last) {
    const { name, score, total } = JSON.parse(last);
    banner.textContent = `Last score: ${escHtml(name)} scored ${score}/${total}`;
    banner.style.display = 'block';
  }
}

/* ─────────────────────────────────────────────────
    CATEGORY PILLS
 ───────────────────────────────────────────────── */

// Fetch questions from Open Trivia Database
async function fetchQuestionsFromAPI(category, limit = 10) {
  try {
    let url = `https://opentdb.com/api.php?amount=${limit}&type=multiple`;
    
    // Add category parameter if not random
    const opentdbCat = OPENTDB_CATEGORIES[category];
    if (opentdbCat) {
      url += `&category=${opentdbCat}`;
    }
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('API request failed');
    
    const data = await response.json();
    
    if (data.response_code !== 0 || !data.results || data.results.length === 0) {
      console.warn('OpenTDB returned no questions');
      return null;
    }
    
    // Transform OpenTDB format to our format
    return data.results.map(q => {
      const allOptions = [...q.incorrect_answers, q.correct_answer];
      const shuffledOptions = shuffle(allOptions);
      const correctIndex = shuffledOptions.indexOf(q.correct_answer);
      
      return {
        q: decodeHTML(q.question),
        options: shuffledOptions.map(opt => decodeHTML(opt)),
        answer: correctIndex >= 0 ? correctIndex : 0,
        category: category
      };
    });
    
  } catch (err) {
    console.warn('Questions API unavailable:', err.message);
    return null;
  }
}

// Decode HTML entities from OpenTDB
function decodeHTML(html) {
  const txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

$('categoryPills').addEventListener('click', e => {
  const pill = e.target.closest('.pill');
  if (!pill) return;
  document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  state.category = pill.dataset.cat;
});

/* ─────────────────────────────────────────────────
   LANDING — START
───────────────────────────────────────────────── */
$('startBtn').addEventListener('click', startQuiz);
$('nameInput').addEventListener('keydown', e => { if (e.key === 'Enter') startQuiz(); });

function startQuiz() {
  const name = $('nameInput').value.trim();
  if (!name) {
    $('nameInput').classList.add('shake');
    setTimeout(() => $('nameInput').classList.remove('shake'), 500);
    $('nameInput').focus();
    return;
  }
  state.userName = name;

  // Loading screen
  showScreen('loading');
  const msgs = [
    'Shuffling questions…',
    'Charging brain cells…',
    'Polishing trivia gems…',
    'Almost ready…',
  ];
  let mi = 0;
  const msgInterval = setInterval(() => {
    $('loadingText').textContent = msgs[++mi % msgs.length];
  }, 400);

  // Fetch questions from API only
  async function loadQuestions() {
    const apiQuestions = await fetchQuestionsFromAPI(state.category, QUESTIONS_PER_QUIZ);
    if (apiQuestions && apiQuestions.length >= QUESTIONS_PER_QUIZ) {
      return apiQuestions;
    }
    throw new Error('No questions available from server');
  }

  loadQuestions().then(questions => {
    state.questions = questions;
    
    // Reset state
    state.currentIndex = 0;
    state.score        = 0;
    state.correctCount = 0;
    state.wrongCount   = 0;
    state.skippedCount = 0;

    clearInterval(msgInterval);
    showScreen('quiz');
    setupQuizUI();
    renderQuestion();
  }).catch(err => {
    console.error('Failed to load questions:', err);
    clearInterval(msgInterval);
    showScreen('landing');
    alert('Failed to load questions. Please try again.');
  });
}

/* ─────────────────────────────────────────────────
   QUIZ UI SETUP (called once at quiz start)
───────────────────────────────────────────────── */
function setupQuizUI() {
  const n = state.userName;
  $('quizUserName').textContent = n;
  $('userAvatar').textContent   = n.charAt(0).toUpperCase();
  $('liveScore').textContent    = 'Score: 0';
}

/* ─────────────────────────────────────────────────
   RENDER QUESTION
───────────────────────────────────────────────── */
function renderQuestion() {
  const total = state.questions.length;
  const idx   = state.currentIndex;
  const q     = state.questions[idx];

  state.answered = false;

  // Progress
  $('progressLabel').textContent = `Question ${idx + 1} of ${total}`;
  $('progressBarFill').style.width = `${((idx) / total) * 100}%`;
  $('qCategoryTag').textContent = CATEGORY_LABELS[q.category] || q.category;

  // Question text with animation
  const qWrap = $('questionWrap');
  qWrap.classList.remove('q-enter');
  void qWrap.offsetWidth; // reflow
  qWrap.classList.add('q-enter');
  $('questionText').textContent = q.q;

  // Render options
  const grid = $('optionsGrid');
  grid.innerHTML = '';
  const keys = ['1','2','3','4'];

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.dataset.index = i;
    btn.innerHTML = `
      <span class="option-key">${keys[i]}</span>
      <span class="option-text">${escHtml(opt)}</span>
    `;
    btn.addEventListener('click', () => selectOption(i));
    grid.appendChild(btn);
  });

  // Start timer
  startTimer();
}

/* ─────────────────────────────────────────────────
   TIMER
───────────────────────────────────────────────── */
function startTimer() {
  clearTimer();
  state.timeLeft = TIMER_SECONDS;
  updateTimerUI(TIMER_SECONDS);

  state.timerInterval = setInterval(() => {
    state.timeLeft--;
    updateTimerUI(state.timeLeft);

    // Tick sound in last 5 seconds
    if (state.timeLeft <= 5 && state.timeLeft > 0) soundTick();

    if (state.timeLeft <= 0) {
      clearTimer();
      handleTimeout();
    }
  }, 1000);
}

function clearTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function updateTimerUI(t) {
  const total      = TIMER_SECONDS;
  const pct        = t / total;
  const circumference = 125.66; // 2π × 20
  const offset     = circumference * (1 - pct);

  $('timerNum').textContent        = t;
  $('timerArc').style.strokeDashoffset = offset;
  $('timerBarFill').style.width    = `${pct * 100}%`;

  // Color states
  const arc = $('timerArc');
  const bar = $('timerBarFill');
  arc.classList.remove('warning','danger');
  bar.classList.remove('warning','danger');

  if (t <= 5) {
    arc.classList.add('danger');
    bar.classList.add('danger');
  } else if (t <= 8) {
    arc.classList.add('warning');
    bar.classList.add('warning');
  }
}

function handleTimeout() {
  if (state.answered) return;
  state.answered = true;
  state.wrongCount++;
  // Reveal correct answer
  revealAnswer(-1);
  soundWrong();
  setTimeout(nextQuestion, 1500);
}

/* ─────────────────────────────────────────────────
   OPTION SELECTION
───────────────────────────────────────────────── */
function selectOption(selectedIdx) {
  if (state.answered) return;
  state.answered = true;
  clearTimer();

  const q       = state.questions[state.currentIndex];
  const correct = selectedIdx === q.answer;

  if (correct) {
    state.score++;
    state.correctCount++;
    soundCorrect();
  } else {
    state.wrongCount++;
    soundWrong();
  }

  revealAnswer(selectedIdx);

  // Update live score
  $('liveScore').textContent = `Score: ${state.score}`;
  $('liveScore').classList.add('score-pop');
  setTimeout(() => $('liveScore').classList.remove('score-pop'), 400);

  setTimeout(nextQuestion, 1500);
}

/** Highlight correct / wrong buttons */
function revealAnswer(selectedIdx) {
  const q    = state.questions[state.currentIndex];
  const btns = $('optionsGrid').querySelectorAll('.option-btn');
  btns.forEach((btn, i) => {
    btn.disabled = true;
    if (i === q.answer) {
      btn.classList.add('correct');
    } else if (i === selectedIdx) {
      btn.classList.add('wrong');
    }
  });
}

/* ─────────────────────────────────────────────────
   SKIP
───────────────────────────────────────────────── */
$('skipBtn').addEventListener('click', () => {
  if (state.answered) return;
  state.answered = true;
  clearTimer();
  state.skippedCount++;
  // Apply penalty (can't go below 0)
  state.score = Math.max(0, state.score - SKIP_PENALTY);
  $('liveScore').textContent = `Score: ${state.score}`;
  // Reveal correct answer
  revealAnswer(-1);
  setTimeout(nextQuestion, 1200);
});

/* ─────────────────────────────────────────────────
   KEYBOARD SUPPORT (1–4)
───────────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (!screens.quiz.classList.contains('hidden')) {
    const map = { '1':0, '2':1, '3':2, '4':3 };
    if (e.key in map) selectOption(map[e.key]);
    if (e.key === 's' || e.key === 'S') $('skipBtn').click();
  }
});

/* ─────────────────────────────────────────────────
   NEXT QUESTION / END QUIZ
───────────────────────────────────────────────── */
function nextQuestion() {
  state.currentIndex++;
  const total = state.questions.length;

  if (state.currentIndex >= total) {
    endQuiz();
    return;
  }

  // Animate out, then render next
  const qWrap = $('questionWrap');
  qWrap.classList.remove('q-enter');
  qWrap.classList.add('q-exit');

  setTimeout(() => {
    qWrap.classList.remove('q-exit');
    renderQuestion();
  }, 200);
}

/* ─────────────────────────────────────────────────
   END QUIZ → RESULT SCREEN
───────────────────────────────────────────────── */
async function endQuiz() {
  clearTimer();
  const total    = state.questions.length;
  const score    = state.score;
  const pct      = score / total;

  // Final progress bar
  $('progressBarFill').style.width = '100%';

  // Save to global leaderboard (async, non-blocking for UI)
  saveToLeaderboard(state.userName, score, total);
  localStorage.setItem('bijuAsks_lastScore', JSON.stringify({
    name: state.userName, score, total
  }));

  // Result screen
  $('resultName').textContent  = `Well done, ${state.userName}!`;
  $('scoreBig').textContent    = score;
  $('scoreDenom').textContent  = `/${total}`;
  $('statCorrect').textContent = state.correctCount;
  $('statWrong').textContent   = state.wrongCount;
  $('statSkipped').textContent = state.skippedCount;

  // Performance message & emoji
  let msg, emoji;
  if (pct >= 0.9)       { msg = 'Outstanding! You\'re a genius! 🔥'; emoji = '🏆'; }
  else if (pct >= 0.7)  { msg = 'Great job! Keep it up!';             emoji = '🎉'; }
  else if (pct >= 0.5)  { msg = 'Good effort! You\'re getting there.';emoji = '👍'; }
  else if (pct >= 0.3)  { msg = 'Keep practicing — you\'ll crack it!';emoji = '📚'; }
  else                  { msg = 'Don\'t give up! Try again!';          emoji = '💪'; }

  $('resultEmoji').textContent = emoji;
  $('resultMsg').textContent   = msg;

  showScreen('result');

  // Confetti on high score (≥ 70%)
  if (pct >= 0.7) launchConfetti();
}

/* ─────────────────────────────────────────────────
   RESULT ACTIONS
───────────────────────────────────────────────── */
$('restartBtn').addEventListener('click', () => {
  showScreen('landing');
  refreshLastScoreBanner();
});

$('leaderboardFromResultBtn').addEventListener('click', openLeaderboard);
$('showLeaderboardBtn').addEventListener('click', openLeaderboard);
$('closeLeaderboard').addEventListener('click', () => {
  $('leaderboardModal').classList.add('hidden');
});

// Close modal on overlay click
$('leaderboardModal').addEventListener('click', e => {
  if (e.target === $('leaderboardModal'))
    $('leaderboardModal').classList.add('hidden');
});

/* ─────────────────────────────────────────────────
   CONFETTI
───────────────────────────────────────────────── */
function launchConfetti() {
  const canvas = $('confettiCanvas');
  const ctx    = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#c4601a','#e8843a','#f0c040','#4caf76','#5a9fd4','#e05555'];
  const pieces = Array.from({ length: 120 }, () => ({
    x:     Math.random() * canvas.width,
    y:     Math.random() * canvas.height - canvas.height,
    w:     Math.random() * 10 + 6,
    h:     Math.random() * 6 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    angle: Math.random() * Math.PI * 2,
    spin:  (Math.random() - 0.5) * 0.2,
    vx:    (Math.random() - 0.5) * 3,
    vy:    Math.random() * 3 + 2,
  }));

  let frame;
  let elapsed = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.85;
      ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
      ctx.restore();

      p.x     += p.vx;
      p.y     += p.vy;
      p.angle += p.spin;
      p.vy    += 0.05; // gravity
    });

    elapsed++;
    if (elapsed < 180) {
      frame = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(draw);
}

/* ─────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────── */
refreshLastScoreBanner();
showScreen('landing');

function isValidName(name) {
  const lower = name.toLowerCase();
  return !bannedWords.some(word => lower.includes(word));
}

// Usage
const username = input.value;

if (!isValidName(username)) {
  alert("❌ Inappropriate name not allowed");
} else {
  // continue game
}