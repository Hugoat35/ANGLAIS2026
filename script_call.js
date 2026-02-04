// --- CONFIGURATION ---
const OPERATOR_CODE = "4215"; 
const EMERGENCY_NUMBERS = ["15", "112", "18", "911", "999"];
const CALL_DURATION = 120; 

const HINTS = [
    "HAZARDS (Fire? Gas? Traffic?)",
    "NATURE OF THE INCIDENT (What happened?)",
    "CONDITION OF VICTIMS (Conscious? Breathing?)",
    "LOCATION (Where are you?)",
    "NUMBER OF VICTIMS (How many?)",
];

// --- VARIABLES ---
let currentInput = "";
let isCallActive = false;
let callTimerInterval;
let hintIndex = 0;

// STATS
let levelStartTime = 0;
let stepErrors = 0;

// --- DOM ELEMENTS ---
const screenDial = document.getElementById('screen-dial');
const screenConnecting = document.getElementById('screen-connecting');
const screenActiveCall = document.getElementById('screen-active-call');

const dialDisplay = document.getElementById('dial-display');
const finalCodeDisplay = document.getElementById('final-code-display');
const callTimer = document.getElementById('call-timer');

const btnCall = document.getElementById('btn-call');
const btnOk = document.getElementById('btn-ok');
const numpadArea = document.getElementById('numpad-area');

const modalOverlay = document.getElementById('overlay-final');
const modalHint = document.getElementById('overlay-hint');
const hintText = document.getElementById('hint-text');

// --- SHORTCUT ADMIN ---
document.addEventListener('keydown', function(e) {
    if (e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        document.getElementById('dev-menu').classList.toggle('visible');
    }
});

// Initialisation Stats
window.onload = function() {
    levelStartTime = Date.now();
};

function pressKey(num) {
    if(screenConnecting.style.display === 'flex') return;

    if (!isCallActive) {
        if (currentInput.length < 3) {
            currentInput += num;
            dialDisplay.innerText = currentInput;
        }
    } else {
        if (currentInput.length < 4) {
            currentInput += num;
            finalCodeDisplay.innerText = currentInput;
        }
    }
}

function pressDel() {
    if(screenConnecting.style.display === 'flex') return;
    currentInput = "";
    if (!isCallActive) dialDisplay.innerText = "_ _ _";
    else finalCodeDisplay.innerText = "_ _ _ _";
}

function submitDial() {
    if (EMERGENCY_NUMBERS.includes(currentInput)) {
        triggerConnectionSequence();
    } else {
        // ERREUR NUMÉRO
        stepErrors++;
        dialDisplay.style.color = "var(--alert)";
        setTimeout(() => dialDisplay.style.color = "var(--primary)", 500);
        currentInput = "";
        dialDisplay.innerText = "_ _ _";
    }
}

function triggerConnectionSequence() {
    screenDial.style.display = 'none';
    screenConnecting.style.display = 'flex';
    setTimeout(() => {
        screenConnecting.style.display = 'none';
        startCall();
    }, 2500);
}

function startCall() {
    isCallActive = true;
    currentInput = "";
    
    screenActiveCall.style.display = 'flex';
    btnCall.style.display = 'none';
    btnOk.style.display = 'block';
    
    numpadArea.style.display = 'none';
    document.getElementById('btn-toggle-pad').classList.remove('active');
    
    startTimer();
}

function toggleKeypad() {
    const btn = document.getElementById('btn-toggle-pad');
    if (numpadArea.style.display === 'none') {
        numpadArea.style.display = 'flex';
        btn.classList.add('active');
    } else {
        numpadArea.style.display = 'none';
        btn.classList.remove('active');
    }
}

function hangUpCall() {
    clearInterval(callTimerInterval);
    isCallActive = false;
    currentInput = "";
    
    screenActiveCall.style.display = 'none';
    screenDial.style.display = 'flex';
    
    btnOk.style.display = 'none';
    btnCall.style.display = 'block';
    
    numpadArea.style.display = 'flex';
    
    dialDisplay.innerText = "_ _ _";
    finalCodeDisplay.innerText = "_ _ _ _";
    finalCodeDisplay.style.color = "#fff";
    callTimer.innerText = "02:00";
    callTimer.style.color = "#fff";
}

function startTimer() {
    let timeLeft = CALL_DURATION;
    callTimer.style.color = "#fff";
    
    clearInterval(callTimerInterval);
    callTimerInterval = setInterval(() => {
        timeLeft--;
        
        let m = Math.floor(timeLeft / 60);
        let s = timeLeft % 60;
        callTimer.innerText = `0${m}:${s < 10 ? '0'+s : s}`;
        
        if (timeLeft <= 30) callTimer.style.color = "var(--alert)";
        
        if (timeLeft <= 0) {
            handleTimeOut();
        }
    }, 1000);
}

function handleTimeOut() {
    clearInterval(callTimerInterval);
    if (hintIndex < HINTS.length) {
        showNextHint();
    } else {
        endGame(false, "CONNECTION LOST. TOO MANY ATTEMPTS.");
    }
}

function showNextHint() {
    clearInterval(callTimerInterval);
    hintText.innerText = HINTS[hintIndex];
    modalHint.classList.add('visible');
    hintIndex++;
}

function resumeCall() {
    modalHint.classList.remove('visible');
    startTimer();
}

function submitFinalCode() {
    if (currentInput === OPERATOR_CODE) {
        endGame(true);
    } else {
        // ERREUR CODE
        stepErrors++;
        finalCodeDisplay.style.color = "var(--alert)";
        setTimeout(() => finalCodeDisplay.style.color = "#fff", 500);
        currentInput = "";
        finalCodeDisplay.innerText = "_ _ _ _";
    }
}

function endGame(success, reason) {
    clearInterval(callTimerInterval);
    
    if (success) {
        // --- SAUVEGARDE DES STATS ÉTAPE 2 ---
        const duration = Date.now() - levelStartTime;
        localStorage.setItem('stats_step2', JSON.stringify({
            time: duration,
            errors: stepErrors
        }));

        // Transition
        const transitionOverlay = document.getElementById('transition-overlay');
        if(transitionOverlay) {
            transitionOverlay.classList.add('active');
            setTimeout(() => {
                window.location.href = "enigme_triage.html"; 
            }, 2000);
        } else {
            window.location.href = "enigme_triage.html";
        }
    } else {
        const title = document.getElementById('final-title');
        const text = document.getElementById('final-text');
        title.innerText = "MISSION FAILED";
        title.style.color = "var(--alert)";
        text.innerText = reason || "Communication failure.";
        modalOverlay.classList.add('visible');
    }
}