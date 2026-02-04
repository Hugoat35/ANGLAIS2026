// --- DONNÉES PATIENTS ---
const PATIENTS = [
    {
        id: "A",
        label: "VICTIM A",
        desc: "Female, 20s.",
        resp: "22 / min",
        pulse: "Rapid (110 bpm)",
        mental: "Anxious",
        injury: "Massive arterial bleeding (Thigh).",
        actionRequired: true,
        triggerActionOn: "injury",
        actionOptions: ["START CPR", "APPLY TOURNIQUET", "ELEVATE LEGS"],
        correctAction: "APPLY TOURNIQUET",
        successMsg: "Tourniquet applied. Bleeding stopped.",
        failMsg: "You started CPR on a conscious patient. Patient bled out.",
        obs: "Patient is now stable but cannot walk.",
        correct: "YELLOW",
        hasPulse: true
    },
    {
        id: "B",
        label: "VICTIM B",
        desc: "Male, 50s.",
        resp: "Occasional Gasp",
        pulse: "NO PULSE",
        mental: "Unresponsive",
        injury: "Severe Head Trauma.",
        actionRequired: true,
        triggerActionOn: "resp",
        actionOptions: ["OPEN AIRWAY", "RECOVERY POSITION", "GIVE WATER"],
        correctAction: "OPEN AIRWAY",
        successMsg: "Airway opened. Still no spontaneous breathing.",
        failMsg: "You moved trauma patient without checking airway. Suffocated.",
        obs: "Patient is apneaic (not breathing) despite open airway.",
        correct: "BLACK",
        hasPulse: false
    },
    {
        id: "C",
        label: "VICTIM C",
        desc: "Female, 40s.",
        resp: "20 / min",
        pulse: "Strong (80 bpm)",
        mental: "Confused",
        injury: "Head laceration.",
        actionRequired: false, 
        obs: "She is walking steadily but keeps asking the same questions.",
        correct: "GREEN",
        hasPulse: true
    },
    {
        id: "D",
        label: "VICTIM D",
        desc: "Teenager, 16s.",
        resp: "No breathing / Agonal",
        pulse: "NO PULSE DETECTED", 
        mental: "Unresponsive",
        injury: "No external bleeding. Cyanosis.",
        actionRequired: true,
        triggerActionOn: "pulse",
        actionOptions: ["TREAT FOR SHOCK", "WALK HIM AWAY", "START CPR"],
        correctAction: "START CPR", 
        successMsg: "CPR effective. Pulse and breathing returned.",
        failMsg: "You ignored a cardiac arrest. Patient died.",
        obs: "Patient has a weak pulse after CPR but remains unconscious.",
        correct: "RED",
        hasPulse: false 
    },
    {
        id: "E",
        label: "VICTIM E",
        desc: "Male, 30s.",
        resp: "34 / min",
        pulse: "Weak (120 bpm)",
        mental: "Alert",
        injury: "Chest bruising.",
        actionRequired: false,
        obs: "Respiration rate is dangerously high (>30).",
        correct: "RED",
        hasPulse: true
    }
];

// --- VARIABLES ---
let currentPatientIndex = 0;
let isScanning = false;
let actionInterval;
let startTime = 0;
let totalErrorsCount = 0; // Erreurs de cette étape

let tags = { A: null, B: null, C: null, D: null, E: null }; 
let revealedData = {
    A: { resp:false, pulse:false, mental:false, injury:false, actionDone:false },
    B: { resp:false, pulse:false, mental:false, injury:false, actionDone:false },
    C: { resp:false, pulse:false, mental:false, injury:false, actionDone:true },
    D: { resp:false, pulse:false, mental:false, injury:false, actionDone:false },
    E: { resp:false, pulse:false, mental:false, injury:false, actionDone:true }
};

// --- DOM ELEMENTS ---
const tabsContainer = document.getElementById('tabs-container');
const btnSubmit = document.getElementById('btn-submit');
const modalResult = document.getElementById('overlay-result');
const actionPanel = document.getElementById('action-panel');
const actionButtons = document.getElementById('action-buttons');
const obsBox = document.getElementById('p-obs');
const actionTimerDisplay = document.getElementById('action-timer');
const actionBar = document.getElementById('action-bar');

// --- SHORTCUT ADMIN ---
document.addEventListener('keydown', function(e) {
    if (e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        document.getElementById('dev-menu').classList.toggle('visible');
    }
});

window.onload = function() {
    initTabs();
    loadPatient(0);
    // Démarrage chrono local
    startTime = Date.now();
};

function closeBriefing() {
    document.getElementById('overlay-briefing').classList.remove('visible');
    // On peut réinitialiser le temps ici si on veut ne pas compter le briefing
    startTime = Date.now();
}

function initTabs() {
    tabsContainer.innerHTML = "";
    PATIENTS.forEach((p, index) => {
        const btn = document.createElement('div');
        btn.className = `tab-btn ${index === 0 ? 'active' : ''}`;
        btn.innerHTML = `${p.label} <div class="tab-indicator" id="ind-${p.id}"></div>`;
        btn.onclick = () => { if(!isScanning) loadPatient(index); };
        tabsContainer.appendChild(btn);
    });
}

function loadPatient(index) {
    if(isScanning) return; 

    currentPatientIndex = index;
    const p = PATIENTS[index];
    
    document.querySelectorAll('.tab-btn').forEach((btn, i) => {
        if(i === index) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    document.getElementById('p-name').innerText = p.desc;
    
    resetVitalBox('resp', p);
    resetVitalBox('pulse', p);
    resetVitalBox('mental', p);
    resetVitalBox('injury', p);
    
    if(revealedData[p.id].actionDone) {
        actionPanel.style.display = 'none';
        if(revealedData[p.id].injury) {
            obsBox.style.display = 'block';
            obsBox.innerText = p.obs;
        } else {
            obsBox.style.display = 'none';
        }
    } 
    else {
        const trigger = p.triggerActionOn || 'injury';
        if(revealedData[p.id][trigger]) {
            showActionPanel(p);
            obsBox.style.display = 'none';
        } else {
            actionPanel.style.display = 'none';
            obsBox.style.display = 'none';
        }
    }

    updateButtonsUI(p.id);
    updateStatusText(p.id);
}

function resetVitalBox(type, p) {
    const box = document.getElementById(`box-${type}`);
    const valDiv = box.querySelector('.vital-value');
    const hintDiv = box.querySelector('.tap-hint');
    const bar = box.querySelector('.scan-bar');
    const ecg = box.querySelector('.ecg-line');
    const flat = box.querySelector('.ecg-flat');
    
    box.className = 'vital-box';
    box.classList.remove('scanning');
    
    bar.style.width = '0%';
    if(ecg) ecg.style.display = 'none';
    if(flat) flat.style.display = 'none';

    if (revealedData[p.id][type]) {
        box.classList.add('revealed');
        valDiv.style.display = 'block';
        hintDiv.style.display = 'none';
        
        if (type === 'resp') valDiv.innerText = p.resp;
        if (type === 'mental') valDiv.innerText = p.mental;
        if (type === 'injury') valDiv.innerText = p.injury;
        
        if (type === 'pulse') {
            valDiv.innerText = p.pulse;
            if(p.hasPulse && p.pulse !== "NO PULSE" && p.pulse !== "ABSENT RADIAL" && p.pulse !== "NO PULSE DETECTED") ecg.style.display = 'block';
            else flat.style.display = 'block';
        }
    } else {
        valDiv.style.display = 'none';
        hintDiv.style.display = 'flex';
        valDiv.innerText = "";
    }
}

function checkVital(type) {
    if (isScanning) return; 
    
    const p = PATIENTS[currentPatientIndex];
    if (revealedData[p.id][type]) return; 

    isScanning = true;

    const box = document.getElementById(`box-${type}`);
    const bar = box.querySelector('.scan-bar');
    
    box.classList.add('scanning');
    bar.style.width = '100%';

    setTimeout(() => {
        revealedData[p.id][type] = true;
        bar.style.transition = 'none';
        bar.style.width = '0%';
        setTimeout(() => bar.style.transition = 'width 2s linear', 50);
        
        resetVitalBox(type, p);

        const trigger = p.triggerActionOn || 'injury';
        if(type === trigger) {
            if(p.actionRequired && !revealedData[p.id].actionDone) {
                showActionPanel(p);
            } else {
                if(!p.actionRequired && type === 'injury') {
                    obsBox.innerText = p.obs;
                    obsBox.style.display = 'block';
                }
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
            triggerFail("TIME OUT. Failed to act in time.");
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
        revealedData[p.id].actionDone = true;
        actionPanel.style.display = 'none';
        obsBox.innerHTML = `<span style="color:#22c55e; font-weight:bold;">✔ ${p.successMsg}</span><br>${p.obs}`;
        obsBox.style.display = 'block';
    } else {
        triggerFail(p.failMsg);
    }
}

function triggerFail(reason) {
    clearInterval(actionInterval);
    
    // COMPTE COMME UNE ERREUR MAJEURE
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
    const p = PATIENTS[currentPatientIndex];
    tags[p.id] = color;
    updateButtonsUI(p.id);
    updateIndicator(p.id, color);
    updateStatusText(p.id);
    checkCompletion();
}

function updateButtonsUI(pid) {
    const currentTag = tags[pid];
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.classList.remove('selected');
        if (currentTag === 'GREEN' && btn.classList.contains('tag-green')) btn.classList.add('selected');
        if (currentTag === 'YELLOW' && btn.classList.contains('tag-yellow')) btn.classList.add('selected');
        if (currentTag === 'RED' && btn.classList.contains('tag-red')) btn.classList.add('selected');
        if (currentTag === 'BLACK' && btn.classList.contains('tag-black')) btn.classList.add('selected');
    });
}

function updateIndicator(pid, color) {
    const ind = document.getElementById(`ind-${pid}`);
    if(color === 'GREEN') ind.style.background = '#22c55e';
    if(color === 'YELLOW') ind.style.background = '#eab308';
    if(color === 'RED') ind.style.background = '#ef4444';
    if(color === 'BLACK') ind.style.background = '#94a3b8';
}

function updateStatusText(pid) {
    const statusSpan = document.getElementById('p-status');
    const color = tags[pid];
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
    let count = 0;
    for (let key in tags) if (tags[key] !== null) count++;
    btnSubmit.innerText = `SUBMIT FINAL REPORT (${count}/5 TAGGED)`;
    if (count === 5) {
        btnSubmit.disabled = false;
        btnSubmit.style.opacity = "1";
    } else {
        btnSubmit.disabled = true;
        btnSubmit.style.opacity = "0.5";
    }
}

function submitTriage() {
    let errors = [];
    PATIENTS.forEach(p => {
        if (tags[p.id] !== p.correct) errors.push(p.label);
    });

    if (errors.length === 0) {
        triggerVictory();
    } else {
        // AJOUT DES ERREURS DE TRIAGE AU TOTAL
        totalErrorsCount += errors.length;
        
        const title = document.getElementById('res-title');
        const text = document.getElementById('res-text');
        const btn = document.getElementById('res-btn');
        
        title.innerText = "PROTOCOL ERROR";
        title.style.color = "var(--alert)";
        text.innerHTML = `Incorrect assessment on: <br><b>${errors.join(', ')}</b>.<br>Re-evaluate vitals carefully.`;
        btn.innerText = "RETURN TO SCENE";
        btn.onclick = function() { modalResult.classList.remove('visible'); };
        
        modalResult.classList.add('visible');
    }
}

// --- VICTOIRE FINALE (CALCUL GLOBAL) ---
function triggerVictory() {
    const endTime = Date.now();
    
    // Temps passé sur l'étape 3
    const step3Duration = endTime - startTime;
    
    // Récupération des stats des étapes précédentes (Stockées en JSON dans localStorage)
    const stats1 = JSON.parse(localStorage.getItem('stats_step1')) || { time: 0, errors: 0 };
    const stats2 = JSON.parse(localStorage.getItem('stats_step2')) || { time: 0, errors: 0 };
    
    // CALCULS TOTAUX
    const totalTimeMs = stats1.time + stats2.time + step3Duration;
    const totalErrors = stats1.errors + stats2.errors + totalErrorsCount;
    
    // Formatage du temps
    const totalSeconds = Math.floor(totalTimeMs / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    const timeString = `${mins < 10 ? '0'+mins : mins}:${secs < 10 ? '0'+secs : secs}`;

    // Calcul du Rang (Note)
    let rank = 'S';
    if(totalErrors > 0) rank = 'A';
    if(totalErrors > 3) rank = 'B';
    if(totalErrors > 6) rank = 'C';
    if(totalErrors > 10) rank = 'D';

    // Affichage
    document.getElementById('vic-time').innerText = timeString;
    document.getElementById('vic-errors').innerText = totalErrors;
    document.getElementById('vic-attempts').innerText = "1"; // Mission accomplie
    document.getElementById('vic-rank').innerText = rank;

    const screen = document.getElementById('victory-screen');
    screen.classList.add('visible');
    
    // Confettis
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

function forceSolve() {
    PATIENTS.forEach(p => {
        tags[p.id] = p.correct; 
        updateIndicator(p.id, p.correct);
    });
    loadPatient(currentPatientIndex);
    checkCompletion();
}