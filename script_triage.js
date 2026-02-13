/* --- SCRIPT TRIAGE : MODE "HARD DEDUCTION" (SHORTCUT FIXED) --- */

const PATIENT_PROFILES = [
    {
        realName: "Sarah", 
        visualCue: "UNIDENTIFIED SUBJECT (NO VISUAL ID)",
        resp: "24 / min", // Elevated
        pulse: "110 bpm", // Rapid
        mental: "Anxious",
        injury: "L-Thigh Laceration",
        
        actionRequired: true,
        triggerActionOn: "injury",
        actionOptions: ["APPLY TOURNIQUET", "ELEVATE LEGS", "GIVE MORPHINE"],
        correctAction: "APPLY TOURNIQUET",
        successMsg: "Tourniquet applied. Bleeding stopped.",
        failMsg: "Arterial bleed unchecked. Exsanguination.",
        obs: "Bleeding controlled.",
        correctColor: "YELLOW",
        hasPulse: true
    },
    {
        realName: "John",
        visualCue: "UNIDENTIFIED SUBJECT (NO VISUAL ID)",
        resp: "0 (Apnea)", // Absent
        pulse: "ABSENT",   // Absent
        mental: "Unresponsive",
        injury: "Severe Head Trauma", 
        
        actionRequired: true,
        triggerActionOn: "resp",
        actionOptions: ["OPEN AIRWAY", "START CPR", "RECOVERY POSITION"],
        correctAction: "OPEN AIRWAY",
        successMsg: "Airway opened. Still no breathing.",
        failMsg: "Spine severed during manipulation.",
        obs: "No spontaneous breathing.",
        correctColor: "BLACK",
        hasPulse: false
    },
    {
        realName: "Emily",
        visualCue: "UNIDENTIFIED SUBJECT (NO VISUAL ID)",
        resp: "20 / min", // Normal
        pulse: "100 bpm", // Fast (Stress)
        mental: "Confused",
        injury: "Forehead Abrasion", 
        
        actionRequired: false, 
        obs: "",
        correctColor: "GREEN",
        hasPulse: true
    },
    {
        realName: "Kevin",
        visualCue: "UNIDENTIFIED SUBJECT (NO VISUAL ID)",
        resp: "Agonal / Gasping", // Agonal
        pulse: "NO PULSE (Initially)", // Initially Absent
        mental: "Unresponsive",
        injury: "No external trauma",
        
        actionRequired: true,
        triggerActionOn: "pulse",
        actionOptions: ["CHECK ID", "WALK HIM AWAY", "START CPR"],
        correctAction: "START CPR", 
        successMsg: "Pulse returned (Weak).",
        failMsg: "Cardiac arrest ignored.",
        obs: "Pulse returned (Weak).", 
        correctColor: "RED",
        hasPulse: false 
    },
    {
        realName: "Mike",
        visualCue: "UNIDENTIFIED SUBJECT (NO VISUAL ID)",
        resp: "34 / min", // Critical
        pulse: "120 bpm", // Fast
        mental: "Alert",
        injury: "Chest Bruising",
        
        actionRequired: false,
        obs: "",
        correctColor: "RED",
        hasPulse: true
    }
];

// --- VARIABLES ---
let activePatients = [];
let currentPatientIndex = 0;
let isScanning = false;
let actionInterval;
let startTime = 0;
let totalErrorsCount = 0; 
let userTags = { 0: null, 1: null, 2: null, 3: null, 4: null }; 
let userIdentities = { 0: "", 1: "", 2: "", 3: "", 4: "" };    
let revealedData = {}; 

// --- DOM ELEMENTS ---
const tabsContainer = document.getElementById('tabs-container');
const btnSubmit = document.getElementById('btn-submit');
const identitySelect = document.getElementById('identity-select');
const modalResult = document.getElementById('overlay-result');
const actionPanel = document.getElementById('action-panel');
const actionButtons = document.getElementById('action-buttons');
const obsBox = document.getElementById('p-obs');
const actionTimerDisplay = document.getElementById('action-timer');
const actionBar = document.getElementById('action-bar');

// --- INIT ---
window.onload = function() {
    activePatients = [...PATIENT_PROFILES]; 
    shuffleArray(activePatients); 
    
    for(let i=0; i<5; i++) {
        revealedData[i] = { resp:false, pulse:false, mental:false, injury:false, actionDone:false, successMsg: "" };
        if(!activePatients[i].actionRequired) revealedData[i].actionDone = true; 
    }

    initTabs();
    loadPatient(0);
    startTime = Date.now();
    

    // Ajout de l'écouteur pour le raccourci clavier
    document.addEventListener('keydown', (e) => {
        if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            forceSolve();
        }
    });
};

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function closeBriefing() {
    if(typeof AudioEngine !== 'undefined') {
        AudioEngine.init(); // On initialise le moteur audio ici (sur un clic)
        AudioEngine.playClick();
        // C'est le moment parfait pour lancer l'ambiance !
        AudioEngine.playAmbience('ambience_chaos.mp3'); 
    }
    
    document.getElementById('overlay-briefing').classList.remove('visible');
    startTime = Date.now(); 
}

function initTabs() {
    tabsContainer.innerHTML = "";
    const letters = ["A", "B", "C", "D", "E"];
    activePatients.forEach((p, index) => {
        const btn = document.createElement('div');
        btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
        btn.innerHTML = `VICTIM ${letters[index]} <div class="tab-indicator" id="ind-${index}"></div>`;
        btn.onclick = () => { if(!isScanning) loadPatient(index); };
        tabsContainer.appendChild(btn);
    });
}

function loadPatient(index) {
    if(isScanning) return; 
    if(typeof AudioEngine !== 'undefined') AudioEngine.playClick();

    currentPatientIndex = index;
    const p = activePatients[index];
    const letters = ["A", "B", "C", "D", "E"];

    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        if(i === index) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    document.getElementById('p-label').innerText = `VICTIM ${letters[index]}`;
    document.getElementById('p-desc').innerText = p.visualCue;

    identitySelect.value = userIdentities[index] || "";

    resetVitalBox('resp', p, index);
    resetVitalBox('pulse', p, index);
    resetVitalBox('mental', p, index);
    resetVitalBox('injury', p, index);
    
    const dataState = revealedData[index];
    actionPanel.style.display = 'none';
    obsBox.style.display = 'none';

    if(dataState.actionDone) {
        if(p.actionRequired && dataState.successMsg) {
            obsBox.style.display = 'block';
            obsBox.innerHTML = dataState.successMsg;
        } 
    } 
    else {
        const trigger = p.triggerActionOn || 'injury';
        if(dataState[trigger] && p.actionRequired) {
            showActionPanel(p);
        }
    }

    updateButtonsUI(index);
    updateStatusText(index);
}

function selectIdentity(nameVal) {
    if(isScanning) return;
    if(typeof AudioEngine !== 'undefined') AudioEngine.playClick();
    userIdentities[currentPatientIndex] = nameVal;
    checkCompletion();
}

function resetVitalBox(type, p, idx) {
    const box = document.getElementById(`box-${type}`);
    const valDiv = box.querySelector('.vital-value');
    const hintDiv = box.querySelector('.tap-hint');
    const bar = box.querySelector('.scan-bar');
    const ecg = box.querySelector('.ecg-line'); 
    const flat = box.querySelector('.ecg-flat'); 
    
    box.className = 'vital-box'; 
    box.classList.remove('scanning');
    
    if(bar) bar.style.width = '0%';
    if(ecg) ecg.style.display = 'none';
    if(flat) flat.style.display = 'none';

    if (revealedData[idx][type]) {
        box.classList.add('revealed');
        valDiv.style.display = 'block';
        hintDiv.style.display = 'none';
        
        if (type === 'resp') valDiv.innerText = p.resp;
        if (type === 'mental') valDiv.innerText = p.mental;
        if (type === 'injury') valDiv.innerText = p.injury;
        if (type === 'pulse') {
            valDiv.innerText = p.pulse;
            if(p.hasPulse && p.pulse !== "ABSENT" && p.pulse !== "NO PULSE") {
                 if(ecg) ecg.style.display = 'block';
            } else {
                 if(flat) flat.style.display = 'block';
            }
        }
    } else {
        valDiv.style.display = 'none';
        hintDiv.style.display = 'flex';
        valDiv.innerText = "";
    }
}

function checkVital(type) {
    if (isScanning) return; 
    const p = activePatients[currentPatientIndex];
    if (revealedData[currentPatientIndex][type]) return; 

    isScanning = true;
    const box = document.getElementById(`box-${type}`);
    const bar = box.querySelector('.scan-bar');
    
    box.classList.add('scanning');
    bar.style.width = '100%';

    setTimeout(() => {
        if(typeof AudioEngine !== 'undefined') AudioEngine.playScan();

        revealedData[currentPatientIndex][type] = true;
        bar.style.transition = 'none';
        bar.style.width = '0%';
        setTimeout(() => bar.style.transition = 'width 2s linear', 50);
        
        resetVitalBox(type, p, currentPatientIndex);

        const trigger = p.triggerActionOn || 'injury';
        if(type === trigger) {
            if(p.actionRequired && !revealedData[currentPatientIndex].actionDone) {
                showActionPanel(p);
            } 
        }
        isScanning = false;
    }, 2000); 
}

function showActionPanel(p) {
    actionPanel.style.display = 'block';
    actionButtons.innerHTML = "";
    const options = [...p.actionOptions].sort(() => 0.5 - Math.random());
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn-action-medical';
        btn.innerText = opt;
        btn.onclick = () => handleAction(opt, p);
        actionButtons.appendChild(btn);
    });
    startActionTimer(10); 
}

function startActionTimer(seconds) {
    clearInterval(actionInterval);
    const start = Date.now();
    const duration = seconds * 1000;
    updateTimerUI(seconds, seconds);
    actionInterval = setInterval(() => {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, duration - elapsed);
        updateTimerUI(remaining / 1000, seconds);
        if (remaining <= 0) {
            clearInterval(actionInterval);
            triggerFail("TIME OUT. Critical delay.");
        }
    }, 50);
}

function updateTimerUI(currentSec, totalSec) {
    if(!actionTimerDisplay || !actionBar) return;
    actionTimerDisplay.innerText = currentSec.toFixed(1) + "s";
    const percent = (currentSec / totalSec) * 100;
    actionBar.style.width = percent + "%";
    if(currentSec <= 3.0) {
        actionTimerDisplay.style.color = "#fff";
        actionTimerDisplay.style.backgroundColor = "var(--alert)";
    } else {
        actionTimerDisplay.style.color = "var(--alert)";
        actionTimerDisplay.style.backgroundColor = "rgba(0,0,0,0.5)";
    }
}

function handleAction(choice, p) {
    clearInterval(actionInterval);
    if(choice === p.correctAction) {
        if(typeof AudioEngine !== 'undefined') AudioEngine.playSuccess();
        revealedData[currentPatientIndex].actionDone = true;
        revealedData[currentPatientIndex].successMsg = `<span style="color:#22c55e; font-weight:bold;">✔ ${p.successMsg}</span><br>${p.obs}`;
        actionPanel.style.display = 'none';
        obsBox.innerHTML = revealedData[currentPatientIndex].successMsg;
        obsBox.style.display = 'block';
    } else {
        if(typeof AudioEngine !== 'undefined') AudioEngine.playError();
        triggerFail(p.failMsg);
    }
}

function triggerFail(reason) {
    clearInterval(actionInterval);
    totalErrorsCount++; 
    const title = document.getElementById('res-title');
    const text = document.getElementById('res-text');
    const btn = document.getElementById('res-btn');
    title.innerText = "PATIENT LOST";
    title.style.color = "var(--alert)";
    text.innerHTML = `FATAL ERROR: ${reason}<br>Protocol Failed.`;
    btn.innerText = "RESTART LEVEL";
    btn.onclick = () => location.reload();
    modalResult.classList.add('visible');
}

function tagPatient(color) {
    if(isScanning) return;
    if(typeof AudioEngine !== 'undefined') AudioEngine.playClick();
    userTags[currentPatientIndex] = color;
    updateButtonsUI(currentPatientIndex);
    updateIndicator(currentPatientIndex, color);
    updateStatusText(currentPatientIndex);
    checkCompletion();
}

function updateButtonsUI(idx) {
    const currentTag = userTags[idx];
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (currentTag === 'GREEN' && btn.classList.contains('tag-green')) btn.classList.add('selected');
        if (currentTag === 'YELLOW' && btn.classList.contains('tag-yellow')) btn.classList.add('selected');
        if (currentTag === 'RED' && btn.classList.contains('tag-red')) btn.classList.add('selected');
        if (currentTag === 'BLACK' && btn.classList.contains('tag-black')) btn.classList.add('selected');
    });
}

function updateIndicator(idx, color) {
    const ind = document.getElementById(`ind-${idx}`);
    if(color === 'GREEN') ind.style.background = '#22c55e';
    if(color === 'YELLOW') ind.style.background = '#eab308';
    if(color === 'RED') ind.style.background = '#ef4444';
    if(color === 'BLACK') ind.style.background = '#94a3b8';
}

function updateStatusText(idx) {
    const statusSpan = document.getElementById('p-status');
    const color = userTags[idx];
    if(!color) {
        statusSpan.innerText = "NOT TAGGED";
        statusSpan.style.color = "#64748b";
    } else {
        statusSpan.innerText = `TAGGED: ${color}`;
        if(color === 'GREEN') statusSpan.style.color = '#22c55e';
        if(color === 'YELLOW') statusSpan.style.color = '#eab308';
        if(color === 'RED') statusSpan.style.color = '#ef4444';
        if(color === 'BLACK') statusSpan.style.color = '#94a3b8';
    }
}

function checkCompletion() {
    let countTags = 0;
    let countIds = 0;
    for (let i=0; i<5; i++) {
        if (userTags[i] !== null) countTags++;
        if (userIdentities[i] !== "") countIds++;
    }
    btnSubmit.innerText = `SUBMIT REPORT (${countTags} TAGS / ${countIds} IDs)`;
    if (countTags === 5 && countIds === 5) {
        btnSubmit.disabled = false;
        btnSubmit.style.opacity = "1";
    } else {
        btnSubmit.disabled = true;
        btnSubmit.style.opacity = "0.5";
    }
}

function submitTriage() {
    let errors = [];
    const letters = ["A", "B", "C", "D", "E"];
    activePatients.forEach((p, index) => {
        let isColorCorrect = (userTags[index] === p.correctColor);
        let isNameCorrect = (userIdentities[index] === p.realName);
        if (!isColorCorrect || !isNameCorrect) {
            let msg = `VICTIM ${letters[index]} (`;
            if(!isNameCorrect) msg += "Wrong ID";
            if(!isNameCorrect && !isColorCorrect) msg += " & ";
            if(!isColorCorrect) msg += "Wrong Tag";
            msg += ")";
            errors.push(msg);
        }
    });
    if (errors.length === 0) {
        triggerVictory();
    } else {
        if(typeof AudioEngine !== 'undefined') AudioEngine.playError();
        totalErrorsCount += errors.length; 
        const title = document.getElementById('res-title');
        const text = document.getElementById('res-text');
        title.innerText = "PROTOCOL ERROR";
        title.style.color = "var(--alert)";
        text.innerHTML = `Errors detected:<br><b>${errors.join('<br>')}</b>.<br>Cross-reference vitals with physical files.`;
        modalResult.classList.add('visible');
    }
}

/* DANS script_triage.js - Remplace toute la fonction triggerVictory */

// --- VICTOIRE & BARÈME STRICT (30 MIN MAX) ---
function triggerVictory() {
    if(typeof AudioEngine !== 'undefined') {
        AudioEngine.stopAmbience();
        AudioEngine.playSuccess();
    }

    const endTime = Date.now();
    const step3Duration = Math.max(0, endTime - startTime);
    
    // SÉCURITÉ : Lecture stats (évite les bugs si vide)
    let stats1 = { time: 0, errors: 0 };
    let stats2 = { time: 0, errors: 0 };
    let totalHints = 0;

    try {
        if(localStorage.getItem('stats_step1')) stats1 = JSON.parse(localStorage.getItem('stats_step1'));
        if(localStorage.getItem('stats_step2')) stats2 = JSON.parse(localStorage.getItem('stats_step2'));
        if(localStorage.getItem('total_hints')) totalHints = parseInt(localStorage.getItem('total_hints'));
    } catch(e) { console.warn("Erreur lecture stats:", e); }
    
    // Calculs (le || 0 empêche le bug NaN)
    const totalTimeMs = (stats1.time || 0) + (stats2.time || 0) + step3Duration;
    const totalErrors = (stats1.errors || 0) + (stats2.errors || 0) + totalErrorsCount;
    
    const totalSeconds = Math.floor(totalTimeMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const timeString = `${mins < 10 ? '0'+mins : mins}:${secs < 10 ? '0'+secs : secs}`;

    // --- NOUVEAU BARÈME STRICT (30 MIN MAX) ---
    // Score = Minutes + (Erreurs * 5) + (Indices * 5)
    let penalty = 0;
    penalty += mins;                // 1 pt par minute
    penalty += (totalErrors * 5);   // 5 pts par erreur (ex: 2 erreurs = +10 min virtuelles)
    penalty += (totalHints * 5);    // 5 pts par indice

    let rank = 'D'; 
    // Objectif : Finir vite !
    if (penalty <= 18) rank = 'S';      // Ex: 15 min + 0 erreur (Excellent)
    else if (penalty <= 23) rank = 'A'; // Ex: 20 min + 0 erreur (Très bien)
    else if (penalty <= 28) rank = 'B'; // Ex: 25 min + 0 erreur (Bien)
    else if (penalty <= 33) rank = 'C'; // Ex: 28 min + 1 erreur (Juste)
    // Au-dessus de 33 points (ex: 30 min + erreurs), c'est un D.

    // Affichage SÉCURISÉ (Vérifie si les éléments existent)
    const elTime = document.getElementById('vic-time');
    if(elTime) elTime.innerText = timeString;

    const elErr = document.getElementById('vic-errors');
    if(elErr) elErr.innerText = totalErrors;

    const elHints = document.getElementById('vic-hints');
    if(elHints) elHints.innerText = totalHints;

    const elRank = document.getElementById('vic-rank');
    if(elRank) {
        elRank.innerText = rank;
        // FIX BUG NOTE INVISIBLE : On force l'affichage après un court délai
        elRank.style.transform = "scale(0)"; // Reset avant anim
        setTimeout(() => { 
            elRank.style.transition = "transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)";
            elRank.style.transform = "scale(1)"; 
        }, 500);
    }

    const screen = document.getElementById('victory-screen');
    if(screen) screen.classList.add('visible');
    
    for(let i=0; i<50; i++) createConfetti();
}

function createConfetti() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    const colors = ['#22c55e', '#0ea5e9', '#ffffff'];
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    const duration = Math.random() * 3 + 2;
    confetti.style.animation = `fall ${duration}s linear forwards`;
    document.body.appendChild(confetti);
    setTimeout(() => { confetti.remove(); }, duration * 1000);
}

// Fonction pour auto-compléter (DEV MODE)
function forceSolve() {
    activePatients.forEach((p, i) => {
        // Simule les scans faits
        revealedData[i].resp = true;
        revealedData[i].pulse = true;
        revealedData[i].mental = true;
        revealedData[i].injury = true;
        revealedData[i].actionDone = true; 
        
        // Remplit les bonnes réponses
        userTags[i] = p.correctColor;
        userIdentities[i] = p.realName;
    });

    // Recharge la vue pour voir les changements
    loadPatient(currentPatientIndex);
    checkCompletion();
    
    // Notification visuelle rapide
    const btn = document.getElementById('btn-submit');
    btn.style.backgroundColor = "var(--success)";
    btn.innerText = "DEV MODE: SOLVED";
    setTimeout(() => { checkCompletion(); }, 1000);
}