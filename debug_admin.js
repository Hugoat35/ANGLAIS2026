/* --- DEBUG ADMIN TOOL (GOD MODE & HINTS) --- */
/* Usage: Appuyer sur SHIFT + Z */

(function() {
    // 1. STYLE
    const style = document.createElement('style');
    style.innerHTML = `
        #admin-panel {
            position: fixed; top: 10px; right: 10px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid #ef4444;
            color: #fff;
            padding: 15px;
            z-index: 999999;
            font-family: monospace;
            display: none;
            box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
            border-radius: 8px;
            width: 260px;
            text-align: left;
        }
        #admin-panel h3 { margin: 0 0 10px 0; border-bottom: 1px solid #ef4444; text-align: center; color: #ef4444; padding-bottom: 5px; }
        .admin-btn {
            display: block; width: 100%;
            background: #222; color: #fff;
            border: 1px solid #444;
            padding: 8px; margin-bottom: 5px;
            cursor: pointer; text-align: left;
            font-family: monospace;
            transition: all 0.2s;
            font-size: 12px;
        }
        .admin-btn:hover { background: #ef4444; color: #fff; border-color:#ef4444; }
        .admin-section { margin-top: 15px; font-weight: bold; color: #888; font-size: 0.7rem; margin-bottom:5px; text-transform:uppercase; }
        .admin-close { position: absolute; top: 5px; right: 10px; cursor: pointer; color: #ef4444; font-weight:bold; }
        .hint-count { float: right; color: #ffff00; }
    `;
    document.head.appendChild(style);

    // 2. HTML
    const panel = document.createElement('div');
    panel.id = 'admin-panel';
    updatePanelHTML(panel); // Fonction pour générer le contenu dynamique
    document.body.appendChild(panel);

    function updatePanelHTML(container) {
        let currentHints = parseInt(localStorage.getItem('total_hints') || "0");
        container.innerHTML = `
            <div class="admin-close" onclick="toggleAdmin()">[X]</div>
            <h3>/// GOD MODE ///</h3>
            
            <div class="admin-section">🧠 GESTION JEU</div>
            <button class="admin-btn" onclick="addHint()">
                > +1 INDICE DONNÉ <span class="hint-count">Total: ${currentHints}</span>
            </button>
            <button class="admin-btn" onclick="forceWinCurrent()">> ⚡ FORCE WIN LEVEL</button>
            <button class="admin-btn" onclick="resetGameData()">> 🗑 RESET ALL DATA</button>
            
            <div class="admin-section">🚀 TELEPORTATION</div>
            <button class="admin-btn" onclick="window.location.href='index.html'">1. INTRO</button>
            <button class="admin-btn" onclick="window.location.href='enigme_cards.html'">2. CARDS</button>
            <button class="admin-btn" onclick="window.location.href='enigme_call.html'">3. CALL</button>
            <button class="admin-btn" onclick="window.location.href='enigme_triage.html'">4. TRIAGE</button>
        `;
    }

    // 3. LISTENERS
    document.addEventListener('keydown', function(e) {
        if (e.shiftKey && (e.key === 'Z' || e.key === 'z')) {
            toggleAdmin();
        }
    });

    // --- ACTIONS ---

    window.toggleAdmin = function() {
        const p = document.getElementById('admin-panel');
        // Mise à jour du compteur d'indices à l'ouverture
        updatePanelHTML(p);
        p.style.display = (p.style.display === 'none' || p.style.display === '') ? 'block' : 'none';
    };

    window.addHint = function() {
        let h = parseInt(localStorage.getItem('total_hints') || "0");
        h++;
        localStorage.setItem('total_hints', h);
        updatePanelHTML(document.getElementById('admin-panel'));
    };

    window.resetGameData = function() {
        if(confirm("⚠ ATTENTION : Reset complet ?")) {
            localStorage.clear();
            location.reload();
        }
    };

    window.forceWinCurrent = function() {
        const path = window.location.pathname;
        if (path.includes('enigme_cards')) {
            localStorage.setItem('stats_step1', JSON.stringify({ time: 600, errors: 0 }));
            window.location.href = 'enigme_call.html';
        }
        else if (path.includes('enigme_call')) {
            localStorage.setItem('stats_step2', JSON.stringify({ time: 600, errors: 0 }));
            const display = document.getElementById('dial-display');
            if(display) { display.innerText = "BYPASS"; display.style.color = "#00ff00"; }
            setTimeout(() => { window.location.href = 'enigme_triage.html'; }, 800);
        }
        else if (path.includes('enigme_triage')) {
            if (typeof forceSolve === 'function') forceSolve();
        }
    };

})();