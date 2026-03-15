/**
 * LoopLab Audio Engine
 * Core audio scheduling and playback using Web Audio API
 */
class AudioEngine {
    constructor() {
        this.ctx = null;
        this.masterGain = null;
        this.isPlaying = false;
        this.bpm = 120;
        this.swing = 0;
        this.stepsPerBeat = 4;
        this.beatsPerBar = 4;
        this.currentStep = -1;
        this.totalSteps = 16;
        this.nextStepTime = 0;
        this.scheduleAheadTime = 0.1;
        this.lookAhead = 25; // ms
        this.timerID = null;
        this.onStep = null; // callback
        this.compressor = null;
    }

    init() {
        if (this.ctx) return;
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();

        // Master compressor for better sound
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.setValueAtTime(-24, this.ctx.currentTime);
        this.compressor.knee.setValueAtTime(30, this.ctx.currentTime);
        this.compressor.ratio.setValueAtTime(4, this.ctx.currentTime);
        this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
        this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);
        this.compressor.connect(this.ctx.destination);

        // Master gain
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        this.masterGain.connect(this.compressor);
    }

    setMasterVolume(value) {
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.01);
        }
    }

    setBPM(bpm) {
        if (bpm === null || bpm === undefined) return;
        const val = Number(bpm);
        if (isNaN(val)) return;
        this.bpm = Math.max(40, Math.min(240, val));
    }

    setSwing(amount) {
        this.swing = amount / 100; // 0-1
    }

    setBeatsPerBar(beats) {
        this.beatsPerBar = beats;
        this.totalSteps = beats * this.stepsPerBeat;
    }

    getStepDuration() {
        return 60.0 / this.bpm / this.stepsPerBeat;
    }

    play() {
        if (this.isPlaying) return;
        this.init();

        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        this.isPlaying = true;
        this.currentStep = -1;
        this.nextStepTime = this.ctx.currentTime;
        this._schedule();
    }

    stop() {
        this.isPlaying = false;
        this.currentStep = -1;
        if (this.timerID) {
            clearTimeout(this.timerID);
            this.timerID = null;
        }
        if (this.onStep) {
            this.onStep(-1);
        }
    }

    _schedule() {
        if (!this.isPlaying) return;

        while (this.nextStepTime < this.ctx.currentTime + this.scheduleAheadTime) {
            this.currentStep = (this.currentStep + 1) % this.totalSteps;

            // Apply swing to even steps (off-beats)
            let swingOffset = 0;
            if (this.currentStep % 2 === 1 && this.swing > 0) {
                swingOffset = this.getStepDuration() * this.swing * 0.5;
            }

            const stepTime = this.nextStepTime + swingOffset;

            if (this.onStep) {
                this.onStep(this.currentStep, stepTime);
            }

            this.nextStepTime += this.getStepDuration();
        }

        this.timerID = setTimeout(() => this._schedule(), this.lookAhead);
    }

    // Create a gain node connected to master
    createGainNode(volume = 1.0) {
        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(volume, this.ctx.currentTime);
        gain.connect(this.masterGain);
        return gain;
    }

    // Create a filter connected to a destination
    createFilter(type, frequency, Q = 1) {
        const filter = this.ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        filter.Q.setValueAtTime(Q, this.ctx.currentTime);
        return filter;
    }
}

// Singleton
const audioEngine = new AudioEngine();
if (typeof module !== 'undefined' && module.exports) { module.exports = { AudioEngine, audioEngine }; }
