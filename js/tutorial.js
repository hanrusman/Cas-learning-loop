/**
 * LoopLab Tutorial System
 * Begeleidt kinderen stap voor stap door de app.
 * Benny Beats (de drummer) geeft kleine opdrachten en wacht
 * tot het kind ze uitvoert voordat de volgende stap begint.
 */
class Tutorial {
    constructor() {
        this.currentStep = 0;
        this.active = false;
        this.steps = [];
        this.overlay = null;
        this.bubble = null;
        this._completionHandler = null;
        this._completedSteps = this._loadProgress();
    }

    // =====================
    // TUTORIAL STEPS
    // =====================
    allSteps = [
        {
            id: 'welcome',
            message: 'Hoi! Ik ben Benny Beats! Weet je wat een loop is? Een loop is een stukje muziek dat steeds opnieuw wordt afgespeeld. Samen gaan we een liedje maken met loops!',
            target: null,
            action: 'click-next',
            emoji: '🥁',
            xp: 0
        },
        {
            id: 'explain_loop',
            message: 'Zo werkt het: je maakt eerst een drumbeat, dan voeg je een melodie toe. Samen wordt dat een liedje! Elke rij vakjes is een ander geluid.',
            target: null,
            action: 'click-next',
            emoji: '💡',
            xp: 0
        },
        {
            id: 'listen_beat',
            message: 'Zie je die gekleurde vakjes hieronder? Dat is een beat! Druk op de PLAY knop ▶ om te horen hoe het klinkt.',
            target: '#btn-play',
            action: 'click',
            emoji: '🎧',
            xp: 10
        },
        {
            id: 'stop_beat',
            message: 'Hoor je dat? De drums herhalen steeds opnieuw, dat is een loop! Druk op STOP ⏹ om te stoppen.',
            target: '#btn-stop',
            action: 'click',
            emoji: '✋',
            xp: 5
        },
        {
            id: 'click_kick',
            message: 'Nu ben jij aan de beurt! Klik op een leeg vakje bij de Kick drum (de eerste rij). Dan voeg je een basgeluid toe!',
            target: '.beat-row[data-instrument="kick"]',
            action: 'beat-cell-click',
            instrument: 'kick',
            emoji: '👆',
            xp: 15
        },
        {
            id: 'play_your_beat',
            message: 'Goed zo! Druk nu op PLAY ▶ om te horen wat je hebt gemaakt!',
            target: '#btn-play',
            action: 'click',
            emoji: '🎉',
            xp: 10
        },
        {
            id: 'add_snare',
            message: 'Lekker! Voeg nu een Snare toe (de tweede rij). De snare klinkt als een klap!',
            target: '.beat-row[data-instrument="snare"]',
            action: 'beat-cell-click',
            instrument: 'snare',
            emoji: '🥁',
            xp: 15
        },
        {
            id: 'explain_song_structure',
            message: 'Wist je dat bijna alle liedjes op de radio zo worden gemaakt? Eerst een beat, dan een melodie erbij, en dan herhalen! Klik op "Volgende" om verder te gaan.',
            target: null,
            action: 'click-next',
            emoji: '📻',
            xp: 5
        },
        {
            id: 'change_bpm',
            message: 'Wil je het sneller of langzamer? Klik op + of - bij het tempo. Langzaam = rustig liedje, snel = dansfeestje!',
            target: '.bpm-control',
            action: 'bpm-change',
            emoji: '⏩',
            xp: 10
        },
        {
            id: 'go_melody',
            message: 'Tijd om een melodie toe te voegen! Klik op "Melodie" 🎹 hierboven.',
            target: '.nav-btn[data-view="piano"]',
            action: 'click',
            emoji: '🎹',
            xp: 10
        },
        {
            id: 'click_note',
            message: 'Klik op een vakje om een noot neer te zetten. Hoog = hoge toon, laag = lage toon. Probeer het!',
            target: '#piano-grid',
            action: 'piano-note-click',
            emoji: '🎵',
            xp: 15
        },
        {
            id: 'add_more_notes',
            message: 'Klik nog een paar vakjes om een melodie te maken. Probeer noten naast elkaar te zetten zodat het een deuntje wordt! Klik daarna op "Volgende".',
            target: '#piano-grid',
            action: 'click-next',
            emoji: '🎼',
            xp: 10
        },
        {
            id: 'play_melody',
            message: 'Druk op PLAY ▶ om je beat EN melodie samen te horen. Zo klinkt jouw liedje!',
            target: '#btn-play',
            action: 'click',
            emoji: '🎧',
            xp: 15
        },
        {
            id: 'explain_save',
            message: 'Als je iets moois hebt gemaakt, kun je naar "Liedjes" gaan om het op te slaan! Daar staan ook voorbeeldliedjes om van te leren. Klik op "Volgende".',
            target: null,
            action: 'click-next',
            emoji: '💾',
            xp: 5
        },
        {
            id: 'tutorial_done',
            message: 'Je bent een ster! Je weet nu hoe je een liedje maakt: een beat + een melodie = een loop! Probeer ook eens de voorbeeldliedjes bij "Liedjes". Veel plezier!',
            target: null,
            action: 'click-next',
            emoji: '⭐',
            xp: 50
        }
    ];

    // =====================
    // PERSISTENCE
    // =====================
    _loadProgress() {
        try {
            const data = localStorage.getItem('looplab-tutorial');
            return data ? JSON.parse(data) : { completed: false, step: 0 };
        } catch {
            return { completed: false, step: 0 };
        }
    }

    _saveProgress() {
        localStorage.setItem('looplab-tutorial', JSON.stringify(this._completedSteps));
    }

    isTutorialCompleted() {
        return this._completedSteps.completed === true;
    }

    resetTutorial() {
        this._completedSteps = { completed: false, step: 0 };
        this._saveProgress();
    }

    // =====================
    // START / STOP
    // =====================
    start() {
        if (this.isTutorialCompleted()) return;

        this.active = true;
        this.currentStep = this._completedSteps.step || 0;
        this.steps = [...this.allSteps];

        this._createOverlay();
        this._showStep(this.currentStep);
    }

    stop() {
        this.active = false;
        this._removeOverlay();
        this._removeCompletionHandler();
    }

    complete() {
        this._completedSteps.completed = true;
        this._saveProgress();
        this.stop();
    }

    // =====================
    // UI: OVERLAY + BUBBLE
    // =====================
    _createOverlay() {
        // Remove existing
        this._removeOverlay();

        // Spotlight overlay (4 dark panels around the target)
        this.overlay = document.createElement('div');
        this.overlay.id = 'tutorial-overlay';
        this.overlay.innerHTML = `
            <div class="tutorial-spotlight-top"></div>
            <div class="tutorial-spotlight-bottom"></div>
            <div class="tutorial-spotlight-left"></div>
            <div class="tutorial-spotlight-right"></div>
        `;
        document.body.appendChild(this.overlay);

        // Speech bubble
        this.bubble = document.createElement('div');
        this.bubble.id = 'tutorial-bubble';
        this.bubble.innerHTML = `
            <div class="tutorial-avatar"></div>
            <div class="tutorial-text"></div>
            <div class="tutorial-actions">
                <button class="tutorial-btn-next" style="display:none">Volgende →</button>
                <button class="tutorial-btn-skip">Overslaan</button>
            </div>
            <div class="tutorial-progress"></div>
        `;
        document.body.appendChild(this.bubble);

        // Skip button
        this.bubble.querySelector('.tutorial-btn-skip').addEventListener('click', () => {
            this.complete();
        });
    }

    _removeOverlay() {
        const existing = document.getElementById('tutorial-overlay');
        if (existing) existing.remove();
        const bubble = document.getElementById('tutorial-bubble');
        if (bubble) bubble.remove();
        // Remove any highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));
        this.overlay = null;
        this.bubble = null;
    }

    // =====================
    // SHOW A STEP
    // =====================
    _showStep(index) {
        if (index >= this.steps.length) {
            this.complete();
            return;
        }

        const step = this.steps[index];
        this.currentStep = index;
        this._completedSteps.step = index;
        this._saveProgress();

        // Remove previous handlers
        this._removeCompletionHandler();

        // Remove previous highlights
        document.querySelectorAll('.tutorial-highlight').forEach(el => el.classList.remove('tutorial-highlight'));

        // Update bubble content
        if (!this.bubble) return;

        const avatarEl = this.bubble.querySelector('.tutorial-avatar');
        const textEl = this.bubble.querySelector('.tutorial-text');
        const nextBtn = this.bubble.querySelector('.tutorial-btn-next');
        const progressEl = this.bubble.querySelector('.tutorial-progress');

        avatarEl.textContent = step.emoji;
        textEl.textContent = step.message;

        // Progress dots
        const totalSteps = this.steps.length;
        progressEl.innerHTML = '';
        for (let i = 0; i < totalSteps; i++) {
            const dot = document.createElement('span');
            dot.className = 'tutorial-dot' + (i === index ? ' active' : '') + (i < index ? ' done' : '');
            progressEl.appendChild(dot);
        }

        // Highlight target element
        if (step.target) {
            const targetEl = document.querySelector(step.target);
            if (targetEl) {
                targetEl.classList.add('tutorial-highlight');
                this._positionSpotlight(targetEl);
                this._positionBubble(targetEl);
            } else {
                this._hideSpotlight();
                this._centerBubble();
            }
        } else {
            this._hideSpotlight();
            this._centerBubble();
        }

        // Set up completion action
        if (step.action === 'click-next') {
            nextBtn.style.display = '';
            nextBtn.onclick = () => {
                this._onStepComplete(step);
            };
        } else if (step.action === 'click') {
            nextBtn.style.display = 'none';
            const targetEl = document.querySelector(step.target);
            if (targetEl) {
                this._completionHandler = () => {
                    this._onStepComplete(step);
                };
                targetEl.addEventListener('click', this._completionHandler, { once: true });
                this._completionTarget = targetEl;
            }
        } else if (step.action === 'beat-cell-click') {
            nextBtn.style.display = 'none';
            this._completionHandler = (e) => {
                const cell = e.target.closest('.beat-cell');
                if (cell) {
                    this._onStepComplete(step);
                }
            };
            const grid = document.getElementById('beat-grid');
            if (grid) {
                grid.addEventListener('click', this._completionHandler, { once: true });
                this._completionTarget = grid;
            }
        } else if (step.action === 'piano-note-click') {
            nextBtn.style.display = 'none';
            this._completionHandler = (e) => {
                const cell = e.target.closest('.piano-cell');
                if (cell) {
                    this._onStepComplete(step);
                }
            };
            const grid = document.getElementById('piano-grid');
            if (grid) {
                grid.addEventListener('click', this._completionHandler, { once: true });
                this._completionTarget = grid;
            }
        } else if (step.action === 'bpm-change') {
            nextBtn.style.display = 'none';
            const bpmUp = document.getElementById('bpm-up');
            const bpmDown = document.getElementById('bpm-down');
            this._completionHandler = () => {
                this._onStepComplete(step);
            };
            if (bpmUp) {
                bpmUp.addEventListener('click', this._completionHandler, { once: true });
                this._completionTarget = bpmUp;
            }
            // Also listen on bpm-down
            if (bpmDown) {
                this._completionHandler2 = () => {
                    // Clean up bpmUp listener
                    if (bpmUp) bpmUp.removeEventListener('click', this._completionHandler);
                    this._onStepComplete(step);
                };
                bpmDown.addEventListener('click', this._completionHandler2, { once: true });
                this._completionTarget2 = bpmDown;
            }
        }

        // Animate bubble entrance
        this.bubble.classList.remove('tutorial-bubble-enter');
        void this.bubble.offsetWidth; // Force reflow
        this.bubble.classList.add('tutorial-bubble-enter');
    }

    _onStepComplete(step) {
        // Award XP
        if (step.xp > 0 && typeof gamification !== 'undefined') {
            gamification.addXP(step.xp, `Tutorial: ${step.id}`);
        }

        // Small celebration
        this._miniCelebration();

        // Next step after brief delay
        setTimeout(() => {
            this._showStep(this.currentStep + 1);
        }, 600);
    }

    _miniCelebration() {
        if (!this.bubble) return;
        const avatar = this.bubble.querySelector('.tutorial-avatar');
        avatar.classList.add('tutorial-celebrate');
        setTimeout(() => avatar.classList.remove('tutorial-celebrate'), 500);
    }

    _removeCompletionHandler() {
        if (this._completionHandler && this._completionTarget) {
            this._completionTarget.removeEventListener('click', this._completionHandler);
        }
        if (this._completionHandler2 && this._completionTarget2) {
            this._completionTarget2.removeEventListener('click', this._completionHandler2);
        }
        this._completionHandler = null;
        this._completionTarget = null;
        this._completionHandler2 = null;
        this._completionTarget2 = null;
    }

    // =====================
    // POSITIONING
    // =====================
    _positionSpotlight(targetEl) {
        if (!this.overlay) return;
        const rect = targetEl.getBoundingClientRect();
        const padding = 8;

        const top = this.overlay.querySelector('.tutorial-spotlight-top');
        const bottom = this.overlay.querySelector('.tutorial-spotlight-bottom');
        const left = this.overlay.querySelector('.tutorial-spotlight-left');
        const right = this.overlay.querySelector('.tutorial-spotlight-right');

        const t = Math.max(0, rect.top - padding);
        const b = rect.bottom + padding;
        const l = Math.max(0, rect.left - padding);
        const r = rect.right + padding;

        top.style.cssText = `top:0;left:0;right:0;height:${t}px;`;
        bottom.style.cssText = `top:${b}px;left:0;right:0;bottom:0;`;
        left.style.cssText = `top:${t}px;left:0;width:${l}px;height:${b - t}px;`;
        right.style.cssText = `top:${t}px;left:${r}px;right:0;height:${b - t}px;`;

        [top, bottom, left, right].forEach(el => el.style.display = 'block');
    }

    _hideSpotlight() {
        if (!this.overlay) return;
        this.overlay.querySelectorAll('[class^="tutorial-spotlight"]').forEach(el => {
            el.style.display = 'none';
        });
    }

    _positionBubble(targetEl) {
        if (!this.bubble) return;
        const rect = targetEl.getBoundingClientRect();
        const bubbleHeight = 200;

        // Position bubble above or below target
        if (rect.top > bubbleHeight + 40) {
            // Place above
            this.bubble.style.top = `${rect.top - bubbleHeight - 20}px`;
        } else {
            // Place below
            this.bubble.style.top = `${rect.bottom + 20}px`;
        }

        // Center horizontally relative to target, but keep on screen
        const bubbleWidth = 360;
        let leftPos = rect.left + rect.width / 2 - bubbleWidth / 2;
        leftPos = Math.max(16, Math.min(leftPos, window.innerWidth - bubbleWidth - 16));
        this.bubble.style.left = `${leftPos}px`;
        this.bubble.style.right = 'auto';
        this.bubble.style.transform = 'none';
    }

    _centerBubble() {
        if (!this.bubble) return;
        this.bubble.style.top = '50%';
        this.bubble.style.left = '50%';
        this.bubble.style.right = 'auto';
        this.bubble.style.transform = 'translate(-50%, -50%)';
    }
}

const tutorial = new Tutorial();
