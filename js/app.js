let playerCount = 1;
let gameStyle = null;

const TIMER_DURATION = 15;
const questions = QUESTION_DB; 

// =====================
//  Sound Effects (FINAL)
// =====================
const SFX = {
  stressLoop: new Audio("sounds/stress.mp3"),
  tadaWheel: new Audio("sounds/tada.mp3"),
  hornWin: new Audio("sounds/horn.mp3"),
};

let soundEnabled = true;

SFX.stressLoop.loop = true;
SFX.stressLoop.volume = 0.35;

SFX.tadaWheel.loop = false;
SFX.tadaWheel.volume = 0.8;

SFX.hornWin.loop = false;
SFX.hornWin.volume = 0.9;

function playSfx(audio) {
  if (!soundEnabled || !audio) return;
  try {
    audio.currentTime = 0;
    audio.play();
  } catch (e) {}
}

function stopSfx(audio) {
  if (!audio) return;
  try {
    audio.pause();
    audio.currentTime = 0;
  } catch (e) {}
}

// =====================================================
//  ابزارهای شافل و انتخاب سوال
// =====================================================
function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickNRandom(arr, n) {
  return shuffleArray(arr).slice(0, n);
}

function shuffleQuestionOptions(q) {
  const correctOptionText = q.options[q.correctAnswer];
  const shuffledOptions = shuffleArray(q.options);
  const newCorrectIndex = shuffledOptions.indexOf(correctOptionText);

  return {
    ...q,
    options: shuffledOptions,
    correctAnswer: newCorrectIndex,
  };
}

// =====================================================
//  سوالات فعال بازی
// =====================================================
let baseQuestions = [];        
let activeQuestions = [];     
let totalQuestions = 0;
let selectedQuestionIds = [];

// =====================================================
function getPlayerColor(index) {
  const colors = [
    'from-blue-400 to-blue-600',
    'from-green-400 to-green-600',
    'from-purple-400 to-purple-600',
    'from-orange-400 to-orange-600',
    'from-pink-400 to-pink-600',
    'from-teal-400 to-teal-600',
    'from-red-400 to-red-600',
    'from-indigo-400 to-indigo-600',
    'from-yellow-400 to-yellow-600',
    'from-cyan-400 to-cyan-600',
  ];
  return colors[index % colors.length];
}

// =====================================================
const Screens = {
  WELCOME: "WELCOME",
  PLAYER_NAMES: "PLAYER_NAMES",
  GAME: "GAME",
};
let currentScreen = Screens.WELCOME;
let playerNames = [];

//  ---- WelcomeScreen + LuckyWheel ----
const gameStyles = [
  {
    id: 'music',
    name: 'Music',
    description: 'From songs to artists🎧',
    icon: '🎵',
    color: 'from-pink-400 to-rose-500',
  },
  {
    id: 'movies-series',
    name: 'Movies & Series & Anime',
    description: "who's the best watcher?🍿",
    icon: '🎬',
    color: 'from-indigo-400 to-purple-600',
  },
  {
    id: 'memes-riddles',
    name: 'Memes & Riddles',
    description: 'only a Gen Z gets it🧩',
    icon: '😂',
    color: 'from-yellow-400 to-orange-500',
  },
  {
    id: 'language-general',
    name: 'Language General Knowledge',
    description: 'English facts, vocab, and grammer 📚',
    icon: '🗣️',
    color: 'from-green-400 to-emerald-600',
  },
];

let welcomeSelectedStyle = null;
let showWheel = false;

// ---- Lucky Wheel State ----
let wheelSpinning = false;
let wheelRotation = 0;
let wheelSelectedStyle = null;
let wheelRandomSegment = null; // ✅ FIX: ذخیره سگمنت انتخابی

const wheelColors = {
  "music": "#ec4899",
  "movies-series": "#8b5cf6",
  "memes-riddles": "#f59e0b",
  "language-general": "#10b981",
};

// ---- Lucky Wheel UI ----
function renderLuckyWheel() {
  const segAngle = 360 / gameStyles.length;

  const gradientStops = gameStyles.map((s, i) => {
    const start = i * segAngle;
    const end = (i + 1) * segAngle;
    return `${wheelColors[s.id]} ${start}deg ${end}deg`;
  }).join(", ");

  const labelsInsideWheel = gameStyles.map((s, i) => {
    const mid = i * segAngle + segAngle / 2;

    return `
      <div class="absolute inset-0 flex items-start justify-center pt-8 pointer-events-none"
        style="transform: rotate(${mid}deg);">
        <span class="text-white px-2 py-1 rounded text-sm font-semibold text-center"
          style="transform: rotate(90deg); transform-origin: center; text-shadow: 0 2px 6px rgba(0,0,0,0.35);">
          ${s.name}
        </span>
      </div>
    `;
  }).join("");

  return `
    <div class="flex flex-col items-center gap-6 p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-xl">
      <div class="text-center">
        <h3 class="text-slate-900 mb-2 text-xl font-bold">✨ Lucky Wheel ✨</h3>
        <p class="text-slate-600">Spin to let fate pick your topic 😎</p>
      </div>

      <div class="relative">
        <div class="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-10">
          <div class="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-red-500 drop-shadow-lg"></div>
        </div>

        <div class="relative w-72 h-72 md:w-80 md:h-80 rounded-full shadow-2xl overflow-hidden border-8 border-white">
          <div id="wheel" class="absolute inset-0 rounded-full"
            style="background: conic-gradient(${gradientStops}); transform: rotate(${wheelRotation}deg); will-change: transform; backface-visibility: hidden;">
            ${labelsInsideWheel}
            <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-white rounded-full shadow-lg border-4 border-slate-200 flex items-center justify-center z-20">
              ✨
            </div>
          </div>
        </div>
      </div>

      <button id="spin-btn" ${wheelSpinning ? "disabled" : ""}
        class="px-8 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg disabled:opacity-50">
        ${wheelSpinning ? "Spinning..." : "Spin the Wheel!"}
      </button>

      ${wheelSelectedStyle && !wheelSpinning ? `
        <div class="text-center p-4 bg-white rounded-lg shadow-md border-2 border-green-400 animate-bounce">
          <p class="text-green-600 font-semibold">
            Selected: ${gameStyles.find(x => x.id === wheelSelectedStyle)?.name}
          </p>
        </div>` : ""}
    </div>
  `;
}

// ---- Lucky Wheel Logic (Smooth) ----
function spinWheel() {
  if (wheelSpinning) return;

  wheelSpinning = true;
  wheelSelectedStyle = null;

  // 🎵 play tada while spinning
  playSfx(SFX.tadaWheel);

  const spinBtn = document.getElementById("spin-btn");
  if (spinBtn) spinBtn.disabled = true;

  const n = gameStyles.length;
  const segAngle = 360 / n;

  // ✅ کاملاً رندوم
  const randomSpins = 5 + Math.random() * 3;       // 5..8 دور
  const randomSegment = Math.floor(Math.random() * n);

  // ✅ مرکز سگمنت انتخابی
  const targetCenter = randomSegment * segAngle + segAngle / 2;

  // ✅ یه jitter کوچیک داخل همون سگمنت که طبیعی شه
  // (ولی انقدر نیست که بره سگمنت کناری)
  const jitter = (Math.random() - 0.5) * segAngle * 0.25; // ±12.5% سگمنت

  // ✅ چرخش لازم که مرکز سگمنت بیاد زیر پوینترِ بالا
  const neededRotation = 360 - targetCenter + jitter;

  const finalRotation =
    wheelRotation + randomSpins * 360 + neededRotation;

  const wheelEl = document.getElementById("wheel");
  if (wheelEl) {
    wheelEl.style.transition = "none";
    wheelEl.style.transform = `rotate(${wheelRotation}deg)`;
    wheelEl.offsetHeight;

    requestAnimationFrame(() => {
      wheelEl.style.transition =
        "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)";
      wheelEl.style.transform = `rotate(${finalRotation}deg)`;
    });
  }

  setTimeout(() => {
    wheelSpinning = false;
    wheelRotation = finalRotation;

    stopSfx(SFX.tadaWheel);

    // ✅ نرمال سازی زاویه توقف
    const normalized = ((finalRotation % 360) + 360) % 360;

    // ✅ محاسبه دقیق سگمنت زیر پوینتر بالا
    const pointerAngle = (360 - normalized) % 360;
    const selectedIndex = Math.floor(pointerAngle / segAngle);

    const selected = gameStyles[selectedIndex];

    wheelSelectedStyle = selected.id;
    welcomeSelectedStyle = selected.id;

    renderApp();

    setTimeout(() => {
      showWheel = false;
      renderApp();
    }, 1500);

  }, 4000);
}



// ---- Welcome UI ----
function renderWelcomeScreen() {
  const manualGrid = `
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      ${gameStyles.map(style => `
        <div class="game-style-card p-6 cursor-pointer transition-all duration-200 hover:scale-105 bg-white rounded-2xl
          ${welcomeSelectedStyle === style.id ? "ring-4 ring-blue-500 shadow-xl" : "hover:shadow-lg"}"
          data-style="${style.id}">
          <div class="flex items-start gap-4">
            <div class="flex items-center justify-center w-16 h-16 bg-gradient-to-br ${style.color} rounded-xl text-white shadow-md text-3xl">
              ${style.icon}
            </div>
            <div class="flex-1">
              <h3 class="text-slate-900 mb-1 text-lg font-bold">${style.name}</h3>
              <p class="text-slate-600">${style.description}</p>
            </div>
            ${welcomeSelectedStyle === style.id ? `
              <div class="flex items-center justify-center w-6 h-6 bg-blue-500 rounded-full text-white text-sm">✓</div>` : ""}
          </div>
        </div>`).join("")}
    </div>
  `;

  return `
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-4xl">
      <div class="text-center mb-8">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl mb-4 shadow-lg text-white text-3xl">⚡</div>
        <h1 class="text-slate-900 mb-2 text-3xl font-bold">Zlingo</h1>
        <p class="text-slate-600">Zlingo, Your Gen Z English quiz.</p>
      </div>

      <div class="p-6 mb-6 shadow-lg border-2 bg-white rounded-2xl">
        <div class="flex items-center gap-4">
          <div class="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg text-blue-600 text-2xl">👥</div>
          <div class="flex-1">
            <label for="player-count" class="block text-slate-700 mb-2">Number of Players</label>

            <!-- ✅ FIX: inputmode + step + buttons -->
            <div class="flex items-center gap-2 max-w-xs">
              <button id="minus-player"
                class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold">−</button>

              <input id="player-count" type="number" min="1" max="10" step="1"
                inputmode="numeric"
                value="${playerCount}"
                class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-blue-400 text-center"
                placeholder="Players" />

              <button id="plus-player"
                class="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold">+</button>
            </div>

          </div>
        </div>
      </div>

      <div class="mb-8">
        <div class="flex items-center justify-between mb-4 gap-3">
          <h2 class="text-slate-900 text-xl font-bold">Pick a Topic</h2>
          <button id="wheel-toggle-btn"
            class="px-4 py-2 rounded-lg border bg-white shadow-sm hover:bg-slate-50 text-slate-700 font-semibold">
            ${showWheel ? "Manual Selection" : "Try Lucky Wheel"}
          </button>
        </div>
        ${showWheel ? renderLuckyWheel() : manualGrid}
      </div>

      <div class="flex justify-center">
        <button id="start-game-btn"
          class="px-12 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
          Start Game
        </button>
      </div>
    </div>
  </div>
  `;
}

// ---- Welcome Events ----
function bindWelcomeEvents() {
  const countInput = document.getElementById("player-count");
  const plusBtn = document.getElementById("plus-player");
  const minusBtn = document.getElementById("minus-player");

  // ✅ آزاد بذار تایپ کنه، clamp رو بعداً انجام می‌دیم
  countInput.addEventListener("input", (e) => {
    const val = e.target.value;
    if (val === "") return; // اجازه بده خالی بشه
    const num = Number(val);
    if (!Number.isNaN(num)) playerCount = num;
  });

  // ✅ clamp وقتی از input خارج شد
  function clampPlayerCount() {
    playerCount = Math.max(1, Math.min(10, Number(playerCount || 1)));
    countInput.value = playerCount;
  }
  countInput.addEventListener("blur", clampPlayerCount);
  countInput.addEventListener("change", clampPlayerCount);

  // ✅ دکمه‌های + و –
  plusBtn.addEventListener("click", () => {
    playerCount = Math.min(10, playerCount + 1);
    countInput.value = playerCount;
  });
  minusBtn.addEventListener("click", () => {
    playerCount = Math.max(1, playerCount - 1);
    countInput.value = playerCount;
  });

  document.getElementById("wheel-toggle-btn").addEventListener("click", () => {
    showWheel = !showWheel;
    renderApp();
  });

  document.querySelectorAll(".game-style-card").forEach(card => {
    card.addEventListener("click", () => {
      welcomeSelectedStyle = card.dataset.style;
      renderApp();
    });
  });

  const spinBtn = document.getElementById("spin-btn");
  if (spinBtn) spinBtn.addEventListener("click", spinWheel);

  document.getElementById("start-game-btn").addEventListener("click", () => {
    clampPlayerCount();

    if (!welcomeSelectedStyle || !playerCount || playerCount < 1) {
      alert("Please enter the number of players and select a topic");
      return;
    }

    gameStyle = welcomeSelectedStyle;

    const topicQuestions = questions.filter(q => q.topic === gameStyle);
    if (topicQuestions.length < 10) {
      alert("Not enough questions in this topic. Please add more!");
      return;
    }

    baseQuestions = pickNRandom(topicQuestions, 10);
    totalQuestions = baseQuestions.length;
    selectedQuestionIds = baseQuestions.map(q => q.id);

    currentScreen = Screens.PLAYER_NAMES;
    playerNames = Array(playerCount).fill("");
    renderApp();
  });
}

// =====================================================
//  ---- PlayerNamesScreen ----
// =====================================================
function renderPlayerNamesScreen() {
  const inputs = Array.from({ length: playerCount }).map((_, i) => {
    return `
      <div class="p-6 shadow-lg border-2 hover:shadow-xl transition-shadow bg-white rounded-2xl">
        <div class="flex items-center gap-4">
          <div class="flex items-center justify-center w-16 h-16 bg-gradient-to-br ${getPlayerColor(i)} rounded-xl text-white shadow-md flex-shrink-0 text-2xl">👤</div>
          <div class="flex-1">
            <label for="player-${i}" class="block text-slate-700 mb-2">Player ${i + 1}</label>
            <input id="player-${i}" type="text" placeholder="Enter name for Player ${i + 1}"
              class="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:outline-none focus:border-blue-400"
              value="${playerNames[i] ?? ""}" />
          </div>
          <div id="check-${i}" class="${(playerNames[i]||"").trim() ? "" : "hidden"} flex items-center justify-center w-8 h-8 bg-green-500 rounded-full flex-shrink-0">
            <svg class="w-5 h-5 text-white" fill="none" stroke-linecap="round" stroke-linejoin="round"
              stroke-width="2" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 13l4 4L19 7"></path></svg>
          </div>
        </div>
      </div>`;
  }).join("");

  const chosenTopic = gameStyles.find(s => s.id === gameStyle)?.name || gameStyle;

  return `
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-3xl">
        <div class="text-center mb-8">
          <h1 class="text-slate-900 mb-2 text-3xl font-bold">Enter Player Names</h1>
          <p class="text-slate-600">Let's get to know everyone before we start the game</p>
        </div>

        <div class="space-y-4 mb-8">${inputs}</div>

        <div class="p-4 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl">
          <div class="flex items-center justify-center gap-2 text-slate-700">
            <span>Game Topic:</span>
            <span class="px-3 py-1 bg-white rounded-lg shadow-sm">${chosenTopic}</span>
          </div>
        </div>

        <div class="flex justify-center gap-4">
          <button id="previous-btn"
            class="px-12 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg flex items-center gap-2">
            <span class="text-lg">⬅️</span> previous page
          </button>

          <button id="continue-btn"
            class="px-12 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg flex items-center gap-2">
            Continue to Game <span class="text-lg">➡️</span>
          </button>
        </div>
      </div>
    </div>`;
}

function bindPlayerNamesEvents() {
  for (let i = 0; i < playerCount; i++) {
    const input = document.getElementById(`player-${i}`);
    const check = document.getElementById(`check-${i}`);

    input.addEventListener("input", (e) => {
      playerNames[i] = e.target.value;
      if (playerNames[i].trim() !== "") check.classList.remove("hidden");
      else check.classList.add("hidden");
    });
  }

  document.getElementById("continue-btn").addEventListener("click", () => {
    const empty = playerNames.filter(n => !n || n.trim() === "");
    if (empty.length > 0) {
      alert("Please enter names for all players");
      return;
    }

    playSfx(SFX.stressLoop);

    currentScreen = Screens.GAME;
    initGameStates();
    renderApp();
    startTimerIfNeeded();
  });

  document.getElementById("previous-btn").addEventListener("click", () => {
    window.location.href = "index.html";
  });
}

// =====================================================
//  ---- GameScreen ----
// =====================================================
let currentQuestionIndex = 0;
let currentPlayerIndex = 0;
let selectedAnswer = null;
let timeLeft = TIMER_DURATION;
let isAnswered = false;
let scores = [];
let gameFinished = false;
let showPlayerTransition = false;
let timerId = null;

function buildQuestionsForCurrentPlayer() {
  return baseQuestions.map(shuffleQuestionOptions);
}

function initGameStates() {
  currentQuestionIndex = 0;
  currentPlayerIndex = 0;
  selectedAnswer = null;
  timeLeft = TIMER_DURATION;
  isAnswered = false;
  scores = Array(playerNames.length).fill(0);
  gameFinished = false;
  showPlayerTransition = false;

  activeQuestions = buildQuestionsForCurrentPlayer();
}

function getTimerColor() {
  if (timeLeft > (TIMER_DURATION * 2) / 3) return 'from-green-500 to-green-600';
  if (timeLeft > TIMER_DURATION / 3) return 'from-yellow-500 to-yellow-600';
  return 'from-red-500 to-red-600';
}

function getAnswerClassName(index, correctAnswer) {
  if (!isAnswered) {
    return 'bg-white hover:bg-blue-50 border-2 border-slate-200 hover:border-blue-400';
  }
  if (index === correctAnswer) {
    return 'bg-green-100 border-2 border-green-500';
  }
  if (index === selectedAnswer && index !== correctAnswer) {
    return 'bg-red-100 border-2 border-red-500';
  }
  return 'bg-slate-100 border-2 border-slate-200';
}

function startTimerIfNeeded() {
  stopTimer();
  if (isAnswered || gameFinished || showPlayerTransition) return;

  timerId = setInterval(() => {
    timeLeft -= 1;
    if (timeLeft <= 0) {
      timeLeft = 0;
      handleTimeUp();
    }
    renderApp();
  }, 1000);
}

function stopTimer() {
  if (timerId) clearInterval(timerId);
  timerId = null;
}

function handleTimeUp() {
  isAnswered = true;
  stopTimer();
  renderApp();
  setTimeout(moveToNextQuestion, 2000);
}

function getSpeedPoints(timeLeft) {
  const used = TIMER_DURATION - timeLeft;
  if (used < 5) return 3;   
  if (used <= 10) return 2; 
  return 1;                
}

function handleAnswerSelect(answerIndex) {
  if (isAnswered) return;

  selectedAnswer = answerIndex;
  isAnswered = true;
  stopTimer();

  const currentQuestion = activeQuestions[currentQuestionIndex];

  if (answerIndex === currentQuestion.correctAnswer) {
    const pts = getSpeedPoints(timeLeft);
    scores[currentPlayerIndex] += pts;
  }

  renderApp();
  setTimeout(moveToNextQuestion, 2000);
}

function moveToNextQuestion() {
  if (currentQuestionIndex + 1 >= totalQuestions) {
    if (currentPlayerIndex + 1 >= playerNames.length) {
      gameFinished = true;
    } else {
      showPlayerTransition = true;
    }
  } else {
    currentQuestionIndex += 1;
    selectedAnswer = null;
    isAnswered = false;
    timeLeft = TIMER_DURATION;
  }

  renderApp();
  startTimerIfNeeded();
}

function startNextPlayer() {
  currentPlayerIndex += 1;
  currentQuestionIndex = 0;
  showPlayerTransition = false;
  selectedAnswer = null;
  isAnswered = false;
  timeLeft = TIMER_DURATION;

  activeQuestions = buildQuestionsForCurrentPlayer();

  renderApp();
  startTimerIfNeeded();
}

function goFirstPage() {
  window.location.href = "index.html";
}

// =====================================================
function getGenZMessage(score, isWinner, isStrictWinner) {
  if (gameStyle === "language-general") return "";

  if (playerCount === 1 && score < 15) {
    return "You're probably the parent of a Gen Z! 👵😂";
  }

  if (isWinner) {
    if (isStrictWinner && score < 15) {
      return "Among all your rivals, you're the most Gen Z 😌🔥";
    }
    if (score >= 15 && score <= 21) return "You low-key passed! 😏✅";
  }

  if (score < 15) return "You're probably the parent of a Gen Z! 👵😂";
  if (score > 24) return "Certified Gen Z 😎✅";
  return "";
}


let confettiStarted = false;

function startConfetti() {
  if (confettiStarted) return;
  confettiStarted = true;

  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  document.body.appendChild(layer);

  const emojis = ["🎉", "✨", "🎊", "💥", "🪩", "🔥"];
  const pieces = 80;

  for (let i = 0; i < pieces; i++) {
    const p = document.createElement("span");
    p.className = "confetti-piece";
    p.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    const left = Math.random() * 100;
    const delay = Math.random() * 1.5;
    const duration = 2.5 + Math.random() * 1.5;
    const size = 14 + Math.random() * 16;
    const rotate = Math.random() * 360;

    p.style.left = left + "vw";
    p.style.animationDelay = delay + "s";
    p.style.animationDuration = duration + "s";
    p.style.fontSize = size + "px";
    p.style.transform = `rotate(${rotate}deg)`;

    layer.appendChild(p);
  }

  setTimeout(() => layer.remove(), 5000);
}

// ---- Game Over UI ----
function renderGameOver() {
  const maxScore = Math.max(...scores);

  const winnerIndices = scores
    .map((s, i) => (s === maxScore ? i : -1))
    .filter(i => i !== -1);

  const winnersText =
    winnerIndices.length === 1
      ? `🏆 ${playerNames[winnerIndices[0]]} 🏆`
      : `🏆 ${winnerIndices.map(i => playerNames[i]).join(" & ")} 🏆`;

  const sortedPlayers = playerNames
    .map((name, index) => ({ name, index, score: scores[index] }))
    .sort((a, b) => b.score - a.score);

  const isTie = winnerIndices.length > 1;

  return `
  <div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
    <style>
      .confetti-layer { position: fixed; inset: 0; pointer-events: none; z-index: 9999; overflow: hidden; }
      .confetti-piece { position: absolute; top: -5vh; animation: confetti-fall linear forwards; opacity: 0.95; will-change: transform, top; }
      @keyframes confetti-fall {
        0% { top: -5vh; transform: translateY(0) rotate(0deg); }
        100% { top: 105vh; transform: translateY(105vh) rotate(720deg); }
      }
    </style>

    <div class="w-full max-w-2xl">
      <div class="p-8 text-center shadow-xl bg-white rounded-2xl">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mb-6 text-white text-3xl">🏆</div>

        <h1 class="text-slate-900 mb-2 text-3xl font-bold">Game Over!</h1>

        <div class="mb-8">
          <p class="text-slate-600 mb-4">
            ${isTie ? "It's a tie! Winners have the same score 😮" : "Congratulations to the winner!"}
          </p>
          <div class="inline-block px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl text-white shadow-lg">
            <span class="text-2xl">${winnersText}</span>
          </div>
        </div>

        <p class="text-slate-600 mb-8">Final Scores:</p>

        <div class="space-y-4 text-left">
          ${sortedPlayers.map((p) => {
            const isWinner = winnerIndices.includes(p.index);
            const isStrictWinner = (winnerIndices.length === 1) && isWinner;
            const msg = getGenZMessage(p.score, isWinner, isStrictWinner);

            return `
              <div class="p-4 rounded-xl ${
                isWinner
                  ? "bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400"
                  : "bg-gradient-to-r from-slate-50 to-slate-100"
              }">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br ${getPlayerColor(p.index)} rounded-lg flex items-center justify-center text-white">
                      ${isWinner ? "🏆" : "👤"}
                    </div>
                    <div>
                      <div class="text-slate-900 font-semibold">${p.name}</div>
                      ${msg ? `<div class="text-slate-600 text-sm mt-1">${msg}</div>` : ""}
                    </div>
                  </div>
                  <div class="text-slate-900 font-bold">${p.score}</div>
                </div>
              </div>`;
          }).join("")}
        </div>

        <div class="flex justify-center gap-4 m-10">
          <button onclick="goFirstPage()"
            class="px-12 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
            Back to first page
          </button>
        </div>

      </div>
    </div>
  </div>`;
}

// ---- Player Transition UI ----
function renderPlayerTransition() {
  const currentPlayer = playerNames[currentPlayerIndex];

  return `
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-2xl">
      <div class="p-8 text-center shadow-xl bg-white rounded-2xl">
        <div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${getPlayerColor(currentPlayerIndex)} rounded-full mb-6 text-white text-3xl">✅</div>
        <h1 class="text-slate-900 mb-4 text-2xl font-bold">${currentPlayer} Finished!</h1>
        <p class="text-slate-600 mb-6">Score: ${scores[currentPlayerIndex]}</p>

        <div class="mb-8">
          <h2 class="text-slate-700 mb-4 font-semibold">Current Scores:</h2>
          <div class="space-y-3">
            ${playerNames.slice(0, currentPlayerIndex + 1).map((name, index) => `
              <div class="p-4 bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-gradient-to-br ${getPlayerColor(index)} rounded-lg flex items-center justify-center text-white">👤</div>
                    <span class="text-slate-900 font-semibold">${name}</span>
                  </div>
                  <div class="text-slate-900 font-bold">${scores[index]}</div>
                </div>
              </div>`).join("")}
          </div>
        </div>

        <div class="text-center mb-6">
          <p class="text-slate-700">Next Player:</p>
          <div class="inline-flex items-center gap-3 mt-2 px-6 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
            <div class="w-10 h-10 bg-gradient-to-br ${getPlayerColor(currentPlayerIndex + 1)} rounded-lg flex items-center justify-center text-white">👤</div>
            <span class="text-slate-900 font-semibold">${playerNames[currentPlayerIndex + 1]}</span>
          </div>
        </div>

        <button id="start-next-player"
          class="px-12 py-3 rounded-xl text-white font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
          Start ${playerNames[currentPlayerIndex + 1]}'s Turn
        </button>
      </div>
    </div>
  </div>`;
}

// ---- Main Game UI ----
function renderMainGame() {
  const currentQuestion = activeQuestions[currentQuestionIndex];
  const currentPlayer = playerNames[currentPlayerIndex];
  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  return `
  <div class="min-h-screen flex items-center justify-center p-4">
    <div class="w-full max-w-4xl">

      <div class="mb-6 flex items-center justify-between gap-4">
        <div class="flex-1 p-4 shadow-lg bg-white rounded-2xl">
          <div class="flex items-center justify-between mb-2">
            <span class="text-slate-700">Question ${currentQuestionIndex + 1} of ${totalQuestions}</span>
            <span class="text-slate-500">${currentQuestion.category}</span>
          </div>
          <div class="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div class="h-full bg-blue-600" style="width:${progressPercent}%"></div>
          </div>
        </div>

        <div class="p-4 shadow-lg bg-white rounded-2xl">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-gradient-to-br ${getTimerColor()} rounded-lg flex items-center justify-center text-white">⏱️</div>
            <div>
              <div class="text-slate-500 text-sm">Time Left</div>
              <div class="text-slate-900 font-bold text-lg">${timeLeft}s</div>
            </div>
          </div>

          <button id="mute-btn"
            class="mt-3 w-full px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 border text-slate-700 font-semibold">
            ${soundEnabled ? "🔊 Sound On" : "🔇 Sound Off"}
          </button>
        </div>
      </div>

      <div class="p-4 mb-6 shadow-lg rounded-2xl bg-gradient-to-r ${getPlayerColor(currentPlayerIndex)} bg-opacity-10">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-br ${getPlayerColor(currentPlayerIndex)} rounded-lg flex items-center justify-center text-white">👤</div>
          <span class="text-slate-900 font-semibold">Current Player: ${currentPlayer}</span>
        </div>
      </div>

      <div class="p-8 mb-6 shadow-xl bg-white rounded-2xl">
        <h2 class="text-slate-900 mb-8 text-xl font-bold">${currentQuestion.question}</h2>

        <div class="grid gap-4">
          ${currentQuestion.options.map((option, index) => `
            <button class="answer-btn p-5 rounded-xl text-left transition-all duration-200
              ${getAnswerClassName(index, currentQuestion.correctAnswer)}
              ${!isAnswered ? "cursor-pointer hover:scale-[1.02]" : "cursor-not-allowed"}"
              data-index="${index}" ${isAnswered ? "disabled" : ""}>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-4">
                  <div class="w-8 h-8 bg-slate-200 rounded-lg flex items-center justify-center text-slate-700 font-bold">
                    ${String.fromCharCode(65 + index)}
                  </div>
                  <span class="text-slate-900">${option}</span>
                </div>
                ${isAnswered && index === currentQuestion.correctAnswer ? `<span class="text-green-600 text-xl">✅</span>` : ""}
              </div>
            </button>`).join("")}
        </div>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        ${playerNames.map((name, index) => `
          <div class="p-4 text-center bg-white rounded-2xl shadow">
            <div class="text-slate-600 mb-1">${name}</div>
            <div class="text-slate-900 font-bold">${scores[index]}</div>
          </div>`).join("")}
      </div>

    </div>
  </div>`;
}

function bindGameEvents() {
  if (gameFinished) return;

  if (showPlayerTransition) {
    document.getElementById("start-next-player")
      .addEventListener("click", startNextPlayer);
    return;
  }

  document.querySelectorAll(".answer-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.index);
      handleAnswerSelect(idx);
    });
  });

  const muteBtn = document.getElementById("mute-btn");
  if (muteBtn) {
    muteBtn.addEventListener("click", () => {
      soundEnabled = !soundEnabled;

      if (!soundEnabled) {
        stopSfx(SFX.stressLoop);
        stopSfx(SFX.tadaWheel);
        stopSfx(SFX.hornWin);
      } else {
        if (currentScreen === Screens.GAME && !gameFinished) {
          playSfx(SFX.stressLoop);
        }
      }

      renderApp();
    });
  }
}

// =====================================================
//  رندر کل اپ
// =====================================================
function renderApp() {
  const root = document.getElementById("app-root");

  if (currentScreen === Screens.WELCOME) {
    root.innerHTML = renderWelcomeScreen();
    bindWelcomeEvents();
    return;
  }

  if (currentScreen === Screens.PLAYER_NAMES) {
    root.innerHTML = renderPlayerNamesScreen();
    bindPlayerNamesEvents();
    return;
  }

  if (gameFinished) {
    root.innerHTML = renderGameOver();
    startConfetti();

    stopSfx(SFX.stressLoop);
    playSfx(SFX.hornWin);

    return;
  }

  if (showPlayerTransition) {
    root.innerHTML = renderPlayerTransition();
    bindGameEvents();
    return;
  }

  root.innerHTML = renderMainGame();
  bindGameEvents();
}

renderApp();
