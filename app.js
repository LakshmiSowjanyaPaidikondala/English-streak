'use strict';

const K_DONE = 'eng_done';
const K_BEST = 'eng_best';
const K_ACTS = 'eng_acts_';

function get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }

function todayStr() { return new Date().toISOString().slice(0, 10); }

function getDone() { return get(K_DONE) || []; }

function calcStreak(done) {
  if (!done.length) return 0;
  const sorted = [...done].sort().reverse();
  const today = todayStr();
  let streak = 0;
  let check = today;
  for (const d of sorted) {
    if (d === check) {
      streak++;
      const dt = new Date(check);
      dt.setDate(dt.getDate() - 1);
      check = dt.toISOString().slice(0, 10);
    } else if (d < check) break;
  }
  return streak;
}

function motivationMsg(streak) {
  if (streak === 0) return "Start your streak today! 💪";
  if (streak === 1) return "Great start! Come back tomorrow! 🌱";
  if (streak < 5) return `${streak} days strong! Keep going! 🔥`;
  if (streak < 10) return `Amazing ${streak} day streak! 🚀`;
  if (streak < 20) return `${streak} days! You're on fire! 🔥🔥`;
  if (streak < 30) return `Incredible! ${streak} days non-stop! ⚡`;
  return `${streak} days! You're unstoppable! 👑`;
}

function getWeekDates() {
  const today = new Date();
  const day = today.getDay(); // 0=Sun
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((day + 6) % 7));
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function thisMonthCount(done) {
  const now = new Date();
  const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return done.filter(d => d.startsWith(prefix)).length;
}

function render() {
  const today = todayStr();
  const done = getDone();
  const todayDone = done.includes(today);
  const streak = calcStreak(done);
  const best = Math.max(get(K_BEST) || 0, streak);
  set(K_BEST, best);

  // Date badge
  document.getElementById('date-badge').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short'
  });

  // Streak hero
  document.getElementById('streak-num').textContent = streak;
  document.getElementById('motivation-text').textContent = motivationMsg(streak);

  // Check-in button
  const btn = document.getElementById('checkin-btn');
  if (todayDone) {
    btn.className = 'checkin-btn done-state';
    document.getElementById('checkin-label').textContent = '✅ Done for today!';
  } else {
    btn.className = 'checkin-btn';
    document.getElementById('checkin-label').textContent = 'Mark today as done ✓';
  }

  // Stats
  document.getElementById('best-streak').textContent = best;
  document.getElementById('total-days').textContent = done.length;
  document.getElementById('this-month').textContent = thisMonthCount(done);

  // Week row
  const weekDates = getWeekDates();
  const labels = ['M','T','W','T','F','S','S'];
  const weekRow = document.getElementById('week-row');
  weekRow.innerHTML = weekDates.map((d, i) => {
    const isDone = done.includes(d);
    const isToday = d === today;
    return `<div class="week-day${isDone ? ' done' : ''}${isToday ? ' today' : ''}">
      <span class="week-day-label">${labels[i]}</span>
      <span class="week-flame">🔥</span>
    </div>`;
  }).join('');

  // Calendar
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let cal = '';
  for (let i = 0; i < firstDay; i++) cal += `<div class="cal-day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const isDone = done.includes(ds);
    const isToday = ds === today;
    const isFuture = ds > today;
    let cls = 'cal-day';
    if (isDone) cls += ' done';
    if (isToday) cls += ' today';
    if (isFuture) cls += ' future';
    cal += `<div class="${cls}">${d}</div>`;
  }
  document.getElementById('cal-grid').innerHTML = cal;

  // Activities
  renderActs(today);

  // Install hint on iOS
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone;
  if (isIOS && !isStandalone) {
    document.getElementById('install-hint').style.display = 'block';
  }
}

function renderActs(today) {
  const saved = get(K_ACTS + today) || [];
  document.querySelectorAll('.act').forEach(el => {
    el.classList.toggle('checked', saved.includes(el.dataset.key));
  });
}

window.toggleToday = function () {
  const today = todayStr();
  let done = getDone();
  if (done.includes(today)) {
    done = done.filter(d => d !== today);
  } else {
    done.push(today);
    // Pulse animation
    document.querySelector('.streak-hero').classList.remove('pulse');
    void document.querySelector('.streak-hero').offsetWidth;
    document.querySelector('.streak-hero').classList.add('pulse');
  }
  set(K_DONE, done);
  render();
};

window.toggleAct = function (el) {
  const today = todayStr();
  const k = el.dataset.key;
  let saved = get(K_ACTS + today) || [];
  if (saved.includes(k)) saved = saved.filter(x => x !== k);
  else saved.push(k);
  set(K_ACTS + today, saved);
  el.classList.toggle('checked', saved.includes(k));
  // Auto mark done if 2+ activities checked
  if (saved.length >= 2 && !getDone().includes(today)) {
    const done = getDone();
    done.push(today);
    set(K_DONE, done);
    render();
  }
};

window.shareStreak = function () {
  const done = getDone();
  const streak = calcStreak(done);
  const text = `🔥 ${streak}-day English communication streak!\nPracticing every day to improve my English. 💪\n#EnglishStreak #LearnEnglish #EnglishCommunication`;
  if (navigator.share) {
    navigator.share({ title: 'My English Streak', text });
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => alert('Copied to clipboard!'));
  }
};

// Service Worker registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ── Vocabulary Notebook ──────────────────────────────────────
const K_VOCAB = 'eng_vocab';
let vocabFilter = 'all';

function getVocab() { return get(K_VOCAB) || []; }

function getWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

window.addVocab = function () {
  const wordEl = document.getElementById('vocab-word');
  const meaningEl = document.getElementById('vocab-meaning');
  const word = wordEl.value.trim();
  const meaning = meaningEl.value.trim();
  if (!word) { wordEl.focus(); return; }

  const vocab = getVocab();
  vocab.unshift({ id: Date.now(), word, meaning, date: todayStr() });
  set(K_VOCAB, vocab);
  wordEl.value = '';
  meaningEl.value = '';
  wordEl.focus();
  renderVocab();
};

window.deleteVocab = function (id) {
  const vocab = getVocab().filter(v => v.id !== id);
  set(K_VOCAB, vocab);
  renderVocab();
};

window.filterVocab = function (f, btn) {
  vocabFilter = f;
  document.querySelectorAll('.vf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderVocab();
};

window.exportVocab = function () {
  const vocab = getVocab();
  if (!vocab.length) { alert('No words saved yet!'); return; }
  const text = vocab.map(v => `${v.word}${v.meaning ? ' — ' + v.meaning : ''} (${v.date})`).join('\n');
  const blob = new Blob([text], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'english-vocabulary.txt';
  a.click();
};

function renderVocab() {
  const vocab = getVocab();
  const today = todayStr();
  const weekStart = getWeekStart();

  let filtered = vocab;
  if (vocabFilter === 'today') filtered = vocab.filter(v => v.date === today);
  if (vocabFilter === 'week') filtered = vocab.filter(v => v.date >= weekStart);

  document.getElementById('vocab-total').textContent = vocab.length;
  document.getElementById('vocab-today-count').textContent = vocab.filter(v => v.date === today).length;

  const list = document.getElementById('vocab-list');
  if (!filtered.length) {
    list.innerHTML = '';
    return;
  }
  list.innerHTML = filtered.map(v => `
    <div class="vocab-item${v.date === today ? ' today-word' : ''}">
      <div class="vocab-word-col">
        <div class="vocab-word">${escHtml(v.word)}</div>
        ${v.meaning ? `<div class="vocab-meaning">${escHtml(v.meaning)}</div>` : ''}
        <div class="vocab-date">${v.date}</div>
      </div>
      <button class="vocab-delete" onclick="deleteVocab(${v.id})" title="Delete">✕</button>
    </div>
  `).join('');
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// Enter key support for vocab input
document.addEventListener('DOMContentLoaded', () => {
  render();
  renderVocab();
  document.getElementById('vocab-meaning').addEventListener('keydown', e => {
    if (e.key === 'Enter') addVocab();
  });
  document.getElementById('vocab-word').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('vocab-meaning').focus();
  });
});
