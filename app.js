/* ══════════════════════════════════════════════════
   BIJUASKS — app.js
   Full quiz logic: questions, timer, score,
   leaderboard, dark mode, confetti, sounds
══════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────────────
   QUESTION BANK
   Each question: { q, options, answer (0-indexed),
                    category: 'tech'|'science'|'general'|'math' }
───────────────────────────────────────────────── */
const QUESTION_BANK = [
  // ── TECH ──
  {
    q: "What does 'HTTP' stand for?",
    options: ["HyperText Transfer Protocol", "High-Traffic Transfer Process", "Hyper Terminal Text Protocol", "HyperLink Transmission Protocol"],
    answer: 0, category: 'tech'
  },
  {
    q: "Which programming language is known as the 'language of the web'?",
    options: ["Python", "Java", "JavaScript", "Ruby"],
    answer: 2, category: 'tech'
  },
  {
    q: "What does 'CSS' stand for in web development?",
    options: ["Computer Style Sheets", "Cascading Style Sheets", "Creative Style System", "Coded Style Syntax"],
    answer: 1, category: 'tech'
  },
  {
    q: "Which data structure operates on a LIFO (Last In, First Out) principle?",
    options: ["Queue", "Linked List", "Stack", "Tree"],
    answer: 2, category: 'tech'
  },
  {
    q: "What is the time complexity of binary search on a sorted array?",
    options: ["O(n)", "O(n²)", "O(log n)", "O(1)"],
    answer: 2, category: 'tech'
  },
  {
    q: "Which company developed the Python programming language?",
    options: ["MIT", "Google", "Guido van Rossum (CWI)", "Sun Microsystems"],
    answer: 2, category: 'tech'
  },
  {
    q: "What does 'RAM' stand for in computing?",
    options: ["Random Access Memory", "Read Arithmetic Memory", "Rapid Application Memory", "Remote Access Module"],
    answer: 0, category: 'tech'
  },
  {
    q: "Which protocol is used to send email?",
    options: ["FTP", "SMTP", "POP3", "SSH"],
    answer: 1, category: 'tech'
  },
  {
    q: "In a boolean expression, what does the AND operator return when both values are true?",
    options: ["false", "null", "true", "undefined"],
    answer: 2, category: 'tech'
  },
  {
    q: "What does 'API' stand for?",
    options: ["Automated Program Interface", "Application Programming Interface", "Advanced Protocol Integration", "Applied Program Instruction"],
    answer: 1, category: 'tech'
  },
  // ── SCIENCE ──
  {
    q: "What is the chemical symbol for gold?",
    options: ["Gd", "Go", "Ag", "Au"],
    answer: 3, category: 'science'
  },
  {
    q: "What is the speed of light in a vacuum (approximately)?",
    options: ["300,000 km/s", "150,000 km/s", "450,000 km/s", "3,000 km/s"],
    answer: 0, category: 'science'
  },
  {
    q: "How many bones are in the adult human body?",
    options: ["196", "206", "216", "186"],
    answer: 1, category: 'science'
  },
  {
    q: "What is the powerhouse of the cell?",
    options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi apparatus"],
    answer: 2, category: 'science'
  },
  {
    q: "Which planet is known as the Red Planet?",
    options: ["Jupiter", "Venus", "Saturn", "Mars"],
    answer: 3, category: 'science'
  },
  {
    q: "What is the atomic number of Carbon?",
    options: ["8", "4", "6", "12"],
    answer: 2, category: 'science'
  },
  {
    q: "What gas do plants absorb during photosynthesis?",
    options: ["Oxygen", "Nitrogen", "Carbon Dioxide", "Hydrogen"],
    answer: 2, category: 'science'
  },
  {
    q: "What is the hardest natural substance on Earth?",
    options: ["Gold", "Quartz", "Iron", "Diamond"],
    answer: 3, category: 'science'
  },
  // ── GENERAL ──
  {
    q: "What is the capital of France?",
    options: ["Berlin", "Madrid", "Rome", "Paris"],
    answer: 3, category: 'general'
  },
  {
    q: "How many continents are there on Earth?",
    options: ["5", "6", "7", "8"],
    answer: 2, category: 'general'
  },
  {
    q: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Caravaggio"],
    answer: 2, category: 'general'
  },
  {
    q: "What is the largest ocean on Earth?",
    options: ["Atlantic", "Indian", "Arctic", "Pacific"],
    answer: 3, category: 'general'
  },
  {
    q: "In which year did World War II end?",
    options: ["1943", "1944", "1945", "1946"],
    answer: 2, category: 'general'
  },
  {
    q: "Which is the longest river in the world?",
    options: ["Amazon", "Nile", "Yangtze", "Mississippi"],
    answer: 1, category: 'general'
  },
  // ── MATH ──
  {
    q: "What is the value of π (pi) to two decimal places?",
    options: ["3.12", "3.16", "3.14", "3.18"],
    answer: 2, category: 'math'
  },
  {
    q: "What is the square root of 144?",
    options: ["11", "12", "13", "14"],
    answer: 1, category: 'math'
  },
  {
    q: "If a triangle has angles of 60° and 80°, what is the third angle?",
    options: ["30°", "40°", "50°", "60°"],
    answer: 1, category: 'math'
  },
  {
    q: "What is 15% of 200?",
    options: ["25", "30", "35", "40"],
    answer: 1, category: 'math'
  },
  {
    q: "Which of the following is a prime number?",
    options: ["21", "27", "33", "37"],
    answer: 3, category: 'math'
  },
  {
    q: "What is 2 to the power of 10?",
    options: ["512", "1024", "2048", "256"],
    answer: 1, category: 'math'
  },
];

const QUESTIONS_PER_QUIZ = 10;
const TIMER_SECONDS = 15;
const SKIP_PENALTY = 1;
const CATEGORY_LABELS = { tech:'💻 Tech', science:'🔬 Science', general:'🌍 General', math:'🔢 Math', all:'All' };

/* ─────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────── */
let state = {
  userName: '',
  category: 'all',
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
   LEADERBOARD (Global Shared Storage)
   Uses window.storage with shared:true so all
   players across devices see the same board.
───────────────────────────────────────────────── */
const LB_GLOBAL_KEY = 'bijuAsks_global_leaderboard';

async function getGlobalLeaderboard() {
  try {
    const result = await window.storage.get(LB_GLOBAL_KEY, true);
    return result ? JSON.parse(result.value) : [];
  } catch {
    return [];
  }
}

async function saveToLeaderboard(name, score, total) {
  try {
    const lb = await getGlobalLeaderboard();
    lb.push({ name, score, total, ts: Date.now() });
    lb.sort((a, b) => (b.score / b.total) - (a.score / a.total) || b.score - a.score);
    const trimmed = lb.slice(0, 20); // keep top 20 globally
    await window.storage.set(LB_GLOBAL_KEY, JSON.stringify(trimmed), true);
  } catch (err) {
    console.warn('Global leaderboard save failed:', err);
    // Fallback: save to localStorage so the score isn't lost
    try {
      const fallback = JSON.parse(localStorage.getItem('bijuAsks_lb_fallback') || '[]');
      fallback.push({ name, score, total, ts: Date.now() });
      fallback.sort((a,b)=>(b.score/b.total)-(a.score/a.total)||b.score-a.score);
      localStorage.setItem('bijuAsks_lb_fallback', JSON.stringify(fallback.slice(0,10)));
    } catch {}
  }
}

async function renderLeaderboard() {
  const list  = $('leaderboardList');
  const empty = $('leaderboardEmpty');
  list.innerHTML = '<li class="lb-loading">⏳ Loading global scores…</li>';
  empty.classList.add('hidden');

  let lb = await getGlobalLeaderboard();

  // Merge any offline fallback entries
  try {
    const fallback = JSON.parse(localStorage.getItem('bijuAsks_lb_fallback') || '[]');
    if (fallback.length) {
      lb = [...lb, ...fallback];
      lb.sort((a,b)=>(b.score/b.total)-(a.score/a.total)||b.score-a.score);
      lb = lb.slice(0,20);
    }
  } catch {}

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
      <span class="lb-date">${fmtDate(entry.ts)}</span>
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

  // Filter question bank
  const pool = state.category === 'all'
    ? QUESTION_BANK
    : QUESTION_BANK.filter(q => q.category === state.category);

  if (pool.length < QUESTIONS_PER_QUIZ) {
    // Not enough questions — fall back to all
    state.questions = shuffle(QUESTION_BANK).slice(0, QUESTIONS_PER_QUIZ);
  } else {
    state.questions = shuffle(pool).slice(0, QUESTIONS_PER_QUIZ);
  }

  // Reset state
  state.currentIndex = 0;
  state.score        = 0;
  state.correctCount = 0;
  state.wrongCount   = 0;
  state.skippedCount = 0;

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

  setTimeout(() => {
    clearInterval(msgInterval);
    showScreen('quiz');
    setupQuizUI();
    renderQuestion();
  }, 1600);
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