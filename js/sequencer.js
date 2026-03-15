/**
 * LoopLab Beat Sequencer
 * Grid-based drum pattern editor
 */
class BeatSequencer {
    constructor() {
        this.instruments = [
            { id: 'kick', name: 'Kick', icon: '🔴' },
            { id: 'snare', name: 'Snare', icon: '🟣' },
            { id: 'hihat', name: 'Hi-Hat', icon: '🔵' },
            { id: 'hihat-open', name: 'Open HH', icon: '🔵' },
            { id: 'clap', name: 'Clap', icon: '🟡' },
            { id: 'tom', name: 'Tom', icon: '🟠' },
            { id: 'ride', name: 'Ride', icon: '🟢' },
            { id: 'crash', name: 'Crash', icon: '⚪' }
        ];

        // 4 patterns (A, B, C, D), each with grid data
        this.patterns = Array.from({ length: 4 }, () => this._createEmptyPattern());
        this.currentPattern = 0;

        // Per-row state
        this.rowMute = {};
        this.rowSolo = {};
        this.rowVolume = {};
        this.instruments.forEach(inst => {
            this.rowMute[inst.id] = false;
            this.rowSolo[inst.id] = false;
            this.rowVolume[inst.id] = 0.8;
        });

        this.currentKit = 'electronic';
    }

    _createEmptyPattern() {
        const pattern = {};
        this.instruments.forEach(inst => {
            pattern[inst.id] = new Array(16).fill(false);
        });
        return pattern;
    }

    getGrid() {
        return this.patterns[this.currentPattern];
    }

    toggleCell(instrument, step) {
        const grid = this.getGrid();
        grid[instrument][step] = !grid[instrument][step];
        return grid[instrument][step];
    }

    setCell(instrument, step, value) {
        this.getGrid()[instrument][step] = value;
    }

    clearPattern() {
        this.patterns[this.currentPattern] = this._createEmptyPattern();
    }

    randomPattern() {
        const grid = this.getGrid();
        // Musical random patterns
        const probabilities = {
            kick: [0.9, 0, 0, 0, 0, 0, 0, 0, 0.8, 0, 0.3, 0, 0, 0, 0, 0],
            snare: [0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 0, 0, 0.9, 0, 0, 0.3],
            hihat: [0.7, 0.3, 0.7, 0.3, 0.7, 0.3, 0.7, 0.3, 0.7, 0.3, 0.7, 0.3, 0.7, 0.3, 0.7, 0.3],
            'hihat-open': [0, 0, 0, 0, 0, 0, 0.3, 0, 0, 0, 0, 0, 0, 0, 0.3, 0],
            clap: [0, 0, 0, 0, 0.5, 0, 0, 0, 0, 0, 0, 0, 0.5, 0, 0, 0],
            tom: [0, 0, 0, 0, 0, 0, 0.2, 0, 0, 0, 0.2, 0, 0, 0, 0.3, 0],
            ride: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            crash: [0.3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        };

        for (const inst of this.instruments) {
            const probs = probabilities[inst.id] || new Array(16).fill(0.1);
            for (let i = 0; i < 16; i++) {
                grid[inst.id][i] = Math.random() < probs[i];
            }
        }
    }

    copyPattern() {
        return JSON.parse(JSON.stringify(this.getGrid()));
    }

    pastePattern(data) {
        this.patterns[this.currentPattern] = JSON.parse(JSON.stringify(data));
    }

    isInstrumentAudible(instrumentId) {
        const hasSolo = Object.values(this.rowSolo).some(v => v);
        if (hasSolo) {
            return this.rowSolo[instrumentId];
        }
        return !this.rowMute[instrumentId];
    }

    getActiveSteps(step) {
        const grid = this.getGrid();
        const active = [];
        for (const inst of this.instruments) {
            if (grid[inst.id][step] && this.isInstrumentAudible(inst.id)) {
                active.push({ id: inst.id, volume: this.rowVolume[inst.id] });
            }
        }
        return active;
    }

    patternHasData(index) {
        const pattern = this.patterns[index];
        return this.instruments.some(inst =>
            pattern[inst.id].some(v => v)
        );
    }

    // Build the sequencer UI
    render(container) {
        container.innerHTML = '';
        const grid = this.getGrid();

        for (const inst of this.instruments) {
            const row = document.createElement('div');
            row.className = 'beat-row';
            row.dataset.instrument = inst.id;

            // Label
            const label = document.createElement('div');
            label.className = 'beat-row-label';
            label.innerHTML = `<span class="instrument-icon">${inst.icon}</span>${inst.name}`;
            label.addEventListener('click', () => {
                this._previewSound(inst.id);
            });

            // Controls (mute/solo/volume)
            const controls = document.createElement('div');
            controls.className = 'beat-row-controls';

            const muteBtn = document.createElement('button');
            muteBtn.className = 'row-mute' + (this.rowMute[inst.id] ? ' active' : '');
            muteBtn.textContent = 'M';
            muteBtn.addEventListener('click', () => {
                this.rowMute[inst.id] = !this.rowMute[inst.id];
                muteBtn.classList.toggle('active');
            });

            const soloBtn = document.createElement('button');
            soloBtn.className = 'row-solo' + (this.rowSolo[inst.id] ? ' active' : '');
            soloBtn.textContent = 'S';
            soloBtn.addEventListener('click', () => {
                this.rowSolo[inst.id] = !this.rowSolo[inst.id];
                soloBtn.classList.toggle('active');
            });

            controls.appendChild(muteBtn);
            controls.appendChild(soloBtn);

            // Cells
            const cells = document.createElement('div');
            cells.className = 'beat-cells';

            for (let i = 0; i < audioEngine.totalSteps; i++) {
                const cell = document.createElement('div');
                cell.className = 'beat-cell';
                if (grid[inst.id][i]) cell.classList.add('active');
                if (i % audioEngine.stepsPerBeat === 0) cell.classList.add('beat-start');

                cell.dataset.instrument = inst.id;
                cell.dataset.step = i;

                cell.addEventListener('click', () => {
                    const isActive = this.toggleCell(inst.id, i);
                    cell.classList.toggle('active', isActive);
                    if (isActive) this._previewSound(inst.id);
                });

                cells.appendChild(cell);
            }

            row.appendChild(label);
            row.appendChild(controls);
            row.appendChild(cells);
            container.appendChild(row);
        }
    }

    _previewSound(instrumentId) {
        audioEngine.init();
        const ctx = audioEngine.ctx;
        const dest = audioEngine.masterGain;
        if (Instruments.drums[instrumentId]) {
            Instruments.drums[instrumentId](ctx, dest, ctx.currentTime);
        }
    }

    // Highlight current step
    highlightStep(step) {
        document.querySelectorAll('.beat-cell.playing').forEach(el => {
            el.classList.remove('playing');
        });

        if (step >= 0) {
            document.querySelectorAll(`.beat-cell[data-step="${step}"]`).forEach(el => {
                el.classList.add('playing');
            });
        }
    }

    // Update pattern button states
    updatePatternButtons() {
        document.querySelectorAll('.pattern-btn').forEach(btn => {
            const idx = parseInt(btn.dataset.pattern);
            btn.classList.toggle('active', idx === this.currentPattern);
            btn.classList.toggle('has-data', this.patternHasData(idx) && idx !== this.currentPattern);
        });
    }
}

const beatSequencer = new BeatSequencer();
