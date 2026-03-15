/**
 * Web Audio API and DOM Mocks for Node.js testing
 */

// Mock AudioParam
class MockAudioParam {
    constructor(defaultValue = 0) {
        this.value = defaultValue;
    }
    setValueAtTime(value, time) { this.value = value; return this; }
    linearRampToValueAtTime(value, time) { this.value = value; return this; }
    exponentialRampToValueAtTime(value, time) { this.value = value; return this; }
    setTargetAtTime(value, time, constant) { this.value = value; return this; }
}

// Mock AudioNode
class MockAudioNode {
    connect(dest) { return dest; }
    disconnect() {}
}

// Mock OscillatorNode
class MockOscillator extends MockAudioNode {
    constructor() {
        super();
        this.type = 'sine';
        this.frequency = new MockAudioParam(440);
        this.detune = new MockAudioParam(0);
    }
    start(time) {}
    stop(time) {}
}

// Mock GainNode
class MockGainNode extends MockAudioNode {
    constructor() {
        super();
        this.gain = new MockAudioParam(1);
    }
}

// Mock BiquadFilterNode
class MockBiquadFilter extends MockAudioNode {
    constructor() {
        super();
        this.type = 'lowpass';
        this.frequency = new MockAudioParam(350);
        this.Q = new MockAudioParam(1);
    }
}

// Mock DynamicsCompressor
class MockCompressor extends MockAudioNode {
    constructor() {
        super();
        this.threshold = new MockAudioParam(-24);
        this.knee = new MockAudioParam(30);
        this.ratio = new MockAudioParam(12);
        this.attack = new MockAudioParam(0.003);
        this.release = new MockAudioParam(0.25);
    }
}

// Mock AudioBuffer
class MockAudioBuffer {
    constructor(numChannels, length, sampleRate) {
        this.numberOfChannels = numChannels;
        this.length = length;
        this.sampleRate = sampleRate;
        this._channels = [];
        for (let i = 0; i < numChannels; i++) {
            this._channels.push(new Float32Array(length));
        }
    }
    getChannelData(channel) { return this._channels[channel]; }
}

// Mock BufferSource
class MockBufferSource extends MockAudioNode {
    constructor() {
        super();
        this.buffer = null;
    }
    start(time) {}
    stop(time) {}
}

// Mock AudioContext
class MockAudioContext {
    constructor() {
        this.currentTime = 0;
        this.sampleRate = 44100;
        this.state = 'running';
        this.destination = new MockAudioNode();
    }

    createOscillator() { return new MockOscillator(); }
    createGain() { return new MockGainNode(); }
    createBiquadFilter() { return new MockBiquadFilter(); }
    createDynamicsCompressor() { return new MockCompressor(); }
    createBuffer(channels, length, sampleRate) {
        return new MockAudioBuffer(channels, length, sampleRate);
    }
    createBufferSource() { return new MockBufferSource(); }
    resume() { this.state = 'running'; return Promise.resolve(); }
    suspend() { this.state = 'suspended'; return Promise.resolve(); }
}

// Mock OfflineAudioContext
class MockOfflineAudioContext extends MockAudioContext {
    constructor(channels, length, sampleRate) {
        super();
        this._channels = channels;
        this._length = length;
        this.sampleRate = sampleRate;
    }
    async startRendering() {
        return new MockAudioBuffer(this._channels, this._length, this.sampleRate);
    }
}

// Mock DOM
class MockElement {
    constructor(tag) {
        this.tagName = tag.toUpperCase();
        this.className = '';
        this.textContent = '';
        this.__innerHTML = '';
        this.style = {};
        this.dataset = {};
        this.children = [];
        this.parentNode = null;

        // innerHTML setter clears children
        Object.defineProperty(this, 'innerHTML', {
            get() { return this.__innerHTML; },
            set(val) { this.__innerHTML = val; this.children = []; },
            configurable: true
        });
        this.classList = {
            _classes: new Set(),
            add(c) { this._classes.add(c); },
            remove(c) { this._classes.delete(c); },
            toggle(c, force) {
                if (force === undefined) {
                    if (this._classes.has(c)) this._classes.delete(c);
                    else this._classes.add(c);
                } else if (force) {
                    this._classes.add(c);
                } else {
                    this._classes.delete(c);
                }
            },
            contains(c) { return this._classes.has(c); }
        };
        this._listeners = {};
    }

    addEventListener(event, handler) {
        if (!this._listeners[event]) this._listeners[event] = [];
        this._listeners[event].push(handler);
    }

    removeEventListener(event, handler) {
        if (this._listeners[event]) {
            this._listeners[event] = this._listeners[event].filter(h => h !== handler);
        }
    }

    appendChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return child;
    }

    removeChild(child) {
        const idx = this.children.indexOf(child);
        if (idx > -1) {
            this.children.splice(idx, 1);
            child.parentNode = null;
        }
        return child;
    }

    querySelector(selector) {
        // Search children by className match
        for (const child of this.children) {
            if (child.className && selector.includes(child.className.split(' ')[0])) return child;
            const found = child.querySelector ? child.querySelector(selector) : null;
            if (found) return found;
        }
        return new MockElement('div'); // Return mock element instead of null
    }
    querySelectorAll(selector) { return []; }
    click() {
        if (this._listeners['click']) {
            this._listeners['click'].forEach(h => h({}));
        }
    }
}

// Setup global mocks
function setupGlobalMocks() {
    global.window = {
        AudioContext: MockAudioContext,
        webkitAudioContext: MockAudioContext
    };
    global.AudioContext = MockAudioContext;
    global.OfflineAudioContext = MockOfflineAudioContext;

    const elements = {};

    global.document = {
        createElement(tag) { return new MockElement(tag); },
        getElementById(id) {
            if (!elements[id]) elements[id] = new MockElement('div');
            return elements[id];
        },
        querySelector(sel) { return new MockElement('div'); },
        querySelectorAll(sel) { return []; },
        addEventListener(event, handler) {},
        body: new MockElement('body')
    };

    global.performance = { now() { return Date.now(); } };
    global.requestAnimationFrame = (fn) => setTimeout(fn, 16);
    global.cancelAnimationFrame = (id) => clearTimeout(id);
    global.localStorage = {
        _data: {},
        getItem(key) { return this._data[key] || null; },
        setItem(key, value) { this._data[key] = value; },
        removeItem(key) { delete this._data[key]; },
        clear() { this._data = {}; }
    };
    global.alert = () => {};
    global.confirm = () => true;
    global.prompt = (msg, def) => def;
    global.URL = {
        createObjectURL() { return 'blob:mock'; },
        revokeObjectURL() {}
    };
    global.Blob = class Blob {
        constructor(parts, opts) {
            this.parts = parts;
            this.type = opts?.type || '';
        }
    };
    global.ArrayBuffer = ArrayBuffer;
    global.DataView = DataView;
    global.Float32Array = Float32Array;
    global.console = console;
}

module.exports = {
    MockAudioContext,
    MockOfflineAudioContext,
    MockElement,
    MockAudioBuffer,
    setupGlobalMocks
};
