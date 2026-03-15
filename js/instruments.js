/**
 * LoopLab Instruments
 * All sounds synthesized with Web Audio API - no samples needed!
 */

const Instruments = {
    // ========================
    // DRUM SOUNDS
    // ========================
    drums: {
        kick(ctx, dest, time, velocity = 1) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(dest);

            osc.frequency.setValueAtTime(150 * velocity, time);
            osc.frequency.exponentialRampToValueAtTime(30, time + 0.12);
            gain.gain.setValueAtTime(1.2 * velocity, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

            // Click transient
            const click = ctx.createOscillator();
            const clickGain = ctx.createGain();
            click.connect(clickGain);
            clickGain.connect(dest);
            click.frequency.setValueAtTime(1000, time);
            click.frequency.exponentialRampToValueAtTime(60, time + 0.02);
            clickGain.gain.setValueAtTime(0.6 * velocity, time);
            clickGain.gain.exponentialRampToValueAtTime(0.001, time + 0.03);

            osc.start(time);
            osc.stop(time + 0.4);
            click.start(time);
            click.stop(time + 0.03);
        },

        snare(ctx, dest, time, velocity = 1) {
            // Tone
            const osc = ctx.createOscillator();
            const oscGain = ctx.createGain();
            osc.connect(oscGain);
            oscGain.connect(dest);
            osc.frequency.setValueAtTime(200, time);
            osc.frequency.exponentialRampToValueAtTime(120, time + 0.05);
            oscGain.gain.setValueAtTime(0.7 * velocity, time);
            oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);

            // Noise
            const bufferSize = ctx.sampleRate * 0.2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * 0.8;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const noiseGain = ctx.createGain();
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.setValueAtTime(2000, time);
            noise.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(dest);
            noiseGain.gain.setValueAtTime(0.6 * velocity, time);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);

            osc.start(time);
            osc.stop(time + 0.15);
            noise.start(time);
            noise.stop(time + 0.2);
        },

        hihat(ctx, dest, time, velocity = 1) {
            const bufferSize = ctx.sampleRate * 0.05;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(8000, time);
            const filter2 = ctx.createBiquadFilter();
            filter2.type = 'bandpass';
            filter2.frequency.setValueAtTime(10000, time);
            filter2.Q.setValueAtTime(1, time);

            noise.connect(filter);
            filter.connect(filter2);
            filter2.connect(gain);
            gain.connect(dest);
            gain.gain.setValueAtTime(0.4 * velocity, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

            noise.start(time);
            noise.stop(time + 0.05);
        },

        'hihat-open'(ctx, dest, time, velocity = 1) {
            const bufferSize = ctx.sampleRate * 0.3;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(6000, time);

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            gain.gain.setValueAtTime(0.35 * velocity, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

            noise.start(time);
            noise.stop(time + 0.3);
        },

        clap(ctx, dest, time, velocity = 1) {
            // Layered noise bursts
            for (let i = 0; i < 3; i++) {
                const t = time + i * 0.01;
                const bufferSize = ctx.sampleRate * 0.02;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let j = 0; j < bufferSize; j++) {
                    data[j] = Math.random() * 2 - 1;
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const gain = ctx.createGain();
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(1200, t);
                filter.Q.setValueAtTime(2, t);

                noise.connect(filter);
                filter.connect(gain);
                gain.connect(dest);
                gain.gain.setValueAtTime(0.5 * velocity, t);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

                noise.start(t);
                noise.stop(t + 0.15);
            }

            // Tail
            const bufferSize = ctx.sampleRate * 0.2;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let j = 0; j < bufferSize; j++) {
                data[j] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(1500, time + 0.03);
            filter.Q.setValueAtTime(1.5, time + 0.03);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            gain.gain.setValueAtTime(0.4 * velocity, time + 0.03);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
            noise.start(time + 0.03);
            noise.stop(time + 0.2);
        },

        tom(ctx, dest, time, velocity = 1) {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(dest);

            osc.frequency.setValueAtTime(200 * velocity, time);
            osc.frequency.exponentialRampToValueAtTime(80, time + 0.2);
            gain.gain.setValueAtTime(0.8 * velocity, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

            osc.start(time);
            osc.stop(time + 0.3);
        },

        ride(ctx, dest, time, velocity = 1) {
            // Metallic sound using detuned oscillators
            const freqs = [300, 450, 587, 780];
            freqs.forEach(freq => {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.connect(gain);
                gain.connect(dest);
                osc.frequency.setValueAtTime(freq, time);
                gain.gain.setValueAtTime(0.05 * velocity, time);
                gain.gain.exponentialRampToValueAtTime(0.001, time + 0.6);
                osc.start(time);
                osc.stop(time + 0.6);
            });

            // Noise component
            const bufferSize = ctx.sampleRate * 0.4;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(7000, time);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            gain.gain.setValueAtTime(0.15 * velocity, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);
            noise.start(time);
            noise.stop(time + 0.4);
        },

        crash(ctx, dest, time, velocity = 1) {
            const bufferSize = ctx.sampleRate * 1.0;
            const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            const noise = ctx.createBufferSource();
            noise.buffer = buffer;
            const gain = ctx.createGain();
            const filter = ctx.createBiquadFilter();
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(4000, time);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(dest);
            gain.gain.setValueAtTime(0.4 * velocity, time);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 1.0);
            noise.start(time);
            noise.stop(time + 1.0);
        }
    },

    // ========================
    // DRUM KIT VARIATIONS
    // ========================
    drumKits: {
        electronic: {}, // Uses default sounds above
        hiphop: {
            kickMod: { freq: 120, decay: 0.5 },
            snareMod: { noiseDecay: 0.25, toneFreq: 180 }
        },
        rock: {
            kickMod: { freq: 180, decay: 0.3 },
            snareMod: { noiseDecay: 0.18, toneFreq: 250 }
        },
        latin: {
            kickMod: { freq: 130, decay: 0.25 },
            snareMod: { noiseDecay: 0.1, toneFreq: 220 }
        }
    },

    // ========================
    // MELODIC INSTRUMENTS
    // ========================
    playNote(ctx, dest, instrument, noteFreq, time, duration = 0.2, velocity = 0.8) {
        switch (instrument) {
            case 'synth': return this._synthLead(ctx, dest, noteFreq, time, duration, velocity);
            case 'piano': return this._piano(ctx, dest, noteFreq, time, duration, velocity);
            case 'bass': return this._bass(ctx, dest, noteFreq, time, duration, velocity);
            case 'strings': return this._strings(ctx, dest, noteFreq, time, duration, velocity);
            case 'pluck': return this._pluck(ctx, dest, noteFreq, time, duration, velocity);
            default: return this._synthLead(ctx, dest, noteFreq, time, duration, velocity);
        }
    },

    _synthLead(ctx, dest, freq, time, duration, velocity) {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, time);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq * 1.005, time); // Slight detune

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 4, time);
        filter.frequency.exponentialRampToValueAtTime(freq * 1.5, time + duration);
        filter.Q.setValueAtTime(2, time);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.25 * velocity, time + 0.02);
        gain.gain.setValueAtTime(0.2 * velocity, time + 0.04);
        gain.gain.linearRampToValueAtTime(0.001, time + duration);

        osc1.start(time);
        osc1.stop(time + duration + 0.01);
        osc2.start(time);
        osc2.stop(time + duration + 0.01);
    },

    _piano(ctx, dest, freq, time, duration, velocity) {
        // Simple FM piano
        const carrier = ctx.createOscillator();
        const modulator = ctx.createOscillator();
        const modGain = ctx.createGain();
        const gain = ctx.createGain();

        modulator.frequency.setValueAtTime(freq * 2, time);
        modGain.gain.setValueAtTime(freq * 0.5, time);
        modGain.gain.exponentialRampToValueAtTime(freq * 0.01, time + duration * 0.8);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);

        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(freq, time);
        carrier.connect(gain);
        gain.connect(dest);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.35 * velocity, time + 0.005);
        gain.gain.exponentialRampToValueAtTime(0.15 * velocity, time + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        carrier.start(time);
        carrier.stop(time + duration + 0.01);
        modulator.start(time);
        modulator.stop(time + duration + 0.01);
    },

    _bass(ctx, dest, freq, time, duration, velocity) {
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(freq / 2, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 3, time);
        filter.frequency.exponentialRampToValueAtTime(freq, time + 0.1);
        filter.Q.setValueAtTime(4, time);

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.35 * velocity, time + 0.01);
        gain.gain.linearRampToValueAtTime(0.001, time + duration);

        osc.start(time);
        osc.stop(time + duration + 0.01);
        subOsc.start(time);
        subOsc.stop(time + duration + 0.01);
    },

    _strings(ctx, dest, freq, time, duration, velocity) {
        const oscs = [];
        const detunes = [-10, -3, 3, 10];

        const gain = ctx.createGain();
        gain.connect(dest);

        detunes.forEach(detune => {
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, time);
            osc.detune.setValueAtTime(detune, time);
            osc.connect(gain);
            osc.start(time);
            osc.stop(time + duration + 0.05);
            oscs.push(osc);
        });

        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.12 * velocity, time + 0.08);
        gain.gain.setValueAtTime(0.1 * velocity, time + duration * 0.7);
        gain.gain.linearRampToValueAtTime(0.001, time + duration);
    },

    _pluck(ctx, dest, freq, time, duration, velocity) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, time);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 6, time);
        filter.frequency.exponentialRampToValueAtTime(freq * 0.5, time + duration * 0.5);
        filter.Q.setValueAtTime(3, time);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(dest);

        gain.gain.setValueAtTime(0.35 * velocity, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.start(time);
        osc.stop(time + duration + 0.01);
    },

    // ========================
    // MUSIC THEORY HELPERS
    // ========================
    noteToFreq(note, octave) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const semitone = notes.indexOf(note);
        if (semitone === -1) return 440;
        const midiNote = semitone + (octave + 1) * 12;
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    },

    midiToFreq(midi) {
        return 440 * Math.pow(2, (midi - 69) / 12);
    },

    scales: {
        chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
        major: [0, 2, 4, 5, 7, 9, 11],
        minor: [0, 2, 3, 5, 7, 8, 10],
        pentatonic: [0, 2, 4, 7, 9],
        blues: [0, 3, 5, 6, 7, 10]
    },

    getScaleNotes(key, scale) {
        const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootIndex = notes.indexOf(key);
        const intervals = this.scales[scale] || this.scales.chromatic;
        return intervals.map(i => notes[(rootIndex + i) % 12]);
    },

    isNoteInScale(noteName, key, scale) {
        const scaleNotes = this.getScaleNotes(key, scale);
        return scaleNotes.includes(noteName);
    }
};
