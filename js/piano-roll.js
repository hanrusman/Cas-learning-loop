/**
 * LoopLab Piano Roll
 * Melody editor with scale highlighting
 */
class PianoRoll {
    constructor() {
        this.notes = []; // Array of { midi, step, duration }
        this.grid = {}; // { "midi-step": true }
        this.instrument = 'synth';
        this.scale = 'major';
        this.key = 'C';
        this.octaveRange = { low: 3, high: 5 }; // C3 to B5
        this.steps = 16;
        this.noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        this.isMouseDown = false;
        this.isErasing = false;
    }

    getMidiRange() {
        const low = (this.octaveRange.low + 1) * 12; // C3 = MIDI 48
        const high = (this.octaveRange.high + 2) * 12 - 1; // B5 = MIDI 83
        return { low, high };
    }

    getNoteName(midi) {
        return this.noteNames[midi % 12];
    }

    getOctave(midi) {
        return Math.floor(midi / 12) - 1;
    }

    isBlackKey(midi) {
        return [1, 3, 6, 8, 10].includes(midi % 12);
    }

    isNoteInScale(midi) {
        const noteName = this.getNoteName(midi);
        return Instruments.isNoteInScale(noteName, this.key, this.scale);
    }

    toggleNote(midi, step) {
        const key = `${midi}-${step}`;
        if (this.grid[key]) {
            delete this.grid[key];
            return false;
        } else {
            this.grid[key] = true;
            return true;
        }
    }

    setNote(midi, step, value) {
        const key = `${midi}-${step}`;
        if (value) {
            this.grid[key] = true;
        } else {
            delete this.grid[key];
        }
    }

    hasNote(midi, step) {
        return !!this.grid[`${midi}-${step}`];
    }

    getActiveNotes(step) {
        const notes = [];
        const range = this.getMidiRange();
        for (let midi = range.low; midi <= range.high; midi++) {
            if (this.hasNote(midi, step)) {
                notes.push(midi);
            }
        }
        return notes;
    }

    clear() {
        this.grid = {};
    }

    randomMelody() {
        this.clear();
        const scaleNotes = Instruments.getScaleNotes(this.key, this.scale);
        const range = this.getMidiRange();

        // Get all valid MIDI notes in scale
        const validNotes = [];
        for (let midi = range.low; midi <= range.high; midi++) {
            if (scaleNotes.includes(this.getNoteName(midi))) {
                validNotes.push(midi);
            }
        }

        if (validNotes.length === 0) return;

        // Create a musical melody
        let lastNote = validNotes[Math.floor(validNotes.length / 2)];

        for (let step = 0; step < this.steps; step++) {
            if (Math.random() < 0.6) { // 60% chance of note
                // Move by small intervals mostly
                const noteIdx = validNotes.indexOf(lastNote);
                const maxJump = 3;
                const jump = Math.floor(Math.random() * maxJump * 2) - maxJump;
                const newIdx = Math.max(0, Math.min(validNotes.length - 1, noteIdx + jump));
                lastNote = validNotes[newIdx];
                this.setNote(lastNote, step, true);
            }
        }
    }

    render(keysContainer, gridContainer) {
        keysContainer.innerHTML = '';
        gridContainer.innerHTML = '';

        const range = this.getMidiRange();

        // Render from high to low
        for (let midi = range.high; midi >= range.low; midi--) {
            const noteName = this.getNoteName(midi);
            const octave = this.getOctave(midi);
            const isBlack = this.isBlackKey(midi);
            const inScale = this.isNoteInScale(midi);
            const isCNote = noteName === 'C';

            // Piano key
            const key = document.createElement('div');
            key.className = `piano-key ${isBlack ? 'black' : 'white'} ${inScale ? 'in-scale' : ''}`;
            key.textContent = `${noteName}${octave}`;
            key.dataset.midi = midi;

            key.addEventListener('mousedown', () => {
                this._previewNote(midi);
                key.classList.add('playing');
            });
            key.addEventListener('mouseup', () => {
                key.classList.remove('playing');
            });
            key.addEventListener('mouseleave', () => {
                key.classList.remove('playing');
            });

            keysContainer.appendChild(key);

            // Grid row
            const row = document.createElement('div');
            row.className = 'piano-grid-row';
            if (isBlack) row.classList.add('black-key-row');
            if (isCNote) row.classList.add('c-note-row');

            for (let step = 0; step < this.steps; step++) {
                const cell = document.createElement('div');
                cell.className = 'piano-grid-cell';
                if (step % audioEngine.stepsPerBeat === 0) cell.classList.add('beat-line');
                if (this.hasNote(midi, step)) {
                    cell.classList.add('active');
                    if (inScale) cell.classList.add('in-scale');
                }

                cell.dataset.midi = midi;
                cell.dataset.step = step;

                cell.addEventListener('mousedown', (e) => {
                    e.preventDefault();
                    this.isMouseDown = true;
                    this.isErasing = this.hasNote(midi, step);
                    const isActive = this.toggleNote(midi, step);
                    cell.classList.toggle('active', isActive);
                    if (isActive) {
                        cell.classList.toggle('in-scale', inScale);
                        this._previewNote(midi);
                    }
                });

                cell.addEventListener('mouseenter', () => {
                    if (this.isMouseDown) {
                        const shouldActivate = !this.isErasing;
                        this.setNote(midi, step, shouldActivate);
                        cell.classList.toggle('active', shouldActivate);
                        if (shouldActivate) {
                            cell.classList.toggle('in-scale', inScale);
                            this._previewNote(midi);
                        }
                    }
                });

                row.appendChild(cell);
            }

            gridContainer.appendChild(row);
        }

        // Global mouse up - only add once
        if (!this._mouseUpBound) {
            this._mouseUpBound = () => { this.isMouseDown = false; };
            document.addEventListener('mouseup', this._mouseUpBound);
        }
    }

    _previewNote(midi) {
        audioEngine.init();
        const ctx = audioEngine.ctx;
        const dest = audioEngine.masterGain;
        const freq = Instruments.midiToFreq(midi);
        Instruments.playNote(ctx, dest, this.instrument, freq, ctx.currentTime, 0.3);
    }

    highlightStep(step) {
        document.querySelectorAll('.piano-grid-cell.playing').forEach(el => {
            el.classList.remove('playing');
        });

        if (step >= 0) {
            document.querySelectorAll(`.piano-grid-cell[data-step="${step}"]`).forEach(el => {
                el.classList.add('playing');
            });
        }
    }

    // Serialize for save
    toJSON() {
        return {
            grid: { ...this.grid },
            instrument: this.instrument,
            scale: this.scale,
            key: this.key
        };
    }

    fromJSON(data) {
        this.grid = { ...data.grid };
        this.instrument = data.instrument || 'synth';
        this.scale = data.scale || 'major';
        this.key = data.key || 'C';
    }
}

const pianoRoll = new PianoRoll();
if (typeof module !== 'undefined' && module.exports) { module.exports = { PianoRoll, pianoRoll }; }
