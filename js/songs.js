/**
 * LoopLab Song Manager
 * Save/load songs and manage arrangements
 */
class SongManager {
    constructor() {
        this.arrangement = [0]; // Array of pattern indices
        this.songs = [];
        this.currentSongName = 'Naamloos';
        this._dbReady = this._loadFromDB();
    }

    // Song arrangement
    addSection(patternIndex) {
        this.arrangement.push(patternIndex);
        this.renderArrangement();
    }

    removeSection(index) {
        if (this.arrangement.length > 1) {
            this.arrangement.splice(index, 1);
            this.renderArrangement();
        }
    }

    renderArrangement() {
        const timeline = document.getElementById('arrangement-timeline');
        if (!timeline) return;
        timeline.innerHTML = '';

        const patternColors = ['var(--accent-primary)', 'var(--accent-secondary)', 'var(--accent-warm)', 'var(--accent-pink)'];
        const patternNames = ['A', 'B', 'C', 'D'];

        this.arrangement.forEach((patIdx, i) => {
            const section = document.createElement('div');
            section.className = 'arrangement-section';
            section.style.background = patternColors[patIdx];
            section.textContent = patternNames[patIdx];

            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-section';
            removeBtn.textContent = '×';
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeSection(i);
            });

            section.appendChild(removeBtn);

            section.addEventListener('click', () => {
                beatSequencer.currentPattern = patIdx;
                beatSequencer.updatePatternButtons();
                beatSequencer.render(document.getElementById('beat-grid'));
            });

            timeline.appendChild(section);
        });
    }

    // Save/Load via IndexedDB
    async _loadFromDB() {
        try {
            await loopLabDB.ready();
            this.songs = await loopLabDB.getAllSongs();
        } catch (err) {
            console.warn('DB load failed, falling back to localStorage:', err);
            try {
                this.songs = JSON.parse(localStorage.getItem('looplab-songs') || '[]');
            } catch {
                this.songs = [];
            }
        }
    }

    async saveCurrent() {
        const name = prompt('Naam voor je song:', this.currentSongName) || this.currentSongName;
        this.currentSongName = name;

        const songData = {
            name,
            bpm: audioEngine.bpm,
            swing: audioEngine.swing,
            beatsPerBar: audioEngine.beatsPerBar,
            patterns: JSON.parse(JSON.stringify(beatSequencer.patterns)),
            melody: pianoRoll.toJSON(),
            arrangement: this.arrangement,
            kit: beatSequencer.currentKit,
            savedAt: new Date().toISOString()
        };

        try {
            const saved = await loopLabDB.saveSong(songData);
            // Update local cache
            const existingIdx = this.songs.findIndex(s => s.id === saved.id);
            if (existingIdx >= 0) {
                this.songs[existingIdx] = saved;
            } else {
                this.songs.push(saved);
            }
        } catch (err) {
            console.warn('DB save failed, using localStorage fallback:', err);
            const existingIdx = this.songs.findIndex(s => s.name === name);
            if (existingIdx >= 0) {
                this.songs[existingIdx] = songData;
            } else {
                this.songs.push(songData);
            }
            localStorage.setItem('looplab-songs', JSON.stringify(this.songs));
        }

        this.renderSongsList();
    }

    loadSong(index) {
        const song = this.songs[index];
        if (!song) return;

        this.currentSongName = song.name;
        audioEngine.setBPM(song.bpm || 120);
        audioEngine.swing = song.swing || 0;
        audioEngine.setBeatsPerBar(song.beatsPerBar || 4);

        beatSequencer.patterns = JSON.parse(JSON.stringify(song.patterns));
        beatSequencer.currentPattern = 0;
        beatSequencer.currentKit = song.kit || 'electronic';

        if (song.melody) {
            pianoRoll.fromJSON(song.melody);
        }

        if (song.arrangement) {
            this.arrangement = [...song.arrangement];
        }

        // Update all UI
        document.getElementById('bpm-value').textContent = audioEngine.bpm;
        document.getElementById('swing').value = audioEngine.swing * 100;
        document.getElementById('drum-kit-select').value = beatSequencer.currentKit;
        document.getElementById('melody-instrument').value = pianoRoll.instrument;
        document.getElementById('scale-select').value = pianoRoll.scale;
        document.getElementById('key-select').value = pianoRoll.key;

        beatSequencer.render(document.getElementById('beat-grid'));
        beatSequencer.updatePatternButtons();
        pianoRoll.render(document.getElementById('piano-keys'), document.getElementById('piano-grid'));
        this.renderArrangement();
    }

    async deleteSong(index) {
        const song = this.songs[index];
        if (!song) return;
        if (confirm(`Weet je zeker dat je "${song.name}" wilt verwijderen?`)) {
            try {
                if (song.id) {
                    await loopLabDB.deleteSong(song.id);
                }
            } catch (err) {
                console.warn('DB delete failed:', err);
            }
            this.songs.splice(index, 1);
            this.renderSongsList();
        }
    }

    newSong() {
        if (confirm('Nieuw starten? Niet-opgeslagen wijzigingen gaan verloren!')) {
            audioEngine.setBPM(120);
            audioEngine.swing = 0;
            audioEngine.setBeatsPerBar(4);

            beatSequencer.patterns = Array.from({ length: 4 }, () => beatSequencer._createEmptyPattern());
            beatSequencer.currentPattern = 0;

            pianoRoll.clear();
            this.arrangement = [0];
            this.currentSongName = 'Naamloos';

            document.getElementById('bpm-value').textContent = 120;
            document.getElementById('swing').value = 0;

            beatSequencer.render(document.getElementById('beat-grid'));
            beatSequencer.updatePatternButtons();
            pianoRoll.render(document.getElementById('piano-keys'), document.getElementById('piano-grid'));
            this.renderArrangement();
        }
    }

    renderSongsList() {
        const grid = document.getElementById('songs-grid');
        if (!grid) return;

        if (this.songs.length === 0) {
            grid.innerHTML = '<div class="empty-state">Nog geen opgeslagen songs. Maak iets moois en sla het op!</div>';
            return;
        }

        grid.innerHTML = '';

        this.songs.forEach((song, index) => {
            const card = document.createElement('div');
            card.className = 'song-card';

            const date = new Date(song.savedAt);
            const dateStr = date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

            card.innerHTML = `
                <h4>${song.name}</h4>
                <div class="song-info">
                    ${song.bpm} BPM &bull; ${dateStr}
                </div>
                <div class="song-actions">
                    <button class="load-btn">🎵 Laden</button>
                    <button class="delete-btn">🗑</button>
                </div>
            `;

            card.querySelector('.load-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.loadSong(index);
            });

            card.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteSong(index);
            });

            grid.appendChild(card);
        });
    }

    // Export to WAV
    async exportWAV() {
        try {
        const offlineCtx = new OfflineAudioContext(2, 44100 * 8, 44100); // 8 seconds
        const masterGain = offlineCtx.createGain();
        masterGain.gain.setValueAtTime(0.8, 0);
        masterGain.connect(offlineCtx.destination);

        const stepDuration = audioEngine.getStepDuration();

        // Render arrangement
        let currentTime = 0;
        for (const patIdx of this.arrangement) {
            const pattern = beatSequencer.patterns[patIdx];

            for (let step = 0; step < audioEngine.totalSteps; step++) {
                const time = currentTime + step * stepDuration;

                // Drums (respect mute/solo)
                for (const inst of beatSequencer.instruments) {
                    if (pattern[inst.id][step] && beatSequencer.isInstrumentAudible(inst.id)) {
                        const vol = beatSequencer.rowVolume[inst.id];
                        const drumGain = offlineCtx.createGain();
                        drumGain.gain.setValueAtTime(vol, time);
                        drumGain.connect(masterGain);

                        if (Instruments.drums[inst.id]) {
                            Instruments.drums[inst.id](offlineCtx, drumGain, time);
                        }
                    }
                }

                // Melody
                const activeNotes = pianoRoll.getActiveNotes(step);
                for (const midi of activeNotes) {
                    const freq = Instruments.midiToFreq(midi);
                    Instruments.playNote(offlineCtx, masterGain, pianoRoll.instrument, freq, time, stepDuration * 0.9);
                }
            }

            currentTime += audioEngine.totalSteps * stepDuration;
        }

        const audioBuffer = await offlineCtx.startRendering();

        // Convert to WAV
        const wavBlob = this._bufferToWav(audioBuffer);
        const url = URL.createObjectURL(wavBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${this.currentSongName}.wav`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export mislukt. Probeer het opnieuw.');
        }
    }

    _bufferToWav(buffer) {
        const numChannels = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const format = 1; // PCM
        const bitDepth = 16;

        const bytesPerSample = bitDepth / 8;
        const blockAlign = numChannels * bytesPerSample;
        const dataSize = buffer.length * blockAlign;
        const bufferSize = 44 + dataSize;

        const arrayBuffer = new ArrayBuffer(bufferSize);
        const view = new DataView(arrayBuffer);

        // WAV header
        const writeString = (offset, string) => {
            for (let i = 0; i < string.length; i++) {
                view.setUint8(offset + i, string.charCodeAt(i));
            }
        };

        writeString(0, 'RIFF');
        view.setUint32(4, bufferSize - 8, true);
        writeString(8, 'WAVE');
        writeString(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, format, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, bitDepth, true);
        writeString(36, 'data');
        view.setUint32(40, dataSize, true);

        // Interleave channels
        const channels = [];
        for (let i = 0; i < numChannels; i++) {
            channels.push(buffer.getChannelData(i));
        }

        let offset = 44;
        for (let i = 0; i < buffer.length; i++) {
            for (let ch = 0; ch < numChannels; ch++) {
                const sample = Math.max(-1, Math.min(1, channels[ch][i]));
                view.setInt16(offset, sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuffer], { type: 'audio/wav' });
    }
}

// =====================
// EXAMPLE SONGS (simple riffs as inspiration)
// =====================
SongManager.prototype.exampleSongs = [
    {
        name: 'Vrolijk Deuntje',
        description: 'Een simpel vrolijk melodietje met gitaar',
        icon: '🎸',
        bpm: 110,
        instrument: 'guitar',
        scale: 'major',
        key: 'C',
        // Simple C major melody: C E G E C E G E (octave 4)
        melody: { '60-0': true, '64-2': true, '67-4': true, '64-6': true, '60-8': true, '64-10': true, '67-12': true, '64-14': true },
        beat: {
            kick: [true,false,false,false,true,false,false,false,true,false,false,false,true,false,false,false],
            snare: [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
            hihat: [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
            'hihat-open': new Array(16).fill(false),
            clap: new Array(16).fill(false),
            tom: new Array(16).fill(false),
            ride: new Array(16).fill(false),
            crash: new Array(16).fill(false)
        }
    },
    {
        name: 'Koele Groove',
        description: 'Een relaxte groove zoals Ed Sheeran',
        icon: '🎤',
        bpm: 96,
        instrument: 'guitar',
        scale: 'minor',
        key: 'E',
        // Em - G - D - C vibe: E4 B3 G4 E4 D4 B3 C4 D4
        melody: { '64-0': true, '59-2': true, '67-4': true, '64-6': true, '62-8': true, '59-10': true, '60-12': true, '62-14': true },
        beat: {
            kick: [true,false,false,false,false,false,true,false,true,false,false,false,false,false,false,false],
            snare: [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
            hihat: [true,true,true,true,true,true,true,true,true,true,true,true,true,true,true,true],
            'hihat-open': new Array(16).fill(false),
            clap: new Array(16).fill(false),
            tom: new Array(16).fill(false),
            ride: new Array(16).fill(false),
            crash: new Array(16).fill(false)
        }
    },
    {
        name: 'Dansfeestje',
        description: 'Een lekker dansbaar nummer',
        icon: '💃',
        bpm: 120,
        instrument: 'synth',
        scale: 'pentatonic',
        key: 'C',
        // Pentatonic bounce: C D E G A G E D
        melody: { '60-0': true, '62-2': true, '64-4': true, '67-6': true, '69-8': true, '67-10': true, '64-12': true, '62-14': true },
        beat: {
            kick: [true,false,false,false,true,false,false,false,true,false,false,false,true,false,false,false],
            snare: [false,false,false,false,true,false,false,true,false,false,false,false,true,false,false,false],
            hihat: [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
            'hihat-open': [false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,false],
            clap: [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
            tom: new Array(16).fill(false),
            ride: new Array(16).fill(false),
            crash: [true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
        }
    },
    {
        name: 'Rustig Pianolied',
        description: 'Een zachte melodie op piano',
        icon: '🎹',
        bpm: 80,
        instrument: 'piano',
        scale: 'major',
        key: 'G',
        // G major gentle: G B D B G A B D
        melody: { '67-0': true, '71-2': true, '74-4': true, '71-6': true, '67-8': true, '69-10': true, '71-12': true, '74-14': true },
        beat: {
            kick: [true,false,false,false,false,false,false,false,true,false,false,false,false,false,false,false],
            snare: new Array(16).fill(false),
            hihat: [true,false,false,false,true,false,false,false,true,false,false,false,true,false,false,false],
            'hihat-open': new Array(16).fill(false),
            clap: new Array(16).fill(false),
            tom: new Array(16).fill(false),
            ride: [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
            crash: new Array(16).fill(false)
        }
    },
    {
        name: 'Stoere Rock',
        description: 'Een stevig rockritme',
        icon: '🎸',
        bpm: 130,
        instrument: 'pluck',
        scale: 'minor',
        key: 'A',
        // A minor rock: A C E A G E C A
        melody: { '69-0': true, '72-2': true, '76-4': true, '69-6': true, '67-8': true, '76-10': true, '72-12': true, '69-14': true },
        beat: {
            kick: [true,false,true,false,false,false,true,false,true,false,false,false,false,false,true,false],
            snare: [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
            hihat: [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
            'hihat-open': new Array(16).fill(false),
            clap: new Array(16).fill(false),
            tom: [false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,true],
            ride: new Array(16).fill(false),
            crash: [true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false]
        }
    },
    {
        name: 'Blues Gevoel',
        description: 'Een lekker blues-achtig riffje',
        icon: '🎷',
        bpm: 90,
        instrument: 'guitar',
        scale: 'blues',
        key: 'E',
        // E blues: E G A Bb B E G E
        melody: { '64-0': true, '67-2': true, '69-4': true, '70-6': true, '71-8': true, '64-10': true, '67-12': true, '64-14': true },
        beat: {
            kick: [true,false,false,false,false,false,true,false,true,false,false,false,false,false,false,false],
            snare: [false,false,false,false,true,false,false,false,false,false,false,false,true,false,false,false],
            hihat: [true,false,true,false,true,false,true,false,true,false,true,false,true,false,true,false],
            'hihat-open': [false,false,false,false,false,false,false,true,false,false,false,false,false,false,false,true],
            clap: new Array(16).fill(false),
            tom: new Array(16).fill(false),
            ride: new Array(16).fill(false),
            crash: new Array(16).fill(false)
        }
    }
];

SongManager.prototype.loadExampleSong = function(index) {
    const song = this.exampleSongs[index];
    if (!song) return;

    audioEngine.setBPM(song.bpm);
    audioEngine.swing = 0;
    audioEngine.setBeatsPerBar(4);

    // Load beat pattern
    beatSequencer.patterns[0] = beatSequencer._createEmptyPattern();
    const pattern = beatSequencer.patterns[0];
    for (const [inst, steps] of Object.entries(song.beat)) {
        if (pattern[inst]) {
            for (let i = 0; i < steps.length; i++) {
                pattern[inst][i] = steps[i];
            }
        }
    }
    beatSequencer.currentPattern = 0;

    // Load melody
    pianoRoll.clear();
    pianoRoll.instrument = song.instrument;
    pianoRoll.scale = song.scale;
    pianoRoll.key = song.key;
    for (const [key, val] of Object.entries(song.melody)) {
        pianoRoll.grid[key] = val;
    }

    this.arrangement = [0];
    this.currentSongName = song.name;

    // Update UI
    document.getElementById('bpm-value').textContent = audioEngine.bpm;
    document.getElementById('swing').value = 0;
    document.getElementById('melody-instrument').value = pianoRoll.instrument;
    document.getElementById('scale-select').value = pianoRoll.scale;
    document.getElementById('key-select').value = pianoRoll.key;

    beatSequencer.render(document.getElementById('beat-grid'));
    beatSequencer.updatePatternButtons();
    pianoRoll.render(document.getElementById('piano-keys'), document.getElementById('piano-grid'));
    this.renderArrangement();
};

SongManager.prototype.renderExampleSongs = function() {
    const grid = document.getElementById('example-songs-grid');
    if (!grid) return;
    grid.innerHTML = '';

    this.exampleSongs.forEach((song, index) => {
        const card = document.createElement('div');
        card.className = 'song-card example-song-card';
        card.innerHTML = `
            <div class="example-song-icon">${song.icon}</div>
            <h4>${song.name}</h4>
            <div class="song-info">${song.description}<br>${song.bpm} BPM</div>
        `;
        card.addEventListener('click', () => {
            this.loadExampleSong(index);
            // Switch to sequencer view to see the result
            document.querySelector('.nav-btn[data-view="sequencer"]').click();
        });
        grid.appendChild(card);
    });
};

const songManager = new SongManager();
if (typeof module !== 'undefined' && module.exports) { module.exports = { SongManager, songManager }; }
