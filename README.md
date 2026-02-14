# self-statistics-system-v2: The Neural Second Brain

self statistics system is a high-fidelity personal growth platform that transforms unstructured thoughts (voice recordings) into experience and level updates representing current state, in order to create a status screen for the user. 
It leverages the **Google Gemini API** to classify human effort and visualizes progress through a stable **Directed Acyclic Graph (DAG)**.

Project URL: https://self-statistics-system-v1.web.app

## 🚀 Core Philosophy & Mechanics

### 1. The 3-Layer Semantic Pipeline
The application organizes knowledge into three distinct functional layers, styled as a real-life RPG status system:
- **Actions (Emerald #10b981)**: Granular activities extracted from journal entries (e.g., "Debugging", "Squats").
- **Skills (Amber #f59e0b)**: Intermediate competencies that encapsulate groups of actions (e.g., "Frontend Engineering").
- **Characteristics (Indigo #4f46e5)**: High-level human traits representing fundamental potential (e.g., "Intellect", "Vitality").

### 2. The 7 Archetypal Attributes
The system defines seven core attributes that serve as gravity wells for skill classification:
**Vitality**, **Intellect**, **Wisdom**, **Social**, **Discipline**, **Creativity**, **Leadership**.

The AI is encouraged — but never forced — to map skills toward these hubs. Organic, emergent characteristics are preserved when they don't cleanly fit.

### 3. Adaptive Neural Weighting
The "Brain" is dynamic. Gemini suggests weights for relationships; the system uses a **Learning Rate (0.01)** to adjust existing edge weights over time, allowing the hierarchy to adapt to your evolving habits.

### 4. Cumulative EXP Propagation
Effort is quantified as EXP and propagated using **Path-Weighted Cumulative Averaging**:
- EXP flows upward from Actions to Characteristics.
- Normalization prevents "Domain Inflation," ensuring root attributes reflect average intensity across sub-trees.

### 5. Logarithmic Level Curve
Levels are computed via `Level = floor(log2(EXP + 1))`, providing rapid early leveling that tapers at higher tiers. All EXP values are rounded to 4 decimal places for consistency.

---

## 🛠 Application Views

### 📔 Journal
A hierarchical feed (Year > Month > Day) for voice and text ingestion. Features detailed "status update" for every entry, showing exactly where your effort went. Includes a **Canvas-based Oscilloscope** for real-time voice feedback during recording. Firebase is the source of truth; local IndexedDB provides fast boot and offline reads.

### 🕸 Concept Graph (Visual Source of Truth)
A stable, interactive DAG visualization designed for semantic clarity and structural persistence. Supports multi-node selection, relationship path highlighting, and **Ultra-Rigid position snapping** for a deterministic UX. Hydrates from IndexedDB on boot, then force-refreshes from Firebase.

### 📊 Statistics (RPG Character Sheet)
A four-tab dashboard displaying the player's progression:
- **Status**: 7-axis radar chart of core attributes, attribute grid cards with level + progress bars, recent neural impact (last 5 entries), and skill clusters grouped by characteristic.
- **Experience**: Top 10 nodes ranked by cumulative EXP.
- **Levels**: Global level badge, XP progress bar toward next level, and top 3 contributor nodes.
- **All Statistics**: Summary metrics (total EXP, node/edge counts, highest EXP node).

Tracks daily and yesterday's EXP deltas via hierarchical journal tree metadata.

### ⚙️ Settings & Integrations
A persistent Discord-style interface for managing profile metadata and external connections:
- **Status Display**: Class title and visibility toggles.
- **Account Profile**: Firestore-backed display name editor with Google account details and logout.
- **AI Configuration**: Fine-tune classification temperature, model selection, and transcription feedback.
- **Privacy & Notifications**: Encryption, visibility, and notification preferences.
- **Data Portability**: Full JSON Backup & Restore of the IndexedDB state.
- **Webhooks**: Real-time JSON broadcasts of processed entries.
- **Obsidian**: Local REST API integration to sync entries as Markdown notes.

### 🛠 Debug Console
Low-level access to the application engine. Features batch data injection (AI, Manual, Complex, and Brain datasets), an experience injector for math verification, a raw data browser for IndexedDB inspection, a force-sync panel for reconciling local and backend state, and session authentication diagnostics.

---

## 🏗 Technical Stack & Architecture
- **Framework**: React 19 (Vite 6) + TypeScript ~5.8.2 (Bulletproof Architecture).
- **State**: Zustand 5 (Global) + IndexedDB via `idb-keyval` (Persistence).
- **Backend**: Firebase (Auth, Firestore) — Hybrid Read-Aside, Sync-Behind.
- **AI Engine**: Google Gemini (`gemini-3-flash-preview` → `gemini-2.0-flash` fallback).
- **Visuals**: D3.js v7 with stable hierarchical layouts + Recharts for statistical charts.
- **Styling**: Tailwind CSS 4 + Lucide React icons.
- **Connectivity**: PWA-ready with Service Worker and Manifest support.
- **Progression System**: Centralized in `src/systems/progression/` — propagation engine, EXP scaling, logarithmic level curve, and 7 core attribute definitions. Aliased as `@systems/progression`.
- **Topology Logic**: Graph merging, classification, and topology utilities in `src/lib/soulTopology/`.

## 📂 Project Structure
```
src/
├── systems/          # Core domain logic ("The Brain") — pure, no React
│   └── progression/  # EXP engine, level formulas, attribute constants
├── features/         # Self-contained domain modules
│   ├── journal/      # Voice & text journaling + AI analysis
│   ├── visual-graph/ # D3-based concept graph visualization
│   ├── developer-graph/ # Architectural graph editor
│   ├── statistics/   # RPG character sheet (radar chart, level views)
│   ├── settings/     # Discord-style settings interface
│   ├── debug/        # Debug console + datastore tools
│   ├── auth/         # Authentication UI
│   ├── integration/  # Webhooks & Obsidian sync
│   ├── billing/      # Billing UI (placeholder)
│   └── user-info/    # User identity management
├── stores/           # Zustand stores (data cache only)
│   ├── journal/      # Journal entries + tree index
│   ├── cdag-topology/# CDAG graph cache (nodes, edges, structure)
│   ├── player-statistics/ # EXP + level stats per node
│   ├── user-information/  # Profile metadata
│   ├── ai-config/    # AI processing config
│   ├── user-integrations/ # Webhook & Obsidian settings
│   └── root/         # Serialization-only composition store
├── lib/              # External bridges (Firebase, AI, topology)
│   ├── firebase/     # Auth, CRUD, graph/journal services
│   ├── google-ai/    # Gemini pipeline + prompts
│   └── soulTopology/ # Graph merging & classification logic
├── hooks/            # Cross-feature orchestration
├── components/       # Shared UI (layout, tabs, notifications)
├── providers/        # Auth provider
├── routes/           # Route definitions + protection
├── types/            # Global TypeScript types
└── utils/            # General-purpose utilities
```

For deep-dives into the implementation, see the `/documentation` directory.
