/* --- MOTEUR SONORE (SFX & AMBIANCE) --- */

const AudioEngine = {
    ctx: null,
    ambience: null,
    isRandomChain: false, // Nouveau : Pour savoir si on est en mode "Playlist aléatoire"
    randomConfig: null,   // Pour stocker les infos (préfixe, nombre de fichiers)

    init: function() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    },

    // --- LECTEUR SIMPLE (POUR LES AUTRES ÉTAPES) ---
    playAmbience: function(filename) {
        this.stopAmbience(); // On arrête tout avant
        this.isRandomChain = false; // On désactive le mode aléatoire

        this.ambience = new Audio('audio/' + filename);
        this.ambience.loop = true;
        this.ambience.volume = 0.5;
        this.ambience.play().catch(e => console.log("Audio autoplay blocked"));
    },

    // --- NOUVEAU : LECTEUR ALÉATOIRE EN CHAÎNE ---
    // prefix = "drone_", count = 25
    playRandomChain: function(prefix, count) {
        this.stopAmbience(); // On nettoie
        
        this.isRandomChain = true;
        this.randomConfig = { prefix: prefix, count: count };
        
        this._playNextRandom(); // Lancement du premier son
    },

    _playNextRandom: function() {
        if (!this.isRandomChain) return; // Sécurité si on a changé d'ambiance entre temps

        // Choix d'un numéro au hasard entre 1 et le nombre total (ex: 25)
        const randIndex = Math.floor(Math.random() * this.randomConfig.count) + 1;
        const filename = `${this.randomConfig.prefix}${randIndex}.mp3`;

        this.ambience = new Audio('audio/' + filename);
        this.ambience.volume = 0.5;
        
        // QUAND LE SON EST FINI -> ON LANCE LE SUIVANT
        this.ambience.onended = () => {
            this._playNextRandom();
        };

        this.ambience.play().catch(e => console.log("Audio autoplay blocked"));
    },

    stopAmbience: function() {
        this.isRandomChain = false; // Arrête la boucle infinie aléatoire
        if (this.ambience) {
            this.ambience.pause();
            this.ambience.onended = null; // Important : coupe le lien vers le suivant
            this.ambience = null;
        }
    },

    // --- BRUITAGES (GÉNÉRÉS PAR CODE) ---
    
    playClick: function() {
        if(!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    },

    playError: function() {
        if(!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, this.ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.3);
    },

    playSuccess: function() {
        if(!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.setValueAtTime(1200, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.4);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    },

    playHeartbeat: function() {
        if(!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(60, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.15);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.2);
    },
    
    playScan: function() {
        if(!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(2000, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.05, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.05);
    },
    
    playRing: function() {
        if(!this.ctx) this.init();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.ctx.currentTime);
        osc.frequency.setValueAtTime(480, this.ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 1);
        osc.start();
        osc.stop(this.ctx.currentTime + 1);
    }
};