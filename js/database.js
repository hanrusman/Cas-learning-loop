/**
 * LoopLab Database (IndexedDB)
 * Betrouwbare opslag voor songs, instellingen en gamification data
 */
class LoopLabDB {
    constructor() {
        this.dbName = 'looplab-db';
        this.dbVersion = 1;
        this.db = null;
        this._ready = this._open();
    }

    _open() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Songs store
                if (!db.objectStoreNames.contains('songs')) {
                    const songStore = db.createObjectStore('songs', { keyPath: 'id', autoIncrement: true });
                    songStore.createIndex('name', 'name', { unique: false });
                    songStore.createIndex('savedAt', 'savedAt', { unique: false });
                }

                // Settings store (key-value)
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                this._migrateFromLocalStorage();
                resolve(this.db);
            };

            request.onerror = (event) => {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    /** Migrate old localStorage songs to IndexedDB (one-time) */
    async _migrateFromLocalStorage() {
        try {
            const migrated = localStorage.getItem('looplab-db-migrated');
            if (migrated) return;

            const oldSongs = JSON.parse(localStorage.getItem('looplab-songs') || '[]');
            if (oldSongs.length > 0) {
                const tx = this.db.transaction('songs', 'readwrite');
                const store = tx.objectStore('songs');

                for (const song of oldSongs) {
                    store.add(song);
                }

                await new Promise((resolve, reject) => {
                    tx.oncomplete = resolve;
                    tx.onerror = () => reject(tx.error);
                });

                console.log(`Migrated ${oldSongs.length} songs from localStorage to IndexedDB`);
            }

            localStorage.setItem('looplab-db-migrated', 'true');
        } catch (err) {
            console.warn('Migration from localStorage failed:', err);
        }
    }

    async ready() {
        await this._ready;
        return this;
    }

    // ========================
    // SONGS CRUD
    // ========================

    /** Get all saved songs */
    async getAllSongs() {
        await this._ready;
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('songs', 'readonly');
            const store = tx.objectStore('songs');
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /** Save a song (insert or update by name) */
    async saveSong(songData) {
        await this._ready;

        // Check if song with same name exists
        const existing = await this._findSongByName(songData.name);
        if (existing) {
            songData.id = existing.id;
        }

        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('songs', 'readwrite');
            const store = tx.objectStore('songs');
            const request = songData.id ? store.put(songData) : store.add(songData);

            request.onsuccess = () => {
                songData.id = request.result;
                resolve(songData);
            };
            request.onerror = () => reject(request.error);
        });
    }

    /** Find song by name */
    async _findSongByName(name) {
        await this._ready;
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('songs', 'readonly');
            const store = tx.objectStore('songs');
            const index = store.index('name');
            const request = index.get(name);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /** Get song by ID */
    async getSong(id) {
        await this._ready;
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('songs', 'readonly');
            const store = tx.objectStore('songs');
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }

    /** Delete song by ID */
    async deleteSong(id) {
        await this._ready;
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('songs', 'readwrite');
            const store = tx.objectStore('songs');
            const request = store.delete(id);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ========================
    // SETTINGS
    // ========================

    /** Get a setting by key */
    async getSetting(key) {
        await this._ready;
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('settings', 'readonly');
            const store = tx.objectStore('settings');
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result ? request.result.value : null);
            request.onerror = () => reject(request.error);
        });
    }

    /** Set a setting */
    async setSetting(key, value) {
        await this._ready;
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction('settings', 'readwrite');
            const store = tx.objectStore('settings');
            const request = store.put({ key, value });

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
}

// Global instance
const loopLabDB = new LoopLabDB();
