/**
 * LoopLab Song Manager
 * Save/load songs and manage arrangements
 */
class SongManager {
    constructor() {
        this.arrangement = [0]; // Array of pattern indices
        this.songs = this._loadSongs();
        this.currentSongName = 'Naamloos';
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

    // Save/Load
    _loadSongs() {
        try {
            return JSON.parse(localStorage.getItem('looplab-songs') || '[]');
        } catch {
            return [];
        }
    }

    _saveSongs() {
        localStorage.setItem('looplab-songs', JSON.stringify(this.songs));
    }

    saveCurrent() {
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

        // Check if song with same name exists
        const existingIdx = this.songs.findIndex(s => s.name === name);
        if (existingIdx >= 0) {
            this.songs[existingIdx] = songData;
        } else {
            this.songs.push(songData);
        }

        this._saveSongs();
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

    deleteSong(index) {
        if (confirm(`Weet je zeker dat je "${this.songs[index].name}" wilt verwijderen?`)) {
            this.songs.splice(index, 1);
            this._saveSongs();
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

const songManager = new SongManager();
if (typeof module !== 'undefined' && module.exports) { module.exports = { SongManager, songManager }; }
