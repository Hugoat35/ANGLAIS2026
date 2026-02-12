// --- CONFIGURATION ---
const VOCAB_TIME = 12; // MODIFIÉ : 12 secondes par mot
const WINNING_SCORE = 8; // MODIFIÉ : 8 mots corrects d'affilée requis

// --- LISTE DE MOTS ---
const gameData = [
    { word: "TOURNIQUET",   code: "15" },
    { word: "HEMORRHAGE",   code: "92" },
    { word: "STETHOSCOPE",  code: "33" },
    { word: "ABRASION",     code: "99" },
    { word: "EPIPEN",       code: "07" },
    { word: "VENTILATION",  code: "84" },
    { word: "RECOVERY POSITION", code: "61" },
    { word: "DIZZINESS",    code: "42" },
    { word: "CONCUSSION",   code: "19" },
    { word: "PILE-UP",      code: "55" },
    { word: "HYPOTHERMIA",  code: "03" },
    { word: "BYSTANDER",    code: "11" },
    { word: "EMERGENCY",    code: "90" },
    { word: "CHOKING",      code: "28" },
    { word: "SPLINT",       code: "74" },
    { word: "NECK BRACE",   code: "88" },
    { word: "IV DRIP",      code: "10" },
    { word: "CASUALITY",    code: "22" },
    { word: "AIRWAY",       code: "66" },
    { word: "SEIZURE",      code: "37" },
    { word: "CPR",          code: "44" },
    { word: "PULSE",        code: "77" },
    { word: "DISPATCHER",   code: "01" },
    { word: "SYRINGE",      code: "59" },
    { word: "OXYGEN",       code: "08" }
];

// --- VARIABLES ---
let availableWords = [];
let score = 0;
let currentInput = "";
let timerInterval;
let currentBPM = 80;
let bpmInterval;
let decodeInterval;
let isGameRunning = false;
let cheatBuffer = ""; 

// STATS GLOBALES
let levelStartTime = 0;
let stepErrors = 0;

// --- DOM ELEMENTS ---
const wordDisplay = document.getElementById('target-word');
const inputDisplay = document.getElementById('input-display');
const progressBar = document.getElementById('progress-bar');
const statusMessage = document.getElementById('status-message');
const modalOverlay = document.getElementById('overlay-modal');

// Initialisation
window.onload = function() {
    // NETTOYAGE GLOBAL AU DÉBUT DU JEU
    localStorage.clear();
};

// --- SHORTCUT ADMIN (Shift + A) ---
document.addEventListener('keydown', function(e) {
    if (e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        document.getElementById('dev-menu').classList.toggle('visible');
    }
});

function startGame() {
    AudioEngine.init(); // Important !
    AudioEngine.playRandomChain('drone_',10);
    score = 0;
    stepErrors = 0;
    availableWords = [...gameData];
    modalOverlay.classList.remove('visible');
    isGameRunning = true;
    
    // DÉMARRAGE CHRONO GLOBAL
    levelStartTime = Date.now();
    
    startBPM();
    nextTurn();
}

function nextTurn() {
    // Condition de victoire
    if (score >= WINNING_SCORE) {
        victory();
        return;
    }
    
    document.body.classList.remove('critical-state');
    
    // Mélange et sélection
    if (availableWords.length === 0) availableWords = [...gameData];
    const idx = Math.floor(Math.random() * availableWords.length);
    const data = availableWords[idx];
    availableWords.splice(idx, 1);
    
    // Affichage
    displayWordEffect(data.word);
    wordDisplay.dataset.answer = data.code;
    
    // Mise à jour UI du score (Série en cours)
    statusMessage.innerText = `CURRENT STREAK: ${score} / ${WINNING_SCORE}`;
    statusMessage.style.color = "#64748b"; // Couleur neutre

    currentInput = "";
    inputDisplay.innerText = "_ _";
    startTimer();
}

function startTimer() {
    let timeLeft = VOCAB_TIME;
    
    progressBar.classList.remove('critical');
    progressBar.style.transition = 'none';
    progressBar.style.width = '100%'; 
    
    setTimeout(() => {
        progressBar.style.transition = `width ${VOCAB_TIME}s linear`;
        progressBar.style.width = '0%'; 
    }, 50);

    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timeLeft--;
        if(timeLeft <= 4) {
            progressBar.classList.add('critical');
            document.body.classList.add('critical-state');
        }
        if(timeLeft < 0) {
            // TEMPS ÉCOULÉ = GAME OVER (Ou reset streak ? Ici on garde Game Over pour le stress du temps)
            triggerFail("TIME EXPIRED");
        }
    }, 1000);
}

function addNumber(num) {
    // Cheat Code
    cheatBuffer += num;
    if(cheatBuffer.length > 4) cheatBuffer = cheatBuffer.slice(-4);
    if(cheatBuffer === "2106") {
        document.getElementById('dev-menu').classList.add('visible');
        return;
    }

    if (!isGameRunning) return;
    if (currentInput.length < 2) {
        AudioEngine.playClick();
        currentInput += num;
        inputDisplay.innerText = currentInput;
    }
}

function clearInput() {
    currentInput = "";
    inputDisplay.innerText = "_ _";
}

function submitAnswer() {
    if (!isGameRunning) return;
    
    clearInterval(timerInterval); // On arrête le chrono le temps de vérifier

    if (currentInput === wordDisplay.dataset.answer) {
        AudioEngine.playSuccess();
        // --- BONNE RÉPONSE ---
        score++;
        statusMessage.innerText = `STREAK SECURED: ${score}/${WINNING_SCORE}`;
        statusMessage.style.color = "var(--success)";
        
        // Petit délai avant le prochain mot
        setTimeout(nextTurn, 500);
        
    } else {
        AudioEngine.playError();
        // --- MAUVAISE RÉPONSE : RESET DU STREAK ---
        stepErrors++; // On compte l'erreur pour les stats finales
        
        // RESET DU SCORE À ZÉRO
        score = 0; 
        
        // Feedback visuel "cassure"
        statusMessage.innerText = `WRONG CODE! STREAK BROKEN (0/${WINNING_SCORE})`;
        statusMessage.style.color = "var(--alert)";
        inputDisplay.style.color = "var(--alert)";
        
        // On fait clignoter l'écran rouge brièvement
        document.body.classList.add('critical-state');
        setTimeout(() => document.body.classList.remove('critical-state'), 300);

        // On relance un nouveau mot après 1 seconde pour qu'il réalise son erreur
        setTimeout(() => {
            inputDisplay.style.color = "var(--primary)";
            nextTurn(); 
        }, 1500);
    }
}

function victory() {
    clearInterval(timerInterval);
    clearInterval(bpmInterval);
    document.body.classList.remove('critical-state');
    isGameRunning = false;
    
    // --- SAUVEGARDE DES STATS ÉTAPE 1 ---
    const duration = Date.now() - levelStartTime;
    localStorage.setItem('stats_step1', JSON.stringify({
        time: duration,
        errors: stepErrors
    }));
    
    // ANIMATION TRANSITION
    const transitionOverlay = document.getElementById('transition-overlay');
    if(transitionOverlay) {
        transitionOverlay.classList.add('active'); 
        setTimeout(() => {
            window.location.href = "enigme_call.html";
        }, 2000);
    } else {
        window.location.href = "enigme_call.html";
    }
}

function triggerFail(reason) {
    clearInterval(timerInterval);
    isGameRunning = false;
    document.body.classList.remove('critical-state');
    
    const title = document.getElementById('modal-title');
    const desc = document.getElementById('modal-desc');
    const btn = document.getElementById('modal-btn');
    
    if(title && desc && btn) {
        title.innerText = "MISSION FAILED";
        title.style.color = "var(--alert)";
        desc.innerHTML = `Cause: ${reason}<br>Patient condition critical.<br>Protocol Failed.`;
        btn.innerText = "RETRY LEVEL";
        btn.onclick = startGame;
        modalOverlay.classList.add('visible');
    } else {
        alert("GAME OVER: " + reason);
        location.reload();
    }
}

function displayWordEffect(word) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let iterations = 0;
    clearInterval(decodeInterval);
    decodeInterval = setInterval(() => {
        wordDisplay.innerText = word.split("").map((l, i) => {
            if(i < iterations) return word[i];
            return chars[Math.floor(Math.random() * chars.length)];
        }).join("");
        if(iterations >= word.length) clearInterval(decodeInterval);
        iterations += 1/2;
    }, 30);
}

function startBPM() {
    const el = document.getElementById('bpm-text');
    if(bpmInterval) clearInterval(bpmInterval);
    bpmInterval = setInterval(() => {
        let val = currentBPM + Math.floor(Math.random() * 5) - 2;
        el.innerText = val;
        AudioEngine.playHeartbeat();
    }, 1000);
}

// Fonctions DEV
function devWinWord() {
    if(!isGameRunning) return;
    clearInterval(timerInterval);
    score++;
    nextTurn();
}
function devWinLevel() {
    score = WINNING_SCORE; // Force le score max
    victory(); 
}