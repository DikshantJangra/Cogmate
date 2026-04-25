# Cogmate — The Algorithmic Instructional Designer

Cogmate is an AI-powered classroom companion that captures real-time audio and visual data to generate pedagogically structured learning materials. It combines a multi-agent interactive classroom with live lecture processing capabilities.

## Project Structure

```
Cogmate/
├── apps/
│   ├── classroom/          # Next.js 16 — AI Interactive Classroom (slides, quizzes, simulations)
│   ├── backend/            # FastAPI — AI Pipeline (Whisper, LangGraph, ChromaDB RAG)
│   └── listener/           # Real-time audio capture & transcription service
├── packages/
│   ├── mathml2omml/        # MathML → Office Math conversion
│   └── pptxgenjs/          # Customized PowerPoint generation
└── package.json            # Monorepo root (pnpm workspaces)
```

## Tech Stack

- **Classroom**: Next.js 16, React 19, Tailwind CSS 4, shadcn/ui, LangGraph, Zustand
- **Backend**: FastAPI, LangGraph (Multi-agent orchestration), ChromaDB (Vector store)
- **AI Models**: Whisper (Transcription), pyannote-audio (Diarization), Gemini / GPT-4o (LLM)

## Quick Start

### Prerequisites
- **Node.js** >= 20, **pnpm** >= 10
- **Python** 3.12+

### Setup

```bash
# Install all dependencies
pnpm install

# Copy environment config
cp .env.example .env

# Run the full stack
pnpm dev
```

This starts both the **classroom** (http://localhost:3000) and **backend** (http://localhost:8000).

### Individual Services

```bash
pnpm dev:classroom   # Next.js classroom app only
pnpm dev:backend     # FastAPI backend only
pnpm dev:listener    # Audio listener only
```

## Core Features

### AI Interactive Classroom
- **One-click lesson generation** from any topic or document
- **Multi-agent classroom** with AI teachers and classmates
- **Rich content types** — Slides, quizzes, interactive simulations, PBL
- **Whiteboard & TTS** — Agents draw diagrams and explain with voice
- **Deep Interactive Mode** — 3D visualizations, simulations, mind maps, coding
- **Export** — PowerPoint, interactive HTML, classroom ZIP

### Live Lecture Processing (Coming Soon)
- **Listener Agent**: Real-time audio transcription and classification
- **Watcher Agent**: Visual capture and OCR from slides
- **Highlighter Agent**: Pedagogical importance scoring
- **Architect Agent**: Instructional design mapping (Gagné's Nine Events)
- **Content Agent**: Generation of notes, flashcards, and assessments
- **Simulated Student Agent**: Adversarial validation of learning materials
