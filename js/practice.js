/**
 * LoopLab Practice Mode
 * Guitar Hero-style falling notes game
 */
class PracticeMode {
    constructor() {
        this.mode = 'rhythm'; // 'rhythm' or 'melody'
        this.difficulty = 'easy';
        this.isRunning = false;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hits = 0;
        this.misses = 0;
        this.totalNotes = 0;
        this.fallingNotes = [];
        this.animationId = null;
        this.startTime = 0;
        this.noteSpeed = 2; // pixels per frame
        this.spawnTimer = 0;
        this.pattern = [];
        this.patternIndex = 0;
        this.hitZoneY = 0;
        this.highwayHeight = 0;

        this.laneColors = ['#ff6d00', '#7c4dff', '#00e5ff', '#ff4081'];
        this.laneNames = ['Kick', 'Snare', 'Hi-Hat', 'Clap'];
        this.laneSounds = ['kick', 'snare', 'hihat', 'clap'];

        this.difficultySettings = {
            easy: { speed: 1.5, density: 0.3, hitWindow: 50, noteInterval: 500 },
            medium: { speed: 2.5, density: 0.5, hitWindow: 35, noteInterval: 350 },
            hard: { speed: 3.5, density: 0.7, hitWindow: 25, noteInterval: 250 }
        };
    }

    init() {
        this.renderPads();
        this._setupKeyboard();
    }

    renderPads() {
        const container = document.getElementById('practice-pads');
        if (!container) return;
        container.innerHTML = '';

        const keys = ['1', '2', '3', '4'];

        for (let i = 0; i < 4; i++) {
            const pad = document.createElement('button');
            pad.className = `practice-pad pad-${i}`;
            pad.innerHTML = `${this.laneNames[i]}<span class="pad-key">[${keys[i]}]</span>`;
            pad.dataset.lane = i;

            pad.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this._hitLane(i);
                pad.classList.add('pressed');
            });
            pad.addEventListener('mouseup', () => pad.classList.remove('pressed'));
            pad.addEventListener('mouseleave', () => pad.classList.remove('pressed'));

            // Touch support
            pad.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this._hitLane(i);
                pad.classList.add('pressed');
            });
            pad.addEventListener('touchend', (e) => {
                e.preventDefault();
                pad.classList.remove('pressed');
            });

            container.appendChild(pad);
        }
    }

    _setupKeyboard() {
        if (this._keydownBound) return; // Only bind once
        this._keydownBound = true;
        document.addEventListener('keydown', (e) => {
            if (!this.isRunning) return;
            const keyMap = { '1': 0, '2': 1, '3': 2, '4': 3, 'a': 0, 's': 1, 'd': 2, 'f': 3 };
            const lane = keyMap[e.key.toLowerCase()];
            if (lane !== undefined) {
                e.preventDefault();
                this._hitLane(lane);
                const pad = document.querySelector(`.practice-pad.pad-${lane}`);
                if (pad) {
                    pad.classList.add('pressed');
                    setTimeout(() => pad.classList.remove('pressed'), 100);
                }
            }
        });
    }

    generatePattern() {
        const settings = this.difficultySettings[this.difficulty];
        const totalBeats = 32; // 2 bars at 16 steps
        this.pattern = [];

        // Generate musical pattern based on current beat
        const grid = beatSequencer.getGrid();
        const hasBeats = beatSequencer.instruments.some(inst =>
            grid[inst.id].some(v => v)
        );

        if (hasBeats) {
            // Use current beat pattern
            for (let bar = 0; bar < 2; bar++) {
                for (let step = 0; step < 16; step++) {
                    const laneMap = { kick: 0, snare: 1, hihat: 2, clap: 3 };
                    for (const [inst, lane] of Object.entries(laneMap)) {
                        if (grid[inst] && grid[inst][step]) {
                            this.pattern.push({
                                lane,
                                time: (bar * 16 + step) * (60000 / audioEngine.bpm / 4)
                            });
                        }
                    }
                }
            }
        } else {
            // Generate random pattern
            const stepTime = 60000 / audioEngine.bpm / 4;
            for (let step = 0; step < totalBeats; step++) {
                if (Math.random() < settings.density) {
                    this.pattern.push({
                        lane: Math.floor(Math.random() * 4),
                        time: step * stepTime
                    });
                }
            }
        }

        // Loop pattern if too short
        if (this.pattern.length < 10) {
            const origLen = this.pattern.length;
            const lastTime = this.pattern.length > 0 ? this.pattern[this.pattern.length - 1].time : 0;
            for (let i = 0; i < origLen; i++) {
                this.pattern.push({
                    lane: this.pattern[i].lane,
                    time: this.pattern[i].time + lastTime + 500
                });
            }
        }

        this.totalNotes = this.pattern.length;
    }

    start() {
        audioEngine.init();

        this.isRunning = true;
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.hits = 0;
        this.misses = 0;
        this.fallingNotes = [];
        this.patternIndex = 0;

        const highway = document.getElementById('practice-highway');
        this.highwayHeight = highway.offsetHeight || 350; // Fallback if hidden
        this.hitZoneY = this.highwayHeight - 66; // Match CSS hit-zone position

        const settings = this.difficultySettings[this.difficulty];
        this.noteSpeed = settings.speed;

        this.generatePattern();

        // UI
        document.getElementById('btn-start-practice').style.display = 'none';
        document.getElementById('btn-stop-practice').style.display = '';
        document.getElementById('practice-results').style.display = 'none';
        document.getElementById('practice-area').style.display = '';

        this._updateScoreDisplay();

        // Pre-calculate note spawn times
        // Note needs to travel from top to hit zone
        const travelTime = this.hitZoneY / this.noteSpeed * (1000 / 60); // ms

        this.startTime = performance.now() + 2000; // 2 second countdown
        this.spawnTimes = this.pattern.map(p => ({
            ...p,
            spawnAt: this.startTime + p.time - travelTime,
            hitAt: this.startTime + p.time,
            spawned: false,
            hit: false,
            missed: false
        }));

        this._gameLoop();
    }

    stop() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Clear falling notes
        const container = document.getElementById('falling-notes');
        if (container) container.innerHTML = '';

        document.getElementById('btn-start-practice').style.display = '';
        document.getElementById('btn-stop-practice').style.display = 'none';

        this._showResults();
    }

    _gameLoop() {
        if (!this.isRunning) return;

        const now = performance.now();
        const settings = this.difficultySettings[this.difficulty];
        const container = document.getElementById('falling-notes');

        // Spawn new notes
        for (const note of this.spawnTimes) {
            if (!note.spawned && now >= note.spawnAt) {
                note.spawned = true;
                const el = document.createElement('div');
                el.className = `falling-note lane-${note.lane}`;
                el.style.top = '-30px';
                el.textContent = this.laneNames[note.lane];
                container.appendChild(el);
                note.element = el;
                this.fallingNotes.push(note);
            }
        }

        // Update falling notes positions
        for (let i = this.fallingNotes.length - 1; i >= 0; i--) {
            const note = this.fallingNotes[i];
            if (!note.element) continue;

            const elapsed = now - note.spawnAt;
            const y = (elapsed / 1000) * this.noteSpeed * 60;
            note.element.style.top = `${y}px`;
            note.currentY = y;

            // Check if missed (past hit zone)
            if (y > this.hitZoneY + settings.hitWindow && !note.hit && !note.missed) {
                note.missed = true;
                note.element.classList.add('miss');
                this.misses++;
                this.combo = 0;
                this._showHitFeedback(note.lane, 'miss', 'Miss!');
                this._updateScoreDisplay();

                setTimeout(() => {
                    if (note.element && note.element.parentNode) {
                        note.element.parentNode.removeChild(note.element);
                    }
                }, 500);
                this.fallingNotes.splice(i, 1);
            }

            // Remove if way off screen
            if (y > this.highwayHeight + 60) {
                if (note.element.parentNode) {
                    note.element.parentNode.removeChild(note.element);
                }
                this.fallingNotes.splice(i, 1);
            }
        }

        // Check if game is over
        const allDone = this.spawnTimes.every(n => n.hit || n.missed);
        if (allDone && this.fallingNotes.length === 0) {
            this.stop();
            return;
        }

        this.animationId = requestAnimationFrame(() => this._gameLoop());
    }

    _hitLane(lane) {
        if (!this.isRunning) return;

        const settings = this.difficultySettings[this.difficulty];

        // Play the drum sound
        const ctx = audioEngine.ctx;
        const dest = audioEngine.masterGain;
        const sound = this.laneSounds[lane];
        if (Instruments.drums[sound]) {
            Instruments.drums[sound](ctx, dest, ctx.currentTime);
        }

        // Find closest note in this lane near hit zone
        let closestNote = null;
        let closestDist = Infinity;

        for (const note of this.fallingNotes) {
            if (note.lane !== lane || note.hit || note.missed) continue;

            const dist = Math.abs((note.currentY || 0) - this.hitZoneY);
            if (dist < closestDist && dist < settings.hitWindow) {
                closestDist = dist;
                closestNote = note;
            }
        }

        if (closestNote) {
            closestNote.hit = true;
            closestNote.element.classList.add('hit');

            // Determine accuracy
            let rating, points;
            if (closestDist < settings.hitWindow * 0.3) {
                rating = 'perfect';
                points = 100;
            } else if (closestDist < settings.hitWindow * 0.7) {
                rating = 'good';
                points = 75;
            } else {
                rating = 'ok';
                points = 50;
            }

            this.combo++;
            this.maxCombo = Math.max(this.maxCombo, this.combo);
            this.hits++;

            // Combo multiplier
            const multiplier = Math.min(4, 1 + Math.floor(this.combo / 5));
            this.score += points * multiplier;

            const ratingText = rating === 'perfect' ? 'Perfect!' : rating === 'good' ? 'Good!' : 'OK';
            this._showHitFeedback(lane, rating, ratingText);
            this._updateScoreDisplay();

            setTimeout(() => {
                if (closestNote.element && closestNote.element.parentNode) {
                    closestNote.element.parentNode.removeChild(closestNote.element);
                }
            }, 300);

            const idx = this.fallingNotes.indexOf(closestNote);
            if (idx > -1) this.fallingNotes.splice(idx, 1);
        }
    }

    _showHitFeedback(lane, type, text) {
        const highway = document.getElementById('practice-highway');
        const feedback = document.createElement('div');
        feedback.className = `hit-feedback ${type}`;
        feedback.textContent = text;
        feedback.style.left = `${lane * 25 + 12.5}%`;
        feedback.style.transform = 'translateX(-50%)';
        highway.appendChild(feedback);

        setTimeout(() => {
            if (feedback.parentNode) feedback.parentNode.removeChild(feedback);
        }, 600);
    }

    _updateScoreDisplay() {
        document.getElementById('score-value').textContent = this.score;
        document.getElementById('combo-value').textContent = `${this.combo}x`;

        const total = this.hits + this.misses;
        const accuracy = total > 0 ? Math.round((this.hits / total) * 100) : 100;
        document.getElementById('accuracy-fill').style.width = `${accuracy}%`;
        document.getElementById('accuracy-text').textContent = `${accuracy}%`;
    }

    _showResults() {
        const total = this.hits + this.misses;
        const accuracy = total > 0 ? Math.round((this.hits / total) * 100) : 0;

        let stars = 0;
        if (accuracy >= 95) stars = 5;
        else if (accuracy >= 85) stars = 4;
        else if (accuracy >= 70) stars = 3;
        else if (accuracy >= 50) stars = 2;
        else if (accuracy >= 25) stars = 1;

        const starText = Array(5).fill(null).map((_, i) =>
            i < stars ? '<span style="color: var(--accent-yellow)">★</span>' : '<span style="color: var(--text-dim)">★</span>'
        ).join('');

        document.getElementById('result-stars').innerHTML = starText;
        document.getElementById('result-stats').innerHTML = `
            <p>Score: <strong>${this.score}</strong></p>
            <p>Raak: <strong>${this.hits}</strong> / ${total}</p>
            <p>Nauwkeurigheid: <strong>${accuracy}%</strong></p>
            <p>Max Combo: <strong>${this.maxCombo}x</strong></p>
        `;

        document.getElementById('practice-area').style.display = 'none';
        document.getElementById('practice-results').style.display = '';
    }
}

const practiceMode = new PracticeMode();
if (typeof module !== 'undefined' && module.exports) { module.exports = { PracticeMode, practiceMode }; }
