/**
 * LoopLab Gamification System
 * Based on Jane McGonigal's SuperBetter framework:
 * Secret Identity, Power-Ups, Bad Guys, Quests, Allies, Epic Wins, Scorekeeping
 * + Reality Is Broken: Fiero, Flow, Urgent Optimism
 */

class Gamification {
    constructor() {
        // =====================
        // PLAYER PROFILE
        // =====================
        this.profile = this._loadProfile() || this._defaultProfile();
        this._questCheckInterval = null;
    }

    _defaultProfile() {
        return {
            // Secret Identity
            name: '',
            avatar: '',
            title: 'Beginnende Beatmaker',
            createdAt: null,

            // XP & Leveling
            xp: 0,
            level: 1,
            totalXP: 0,

            // Streaks (Urgent Optimism)
            currentStreak: 0,
            longestStreak: 0,
            lastPlayDate: null,

            // Stats
            totalBeatsCreated: 0,
            totalNotesPlayed: 0,
            totalPracticeRounds: 0,
            totalSongsSaved: 0,
            totalExports: 0,
            practiceHighScore: 0,
            perfectHits: 0,
            totalPlayTimeMs: 0,
            sessionsPlayed: 0,

            // Achievements (Epic Wins)
            achievements: {},

            // Quests
            dailyQuests: [],
            dailyQuestDate: null,
            completedQuestCount: 0,

            // Power-Ups (unlockables)
            unlockedPowerUps: ['electronic'], // Start with basic kit
            activePowerUps: [],

            // Bad Guys defeated
            badGuysDefeated: {},

            // Allies
            allies: [],
            allyMood: {}
        };
    }

    // =====================
    // PERSISTENCE
    // =====================
    _loadProfile() {
        try {
            const data = localStorage.getItem('looplab-profile');
            return data ? JSON.parse(data) : null;
        } catch {
            return null;
        }
    }

    save() {
        localStorage.setItem('looplab-profile', JSON.stringify(this.profile));
    }

    // =====================
    // SECRET IDENTITY
    // =====================
    identities = [
        { avatar: '🎸', title: 'Gitaarheld', description: 'Jij rockt de wereld!' },
        { avatar: '🎹', title: 'Piano Wizard', description: 'Meester van de melodie' },
        { avatar: '🥁', title: 'Drumkoning', description: 'De beat zit in je bloed' },
        { avatar: '🎤', title: 'Stage Legende', description: 'Het podium is van jou' },
        { avatar: '🎧', title: 'DJ Master', description: 'Mix het maar door!' },
        { avatar: '🎵', title: 'Muziek Tovenaar', description: 'Je maakt magie met geluid' },
        { avatar: '🎻', title: 'Groove Kapitein', description: 'Jij stuurt het ritme' },
        { avatar: '🎺', title: 'Beat Architect', description: 'Bouwer van epische beats' }
    ];

    setupIdentity(name, avatarIndex) {
        const identity = this.identities[avatarIndex] || this.identities[0];
        this.profile.name = name;
        this.profile.avatar = identity.avatar;
        this.profile.title = identity.title;
        this.profile.createdAt = new Date().toISOString();
        this.save();
        this._showFiero('identity', `${identity.avatar} ${name} de ${identity.title}!`);
    }

    hasIdentity() {
        return !!this.profile.name && !!this.profile.createdAt;
    }

    // =====================
    // XP & LEVELS (Scorekeeping)
    // =====================
    levels = [
        { level: 1, xpNeeded: 0, title: 'Beginnende Beatmaker' },
        { level: 2, xpNeeded: 100, title: 'Ritme Leerling' },
        { level: 3, xpNeeded: 250, title: 'Groove Ontdekker' },
        { level: 4, xpNeeded: 500, title: 'Beat Bouwer' },
        { level: 5, xpNeeded: 800, title: 'Melodie Maker' },
        { level: 6, xpNeeded: 1200, title: 'Muziek Smid' },
        { level: 7, xpNeeded: 1800, title: 'Ritme Ridder' },
        { level: 8, xpNeeded: 2500, title: 'Sound Designer' },
        { level: 9, xpNeeded: 3500, title: 'Beat Master' },
        { level: 10, xpNeeded: 5000, title: 'Loop Legende' },
        { level: 11, xpNeeded: 7000, title: 'Groove Guru' },
        { level: 12, xpNeeded: 10000, title: 'Muziek Held' },
        { level: 13, xpNeeded: 14000, title: 'Geluid Tovenaar' },
        { level: 14, xpNeeded: 19000, title: 'Producer Pro' },
        { level: 15, xpNeeded: 25000, title: 'LoopLab Legende' }
    ];

    addXP(amount, reason) {
        // Streak bonus
        const streakMultiplier = 1 + Math.min(this.profile.currentStreak * 0.1, 1.0);
        const earned = Math.round(amount * streakMultiplier);

        this.profile.xp += earned;
        this.profile.totalXP += earned;

        // Check level up
        const oldLevel = this.profile.level;
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (this.profile.totalXP >= this.levels[i].xpNeeded) {
                this.profile.level = this.levels[i].level;
                this.profile.title = this.levels[i].title;
                break;
            }
        }

        if (this.profile.level > oldLevel) {
            this._onLevelUp(oldLevel, this.profile.level);
        }

        // Show XP toast
        this._showXPToast(earned, reason);
        this.save();
        this._updateHUD();
        return earned;
    }

    getXPForNextLevel() {
        const currentLevelData = this.levels.find(l => l.level === this.profile.level);
        const nextLevelData = this.levels.find(l => l.level === this.profile.level + 1);
        if (!nextLevelData) return { current: this.profile.totalXP, needed: this.profile.totalXP, progress: 1 };

        const currentMin = currentLevelData ? currentLevelData.xpNeeded : 0;
        const nextMin = nextLevelData.xpNeeded;
        const progress = (this.profile.totalXP - currentMin) / (nextMin - currentMin);
        return { current: this.profile.totalXP - currentMin, needed: nextMin - currentMin, progress: Math.min(1, progress) };
    }

    _onLevelUp(oldLevel, newLevel) {
        const levelData = this.levels.find(l => l.level === newLevel);

        // Unlock power-ups at certain levels
        const levelUnlocks = {
            2: 'hiphop',
            4: 'rock',
            6: 'latin',
            3: 'reverb',
            5: 'delay',
            7: 'distortion',
            8: 'chorus',
            10: 'bitcrusher'
        };

        if (levelUnlocks[newLevel] && !this.profile.unlockedPowerUps.includes(levelUnlocks[newLevel])) {
            this.profile.unlockedPowerUps.push(levelUnlocks[newLevel]);
            this._showFiero('powerup', `Power-Up ontgrendeld: ${levelUnlocks[newLevel]}!`);
        }

        this._showFiero('levelup', `Level ${newLevel}: ${levelData.title}!`);
        this._checkAllyReaction('levelup');
    }

    // =====================
    // STREAKS (Urgent Optimism)
    // =====================
    updateStreak() {
        const today = new Date().toISOString().split('T')[0];
        const lastPlay = this.profile.lastPlayDate;

        if (lastPlay === today) return; // Already counted today

        if (lastPlay) {
            const lastDate = new Date(lastPlay);
            const todayDate = new Date(today);
            const diffDays = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                this.profile.currentStreak++;
            } else if (diffDays > 1) {
                this.profile.currentStreak = 1; // Reset
            }
        } else {
            this.profile.currentStreak = 1;
        }

        this.profile.longestStreak = Math.max(this.profile.longestStreak, this.profile.currentStreak);
        this.profile.lastPlayDate = today;
        this.profile.sessionsPlayed++;
        this.save();

        // Streak achievements
        if (this.profile.currentStreak >= 3) this.unlockAchievement('streak_3');
        if (this.profile.currentStreak >= 7) this.unlockAchievement('streak_7');
        if (this.profile.currentStreak >= 30) this.unlockAchievement('streak_30');
    }

    // =====================
    // ACHIEVEMENTS (Epic Wins)
    // =====================
    allAchievements = {
        // First steps
        first_beat: { name: 'Eerste Beat', desc: 'Maak je eerste beat', icon: '🥁', xp: 20, category: 'begin' },
        first_melody: { name: 'Eerste Melodie', desc: 'Maak je eerste melodie', icon: '🎹', xp: 20, category: 'begin' },
        first_practice: { name: 'Eerste Oefensessie', desc: 'Rond je eerste oefensessie af', icon: '🎯', xp: 20, category: 'begin' },
        first_save: { name: 'Songwriter', desc: 'Sla je eerste song op', icon: '💾', xp: 25, category: 'begin' },
        first_export: { name: 'Producer', desc: 'Exporteer je eerste WAV', icon: '🎵', xp: 30, category: 'begin' },

        // Practice mastery (Fiero moments)
        perfect_round: { name: 'Perfectionist', desc: 'Behaal 100% in een oefensessie', icon: '💎', xp: 100, category: 'fiero' },
        five_stars: { name: 'Vijf Sterren', desc: 'Krijg 5 sterren', icon: '⭐', xp: 50, category: 'fiero' },
        combo_10: { name: 'Combo Koning', desc: 'Haal een combo van 10', icon: '🔥', xp: 30, category: 'fiero' },
        combo_25: { name: 'Combo Legende', desc: 'Haal een combo van 25', icon: '💥', xp: 75, category: 'fiero' },
        score_1000: { name: 'Puntenkanon', desc: 'Scoor 1000+ in één sessie', icon: '🏆', xp: 40, category: 'fiero' },
        score_5000: { name: 'Highscore Held', desc: 'Scoor 5000+ in één sessie', icon: '👑', xp: 100, category: 'fiero' },

        // Creation
        pattern_all: { name: 'Patroonschilder', desc: 'Vul alle 4 patronen', icon: '🎨', xp: 40, category: 'create' },
        random_lover: { name: 'Geluksvogel', desc: 'Gebruik 10x random', icon: '🎲', xp: 20, category: 'create' },
        full_grid: { name: 'Maximalist', desc: 'Vul een hele rij in de sequencer', icon: '📊', xp: 25, category: 'create' },
        melody_master: { name: 'Melodie Meester', desc: 'Maak een melodie met 20+ noten', icon: '🎼', xp: 35, category: 'create' },
        all_instruments: { name: 'Multi-instrumentalist', desc: 'Gebruik alle 5 melodie-instrumenten', icon: '🎸', xp: 50, category: 'create' },
        all_scales: { name: 'Muziektheoreticus', desc: 'Probeer alle toonladders', icon: '📚', xp: 40, category: 'create' },
        song_collection: { name: 'Platenlabel', desc: 'Sla 5 songs op', icon: '💿', xp: 60, category: 'create' },
        arrangement_pro: { name: 'Arrangeur', desc: 'Maak een song met 4+ secties', icon: '📐', xp: 45, category: 'create' },

        // Streaks (Urgent Optimism)
        streak_3: { name: 'Doorzetter', desc: '3 dagen op rij gespeeld', icon: '📅', xp: 30, category: 'streak' },
        streak_7: { name: 'Weekkampioen', desc: '7 dagen op rij gespeeld', icon: '🗓️', xp: 75, category: 'streak' },
        streak_30: { name: 'Maandmeester', desc: '30 dagen op rij gespeeld', icon: '📆', xp: 200, category: 'streak' },

        // Bad Guys
        slay_offbeat: { name: 'Offbeat Overwinnaar', desc: 'Versla de Offbeat Demon', icon: '👹', xp: 50, category: 'badguy' },
        slay_tempo: { name: 'Tempo Temmer', desc: 'Versla het Tempo Monster', icon: '👾', xp: 50, category: 'badguy' },
        slay_silence: { name: 'Stilte Breker', desc: 'Versla de Stilte Geest', icon: '👻', xp: 50, category: 'badguy' },
        badguy_slayer: { name: 'Monster Jager', desc: 'Versla alle Bad Guys', icon: '⚔️', xp: 150, category: 'badguy' },

        // Allies
        full_band: { name: 'Bandleider', desc: 'Verzamel alle bandleden', icon: '🎪', xp: 100, category: 'ally' },
        ally_max_mood: { name: 'Beste Vrienden', desc: 'Maak een bandlid helemaal blij', icon: '💖', xp: 40, category: 'ally' },

        // Epic
        level_5: { name: 'Halve Weg', desc: 'Bereik level 5', icon: '🌟', xp: 50, category: 'epic' },
        level_10: { name: 'Dubbele Cijfers', desc: 'Bereik level 10', icon: '✨', xp: 100, category: 'epic' },
        level_15: { name: 'LoopLab Legende', desc: 'Bereik level 15', icon: '🏅', xp: 250, category: 'epic' },
        xp_10000: { name: 'XP Jager', desc: 'Verdien 10.000 totale XP', icon: '💫', xp: 100, category: 'epic' },
    };

    unlockAchievement(id) {
        if (this.profile.achievements[id]) return false; // Already unlocked

        const achievement = this.allAchievements[id];
        if (!achievement) return false;

        this.profile.achievements[id] = {
            unlockedAt: new Date().toISOString()
        };

        // Award XP (without re-checking achievements to avoid loops)
        this.profile.xp += achievement.xp;
        this.profile.totalXP += achievement.xp;
        this.save();

        // Fiero moment!
        this._showFiero('achievement', `${achievement.icon} ${achievement.name}`, achievement.desc);
        this._checkAllyReaction('achievement');

        return true;
    }

    hasAchievement(id) {
        return !!this.profile.achievements[id];
    }

    getAchievementProgress() {
        const total = Object.keys(this.allAchievements).length;
        const unlocked = Object.keys(this.profile.achievements).length;
        return { total, unlocked, percent: Math.round((unlocked / total) * 100) };
    }

    // =====================
    // QUESTS (Daily Missions)
    // =====================
    questTemplates = [
        { id: 'make_beat', desc: 'Maak een beat met minstens 3 instrumenten', xp: 25, check: (p) => p._questData?.instrumentsUsed >= 3 },
        { id: 'practice_round', desc: 'Rond een oefensessie af', xp: 20, check: (p) => p._questData?.practiceCompleted },
        { id: 'score_500', desc: 'Scoor 500+ punten bij oefenen', xp: 30, check: (p) => p._questData?.practiceScore >= 500 },
        { id: 'try_instrument', desc: 'Probeer een nieuw melodie-instrument', xp: 15, check: (p) => p._questData?.newInstrumentTried },
        { id: 'save_song', desc: 'Sla een song op', xp: 20, check: (p) => p._questData?.songSaved },
        { id: 'fill_pattern', desc: 'Vul 2 verschillende patronen', xp: 25, check: (p) => p._questData?.patternsUsed >= 2 },
        { id: 'use_melody', desc: 'Voeg een melodie toe aan je beat', xp: 20, check: (p) => p._questData?.melodyAdded },
        { id: 'change_bpm', desc: 'Experimenteer met tempo (verander BPM 3x)', xp: 10, check: (p) => p._questData?.bpmChanges >= 3 },
        { id: 'try_scale', desc: 'Probeer een andere toonladder', xp: 15, check: (p) => p._questData?.scaleTried },
        { id: 'combo_5', desc: 'Haal een combo van 5 bij oefenen', xp: 20, check: (p) => p._questData?.maxCombo >= 5 },
        { id: 'arrange_song', desc: 'Maak een arrangement met 3+ secties', xp: 25, check: (p) => p._questData?.arrangementSections >= 3 },
        { id: 'play_3min', desc: 'Speel minstens 3 minuten af', xp: 15, check: (p) => p._questData?.playTimeMs >= 180000 },
    ];

    _questData = {};

    generateDailyQuests() {
        const today = new Date().toISOString().split('T')[0];
        if (this.profile.dailyQuestDate === today && this.profile.dailyQuests.length > 0) {
            return; // Already generated today
        }

        // Pick 3 random quests
        const shuffled = [...this.questTemplates].sort(() => Math.random() - 0.5);
        this.profile.dailyQuests = shuffled.slice(0, 3).map(q => ({
            ...q,
            completed: false
        }));
        this.profile.dailyQuestDate = today;
        this._questData = {};
        this.save();
    }

    trackQuestProgress(key, value) {
        this._questData[key] = value;
        this._checkQuests();
    }

    incrementQuestData(key, amount = 1) {
        this._questData[key] = (this._questData[key] || 0) + amount;
        this._checkQuests();
    }

    _checkQuests() {
        let anyCompleted = false;
        for (const quest of this.profile.dailyQuests) {
            if (quest.completed) continue;
            const template = this.questTemplates.find(t => t.id === quest.id);
            if (template && template.check(this)) {
                quest.completed = true;
                anyCompleted = true;
                this.profile.completedQuestCount++;
                this.addXP(quest.xp, `Quest: ${quest.desc}`);
                this._showFiero('quest', `Quest voltooid!`, quest.desc);
            }
        }

        if (anyCompleted) {
            this.save();
            this._updateQuestUI();
        }
    }

    // =====================
    // POWER-UPS (Unlockables)
    // =====================
    allPowerUps = {
        // Drum kits
        electronic: { name: 'Electronic Kit', desc: 'Standaard elektronische kit', type: 'kit', icon: '🔌', level: 1 },
        hiphop: { name: 'Hip Hop Kit', desc: 'Dikke hip hop beats', type: 'kit', icon: '🎤', level: 2 },
        rock: { name: 'Rock Kit', desc: 'Rock and roll drums', type: 'kit', icon: '🎸', level: 4 },
        latin: { name: 'Latin Kit', desc: 'Hete latin ritmes', type: 'kit', icon: '💃', level: 6 },
        // Effects
        reverb: { name: 'Reverb', desc: 'Ruimtelijk echo effect', type: 'effect', icon: '🏛️', level: 3 },
        delay: { name: 'Delay', desc: 'Herhalend echo effect', type: 'effect', icon: '🔄', level: 5 },
        distortion: { name: 'Distortion', desc: 'Ruig vervormd geluid', type: 'effect', icon: '⚡', level: 7 },
        chorus: { name: 'Chorus', desc: 'Breed en vol geluid', type: 'effect', icon: '🌊', level: 8 },
        bitcrusher: { name: 'Bitcrusher', desc: 'Retro 8-bit geluid', type: 'effect', icon: '👾', level: 10 },
    };

    isPowerUpUnlocked(id) {
        return this.profile.unlockedPowerUps.includes(id);
    }

    getLockedPowerUps() {
        return Object.entries(this.allPowerUps)
            .filter(([id]) => !this.isPowerUpUnlocked(id))
            .map(([id, data]) => ({ id, ...data }));
    }

    getUnlockedPowerUps() {
        return Object.entries(this.allPowerUps)
            .filter(([id]) => this.isPowerUpUnlocked(id))
            .map(([id, data]) => ({ id, ...data }));
    }

    // =====================
    // BAD GUYS (Obstacles to defeat)
    // =====================
    badGuys = [
        {
            id: 'offbeat_demon',
            name: 'De Offbeat Demon',
            icon: '👹',
            desc: 'Dit monster gooit je uit het ritme! Versla hem door 3 oefensessies te halen met 80%+ nauwkeurigheid.',
            achievement: 'slay_offbeat',
            requirement: { type: 'practice_accuracy', count: 3, threshold: 80 }
        },
        {
            id: 'tempo_monster',
            name: 'Het Tempo Monster',
            icon: '👾',
            desc: 'Hij maakt alles te snel! Versla hem door op "Moeilijk" te oefenen en 70%+ te halen.',
            achievement: 'slay_tempo',
            requirement: { type: 'practice_hard', count: 1, threshold: 70 }
        },
        {
            id: 'stilte_geest',
            name: 'De Stilte Geest',
            icon: '👻',
            desc: 'Hij wil dat je stopt met muziek maken! Versla hem door 7 dagen op rij te spelen.',
            achievement: 'slay_silence',
            requirement: { type: 'streak', count: 7 }
        }
    ];

    trackBadGuyProgress(type, value) {
        for (const bg of this.badGuys) {
            if (this.hasAchievement(bg.achievement)) continue; // Already defeated

            const req = bg.requirement;
            if (req.type !== type) continue;

            if (!this.profile.badGuysDefeated[bg.id]) {
                this.profile.badGuysDefeated[bg.id] = { progress: 0 };
            }

            const data = this.profile.badGuysDefeated[bg.id];

            if (type === 'practice_accuracy' && value >= req.threshold) {
                data.progress++;
            } else if (type === 'practice_hard' && value >= req.threshold) {
                data.progress++;
            } else if (type === 'streak') {
                data.progress = value;
            }

            if (data.progress >= req.count) {
                this.unlockAchievement(bg.achievement);
                this._showFiero('badguy', `${bg.icon} ${bg.name} verslagen!`, bg.desc);
            }
        }

        // Check if all bad guys defeated
        if (this.badGuys.every(bg => this.hasAchievement(bg.achievement))) {
            this.unlockAchievement('badguy_slayer');
        }

        this.save();
    }

    getBadGuyStatus(id) {
        const bg = this.badGuys.find(b => b.id === id);
        if (!bg) return null;
        const defeated = this.hasAchievement(bg.achievement);
        const progress = this.profile.badGuysDefeated[id]?.progress || 0;
        return { ...bg, defeated, progress, total: bg.requirement.count };
    }

    // =====================
    // ALLIES (Virtual Band Members)
    // =====================
    allAllies = [
        {
            id: 'drummer',
            name: 'Benny Beats',
            role: 'Drummer',
            icon: '🥁',
            personality: 'Enthousiast en energiek',
            unlockLevel: 1,
            encouragements: [
                'Lekker bezig! Die beat klinkt vet!',
                'Wow, je ritmegevoel wordt steeds beter!',
                'Ga zo door, je bent een natuurtalent!',
                'Die groove is echt sick!'
            ],
            tips: [
                'Probeer eens een hi-hat op elke 8e noot!',
                'Een snare op tel 2 en 4 klinkt altijd goed.',
                'Voeg eens een open hi-hat toe voor variatie.',
                'Probeer swing voor een lekker los gevoel!'
            ]
        },
        {
            id: 'keyboardist',
            name: 'Melody Max',
            role: 'Keyboard',
            icon: '🎹',
            personality: 'Creatief en dromerig',
            unlockLevel: 3,
            encouragements: [
                'Die melodie is prachtig!',
                'Je hebt echt een goed oor voor muziek!',
                'Wauw, dat klinkt als een echte hit!',
                'Je wordt een ware componist!'
            ],
            tips: [
                'De pentatonische toonladder klinkt altijd mooi!',
                'Probeer eens kleine sprongen in je melodie.',
                'Herhaling maakt een melodie onthoudbaar.',
                'Probeer de blues toonladder voor een coole vibe!'
            ]
        },
        {
            id: 'bassist',
            name: 'Bobby Bass',
            role: 'Bassist',
            icon: '🎸',
            personality: 'Relaxed en cool',
            unlockLevel: 5,
            encouragements: [
                'Nice groove, man!',
                'Die bas lijn is dik!',
                'Chill, je klinkt steeds beter!',
                'Dat is het, voel het ritme!'
            ],
            tips: [
                'De bas volgt vaak het akkoord van de melodie.',
                'Minder is meer bij baslijnen!',
                'Probeer de root note van de toonladder als basis.',
                'Syncopatie maakt je bas funky!'
            ]
        },
        {
            id: 'vocalist',
            name: 'Luna Lyrics',
            role: 'Zangeres',
            icon: '🎤',
            personality: 'Expressief en inspirerend',
            unlockLevel: 7,
            encouragements: [
                'Je muziek raakt me echt!',
                'Dit wordt een hit, ik voel het!',
                'Wat een prachtige compositie!',
                'Je creativiteit kent geen grenzen!'
            ],
            tips: [
                'Probeer eens een andere toonsoort!',
                'Variatie tussen patronen houdt het spannend.',
                'Een goed arrangement vertelt een verhaal.',
                'Durf anders te zijn!'
            ]
        }
    ];

    getUnlockedAllies() {
        return this.allAllies.filter(a => this.profile.level >= a.unlockLevel);
    }

    getLockedAllies() {
        return this.allAllies.filter(a => this.profile.level < a.unlockLevel);
    }

    getRandomEncouragement() {
        const allies = this.getUnlockedAllies();
        if (allies.length === 0) return null;
        const ally = allies[Math.floor(Math.random() * allies.length)];
        const msg = ally.encouragements[Math.floor(Math.random() * ally.encouragements.length)];
        return { ally, message: msg };
    }

    getRandomTip() {
        const allies = this.getUnlockedAllies();
        if (allies.length === 0) return null;
        const ally = allies[Math.floor(Math.random() * allies.length)];
        const tip = ally.tips[Math.floor(Math.random() * ally.tips.length)];
        return { ally, message: tip };
    }

    _checkAllyReaction(event) {
        // Allies react to achievements and level ups
        const encouragement = this.getRandomEncouragement();
        if (encouragement) {
            setTimeout(() => {
                this._showAllyMessage(encouragement.ally, encouragement.message);
            }, 2000);
        }
    }

    // =====================
    // FIERO MOMENTS (Epic visual celebrations)
    // =====================
    _fieroQueue = [];
    _fieroActive = false;

    _showFiero(type, title, subtitle = '') {
        this._fieroQueue.push({ type, title, subtitle });
        if (!this._fieroActive) this._processFieroQueue();
    }

    _processFieroQueue() {
        if (this._fieroQueue.length === 0) {
            this._fieroActive = false;
            return;
        }
        this._fieroActive = true;
        const item = this._fieroQueue.shift();

        const overlay = document.getElementById('fiero-overlay');
        if (!overlay) {
            setTimeout(() => this._processFieroQueue(), 100);
            return;
        }

        const typeClasses = {
            levelup: 'fiero-levelup',
            achievement: 'fiero-achievement',
            quest: 'fiero-quest',
            badguy: 'fiero-badguy',
            powerup: 'fiero-powerup',
            identity: 'fiero-identity'
        };

        overlay.className = `fiero-overlay active ${typeClasses[item.type] || ''}`;
        overlay.innerHTML = `
            <div class="fiero-content">
                <div class="fiero-particles"></div>
                <div class="fiero-title">${item.title}</div>
                ${item.subtitle ? `<div class="fiero-subtitle">${item.subtitle}</div>` : ''}
            </div>
        `;

        // Play celebration sound
        this._playCelebrationSound(item.type);

        // Create particles
        this._createParticles(overlay.querySelector('.fiero-particles'));

        setTimeout(() => {
            overlay.classList.remove('active');
            setTimeout(() => this._processFieroQueue(), 300);
        }, 2500);
    }

    _playCelebrationSound(type) {
        try {
            audioEngine.init();
            const ctx = audioEngine.ctx;
            const dest = audioEngine.masterGain;

            if (type === 'levelup') {
                // Triumphant ascending notes
                [0, 4, 7, 12].forEach((semitone, i) => {
                    const freq = 440 * Math.pow(2, semitone / 12);
                    Instruments.playNote(ctx, dest, 'pluck', freq, ctx.currentTime + i * 0.15, 0.3, 0.5);
                });
            } else if (type === 'achievement' || type === 'badguy') {
                // Fanfare
                [0, 7, 12, 16].forEach((semitone, i) => {
                    const freq = 523.25 * Math.pow(2, semitone / 12);
                    Instruments.playNote(ctx, dest, 'synth', freq, ctx.currentTime + i * 0.12, 0.25, 0.4);
                });
            } else if (type === 'quest') {
                // Quick reward ding
                Instruments.playNote(ctx, dest, 'pluck', 880, ctx.currentTime, 0.2, 0.4);
                Instruments.playNote(ctx, dest, 'pluck', 1108.73, ctx.currentTime + 0.1, 0.3, 0.4);
            }
        } catch (e) {
            // Audio not ready, that's ok
        }
    }

    _createParticles(container) {
        if (!container) return;
        const emojis = ['⭐', '✨', '🎵', '🎶', '💫', '🌟', '🔥', '💎'];
        for (let i = 0; i < 20; i++) {
            const particle = document.createElement('span');
            particle.className = 'fiero-particle';
            particle.textContent = emojis[Math.floor(Math.random() * emojis.length)];
            particle.style.left = `${Math.random() * 100}%`;
            particle.style.animationDelay = `${Math.random() * 0.5}s`;
            particle.style.animationDuration = `${1 + Math.random() * 1.5}s`;
            container.appendChild(particle);
        }
    }

    _showXPToast(amount, reason) {
        const container = document.getElementById('xp-toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'xp-toast';
        toast.innerHTML = `<span class="xp-amount">+${amount} XP</span> <span class="xp-reason">${reason}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('fade-out');
            setTimeout(() => toast.remove(), 400);
        }, 2000);
    }

    _showAllyMessage(ally, message) {
        const container = document.getElementById('ally-message-container');
        if (!container) return;

        container.innerHTML = `
            <div class="ally-message active">
                <span class="ally-avatar">${ally.icon}</span>
                <div class="ally-bubble">
                    <strong>${ally.name}:</strong> ${message}
                </div>
            </div>
        `;

        setTimeout(() => {
            const msg = container.querySelector('.ally-message');
            if (msg) msg.classList.remove('active');
            setTimeout(() => { container.innerHTML = ''; }, 400);
        }, 4000);
    }

    // =====================
    // HUD UPDATE
    // =====================
    _updateHUD() {
        const levelEl = document.getElementById('hud-level');
        const xpBar = document.getElementById('hud-xp-bar');
        const xpText = document.getElementById('hud-xp-text');
        const streakEl = document.getElementById('hud-streak');
        const avatarEl = document.getElementById('hud-avatar');
        const titleEl = document.getElementById('hud-title');

        if (levelEl) levelEl.textContent = `Lv.${this.profile.level}`;
        if (avatarEl) avatarEl.textContent = this.profile.avatar || '🎵';
        if (titleEl) titleEl.textContent = this.profile.name || 'Speler';

        const xpInfo = this.getXPForNextLevel();
        if (xpBar) xpBar.style.width = `${xpInfo.progress * 100}%`;
        if (xpText) xpText.textContent = `${xpInfo.current} / ${xpInfo.needed} XP`;

        if (streakEl) {
            streakEl.textContent = this.profile.currentStreak > 0 ? `🔥${this.profile.currentStreak}` : '';
        }
    }

    _updateQuestUI() {
        const container = document.getElementById('quest-list');
        if (!container) return;

        container.innerHTML = '';
        for (const quest of this.profile.dailyQuests) {
            const el = document.createElement('div');
            el.className = `quest-item ${quest.completed ? 'completed' : ''}`;
            el.innerHTML = `
                <span class="quest-check">${quest.completed ? '✅' : '⬜'}</span>
                <span class="quest-desc">${quest.desc}</span>
                <span class="quest-xp">+${quest.xp} XP</span>
            `;
            container.appendChild(el);
        }
    }

    // =====================
    // FLOW STATE (Adaptive difficulty)
    // =====================
    getAdaptiveDifficulty() {
        const recent = this.profile.practiceHighScore;
        const rounds = this.profile.totalPracticeRounds;

        if (rounds < 3) return 'easy';
        if (recent >= 3000) return 'hard';
        if (recent >= 1000) return 'medium';
        return 'easy';
    }

    // =====================
    // STAT TRACKING HELPERS
    // =====================
    onBeatCreated() {
        this.profile.totalBeatsCreated++;
        if (this.profile.totalBeatsCreated === 1) this.unlockAchievement('first_beat');
        this.addXP(2, 'Beat gemaakt');
        this.save();
    }

    onNotePlayed() {
        this.profile.totalNotesPlayed++;
        if (this.profile.totalNotesPlayed === 1) this.unlockAchievement('first_melody');
        this.save();
    }

    onPracticeComplete(score, accuracy, maxCombo, difficulty) {
        this.profile.totalPracticeRounds++;
        if (this.profile.totalPracticeRounds === 1) this.unlockAchievement('first_practice');

        if (score > this.profile.practiceHighScore) {
            this.profile.practiceHighScore = score;
        }

        // XP for practice
        const xp = Math.round(score / 10);
        this.addXP(xp, `Oefensessie (${accuracy}%)`);

        // Achievement checks
        if (accuracy === 100) this.unlockAchievement('perfect_round');
        if (accuracy >= 95) this.unlockAchievement('five_stars');
        if (maxCombo >= 10) this.unlockAchievement('combo_10');
        if (maxCombo >= 25) this.unlockAchievement('combo_25');
        if (score >= 1000) this.unlockAchievement('score_1000');
        if (score >= 5000) this.unlockAchievement('score_5000');

        // Bad Guy tracking
        this.trackBadGuyProgress('practice_accuracy', accuracy);
        if (difficulty === 'hard') {
            this.trackBadGuyProgress('practice_hard', accuracy);
        }

        // Quest tracking
        this.trackQuestProgress('practiceCompleted', true);
        this.trackQuestProgress('practiceScore', score);
        this.trackQuestProgress('maxCombo', maxCombo);

        // Level achievements
        if (this.profile.level >= 5) this.unlockAchievement('level_5');
        if (this.profile.level >= 10) this.unlockAchievement('level_10');
        if (this.profile.level >= 15) this.unlockAchievement('level_15');
        if (this.profile.totalXP >= 10000) this.unlockAchievement('xp_10000');

        this.save();
    }

    onSongSaved() {
        this.profile.totalSongsSaved++;
        if (this.profile.totalSongsSaved === 1) this.unlockAchievement('first_save');
        if (this.profile.totalSongsSaved >= 5) this.unlockAchievement('song_collection');
        this.addXP(15, 'Song opgeslagen');
        this.trackQuestProgress('songSaved', true);
        this.save();
    }

    onExport() {
        this.profile.totalExports++;
        if (this.profile.totalExports === 1) this.unlockAchievement('first_export');
        this.addXP(25, 'Song geexporteerd');
        this.save();
    }

    onRandomUsed() {
        this.profile._randomCount = (this.profile._randomCount || 0) + 1;
        if (this.profile._randomCount >= 10) this.unlockAchievement('random_lover');
        this.save();
    }
}

const gamification = new Gamification();
if (typeof module !== 'undefined' && module.exports) { module.exports = { Gamification, gamification }; }
