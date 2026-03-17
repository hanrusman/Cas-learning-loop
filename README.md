# 🎵 LoopLab — Maak je eigen beats!

<div align="center">

![LoopLab Banner](https://img.shields.io/badge/🎵_LoopLab-Maak_je_eigen_beats!-7c4dff?style=for-the-badge&labelColor=0a0a1a)

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/CSS)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Web Audio API](https://img.shields.io/badge/Web_Audio_API-00e5ff?style=flat-square&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![IndexedDB](https://img.shields.io/badge/IndexedDB-ff6d00?style=flat-square&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
[![License](https://img.shields.io/badge/License-MIT-00e676?style=flat-square)](LICENSE)

**Een interactieve muziek-app waarmee kinderen (8+) hun eigen beats, melodieën en songs maken — met gamification, quests en een avontuurlijk leersysteem.**

[Aan de slag](#-aan-de-slag) · [Features](#-features) · [Hoe het werkt](#-hoe-het-werkt) · [Technologie](#-technologie)

</div>

---

## 🎯 Wat is LoopLab?

LoopLab is een **gratis, browser-gebaseerde muziekstudio** speciaal ontworpen voor kinderen. Zonder installatie, zonder accounts — gewoon openen en muziek maken!

```
┌─────────────────────────────────────────────────────────────────┐
│  🎵 LoopLab                   🥁 Beats  🎹 Melodie  🎮 Oefenen │
├─────────────────────────────────────────────────────────────────┤
│  ▶ ⏹ ⏺    ← 120 BPM →    4/4    Swing ━━━━○━━    🔊 ━━━━━○━ │
│  ● ● ● ● │ ● ● ● ● │ ● ● ● ● │ ● ● ● ●                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Kick   │ ■ · · · │ ■ · · · │ ■ · ■ · │ · · · · │             │
│  Snare  │ · · · · │ ■ · · · │ · · · · │ ■ · · · │             │
│  Hi-Hat │ ■ · ■ · │ ■ · ■ · │ ■ · ■ · │ ■ · ■ · │             │
│  Clap   │ · · · · │ · · · · │ · · · · │ · · · · │             │
│  Tom    │ · · · · │ · · · · │ · · · · │ · · · · │             │
│  Ride   │ · · · · │ · · · · │ · · · · │ · · · · │             │
│  Crash  │ ■ · · · │ · · · · │ · · · · │ · · · · │             │
│                                                                 │
│  Patroon: [A] [B] [C] [D]     🗑 Wissen  🎲 Random  📋 Kopieer │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🥁 Beat Sequencer
Maak drumpatronen door op vakjes te klikken in een 16-staps grid.

```
┌──────────────────────────────────────────────────┐
│  8 Instrumenten   │  4 Patronen (A/B/C/D)        │
│  ─────────────    │  ───────────────────          │
│  🟣 Kick          │  Per rij: volume, mute, solo  │
│  🔵 Snare         │  Random beat generator         │
│  🟢 Hi-Hat        │  Kopieer/plak tussen patronen  │
│  🟡 Hi-Hat Open   │                                │
│  🟠 Clap          │  4 Drum Kits:                  │
│  🔴 Tom           │  • Electronic  • Hip Hop       │
│  ⚪ Ride          │  • Rock        • Latin         │
│  🟤 Crash         │                                │
└──────────────────────────────────────────────────┘
```

### 🎹 Piano Roll — Melodie Editor
Teken melodieën op een visueel pianoklavier met toonladder-ondersteuning.

```
┌────────────────────────────────────────────┐
│  6 Instrumenten    │  5 Toonladders        │
│  ──────────────    │  ──────────────       │
│  🎹 Piano          │  Chromatisch          │
│  🎸 Gitaar         │  Majeur               │
│  🎻 Strijkers      │  Mineur               │
│  🔊 Synth          │  Pentatonisch         │
│  🎵 Bas            │  Blues                 │
│  ✨ Tokkel          │                       │
│                    │  12 Toonsoorten       │
│                    │  (C t/m B)            │
└────────────────────────────────────────────┘
         │
    ┌────┴─────────────────────────────────┐
    │ B5  │ · │ · │ · │ · │ · │ · │ · │   │
    │ A5  │ · │ ■ │ · │ · │ · │ ■ │ · │   │
    │ G5  │ · │ · │ · │ ■ │ · │ · │ · │   │
    │ F5  │ · │ · │ ■ │ · │ · │ · │ ■ │   │
    │ E5  │ ■ │ · │ · │ · │ ■ │ · │ · │   │
    └──────────────────────────────────────┘
```

### 🎮 Oefenmodus — Guitar Hero-stijl
Oefen je ritmegevoel met vallende noten!

```
     ┌─────────────────────────────┐
     │     ★ Score: 1250           │
     │     ⚡ Combo: 8x            │
     │     📊 Accuracy: 94%        │
     ├─────────────────────────────┤
     │         🟣                  │
     │              🔵             │
     │    🟣              🟢      │
     │         🔵                  │
     │              🟢    🟡      │
     │    ─────────────────────    │  ← Hit Zone
     │   [1]  [2]  [3]  [4]       │
     └─────────────────────────────┘

     3 Moeilijkheden: Makkelijk → Normaal → Moeilijk
     ⭐⭐⭐⭐⭐ Sterrensysteem (tot 5 sterren)
```

### 💾 Song Manager
Sla je creaties op in een **echte database** (IndexedDB).

```
┌─────────────────────────────────────────────────┐
│  ✨ Nieuw    💾 Opslaan    🎵 Export WAV         │
├─────────────────────────────────────────────────┤
│                                                  │
│  Song Arrangement:  [A]──[B]──[A]──[C]           │
│                                                  │
│  🎶 Voorbeeldliedjes:                            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ 🎸      │ │ 🎤      │ │ 💃      │            │
│  │ Vrolijk  │ │ Koele   │ │ Dans-   │            │
│  │ Deuntje │ │ Groove  │ │ feestje │            │
│  │ 110 BPM │ │ 96 BPM  │ │ 120 BPM │            │
│  └─────────┘ └─────────┘ └─────────┘            │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│  │ 🎹      │ │ 🎸      │ │ 🎷      │            │
│  │ Rustig   │ │ Stoere  │ │ Blues   │            │
│  │ Piano   │ │ Rock    │ │ Gevoel  │            │
│  │ 80 BPM  │ │ 130 BPM │ │ 90 BPM  │            │
│  └─────────┘ └─────────┘ └─────────┘            │
│                                                  │
│  📂 Jouw opgeslagen songs:                       │
│  ┌──────────────────┐  ┌──────────────────┐      │
│  │ Mijn eerste beat  │  │ Cool nummer      │      │
│  │ 120 BPM • 14 mrt │  │ 96 BPM • 15 mrt  │      │
│  │ 🎵 Laden  🗑     │  │ 🎵 Laden  🗑     │      │
│  └──────────────────┘  └──────────────────┘      │
└─────────────────────────────────────────────────┘
```

### ⚔️ Gamification — Avontuurmodus
Gebaseerd op Jane McGonigal's **SuperBetter** framework.

```
┌─────────────────────────────────────────────────────────┐
│  🎸 DJ Master  │  Lv.5  │  ████████░░ 450/600 XP  🔥3  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  📜 DAGELIJKSE QUESTS                                    │
│  ┌──────────────────────────────────────────────┐        │
│  │ ☐ Maak een beat met 3+ instrumenten  (+25 XP)│        │
│  │ ☑ Rond een oefensessie af             (+20 XP)│        │
│  │ ☐ Sla een song op                     (+20 XP)│        │
│  └──────────────────────────────────────────────┘        │
│                                                          │
│  👹 BAD GUYS                                             │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐           │
│  │ 👹 Offbeat │ │ 🌀 Tempo   │ │ 👻 Stilte  │           │
│  │ Demon     │ │ Monster   │ │ Geest     │           │
│  │ ████░░░   │ │ ██░░░░░   │ │ ██████░   │           │
│  └────────────┘ └────────────┘ └────────────┘           │
│                                                          │
│  🎪 JOUW BAND                                            │
│  🥁 Benny Beats    │ 🎹 Melody Max (Lv.3)               │
│  🎸 Bobby Bass (Lv.5) │ 🎤 Luna Lyrics (Lv.7)          │
│                                                          │
│  🏆 ACHIEVEMENTS  (12/29 behaald)                        │
│  ⭐ Eerste Beat  ⭐ Eerste Melodie  🔒 Combo Koning     │
│  ⭐ Ritme Held   🔒 Song Collectie  🔒 Level 10         │
│                                                          │
│  ⚡ POWER-UPS                                            │
│  🥁 Electronic ✓  │ 🎤 Hip Hop ✓  │ 🎸 Rock (Lv.4)     │
│  🪘 Latin (Lv.6)  │ 🌊 Reverb ✓  │ ⏳ Delay (Lv.5)     │
└─────────────────────────────────────────────────────────┘
```

### 🌗 Dark & Light Mode
Wissel tussen donker en licht thema met één klik.

```
  Donker (standaard)              Licht
  ┌──────────────────┐    ┌──────────────────┐
  │ ██████████████   │    │ ░░░░░░░░░░░░░░   │
  │ ██ 🌙 LoopLab █ │    │ ░░ ☀️ LoopLab ░ │
  │ ██████████████   │    │ ░░░░░░░░░░░░░░   │
  │ ████ ■ · ■ ████ │    │ ░░░░ ■ · ■ ░░░░ │
  │ ████ · ■ · ████ │    │ ░░░░ · ■ · ░░░░ │
  │ ██████████████   │    │ ░░░░░░░░░░░░░░   │
  └──────────────────┘    └──────────────────┘
```

### ❓ Tutorial Systeem
15-stappen begeleide tour met **Benny Beats** als gids.

```
  ┌─────────────────────────────────────────┐
  │                                          │
  │    🥁 Benny Beats zegt:                  │
  │   ┌──────────────────────────────────┐   │
  │   │ "Welkom bij LoopLab! Klik op     │   │
  │   │  een vakje bij 'Kick' om je      │   │
  │   │  eerste beat te maken!"          │   │
  │   └──────────────────────────────────┘   │
  │                              [Volgende →]│
  │    Stap 5/15  ●●●●●○○○○○○○○○○          │
  └─────────────────────────────────────────┘
```

---

## 🚀 Aan de slag

### Vereisten
- Een moderne webbrowser (Chrome, Firefox, Safari, Edge)
- Dat is alles! Geen installatie nodig.

### Starten

```bash
# Clone de repository
git clone https://github.com/hanrusman/Cas-learning-loop.git

# Open index.html in je browser
cd Cas-learning-loop
open index.html        # macOS
xdg-open index.html    # Linux
start index.html       # Windows
```

Of gebruik een lokale server:
```bash
# Met Python
python3 -m http.server 8080

# Met Node.js
npx serve .
```

Open dan `http://localhost:8080` in je browser.

---

## 🏗 Hoe het werkt

### Architectuur

```
                    ┌──────────────┐
                    │  index.html  │
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────┴─────┐ ┌───┴───┐ ┌──────┴──────┐
        │  CSS (6)   │ │  HTML │ │   JS (10)   │
        └───────────┘ └───────┘ └──────┬──────┘
                                       │
          ┌────────────────────────────┼──────────────────┐
          │                            │                   │
    ┌─────┴──────┐            ┌───────┴────────┐   ┌─────┴──────┐
    │   Audio    │            │    UI Layer     │   │   Data     │
    │   Layer    │            │                 │   │   Layer    │
    ├────────────┤            ├─────────────────┤   ├────────────┤
    │ audio-     │            │ sequencer.js    │   │ database.js│
    │ engine.js  │◄──────────►│ piano-roll.js   │   │ (IndexedDB)│
    │ instruments│            │ practice.js     │   │            │
    │ .js        │            │ tutorial.js     │   │ songs.js   │
    └────────────┘            │ gamification.js │   └────────────┘
                              │ app.js          │
                              └─────────────────┘
```

### Bestanden

| Bestand | Beschrijving | Regels |
|---------|-------------|--------|
| `js/audio-engine.js` | Web Audio API motor, scheduling, BPM, swing | ~150 |
| `js/instruments.js` | 14 gesynthetiseerde instrumenten (geen samples!) | ~350 |
| `js/sequencer.js` | 16-staps drum grid met 4 patronen | ~250 |
| `js/piano-roll.js` | Melodie-editor met toonladder-ondersteuning | ~200 |
| `js/practice.js` | Guitar Hero-stijl oefenspel | ~300 |
| `js/songs.js` | Song opslag, arrangement, WAV export | ~520 |
| `js/database.js` | IndexedDB wrapper met migratie | ~170 |
| `js/gamification.js` | XP, levels, quests, achievements, allies | ~600 |
| `js/tutorial.js` | 15-stappen interactieve tutorial | ~250 |
| `js/app.js` | Hoofdapp: verbindt alles + event handlers | ~660 |

### Geluidsengine

Alle geluiden worden **live gesynthetiseerd** met de Web Audio API — er worden geen audiobestanden geladen!

```
  Oscillator(s)
       │
       ▼
  ┌─────────┐    ┌─────────┐    ┌──────────┐    ┌────────────┐
  │ Filter  │───►│  Gain   │───►│Compressor│───►│  Speakers  │
  │(lowpass)│    │(envelope)│    │ (master) │    │     🔊     │
  └─────────┘    └─────────┘    └──────────┘    └────────────┘
```

### Data Flow

```
  Gebruiker klikt grid
         │
         ▼
  ┌──────────────┐     ┌───────────────┐
  │  Sequencer   │────►│ Audio Engine   │──── 🔊 Geluid
  │  toggleCell  │     │ scheduleStep   │
  └──────────────┘     └───────────────┘
         │
         ▼
  ┌──────────────┐     ┌───────────────┐
  │ Gamification │────►│   IndexedDB   │──── 💾 Opgeslagen
  │  onBeatCreated│    │   database    │
  └──────────────┘     └───────────────┘
```

---

## 🛠 Technologie

| Technologie | Waarvoor |
|------------|----------|
| **HTML5** | Structuur & semantiek |
| **CSS3** | Styling, animaties, dark/light thema |
| **Vanilla JavaScript** | Alle logica, geen frameworks |
| **Web Audio API** | Geluidssynthese & audio scheduling |
| **IndexedDB** | Betrouwbare database voor songs |
| **localStorage** | Fallback opslag & gamification data |
| **CSS Custom Properties** | Dynamisch thema-systeem |
| **CSS Grid & Flexbox** | Responsive layout |

### Waarom geen frameworks?

LoopLab is bewust gebouwd **zonder React, Vue of andere frameworks**:
- Sneller laden (geen bundler nodig)
- Makkelijker te begrijpen voor leerlingen
- Werkt direct als statische bestanden
- Geen build-stap vereist
- Kleinere footprint

---

## 📊 Op een rijtje

```
  ┌───────────────────────────────────────────────┐
  │              LoopLab in cijfers                │
  ├───────────────────────────┬───────────────────┤
  │  🥁 Drum instrumenten     │        8          │
  │  🎹 Melodische instrumenten│       6          │
  │  🎼 Toonladders            │        5          │
  │  🥁 Drum kits              │        4          │
  │  📈 Levels                 │       15          │
  │  🏆 Achievements           │       29          │
  │  📜 Dagelijkse quests      │       12          │
  │  🎪 Band-leden (allies)    │        4          │
  │  👹 Bad Guys               │        3          │
  │  ⚡ Power-Ups              │        9          │
  │  🎶 Voorbeeldliedjes       │        6          │
  │  📖 Tutorial stappen       │       15          │
  │  🎮 Oefenmodi              │        2          │
  │  ⭐ Moeilijkheidsgraden    │        3          │
  │  🌗 Thema's                │        2          │
  └───────────────────────────┴───────────────────┘
```

---

## 🎓 Pedagogisch ontwerp

LoopLab is gebaseerd op bewezen leerprincipes:

### Jane McGonigal's SuperBetter Framework
| Element | Implementatie |
|---------|--------------|
| **Geheime Identiteit** | Kies je avatar & muzikantennaam |
| **Bad Guys** | Versla de Offbeat Demon, Tempo Monster & Stilte Geest |
| **Power-Ups** | Ontgrendel drum kits & effecten door te levelen |
| **Quests** | 3 dagelijkse opdrachten om je te motiveren |
| **Allies** | Ontgrendel bandleden die je tips geven |
| **Epic Wins** | 29 achievements met visuele vieringen |

### Flow Theory (Mihaly Csikszentmihalyi)
- **Adaptieve moeilijkheid** in de oefenmodus
- **Directe feedback** bij elke actie (geluid + visueel)
- **Duidelijke doelen** via quests en achievements
- **Balans** tussen uitdaging en vaardigheid

---

## 🤝 Bijdragen

Bijdragen zijn welkom! Dit is een educatief project.

```bash
# Fork de repository
# Maak een feature branch
git checkout -b feature/mijn-feature

# Commit je wijzigingen
git commit -m "feat: beschrijving van je wijziging"

# Push naar je branch
git push origin feature/mijn-feature

# Open een Pull Request
```

---

## 📄 Licentie

Dit project is open-source onder de [MIT-licentie](LICENSE).

---

<div align="center">

**Gemaakt met ❤️ voor jonge muzikanten**

*LoopLab — Waar creativiteit en technologie samenkomen*

![Made for Kids](https://img.shields.io/badge/👶_Gemaakt_voor-Kinderen_8+-ff4081?style=for-the-badge&labelColor=0a0a1a)
![No Install](https://img.shields.io/badge/📦_Geen-Installatie_nodig-00e676?style=for-the-badge&labelColor=0a0a1a)
![Zero Dependencies](https://img.shields.io/badge/⚡_Nul-Dependencies-00e5ff?style=for-the-badge&labelColor=0a0a1a)

</div>
