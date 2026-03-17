/**
 * LoopLab Main App
 * Wires everything together including McGonigal gamification
 */
(function () {
    'use strict';

    // Track instruments/scales used for quests & achievements
    const _usedInstruments = new Set();
    const _usedScales = new Set();
    let _bpmChanges = 0;
    let _playStartTime = 0;

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
        if (viewName === 'profile') {
            renderProfileView();
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
            // Track play time for quests
            if (_playStartTime) {
                const playedMs = Date.now() - _playStartTime;
                gamification.profile.totalPlayTimeMs += playedMs;
                gamification.incrementQuestData('playTimeMs', playedMs);
                _playStartTime = 0;
            }
        } else {
            audioEngine.play();
            btnPlay.classList.add('active');
            btnPlay.textContent = '⏸';
            _playStartTime = Date.now();
        }
    });

    btnStop.addEventListener('click', () => {
        audioEngine.stop();
        btnPlay.classList.remove('active');
        btnPlay.textContent = '▶';
        if (_playStartTime) {
            const playedMs = Date.now() - _playStartTime;
            gamification.profile.totalPlayTimeMs += playedMs;
            gamification.incrementQuestData('playTimeMs', playedMs);
            _playStartTime = 0;
        }
    });

    // Audio engine step callback
    audioEngine.onStep = (step, time) => {
        if (step < 0) {
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

        // Visual update
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
        _bpmChanges++;
        gamification.incrementQuestData('bpmChanges');
    });

    document.getElementById('bpm-up').addEventListener('click', () => {
        audioEngine.setBPM(audioEngine.bpm + 5);
        bpmDisplay.textContent = audioEngine.bpm;
        _bpmChanges++;
        gamification.incrementQuestData('bpmChanges');
    });

    bpmDisplay.parentElement.addEventListener('wheel', (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        audioEngine.setBPM(audioEngine.bpm + delta);
        bpmDisplay.textContent = audioEngine.bpm;
        _bpmChanges++;
        gamification.incrementQuestData('bpmChanges');
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
    // SEQUENCER CONTROLS + GAMIFICATION HOOKS
    // ========================
    document.querySelectorAll('.pattern-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            beatSequencer.currentPattern = parseInt(btn.dataset.pattern);
            beatSequencer.updatePatternButtons();
            beatSequencer.render(document.getElementById('beat-grid'));
        });
    });

    // Wrap the original sequencer render to hook beat creation tracking
    const origToggle = beatSequencer.toggleCell.bind(beatSequencer);
    beatSequencer.toggleCell = function(instrument, step) {
        const result = origToggle(instrument, step);
        if (result) {
            gamification.onBeatCreated();
            // Count unique instruments used for quest
            const grid = this.getGrid();
            const instrumentsUsed = this.instruments.filter(i => grid[i.id].some(v => v)).length;
            gamification.trackQuestProgress('instrumentsUsed', instrumentsUsed);

            // Check full grid achievement
            if (grid[instrument].every(v => v)) {
                gamification.unlockAchievement('full_grid');
            }
            // Check all patterns achievement
            if ([0,1,2,3].every(i => this.patternHasData(i))) {
                gamification.unlockAchievement('pattern_all');
            }
            // Track patterns used for quest
            const patternsUsed = [0,1,2,3].filter(i => this.patternHasData(i)).length;
            gamification.trackQuestProgress('patternsUsed', patternsUsed);
        }
        return result;
    };

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
        gamification.onRandomUsed();
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

    document.getElementById('drum-kit-select').addEventListener('change', (e) => {
        beatSequencer.currentKit = e.target.value;
    });

    // ========================
    // PIANO ROLL CONTROLS + GAMIFICATION HOOKS
    // ========================
    document.getElementById('melody-instrument').addEventListener('change', (e) => {
        pianoRoll.instrument = e.target.value;
        _usedInstruments.add(e.target.value);
        gamification.trackQuestProgress('newInstrumentTried', true);
        if (_usedInstruments.size >= 5) {
            gamification.unlockAchievement('all_instruments');
        }
    });

    document.getElementById('scale-select').addEventListener('change', (e) => {
        pianoRoll.scale = e.target.value;
        pianoRoll.render(document.getElementById('piano-keys'), document.getElementById('piano-grid'));
        _usedScales.add(e.target.value);
        gamification.trackQuestProgress('scaleTried', true);
        if (_usedScales.size >= 5) {
            gamification.unlockAchievement('all_scales');
        }
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
        gamification.onRandomUsed();
    });

    // Hook piano roll note creation for gamification
    const origPianoToggle = pianoRoll.toggleNote.bind(pianoRoll);
    pianoRoll.toggleNote = function(midi, step) {
        const result = origPianoToggle(midi, step);
        if (result) {
            gamification.onNotePlayed();
            gamification.trackQuestProgress('melodyAdded', true);
            // Count notes for achievement
            let noteCount = 0;
            const range = this.getMidiRange();
            for (let s = 0; s < this.steps; s++) {
                for (let m = range.low; m <= range.high; m++) {
                    if (this.hasNote(m, s)) noteCount++;
                }
            }
            if (noteCount >= 20) gamification.unlockAchievement('melody_master');
        }
        return result;
    };

    // ========================
    // PRACTICE CONTROLS + GAMIFICATION HOOKS
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
        // Apply adaptive difficulty suggestion (Flow state)
        const suggested = gamification.getAdaptiveDifficulty();
        document.getElementById('difficulty').value = suggested;
        practiceMode.difficulty = suggested;
        practiceMode.start();
    });

    document.getElementById('btn-stop-practice').addEventListener('click', () => {
        practiceMode.stop();
    });

    // Hook practice mode results for gamification
    const origShowResults = practiceMode._showResults.bind(practiceMode);
    practiceMode._showResults = function() {
        origShowResults();

        const total = this.hits + this.misses;
        const accuracy = total > 0 ? Math.round((this.hits / total) * 100) : 0;

        gamification.onPracticeComplete(this.score, accuracy, this.maxCombo, this.difficulty);

        // Track Bad Guys
        gamification.trackBadGuyProgress('streak', gamification.profile.currentStreak);
    };

    document.getElementById('btn-retry').addEventListener('click', () => {
        document.getElementById('practice-results').style.display = 'none';
        document.getElementById('practice-area').style.display = '';
        practiceMode.start();
    });

    // ========================
    // SONG CONTROLS + GAMIFICATION HOOKS
    // ========================
    document.getElementById('btn-new-song').addEventListener('click', () => {
        songManager.newSong();
    });

    document.getElementById('btn-save-song').addEventListener('click', () => {
        songManager.saveCurrent();
        gamification.onSongSaved();
    });

    document.getElementById('btn-export-wav').addEventListener('click', () => {
        songManager.exportWAV();
        gamification.onExport();
    });

    document.getElementById('btn-add-section').addEventListener('click', () => {
        const next = (songManager.arrangement.length) % 4;
        songManager.addSection(next);
        gamification.trackQuestProgress('arrangementSections', songManager.arrangement.length);
        if (songManager.arrangement.length >= 4) {
            gamification.unlockAchievement('arrangement_pro');
        }
    });

    // ========================
    // KEYBOARD SHORTCUTS
    // ========================
    document.addEventListener('keydown', (e) => {
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
    // GAMIFICATION: Identity Setup
    // ========================
    function showIdentityModal() {
        const modal = document.getElementById('identity-modal');
        modal.classList.remove('hidden');

        const grid = document.getElementById('avatar-grid');
        grid.innerHTML = '';

        let selectedAvatar = 0;
        gamification.identities.forEach((id, i) => {
            const opt = document.createElement('div');
            opt.className = 'avatar-option' + (i === 0 ? ' selected' : '');
            opt.innerHTML = `<span class="avatar-emoji">${id.avatar}</span><span class="avatar-name">${id.title}</span>`;
            opt.addEventListener('click', () => {
                grid.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
                opt.classList.add('selected');
                selectedAvatar = i;
            });
            grid.appendChild(opt);
        });

        document.getElementById('btn-start-adventure').addEventListener('click', () => {
            const name = document.getElementById('identity-name').value.trim() || 'Muzikant';
            gamification.setupIdentity(name, selectedAvatar);
            modal.classList.add('hidden');
            gamification._updateHUD();

            // Start tutorial for new players
            setTimeout(() => {
                if (!tutorial.isTutorialCompleted()) {
                    tutorial.start();
                }
            }, 1500);
        });
    }

    // ========================
    // GAMIFICATION: Profile View Rendering
    // ========================
    function renderProfileView() {
        const p = gamification.profile;

        // Profile header
        document.getElementById('profile-avatar-large').textContent = p.avatar || '🎵';
        document.getElementById('profile-name').textContent = p.name || 'Speler';
        document.getElementById('profile-title-text').textContent = `Level ${p.level} - ${p.title}`;

        const xpInfo = gamification.getXPForNextLevel();
        document.getElementById('profile-level-info').textContent = `${xpInfo.current}/${xpInfo.needed} XP naar level ${p.level + 1}`;

        // Quests
        gamification._updateQuestUI();

        // Bad Guys
        const bgGrid = document.getElementById('badguy-grid');
        bgGrid.innerHTML = '';
        gamification.badGuys.forEach(bg => {
            const status = gamification.getBadGuyStatus(bg.id);
            const card = document.createElement('div');
            card.className = `badguy-card ${status.defeated ? 'defeated' : ''}`;
            card.innerHTML = `
                <div class="badguy-icon">${bg.icon}</div>
                <div class="badguy-name">${bg.name}${status.defeated ? ' ✅' : ''}</div>
                <div class="badguy-desc">${bg.desc}</div>
                <div class="badguy-progress">
                    <div class="badguy-progress-fill" style="width:${Math.min(100, (status.progress / status.total) * 100)}%"></div>
                </div>
            `;
            bgGrid.appendChild(card);
        });
        document.getElementById('badguy-count').textContent =
            `${gamification.badGuys.filter(bg => gamification.hasAchievement(bg.achievement)).length}/${gamification.badGuys.length} verslagen`;

        // Allies
        const allyGrid = document.getElementById('ally-grid');
        allyGrid.innerHTML = '';
        gamification.allAllies.forEach(ally => {
            const unlocked = p.level >= ally.unlockLevel;
            const card = document.createElement('div');
            card.className = `ally-card ${unlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <div class="ally-icon">${ally.icon}</div>
                <div class="ally-name">${ally.name}</div>
                <div class="ally-role">${ally.role}</div>
                <div class="ally-personality">${ally.personality}</div>
                ${!unlocked ? `<div class="ally-unlock">Ontgrendel op level ${ally.unlockLevel}</div>` : ''}
            `;
            allyGrid.appendChild(card);
        });
        document.getElementById('ally-count').textContent =
            `${gamification.getUnlockedAllies().length}/${gamification.allAllies.length} ontgrendeld`;

        // Check full band achievement
        if (gamification.getUnlockedAllies().length === gamification.allAllies.length) {
            gamification.unlockAchievement('full_band');
        }

        // Power-Ups
        const puGrid = document.getElementById('powerup-grid');
        puGrid.innerHTML = '';
        Object.entries(gamification.allPowerUps).forEach(([id, pu]) => {
            const unlocked = gamification.isPowerUpUnlocked(id);
            const card = document.createElement('div');
            card.className = `powerup-card ${unlocked ? '' : 'locked'}`;
            card.innerHTML = `
                <span class="powerup-icon">${pu.icon}</span>
                <div>
                    <div class="powerup-name">${pu.name}</div>
                    <div class="powerup-level">${unlocked ? pu.desc : `Level ${pu.level}`}</div>
                </div>
            `;
            puGrid.appendChild(card);
        });
        document.getElementById('powerup-count').textContent =
            `${gamification.getUnlockedPowerUps().length}/${Object.keys(gamification.allPowerUps).length} ontgrendeld`;

        // Achievements
        const achGrid = document.getElementById('achievement-grid');
        achGrid.innerHTML = '';
        // Show unlocked first
        const sortedAch = Object.entries(gamification.allAchievements).sort(([aId], [bId]) => {
            const aUnlocked = gamification.hasAchievement(aId);
            const bUnlocked = gamification.hasAchievement(bId);
            if (aUnlocked && !bUnlocked) return -1;
            if (!aUnlocked && bUnlocked) return 1;
            return 0;
        });

        sortedAch.forEach(([id, ach]) => {
            const unlocked = gamification.hasAchievement(id);
            const card = document.createElement('div');
            card.className = `achievement-card ${unlocked ? 'unlocked' : 'locked'}`;
            card.innerHTML = `
                <span class="achievement-icon">${ach.icon}</span>
                <div class="achievement-info">
                    <div class="achievement-name">${ach.name}</div>
                    <div class="achievement-desc">${ach.desc}</div>
                </div>
            `;
            achGrid.appendChild(card);
        });
        const achProgress = gamification.getAchievementProgress();
        document.getElementById('achievement-count').textContent =
            `${achProgress.unlocked}/${achProgress.total} (${achProgress.percent}%)`;

        // Stats
        const statsGrid = document.getElementById('profile-stats');
        statsGrid.innerHTML = '';
        const stats = [
            { value: p.totalXP, label: 'Totale XP' },
            { value: p.level, label: 'Level' },
            { value: p.currentStreak, label: 'Huidige Streak' },
            { value: p.longestStreak, label: 'Langste Streak' },
            { value: p.totalBeatsCreated, label: 'Beats Gemaakt' },
            { value: p.totalNotesPlayed, label: 'Noten Gespeeld' },
            { value: p.totalPracticeRounds, label: 'Oefensessies' },
            { value: p.practiceHighScore, label: 'Highscore' },
            { value: p.totalSongsSaved, label: 'Songs Opgeslagen' },
            { value: p.totalExports, label: 'Exports' },
            { value: p.sessionsPlayed, label: 'Sessies' },
            { value: Math.round(p.totalPlayTimeMs / 60000), label: 'Minuten Gespeeld' },
        ];
        stats.forEach(s => {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `<div class="stat-value">${s.value}</div><div class="stat-label">${s.label}</div>`;
            statsGrid.appendChild(card);
        });
    }

    // ========================
    // GAMIFICATION: HUD Buttons
    // ========================
    document.getElementById('hud-quest-btn').addEventListener('click', () => {
        switchView('profile');
    });

    document.getElementById('hud-profile-btn').addEventListener('click', () => {
        switchView('profile');
    });

    document.getElementById('hud-identity-btn').addEventListener('click', () => {
        switchView('profile');
    });

    // ========================
    // GAMIFICATION: Periodic ally tips
    // ========================
    setInterval(() => {
        if (Math.random() < 0.3 && gamification.hasIdentity()) {
            const tip = gamification.getRandomTip();
            if (tip) gamification._showAllyMessage(tip.ally, tip.message);
        }
    }, 120000); // Every 2 minutes, 30% chance

    // ========================
    // INIT
    // ========================
    buildStepIndicator();
    beatSequencer.render(document.getElementById('beat-grid'));
    beatSequencer.updatePatternButtons();
    pianoRoll.render(document.getElementById('piano-keys'), document.getElementById('piano-grid'));
    practiceMode.init();
    songManager.renderArrangement();

    // Gamification init
    gamification.updateStreak();
    gamification.generateDailyQuests();
    gamification._updateHUD();
    gamification._updateQuestUI();

    // Show identity modal if first time, or resume tutorial
    if (!gamification.hasIdentity()) {
        showIdentityModal();
    } else if (!tutorial.isTutorialCompleted()) {
        // Resume tutorial for returning players who haven't finished
        setTimeout(() => tutorial.start(), 1000);
    }

    // Mark quest button if there are incomplete quests
    const hasIncomplete = gamification.profile.dailyQuests.some(q => !q.completed);
    if (hasIncomplete) {
        document.getElementById('hud-quest-btn').classList.add('has-quests');
    }

    // Welcome starter beat
    setTimeout(() => {
        const grid = beatSequencer.getGrid();
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
