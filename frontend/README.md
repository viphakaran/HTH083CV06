# LowKeySigns — Frontend (Demo Mode)

Real-time sign language interpretation designed for civic counters, hospital triage, and public intake desks.

Built for the **Accessibility Tech / Public Services Hackathon**.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Dev Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build
```bash
npm run build
```

---

## 🔒 Anti-Hallucination & Data Integrity

The frontend strictly enforces the **20 locked vocabulary words** benchmarked against open, research-grade sign language datasets (WLASL):

```
help, wait, money, form, pain, doctor, yes, no, thank you, sign,
more, problem, emergency, where, name, appointment, sick, please, here, now
```

### Locked WebSocket Data Shape
All simulated events and future backend WebSocket streams follow this exact JSON contract:
```json
{
  "word": "emergency",
  "confidence": 0.94,
  "timestamp": "2026-09-24T10:15:32.000Z"
}
```

---

## 📁 Architecture & Isolated Data Layer

```
lowkeysigns-frontend/
├── public/
│   └── favicon.svg              # Waveform geometric mark
├── src/
│   ├── components/
│   │   ├── Footer.tsx           # Accessible footer & research citations
│   │   ├── Logo.tsx             # Wordmark + geometric waveform mark
│   │   └── Navbar.tsx           # Global responsive navigation
│   ├── services/
│   │   └── recognitionFeed.ts   # ONLY place mock data is generated / referenced
│   ├── types/
│   │   └── recognition.ts       # TypeScript schemas for locked data shape & tiers
│   ├── pages/
│   │   ├── LandingPage.tsx      # Overview, problem statement, 4-stage pipeline, CTA
│   │   ├── DashboardPage.tsx    # 60/40 desktop layout, feed controls, TTS, Staff Speak
│   │   └── VocabularyPage.tsx   # All 20 approved words, search & category filters
│   ├── App.tsx                  # React Router root configuration
│   ├── index.css                # Base styling & deep navy palette (#1F3864)
│   └── main.tsx                 # Vite entrypoint
├── index.html                   # Inter font, accessibility metadata
├── package.json
└── vite.config.ts
```

> **Note on Backend Integration**: In production, replacing `src/services/recognitionFeed.ts` with a live WebSocket hook is all that is required. No UI component needs to be modified.

---

## ✨ Features

- **Live Recognition Dashboard (`/dashboard`)**:
  - **Desktop (60/40 split) & Mobile Stacking**: Left/center camera panel with simulated viewfinder and right-side real-time transcript log.
  - **Visual & Audio Accessibility**: Bolder typography on latest sign, tiered confidence scoring bar (High $\ge 0.8$, Med $0.5-0.79$, Low $< 0.5$), and native `window.speechSynthesis` text-to-speech.
  - **Two-Way "Staff Speak"**: Collapsible reverse-assist panel leveraging Web Speech API with automatic graceful fallback on unsupported browsers.
- **Vocabulary Reference (`/vocabulary`)**:
  - Searchable, categorized dictionary of all 20 benchmarked words with placeholders for sign guide graphics (`/assets/signs/{word}.png`).
- **Clean SaaS Aesthetics**:
  - Deep navy theme (`#1F3864`), Inter typography, high-contrast WCAG 2.1 AA compliant elements, and zero distracting gimmicks or cartoon icons.
