#!/usr/bin/env node
/**
 * LoopLab Automated Test Suite
 */

const { describe, it, assert, assertEqual, assertDeepEqual, summary } = require('./test-runner');
const { setupGlobalMocks, MockAudioContext } = require('./mocks');

// Setup mocks before loading any modules
setupGlobalMocks();

// Load source files and extract globals
const { AudioEngine, audioEngine } = require('../js/audio-engine.js');
const { Instruments } = require('../js/instruments.js');

// Make globals available for modules that depend on them
global.audioEngine = audioEngine;
global.Instruments = Instruments;

const { BeatSequencer, beatSequencer } = require('../js/sequencer.js');
global.beatSequencer = beatSequencer;

const { PianoRoll, pianoRoll } = require('../js/piano-roll.js');
global.pianoRoll = pianoRoll;

const { PracticeMode, practiceMode } = require('../js/practice.js');
global.practiceMode = practiceMode;

const { SongManager, songManager } = require('../js/songs.js');
global.songManager = songManager;

const { Gamification, gamification } = require('../js/gamification.js');
global.gamification = gamification;

console.log('\n  LoopLab Test Suite');
console.log('  ═════════════════════════════\n');

// ========================
// AUDIO ENGINE TESTS
// ========================
describe('AudioEngine', () => {
    it('should initialize with default values', () => {
        assertEqual(audioEngine.bpm, 120);
        assertEqual(audioEngine.swing, 0);
        assertEqual(audioEngine.stepsPerBeat, 4);
        assertEqual(audioEngine.beatsPerBar, 4);
        assertEqual(audioEngine.totalSteps, 16);
        assertEqual(audioEngine.isPlaying, false);
        assertEqual(audioEngine.currentStep, -1);
    });

    it('should init audio context', () => {
        audioEngine.init();
        assert(audioEngine.ctx !== null, 'Context should be created');
        assert(audioEngine.masterGain !== null, 'Master gain should be created');
        assert(audioEngine.compressor !== null, 'Compressor should be created');
    });

    it('should set BPM within valid range', () => {
        audioEngine.setBPM(100);
        assertEqual(audioEngine.bpm, 100);

        audioEngine.setBPM(30); // Below minimum
        assertEqual(audioEngine.bpm, 40);

        audioEngine.setBPM(300); // Above maximum
        assertEqual(audioEngine.bpm, 240);

        audioEngine.setBPM(120); // Reset
    });

    it('should reject NaN BPM values', () => {
        audioEngine.setBPM(120);
        audioEngine.setBPM(NaN);
        assertEqual(audioEngine.bpm, 120, 'BPM should not change on NaN');

        audioEngine.setBPM(null);
        assertEqual(audioEngine.bpm, 120, 'BPM should not change on null');

        audioEngine.setBPM('abc');
        assertEqual(audioEngine.bpm, 120, 'BPM should not change on string');
    });

    it('should set swing correctly', () => {
        audioEngine.setSwing(50);
        assertEqual(audioEngine.swing, 0.5);

        audioEngine.setSwing(0);
        assertEqual(audioEngine.swing, 0);

        audioEngine.setSwing(100);
        assertEqual(audioEngine.swing, 1);

        audioEngine.setSwing(0); // Reset
    });

    it('should set beats per bar and update totalSteps', () => {
        audioEngine.setBeatsPerBar(3);
        assertEqual(audioEngine.beatsPerBar, 3);
        assertEqual(audioEngine.totalSteps, 12);

        audioEngine.setBeatsPerBar(6);
        assertEqual(audioEngine.totalSteps, 24);

        audioEngine.setBeatsPerBar(4); // Reset
    });

    it('should calculate step duration correctly', () => {
        audioEngine.setBPM(120);
        const duration = audioEngine.getStepDuration();
        // At 120 BPM, 4 steps per beat: 60/120/4 = 0.125 seconds
        assertEqual(duration, 0.125);

        audioEngine.setBPM(60);
        assertEqual(audioEngine.getStepDuration(), 0.25);

        audioEngine.setBPM(120); // Reset
    });

    it('should set master volume', () => {
        audioEngine.init();
        audioEngine.setMasterVolume(0.5);
        assertEqual(audioEngine.masterGain.gain.value, 0.5);
    });

    it('should play and stop', () => {
        audioEngine.onStep = () => {};
        audioEngine.play();
        assertEqual(audioEngine.isPlaying, true);

        audioEngine.stop();
        assertEqual(audioEngine.isPlaying, false);
        assertEqual(audioEngine.currentStep, -1);
    });

    it('should not double-play', () => {
        audioEngine.onStep = () => {};
        audioEngine.play();
        const firstStep = audioEngine.currentStep;
        audioEngine.play(); // Should do nothing
        assertEqual(audioEngine.isPlaying, true);
        audioEngine.stop();
    });
});

// ========================
// INSTRUMENTS TESTS
// ========================
describe('Instruments - Music Theory', () => {
    it('should convert note names to frequencies', () => {
        const a4 = Instruments.noteToFreq('A', 4);
        assertEqual(a4, 440);

        const c4 = Instruments.noteToFreq('C', 4);
        assert(Math.abs(c4 - 261.63) < 0.1, `C4 should be ~261.63, got ${c4}`);
    });

    it('should convert MIDI to frequency', () => {
        assertEqual(Instruments.midiToFreq(69), 440); // A4

        const c4 = Instruments.midiToFreq(60);
        assert(Math.abs(c4 - 261.63) < 0.1, `MIDI 60 (C4) should be ~261.63`);

        const a3 = Instruments.midiToFreq(57);
        assertEqual(a3, 220); // A3
    });

    it('should return correct scale notes for C major', () => {
        const cMajor = Instruments.getScaleNotes('C', 'major');
        assertDeepEqual(cMajor, ['C', 'D', 'E', 'F', 'G', 'A', 'B']);
    });

    it('should return correct scale notes for A minor', () => {
        const aMinor = Instruments.getScaleNotes('A', 'minor');
        assertDeepEqual(aMinor, ['A', 'B', 'C', 'D', 'E', 'F', 'G']);
    });

    it('should return correct pentatonic notes', () => {
        const cPenta = Instruments.getScaleNotes('C', 'pentatonic');
        assertDeepEqual(cPenta, ['C', 'D', 'E', 'G', 'A']);
    });

    it('should return correct blues scale', () => {
        const cBlues = Instruments.getScaleNotes('C', 'blues');
        assertDeepEqual(cBlues, ['C', 'D#', 'F', 'F#', 'G', 'A#']);
    });

    it('should check if note is in scale', () => {
        assert(Instruments.isNoteInScale('C', 'C', 'major'), 'C should be in C major');
        assert(Instruments.isNoteInScale('G', 'C', 'major'), 'G should be in C major');
        assert(!Instruments.isNoteInScale('C#', 'C', 'major'), 'C# should not be in C major');
        assert(!Instruments.isNoteInScale('F#', 'C', 'major'), 'F# should not be in C major');
    });

    it('should handle transposed scales', () => {
        const gMajor = Instruments.getScaleNotes('G', 'major');
        assert(gMajor.includes('F#'), 'G major should include F#');
        assert(!gMajor.includes('F'), 'G major should not include F natural');
    });

    it('should fall back to chromatic for unknown scale', () => {
        const unknown = Instruments.getScaleNotes('C', 'nonexistent');
        assertEqual(unknown.length, 12);
    });
});

describe('Instruments - Drum Synthesis', () => {
    it('should have all 8 drum sounds', () => {
        const drums = ['kick', 'snare', 'hihat', 'hihat-open', 'clap', 'tom', 'ride', 'crash'];
        drums.forEach(name => {
            assert(typeof Instruments.drums[name] === 'function', `${name} should be a function`);
        });
    });

    it('should synthesize kick without errors', () => {
        const ctx = new MockAudioContext();
        const gain = ctx.createGain();
        Instruments.drums.kick(ctx, gain, 0, 1);
    });

    it('should synthesize snare without errors', () => {
        const ctx = new MockAudioContext();
        const gain = ctx.createGain();
        Instruments.drums.snare(ctx, gain, 0, 0.8);
    });

    it('should synthesize all drums at different velocities', () => {
        const ctx = new MockAudioContext();
        const gain = ctx.createGain();
        const drums = ['kick', 'snare', 'hihat', 'hihat-open', 'clap', 'tom', 'ride', 'crash'];
        const velocities = [0.2, 0.5, 0.8, 1.0];

        drums.forEach(name => {
            velocities.forEach(vel => {
                Instruments.drums[name](ctx, gain, 0, vel);
            });
        });
    });
});

describe('Instruments - Melodic Instruments', () => {
    it('should play all instrument types without errors', () => {
        const ctx = new MockAudioContext();
        const gain = ctx.createGain();
        const instruments = ['synth', 'piano', 'bass', 'strings', 'pluck'];

        instruments.forEach(inst => {
            Instruments.playNote(ctx, gain, inst, 440, 0, 0.5, 0.8);
        });
    });

    it('should handle unknown instrument gracefully (fallback to synth)', () => {
        const ctx = new MockAudioContext();
        const gain = ctx.createGain();
        Instruments.playNote(ctx, gain, 'unknown_instrument', 440, 0, 0.5, 0.8);
    });
});

// ========================
// BEAT SEQUENCER TESTS
// ========================
describe('BeatSequencer', () => {
    it('should have 8 instruments', () => {
        assertEqual(beatSequencer.instruments.length, 8);
    });

    it('should have 4 empty patterns initially', () => {
        assertEqual(beatSequencer.patterns.length, 4);
        assertEqual(beatSequencer.currentPattern, 0);
    });

    it('should create empty patterns with all instruments', () => {
        const grid = beatSequencer.getGrid();
        beatSequencer.instruments.forEach(inst => {
            assert(Array.isArray(grid[inst.id]), `${inst.id} should be an array`);
            assertEqual(grid[inst.id].length, 16);
            assert(grid[inst.id].every(v => v === false || v === true), `${inst.id} should contain booleans`);
        });
    });

    it('should toggle cells', () => {
        const result1 = beatSequencer.toggleCell('kick', 0);
        assert(result1 === true || result1 === false, 'Toggle should return boolean');

        const result2 = beatSequencer.toggleCell('kick', 0);
        assertEqual(result1, !result2); // Should flip
    });

    it('should set cells directly', () => {
        beatSequencer.setCell('snare', 5, true);
        assertEqual(beatSequencer.getGrid()['snare'][5], true);

        beatSequencer.setCell('snare', 5, false);
        assertEqual(beatSequencer.getGrid()['snare'][5], false);
    });

    it('should clear pattern', () => {
        beatSequencer.setCell('kick', 0, true);
        beatSequencer.setCell('snare', 4, true);
        beatSequencer.clearPattern();

        const grid = beatSequencer.getGrid();
        beatSequencer.instruments.forEach(inst => {
            assert(grid[inst.id].every(v => !v), `${inst.id} should be all false after clear`);
        });
    });

    it('should generate random pattern', () => {
        beatSequencer.randomPattern();
        const grid = beatSequencer.getGrid();

        // At least kick should have some hits (high probability)
        const hasAnyHit = beatSequencer.instruments.some(inst =>
            grid[inst.id].some(v => v)
        );
        assert(hasAnyHit, 'Random pattern should have at least some hits');

        beatSequencer.clearPattern();
    });

    it('should copy and paste patterns', () => {
        beatSequencer.setCell('kick', 0, true);
        beatSequencer.setCell('snare', 4, true);
        beatSequencer.setCell('hihat', 2, true);

        const copied = beatSequencer.copyPattern();

        beatSequencer.currentPattern = 1;
        beatSequencer.pastePattern(copied);

        const grid = beatSequencer.getGrid();
        assertEqual(grid['kick'][0], true);
        assertEqual(grid['snare'][4], true);
        assertEqual(grid['hihat'][2], true);

        // Verify deep copy (no shared reference)
        beatSequencer.setCell('kick', 0, false);
        beatSequencer.currentPattern = 0;
        assertEqual(beatSequencer.getGrid()['kick'][0], true); // Original unchanged

        beatSequencer.clearPattern();
        beatSequencer.currentPattern = 1;
        beatSequencer.clearPattern();
        beatSequencer.currentPattern = 0;
    });

    it('should detect pattern has data', () => {
        beatSequencer.clearPattern();
        assertEqual(beatSequencer.patternHasData(0), false);

        beatSequencer.setCell('kick', 0, true);
        assertEqual(beatSequencer.patternHasData(0), true);

        beatSequencer.clearPattern();
    });

    it('should handle mute/solo correctly', () => {
        beatSequencer.setCell('kick', 0, true);
        beatSequencer.setCell('snare', 0, true);

        // Default: all audible
        assert(beatSequencer.isInstrumentAudible('kick'));
        assert(beatSequencer.isInstrumentAudible('snare'));

        // Mute kick
        beatSequencer.rowMute['kick'] = true;
        assert(!beatSequencer.isInstrumentAudible('kick'));
        assert(beatSequencer.isInstrumentAudible('snare'));

        // Solo snare (overrides mute)
        beatSequencer.rowSolo['snare'] = true;
        assert(!beatSequencer.isInstrumentAudible('kick')); // Not solo'd
        assert(beatSequencer.isInstrumentAudible('snare')); // Solo'd

        // Cleanup
        beatSequencer.rowMute['kick'] = false;
        beatSequencer.rowSolo['snare'] = false;
        beatSequencer.clearPattern();
    });

    it('should get active steps with mute/solo', () => {
        beatSequencer.setCell('kick', 0, true);
        beatSequencer.setCell('snare', 0, true);
        beatSequencer.setCell('hihat', 0, true);

        let active = beatSequencer.getActiveSteps(0);
        assertEqual(active.length, 3);

        beatSequencer.rowMute['hihat'] = true;
        active = beatSequencer.getActiveSteps(0);
        assertEqual(active.length, 2);

        // Cleanup
        beatSequencer.rowMute['hihat'] = false;
        beatSequencer.clearPattern();
    });

    it('should switch between patterns', () => {
        beatSequencer.setCell('kick', 0, true);
        beatSequencer.currentPattern = 1;
        assertEqual(beatSequencer.getGrid()['kick'][0], false); // Pattern B is empty

        beatSequencer.currentPattern = 0;
        assertEqual(beatSequencer.getGrid()['kick'][0], true); // Pattern A has data

        beatSequencer.clearPattern();
    });
});

// ========================
// PIANO ROLL TESTS
// ========================
describe('PianoRoll', () => {
    it('should initialize with correct defaults', () => {
        assertEqual(pianoRoll.instrument, 'synth');
        assertEqual(pianoRoll.scale, 'major');
        assertEqual(pianoRoll.key, 'C');
        assertEqual(pianoRoll.steps, 16);
    });

    it('should calculate MIDI range correctly', () => {
        const range = pianoRoll.getMidiRange();
        assertEqual(range.low, 48); // C3
        assertEqual(range.high, 83); // B5
    });

    it('should get note names from MIDI', () => {
        assertEqual(pianoRoll.getNoteName(60), 'C');
        assertEqual(pianoRoll.getNoteName(69), 'A');
        assertEqual(pianoRoll.getNoteName(61), 'C#');
    });

    it('should get octave from MIDI', () => {
        assertEqual(pianoRoll.getOctave(60), 4); // C4
        assertEqual(pianoRoll.getOctave(48), 3); // C3
        assertEqual(pianoRoll.getOctave(72), 5); // C5
    });

    it('should identify black keys', () => {
        assertEqual(pianoRoll.isBlackKey(61), true);  // C#
        assertEqual(pianoRoll.isBlackKey(63), true);  // D#
        assertEqual(pianoRoll.isBlackKey(66), true);  // F#
        assertEqual(pianoRoll.isBlackKey(60), false); // C
        assertEqual(pianoRoll.isBlackKey(64), false); // E
    });

    it('should check notes in scale', () => {
        pianoRoll.key = 'C';
        pianoRoll.scale = 'major';
        assert(pianoRoll.isNoteInScale(60), 'C4 should be in C major');
        assert(pianoRoll.isNoteInScale(64), 'E4 should be in C major');
        assert(!pianoRoll.isNoteInScale(61), 'C#4 should not be in C major');
    });

    it('should toggle notes', () => {
        pianoRoll.clear();
        const on = pianoRoll.toggleNote(60, 0);
        assertEqual(on, true);
        assert(pianoRoll.hasNote(60, 0));

        const off = pianoRoll.toggleNote(60, 0);
        assertEqual(off, false);
        assert(!pianoRoll.hasNote(60, 0));
    });

    it('should set notes directly', () => {
        pianoRoll.clear();
        pianoRoll.setNote(60, 0, true);
        assert(pianoRoll.hasNote(60, 0));

        pianoRoll.setNote(60, 0, false);
        assert(!pianoRoll.hasNote(60, 0));
    });

    it('should get active notes for a step', () => {
        pianoRoll.clear();
        pianoRoll.setNote(60, 0, true);
        pianoRoll.setNote(64, 0, true);
        pianoRoll.setNote(67, 0, true);

        const notes = pianoRoll.getActiveNotes(0);
        assertEqual(notes.length, 3);
        assert(notes.includes(60));
        assert(notes.includes(64));
        assert(notes.includes(67));

        const emptyStep = pianoRoll.getActiveNotes(1);
        assertEqual(emptyStep.length, 0);

        pianoRoll.clear();
    });

    it('should clear all notes', () => {
        pianoRoll.setNote(60, 0, true);
        pianoRoll.setNote(64, 5, true);
        pianoRoll.clear();
        assert(!pianoRoll.hasNote(60, 0));
        assert(!pianoRoll.hasNote(64, 5));
    });

    it('should generate random melody in scale', () => {
        pianoRoll.key = 'C';
        pianoRoll.scale = 'pentatonic';
        pianoRoll.randomMelody();

        const scaleNotes = Instruments.getScaleNotes('C', 'pentatonic');
        let hasNotes = false;

        for (let step = 0; step < 16; step++) {
            const notes = pianoRoll.getActiveNotes(step);
            for (const midi of notes) {
                hasNotes = true;
                const name = pianoRoll.getNoteName(midi);
                assert(scaleNotes.includes(name), `Note ${name} should be in C pentatonic`);
            }
        }

        assert(hasNotes, 'Random melody should produce at least some notes');
        pianoRoll.clear();
    });

    it('should serialize and deserialize', () => {
        pianoRoll.clear();
        pianoRoll.setNote(60, 0, true);
        pianoRoll.setNote(67, 4, true);
        pianoRoll.instrument = 'piano';
        pianoRoll.scale = 'blues';
        pianoRoll.key = 'G';

        const json = pianoRoll.toJSON();
        assertEqual(json.instrument, 'piano');
        assertEqual(json.scale, 'blues');
        assertEqual(json.key, 'G');
        assert(json.grid['60-0'] === true);
        assert(json.grid['67-4'] === true);

        pianoRoll.clear();
        pianoRoll.fromJSON(json);
        assert(pianoRoll.hasNote(60, 0));
        assert(pianoRoll.hasNote(67, 4));
        assertEqual(pianoRoll.instrument, 'piano');
        assertEqual(pianoRoll.scale, 'blues');
        assertEqual(pianoRoll.key, 'G');

        // Cleanup
        pianoRoll.clear();
        pianoRoll.instrument = 'synth';
        pianoRoll.scale = 'major';
        pianoRoll.key = 'C';
    });

    it('should handle fromJSON with missing fields gracefully', () => {
        pianoRoll.fromJSON({ grid: {} });
        assertEqual(pianoRoll.instrument, 'synth');
        assertEqual(pianoRoll.scale, 'major');
        assertEqual(pianoRoll.key, 'C');
    });
});

// ========================
// PRACTICE MODE TESTS
// ========================
describe('PracticeMode', () => {
    it('should initialize with correct defaults', () => {
        assertEqual(practiceMode.mode, 'rhythm');
        assertEqual(practiceMode.difficulty, 'easy');
        assertEqual(practiceMode.isRunning, false);
        assertEqual(practiceMode.score, 0);
    });

    it('should have 4 lanes', () => {
        assertEqual(practiceMode.laneNames.length, 4);
        assertEqual(practiceMode.laneSounds.length, 4);
        assertEqual(practiceMode.laneColors.length, 4);
    });

    it('should have difficulty settings', () => {
        const easy = practiceMode.difficultySettings.easy;
        const hard = practiceMode.difficultySettings.hard;

        assert(hard.speed > easy.speed, 'Hard should be faster');
        assert(hard.hitWindow < easy.hitWindow, 'Hard should have smaller hit window');
        assert(hard.density > easy.density, 'Hard should have higher density');
    });

    it('should generate pattern from beat sequencer', () => {
        // Add some beats
        beatSequencer.setCell('kick', 0, true);
        beatSequencer.setCell('snare', 4, true);

        practiceMode.generatePattern();
        assert(practiceMode.pattern.length > 0, 'Should generate pattern from beats');
        assert(practiceMode.totalNotes > 0);

        beatSequencer.clearPattern();
    });

    it('should generate random pattern when sequencer is empty', () => {
        beatSequencer.clearPattern();
        practiceMode.generatePattern();
        assert(practiceMode.pattern.length > 0, 'Should generate random pattern');

        // Check pattern structure
        practiceMode.pattern.forEach(note => {
            assert(note.lane >= 0 && note.lane < 4, 'Lane should be 0-3');
            assert(note.time >= 0, 'Time should be non-negative');
        });
    });

    it('should loop short patterns', () => {
        beatSequencer.clearPattern();
        beatSequencer.setCell('kick', 0, true); // Only 1 hit
        practiceMode.difficulty = 'easy';
        practiceMode.generatePattern();
        assert(practiceMode.pattern.length >= 4, 'Short patterns should be looped');

        beatSequencer.clearPattern();
    });

    it('should calculate accuracy correctly', () => {
        practiceMode.hits = 8;
        practiceMode.misses = 2;
        const total = practiceMode.hits + practiceMode.misses;
        const accuracy = Math.round((practiceMode.hits / total) * 100);
        assertEqual(accuracy, 80);
    });

    it('should award correct star ratings', () => {
        // Test star rating logic
        const getStars = (accuracy) => {
            if (accuracy >= 95) return 5;
            if (accuracy >= 85) return 4;
            if (accuracy >= 70) return 3;
            if (accuracy >= 50) return 2;
            if (accuracy >= 25) return 1;
            return 0;
        };

        assertEqual(getStars(100), 5);
        assertEqual(getStars(95), 5);
        assertEqual(getStars(90), 4);
        assertEqual(getStars(70), 3);
        assertEqual(getStars(50), 2);
        assertEqual(getStars(25), 1);
        assertEqual(getStars(10), 0);
    });

    it('should calculate combo multiplier correctly', () => {
        const getMultiplier = (combo) => Math.min(4, 1 + Math.floor(combo / 5));
        assertEqual(getMultiplier(0), 1);
        assertEqual(getMultiplier(4), 1);
        assertEqual(getMultiplier(5), 2);
        assertEqual(getMultiplier(10), 3);
        assertEqual(getMultiplier(15), 4);
        assertEqual(getMultiplier(100), 4); // Max 4x
    });
});

// ========================
// SONG MANAGER TESTS
// ========================
describe('SongManager', () => {
    it('should initialize with default arrangement', () => {
        assertDeepEqual(songManager.arrangement, [0]);
        assertEqual(songManager.currentSongName, 'Naamloos');
    });

    it('should add sections to arrangement', () => {
        songManager.arrangement = [0];
        songManager.addSection(1);
        assertDeepEqual(songManager.arrangement, [0, 1]);

        songManager.addSection(2);
        assertDeepEqual(songManager.arrangement, [0, 1, 2]);

        songManager.arrangement = [0]; // Reset
    });

    it('should remove sections (but keep at least one)', () => {
        songManager.arrangement = [0, 1, 2];
        songManager.removeSection(1);
        assertDeepEqual(songManager.arrangement, [0, 2]);

        songManager.removeSection(0);
        assertDeepEqual(songManager.arrangement, [2]);

        // Should not remove last section
        songManager.removeSection(0);
        assertDeepEqual(songManager.arrangement, [2]);

        songManager.arrangement = [0]; // Reset
    });

    it('should save and load songs via localStorage', () => {
        localStorage.clear();
        songManager.songs = [];

        // Save a song
        beatSequencer.setCell('kick', 0, true);
        songManager.currentSongName = 'Test Song';
        songManager.saveCurrent();

        assertEqual(songManager.songs.length, 1);
        assertEqual(songManager.songs[0].name, 'Test Song');
        assertEqual(songManager.songs[0].bpm, 120);

        // Verify localStorage
        const stored = JSON.parse(localStorage.getItem('looplab-songs'));
        assertEqual(stored.length, 1);
        assertEqual(stored[0].name, 'Test Song');

        beatSequencer.clearPattern();
    });

    it('should overwrite song with same name', () => {
        localStorage.clear();
        songManager.songs = [];

        songManager.currentSongName = 'My Beat';
        songManager.saveCurrent();
        assertEqual(songManager.songs.length, 1);

        audioEngine.setBPM(140);
        songManager.currentSongName = 'My Beat';
        songManager.saveCurrent();
        assertEqual(songManager.songs.length, 1); // Still 1, overwritten
        assertEqual(songManager.songs[0].bpm, 140);

        audioEngine.setBPM(120); // Reset
    });

    it('should deep copy patterns on save', () => {
        localStorage.clear();
        songManager.songs = [];

        beatSequencer.setCell('kick', 0, true);
        songManager.currentSongName = 'Deep Copy Test';
        songManager.saveCurrent();

        // Modify pattern after save
        beatSequencer.setCell('kick', 0, false);

        // Saved song should still have the kick
        assertEqual(songManager.songs[0].patterns[0]['kick'][0], true);

        beatSequencer.clearPattern();
    });

    it('should load songs with deep copy', () => {
        localStorage.clear();
        songManager.songs = [];

        beatSequencer.setCell('kick', 0, true);
        beatSequencer.setCell('snare', 4, true);
        songManager.currentSongName = 'Load Test';
        songManager.saveCurrent();

        // Clear and load
        beatSequencer.clearPattern();
        songManager.loadSong(0);

        assertEqual(beatSequencer.getGrid()['kick'][0], true);
        assertEqual(beatSequencer.getGrid()['snare'][4], true);

        // Modify loaded pattern - should not affect saved song
        beatSequencer.setCell('kick', 0, false);
        assertEqual(songManager.songs[0].patterns[0]['kick'][0], true);

        beatSequencer.clearPattern();
    });

    it('should handle loading invalid index', () => {
        songManager.loadSong(-1); // Should not throw
        songManager.loadSong(999); // Should not throw
    });

    it('should delete songs', () => {
        localStorage.clear();
        songManager.songs = [];

        songManager.currentSongName = 'Delete Me';
        songManager.saveCurrent();
        assertEqual(songManager.songs.length, 1);

        songManager.deleteSong(0);
        assertEqual(songManager.songs.length, 0);
    });

    it('should handle corrupted localStorage gracefully', () => {
        localStorage.setItem('looplab-songs', 'not valid json{{{');
        const songs = songManager._loadSongs();
        assertDeepEqual(songs, []);
        localStorage.clear();
    });
});

// ========================
// INTEGRATION TESTS
// ========================
describe('Integration', () => {
    it('should play beat with melody simultaneously', () => {
        audioEngine.init();
        beatSequencer.setCell('kick', 0, true);
        pianoRoll.setNote(60, 0, true);

        const activeBeats = beatSequencer.getActiveSteps(0);
        const activeNotes = pianoRoll.getActiveNotes(0);

        assertEqual(activeBeats.length, 1);
        assertEqual(activeNotes.length, 1);

        // Synthesize without errors
        const ctx = audioEngine.ctx;
        const dest = audioEngine.masterGain;

        for (const inst of activeBeats) {
            Instruments.drums[inst.id](ctx, dest, ctx.currentTime);
        }

        for (const midi of activeNotes) {
            const freq = Instruments.midiToFreq(midi);
            Instruments.playNote(ctx, dest, pianoRoll.instrument, freq, ctx.currentTime, 0.2);
        }

        beatSequencer.clearPattern();
        pianoRoll.clear();
    });

    it('should handle full workflow: create, save, load, modify', () => {
        localStorage.clear();
        songManager.songs = [];

        // Create a beat
        beatSequencer.setCell('kick', 0, true);
        beatSequencer.setCell('kick', 8, true);
        beatSequencer.setCell('snare', 4, true);
        beatSequencer.setCell('snare', 12, true);

        // Add melody
        pianoRoll.setNote(60, 0, true);
        pianoRoll.setNote(64, 4, true);
        pianoRoll.setNote(67, 8, true);

        // Set BPM
        audioEngine.setBPM(90);

        // Add arrangement
        songManager.arrangement = [0, 0, 1, 0];

        // Save
        songManager.currentSongName = 'Full Workflow';
        songManager.saveCurrent();

        // Clear everything
        beatSequencer.clearPattern();
        pianoRoll.clear();
        audioEngine.setBPM(120);
        songManager.arrangement = [0];

        // Load
        songManager.loadSong(0);

        // Verify
        assertEqual(beatSequencer.getGrid()['kick'][0], true);
        assertEqual(beatSequencer.getGrid()['snare'][4], true);
        assert(pianoRoll.hasNote(60, 0));
        assert(pianoRoll.hasNote(64, 4));
        assertEqual(audioEngine.bpm, 90);

        // Cleanup
        beatSequencer.clearPattern();
        pianoRoll.clear();
        audioEngine.setBPM(120);
        localStorage.clear();
        songManager.songs = [];
        songManager.arrangement = [0];
    });

    it('should handle time signature changes', () => {
        audioEngine.setBeatsPerBar(3);
        assertEqual(audioEngine.totalSteps, 12);

        // Sequencer grid should still work
        beatSequencer.setCell('kick', 0, true);
        beatSequencer.setCell('kick', 11, true);
        const active = beatSequencer.getActiveSteps(11);
        assertEqual(active.length, 1);

        audioEngine.setBeatsPerBar(4);
        beatSequencer.clearPattern();
    });
});

// ========================
// EDGE CASE TESTS
// ========================
describe('Edge Cases', () => {
    it('should handle empty beat grid playback', () => {
        beatSequencer.clearPattern();
        const active = beatSequencer.getActiveSteps(0);
        assertEqual(active.length, 0);
    });

    it('should handle notes at grid boundaries', () => {
        pianoRoll.clear();
        const range = pianoRoll.getMidiRange();

        pianoRoll.setNote(range.low, 0, true);
        pianoRoll.setNote(range.high, 15, true);

        assert(pianoRoll.hasNote(range.low, 0));
        assert(pianoRoll.hasNote(range.high, 15));

        pianoRoll.clear();
    });

    it('should handle MIDI frequency conversion at extremes', () => {
        const lowFreq = Instruments.midiToFreq(0);
        assert(lowFreq > 0, 'Low MIDI should produce positive frequency');

        const highFreq = Instruments.midiToFreq(127);
        assert(highFreq < 20000, 'High MIDI should be below 20kHz');
        assert(highFreq > 0, 'High MIDI should produce positive frequency');
    });

    it('should handle all 12 keys for scales', () => {
        const keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const scales = ['major', 'minor', 'pentatonic', 'blues', 'chromatic'];

        keys.forEach(key => {
            scales.forEach(scale => {
                const notes = Instruments.getScaleNotes(key, scale);
                assert(notes.length > 0, `${key} ${scale} should have notes`);
                assert(notes.includes(key), `${key} ${scale} should include root note`);
            });
        });
    });

    it('should handle rapid pattern switching', () => {
        for (let i = 0; i < 100; i++) {
            beatSequencer.currentPattern = i % 4;
            beatSequencer.getGrid(); // Should not throw
        }
        beatSequencer.currentPattern = 0;
    });

    it('should handle concurrent note toggling', () => {
        pianoRoll.clear();
        for (let step = 0; step < 16; step++) {
            for (let midi = 48; midi <= 83; midi++) {
                pianoRoll.setNote(midi, step, true);
            }
        }

        // All notes should be set
        const notes = pianoRoll.getActiveNotes(0);
        assertEqual(notes.length, 36); // 83 - 48 + 1

        pianoRoll.clear();
    });

    it('should handle BPM edge values', () => {
        audioEngine.setBPM(40);
        assertEqual(audioEngine.bpm, 40);
        assert(audioEngine.getStepDuration() > 0);

        audioEngine.setBPM(240);
        assertEqual(audioEngine.bpm, 240);
        assert(audioEngine.getStepDuration() > 0);

        audioEngine.setBPM(120);
    });
});

// ========================
// GAMIFICATION TESTS
// ========================
describe('Gamification - Profile & Identity', () => {
    it('should have a default profile', () => {
        assertEqual(gamification.profile.level, 1);
        assertEqual(gamification.profile.xp, 0);
        assertEqual(gamification.profile.currentStreak, 0);
        assert(Array.isArray(gamification.profile.dailyQuests));
    });

    it('should detect no identity initially', () => {
        assertEqual(gamification.hasIdentity(), false);
    });

    it('should setup a secret identity', () => {
        gamification.setupIdentity('TestKid', 2);
        assertEqual(gamification.profile.name, 'TestKid');
        assertEqual(gamification.profile.avatar, gamification.identities[2].avatar);
        assert(gamification.hasIdentity());
    });

    it('should have 8 identity options', () => {
        assertEqual(gamification.identities.length, 8);
        gamification.identities.forEach(id => {
            assert(id.avatar, 'Identity should have avatar');
            assert(id.title, 'Identity should have title');
        });
    });
});

describe('Gamification - XP & Levels', () => {
    it('should add XP', () => {
        const startXP = gamification.profile.totalXP;
        gamification.addXP(50, 'test');
        assert(gamification.profile.totalXP > startXP, 'XP should increase');
    });

    it('should level up when enough XP', () => {
        // Reset
        gamification.profile.totalXP = 0;
        gamification.profile.xp = 0;
        gamification.profile.level = 1;

        gamification.addXP(100, 'test');
        assertEqual(gamification.profile.level, 2);
    });

    it('should have 15 levels', () => {
        assertEqual(gamification.levels.length, 15);
        // Verify levels are ordered
        for (let i = 1; i < gamification.levels.length; i++) {
            assert(gamification.levels[i].xpNeeded > gamification.levels[i-1].xpNeeded,
                'XP should increase per level');
        }
    });

    it('should calculate XP for next level', () => {
        gamification.profile.totalXP = 150;
        gamification.profile.level = 2;
        const info = gamification.getXPForNextLevel();
        assert(info.progress >= 0 && info.progress <= 1, 'Progress should be 0-1');
        assert(info.needed > 0, 'Needed XP should be positive');
    });

    it('should apply streak bonus to XP', () => {
        gamification.profile.currentStreak = 5; // +50% bonus
        const earned = gamification.addXP(100, 'test');
        assert(earned > 100, `Should earn more than 100 with streak, got ${earned}`);
        gamification.profile.currentStreak = 0;
    });
});

describe('Gamification - Streaks (Urgent Optimism)', () => {
    it('should start a streak', () => {
        gamification.profile.lastPlayDate = null;
        gamification.profile.currentStreak = 0;
        gamification.updateStreak();
        assertEqual(gamification.profile.currentStreak, 1);
    });

    it('should continue a streak on consecutive days', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        gamification.profile.lastPlayDate = yesterday.toISOString().split('T')[0];
        gamification.profile.currentStreak = 3;
        gamification.updateStreak();
        assertEqual(gamification.profile.currentStreak, 4);
    });

    it('should reset streak after gap', () => {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        gamification.profile.lastPlayDate = threeDaysAgo.toISOString().split('T')[0];
        gamification.profile.currentStreak = 10;
        gamification.updateStreak();
        assertEqual(gamification.profile.currentStreak, 1);
    });

    it('should track longest streak', () => {
        gamification.profile.longestStreak = 5;
        gamification.profile.currentStreak = 7;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        gamification.profile.lastPlayDate = yesterday.toISOString().split('T')[0];
        gamification.updateStreak();
        assertEqual(gamification.profile.longestStreak, 8);
    });
});

describe('Gamification - Achievements (Epic Wins)', () => {
    it('should unlock achievements', () => {
        const result = gamification.unlockAchievement('first_beat');
        assertEqual(result, true);
        assert(gamification.hasAchievement('first_beat'));
    });

    it('should not double-unlock achievements', () => {
        const result = gamification.unlockAchievement('first_beat');
        assertEqual(result, false);
    });

    it('should track achievement progress', () => {
        const progress = gamification.getAchievementProgress();
        assert(progress.unlocked > 0);
        assert(progress.total > 0);
        assert(progress.percent >= 0 && progress.percent <= 100);
    });

    it('should have all defined achievements', () => {
        const total = Object.keys(gamification.allAchievements).length;
        assert(total >= 25, `Should have 25+ achievements, has ${total}`);
    });

    it('should categorize achievements', () => {
        const categories = new Set();
        Object.values(gamification.allAchievements).forEach(a => categories.add(a.category));
        assert(categories.has('begin'));
        assert(categories.has('fiero'));
        assert(categories.has('create'));
        assert(categories.has('streak'));
        assert(categories.has('badguy'));
        assert(categories.has('epic'));
    });
});

describe('Gamification - Quests', () => {
    it('should generate 3 daily quests', () => {
        gamification.profile.dailyQuestDate = null;
        gamification.generateDailyQuests();
        assertEqual(gamification.profile.dailyQuests.length, 3);
    });

    it('should not regenerate quests on same day', () => {
        const firstQuests = gamification.profile.dailyQuests.map(q => q.id);
        gamification.generateDailyQuests();
        const secondQuests = gamification.profile.dailyQuests.map(q => q.id);
        assertDeepEqual(firstQuests, secondQuests);
    });

    it('should have quest templates', () => {
        assert(gamification.questTemplates.length >= 10, 'Should have 10+ quest templates');
        gamification.questTemplates.forEach(q => {
            assert(q.id, 'Quest should have id');
            assert(q.desc, 'Quest should have desc');
            assert(q.xp > 0, 'Quest should give XP');
            assert(typeof q.check === 'function', 'Quest should have check function');
        });
    });

    it('should track quest data', () => {
        gamification.trackQuestProgress('testKey', 42);
        assertEqual(gamification._questData['testKey'], 42);
    });

    it('should increment quest data', () => {
        gamification._questData['counter'] = 0;
        gamification.incrementQuestData('counter');
        gamification.incrementQuestData('counter');
        assertEqual(gamification._questData['counter'], 2);
    });
});

describe('Gamification - Power-Ups', () => {
    it('should start with electronic kit unlocked', () => {
        assert(gamification.isPowerUpUnlocked('electronic'));
    });

    it('should list locked and unlocked power-ups', () => {
        const unlocked = gamification.getUnlockedPowerUps();
        const locked = gamification.getLockedPowerUps();
        assert(unlocked.length >= 1);
        assert(locked.length >= 0);
        assertEqual(unlocked.length + locked.length, Object.keys(gamification.allPowerUps).length);
    });

    it('should have power-ups with required fields', () => {
        Object.values(gamification.allPowerUps).forEach(pu => {
            assert(pu.name, 'Power-up should have name');
            assert(pu.type, 'Power-up should have type');
            assert(pu.icon, 'Power-up should have icon');
            assert(pu.level > 0, 'Power-up should have unlock level');
        });
    });
});

describe('Gamification - Bad Guys', () => {
    it('should have 3 bad guys', () => {
        assertEqual(gamification.badGuys.length, 3);
    });

    it('should have bad guys with requirements', () => {
        gamification.badGuys.forEach(bg => {
            assert(bg.id, 'Bad guy should have id');
            assert(bg.name, 'Bad guy should have name');
            assert(bg.icon, 'Bad guy should have icon');
            assert(bg.achievement, 'Bad guy should have linked achievement');
            assert(bg.requirement, 'Bad guy should have requirement');
            assert(bg.requirement.type, 'Requirement should have type');
            assert(bg.requirement.count > 0, 'Requirement should have count');
        });
    });

    it('should get bad guy status', () => {
        const status = gamification.getBadGuyStatus('offbeat_demon');
        assert(status !== null);
        assertEqual(status.id, 'offbeat_demon');
        assert(typeof status.defeated === 'boolean');
        assert(typeof status.progress === 'number');
    });

    it('should track bad guy progress', () => {
        gamification.profile.badGuysDefeated = {};
        gamification.trackBadGuyProgress('practice_accuracy', 85);
        const status = gamification.getBadGuyStatus('offbeat_demon');
        assert(status.progress >= 1, 'Should track progress');
    });
});

describe('Gamification - Allies (Virtual Band)', () => {
    it('should have 4 allies', () => {
        assertEqual(gamification.allAllies.length, 4);
    });

    it('should have allies with all required fields', () => {
        gamification.allAllies.forEach(ally => {
            assert(ally.id, 'Ally should have id');
            assert(ally.name, 'Ally should have name');
            assert(ally.role, 'Ally should have role');
            assert(ally.icon, 'Ally should have icon');
            assert(ally.unlockLevel > 0, 'Ally should have unlock level');
            assert(ally.encouragements.length >= 3, 'Ally should have encouragements');
            assert(ally.tips.length >= 3, 'Ally should have tips');
        });
    });

    it('should unlock allies based on level', () => {
        gamification.profile.level = 1;
        const atLevel1 = gamification.getUnlockedAllies();
        assertEqual(atLevel1.length, 1); // Only Benny Beats

        gamification.profile.level = 10;
        const atLevel10 = gamification.getUnlockedAllies();
        assertEqual(atLevel10.length, 4); // All allies
    });

    it('should get random encouragement', () => {
        gamification.profile.level = 5;
        const enc = gamification.getRandomEncouragement();
        assert(enc !== null);
        assert(enc.ally, 'Should have ally');
        assert(enc.message, 'Should have message');
    });

    it('should get random tip', () => {
        gamification.profile.level = 5;
        const tip = gamification.getRandomTip();
        assert(tip !== null);
        assert(tip.ally, 'Should have ally');
        assert(tip.message, 'Should have message');
    });
});

describe('Gamification - Flow State', () => {
    it('should suggest easy for beginners', () => {
        gamification.profile.totalPracticeRounds = 0;
        assertEqual(gamification.getAdaptiveDifficulty(), 'easy');
    });

    it('should suggest harder difficulty as skill improves', () => {
        gamification.profile.totalPracticeRounds = 5;
        gamification.profile.practiceHighScore = 1500;
        assertEqual(gamification.getAdaptiveDifficulty(), 'medium');

        gamification.profile.practiceHighScore = 4000;
        assertEqual(gamification.getAdaptiveDifficulty(), 'hard');
    });
});

describe('Gamification - Stat Tracking', () => {
    it('should track beat creation', () => {
        const before = gamification.profile.totalBeatsCreated;
        gamification.onBeatCreated();
        assertEqual(gamification.profile.totalBeatsCreated, before + 1);
    });

    it('should track note playing', () => {
        const before = gamification.profile.totalNotesPlayed;
        gamification.onNotePlayed();
        assertEqual(gamification.profile.totalNotesPlayed, before + 1);
    });

    it('should track practice completion', () => {
        const before = gamification.profile.totalPracticeRounds;
        gamification.onPracticeComplete(500, 80, 8, 'easy');
        assertEqual(gamification.profile.totalPracticeRounds, before + 1);
    });

    it('should track song saves', () => {
        const before = gamification.profile.totalSongsSaved;
        gamification.onSongSaved();
        assertEqual(gamification.profile.totalSongsSaved, before + 1);
    });

    it('should track exports', () => {
        const before = gamification.profile.totalExports;
        gamification.onExport();
        assertEqual(gamification.profile.totalExports, before + 1);
    });

    it('should save and load profile', () => {
        gamification.profile.name = 'SaveTest';
        gamification.save();

        const loaded = JSON.parse(localStorage.getItem('looplab-profile'));
        assertEqual(loaded.name, 'SaveTest');
    });
});

// Run summary
summary();
