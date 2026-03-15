/**
 * LoopLab Main App
 * Wires everything together
 */
(function () {
    'use strict';

    // ========================
    // NAVIGATION
    // ========================
    function switchView(viewName) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

        const view = document.getElementById(`view-${viewName}`);
        if (view) view.classList.add('active');

        const btn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
        if (btn) btn.classList.add('active');

        // Refresh view content
        if (viewName === 'songs') {
            songManager.renderSongsList();
            songManager.renderArrangement();
        }
    }

    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => switchView(btn.dataset.view));
    });

    // ========================
    // STEP INDICATOR
    // ========================
    function buildStepIndicator() {
        const container = document.querySelector('.step-dots');
        container.innerHTML = '';
        for (let i = 0; i < audioEngine.totalSteps; i++) {
            const dot = document.createElement('div');
            dot.className = 'step-dot';
            if (i % audioEngine.stepsPerBeat === 0) dot.classList.add('beat-marker');
            container.appendChild(dot);
        }
    }

    function updateStepIndicator(step) {
        document.querySelectorAll('.step-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === step);
        });
    }

    // ========================
    // TRANSPORT CONTROLS
    // ========================
    const btnPlay = document.getElementById('btn-play');
    const btnStop = document.getElementById('btn-stop');
    const btnRecord = document.getElementById('btn-record');

    btnPlay.addEventListener('click', () => {
        audioEngine.init();
        if (audioEngine.isPlaying) {
            audioEngine.stop();
            btnPlay.classList.remove('active');
            btnPlay.textContent = '▶';
        } else {
            audioEngine.play();
            btnPlay.classList.add('active');
            btnPlay.textContent = '⏸';
        }
    });

    btnStop.addEventListener('click', () => {
        audioEngine.stop();
        btnPlay.classList.remove('active');
        btnPlay.textContent = '▶';
    });

    // Audio engine step callback
    audioEngine.onStep = (step, time) => {
        if (step < 0) {
            // Stopped
            setTimeout(() => {
                updateStepIndicator(-1);
                beatSequencer.highlightStep(-1);
                pianoRoll.highlightStep(-1);
            }, 0);
            return;
        }

        // Schedule drum sounds
        const activeInstruments = beatSequencer.getActiveSteps(step);
        for (const inst of activeInstruments) {
            const ctx = audioEngine.ctx;
            const drumGain = ctx.createGain();
            drumGain.gain.setValueAtTime(inst.volume, time);
            drumGain.connect(audioEngine.masterGain);

            if (Instruments.drums[inst.id]) {
                Instruments.drums[inst.id](ctx, drumGain, time, 1.0);
            }
        }

        // Schedule melody notes
        const melodyNotes = pianoRoll.getActiveNotes(step);
        for (const midi of melodyNotes) {
            const ctx = audioEngine.ctx;
            const freq = Instruments.midiToFreq(midi);
            const duration = audioEngine.getStepDuration() * 0.9;
            Instruments.playNote(ctx, audioEngine.masterGain, pianoRoll.instrument, freq, time, duration);
        }

        // Visual update (use setTimeout to sync with display)
        const delay = Math.max(0, (time - audioEngine.ctx.currentTime) * 1000);
        setTimeout(() => {
            updateStepIndicator(step);
            beatSequencer.highlightStep(step);
            pianoRoll.highlightStep(step);
        }, delay);
    };

    // ========================
    // BPM CONTROL
    // ========================
    const bpmDisplay = document.getElementById('bpm-value');

    document.getElementById('bpm-down').addEventListener('click', () => {
        audioEngine.setBPM(audioEngine.bpm - 5);
        bpmDisplay.textContent = audioEngine.bpm;
    });

    document.getElementById('bpm-up').addEventListener('click', () => {
        audioEngine.setBPM(audioEngine.bpm + 5);
        bpmDisplay.textContent = audioEngine.bpm;
    });

    // Allow scroll on BPM display
    bpmDisplay.parentElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        audioEngine.setBPM(audioEngine.bpm + delta);
        bpmDisplay.textContent = audioEngine.bpm;
    });

    // Time signature
    document.getElementById('time-sig').addEventListener('change', (e) => {
        const beats = parseInt(e.target.value);
        audioEngine.setBeatsPerBar(beats);
        buildStepIndicator();
        beatSequencer.render(document.getElementById('beat-grid'));
        pianoRoll.steps = audioEngine.totalSteps;
        pianoRoll.render(document.getElementById('piano-keys'), document.getElementById('piano-grid'));
    });

    // Swing
    document.getElementById('swing').addEventListener('input', (e) => {
        audioEngine.setSwing(parseInt(e.target.value));
    });

    // Master volume
    document.getElementById('master-volume').addEventListener('input', (e) => {
        audioEngine.init();
        audioEngine.setMasterVolume(parseInt(e.target.value) / 100);
    });

    // ========================
    // SEQUENCER CONTROLS
    // ========================
    // Pattern buttons
    document.querySelectorAll('.pattern-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            beatSequencer.currentPattern = parseInt(btn.dataset.pattern);
            beatSequencer.updatePatternButtons();
            beatSequencer.render(document.getElementById('beat-grid'));
        });
    });

    let copiedPattern = null;

    document.getElementById('btn-clear-pattern').addEventListener('click', () => {
        beatSequencer.clearPattern();
        beatSequencer.render(document.getElementById('beat-grid'));
        beatSequencer.updatePatternButtons();
    });

    document.getElementById('btn-random-pattern').addEventListener('click', () => {
        beatSequencer.randomPattern();
        beatSequencer.render(document.getElementById('beat-grid'));
        beatSequencer.updatePatternButtons();
    });

    document.getElementById('btn-copy-pattern').addEventListener('click', () => {
        if (copiedPattern) {
            beatSequencer.pastePattern(copiedPattern);
            beatSequencer.render(document.getElementById('beat-grid'));
            copiedPattern = null;
            document.getElementById('btn-copy-pattern').textContent = '📋 Kopieer';
        } else {
            copiedPattern = beatSequencer.copyPattern();
            document.getElementById('btn-copy-pattern').textContent = '📄 Plak';
        }
    });

    // Drum kit
    document.getElementById('drum-kit-select').addEventListener('change', (e) => {
        beatSequencer.currentKit = e.target.value;
    });

    // ========================
    // PIANO ROLL CONTROLS
    // ========================
    document.getElementById('melody-instrument').addEventListener('change', (e) => {
        pianoRoll.instrument = e.target.value;
    });

    document.getElementById('scale-select').addEventListener('change', (e) => {
        pianoRoll.scale = e.target.value;
        pianoRoll.render(document.getElementById('piano-keys'), document.getElementById('piano-grid'));
    });

    document.getElementById('key-select').addEventListener('change', (e) => {
        pianoRoll.key = e.target.value;
        pianoRoll.render(document.getElementById('piano-keys'), document.getElementById('piano-grid'));
    });

    document.getElementById('btn-clear-melody').addEventListener('click', () => {
        pianoRoll.clear();
        pianoRoll.render(document.getElementById('piano-keys'), document.getElementById('piano-grid'));
    });

    document.getElementById('btn-random-melody').addEventListener('click', () => {
        pianoRoll.randomMelody();
        pianoRoll.render(document.getElementById('piano-keys'), document.getElementById('piano-grid'));
    });

    // ========================
    // PRACTICE CONTROLS
    // ========================
    document.querySelectorAll('.practice-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.practice-mode-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            practiceMode.mode = btn.dataset.mode;
        });
    });

    document.getElementById('difficulty').addEventListener('change', (e) => {
        practiceMode.difficulty = e.target.value;
    });

    document.getElementById('btn-start-practice').addEventListener('click', () => {
        practiceMode.start();
    });

    document.getElementById('btn-stop-practice').addEventListener('click', () => {
        practiceMode.stop();
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
        document.getElementById('practice-results').style.display = 'none';
        document.getElementById('practice-area').style.display = '';
        practiceMode.start();
    });

    // ========================
    // SONG CONTROLS
    // ========================
    document.getElementById('btn-new-song').addEventListener('click', () => {
        songManager.newSong();
    });

    document.getElementById('btn-save-song').addEventListener('click', () => {
        songManager.saveCurrent();
    });

    document.getElementById('btn-export-wav').addEventListener('click', () => {
        songManager.exportWAV();
    });

    document.getElementById('btn-add-section').addEventListener('click', () => {
        // Cycle through pattern options
        const next = (songManager.arrangement.length) % 4;
        songManager.addSection(next);
    });

    // ========================
    // KEYBOARD SHORTCUTS
    // ========================
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;

        switch (e.code) {
            case 'Space':
                e.preventDefault();
                btnPlay.click();
                break;
            case 'Escape':
                btnStop.click();
                break;
        }
    });

    // ========================
    // INIT
    // ========================
    buildStepIndicator();
    beatSequencer.render(document.getElementById('beat-grid'));
    beatSequencer.updatePatternButtons();
    pianoRoll.render(document.getElementById('piano-keys'), document.getElementById('piano-grid'));
    practiceMode.init();
    songManager.renderArrangement();

    // Welcome animation - auto-generate a starter beat
    setTimeout(() => {
        // Add a simple starter beat so it's not empty
        const grid = beatSequencer.getGrid();
        // Classic boom-bap
        grid['kick'][0] = true;
        grid['kick'][8] = true;
        grid['kick'][10] = true;
        grid['snare'][4] = true;
        grid['snare'][12] = true;
        grid['hihat'][0] = true;
        grid['hihat'][2] = true;
        grid['hihat'][4] = true;
        grid['hihat'][6] = true;
        grid['hihat'][8] = true;
        grid['hihat'][10] = true;
        grid['hihat'][12] = true;
        grid['hihat'][14] = true;

        beatSequencer.render(document.getElementById('beat-grid'));
        beatSequencer.updatePatternButtons();
    }, 100);

    console.log('🎵 LoopLab loaded! Druk op spatie om te starten.');
})();
