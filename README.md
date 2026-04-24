# Cogmate — The Algorithmic Instructional Designer

Cogmate is an AI-powered classroom companion that captures real-time audio and visual data to generate pedagogically structured learning materials.

## Project Structure

- **frontend/**: Next.js application (React, TypeScript, Tailwind, shadcn/ui).
- **backend/**: FastAPI application (Python, LangGraph, faster-whisper, pyannote-audio).

## Tech Stack

- **Frontend**: Next.js 15+, Tailwind CSS, shadcn/ui.
- **Backend**: FastAPI, LangGraph (Multi-agent orchestration), ChromaDB (Vector store).
- **AI Models**: Whisper (Audio transcription), pyannote-audio (Diarization), Gemini 2.5 Flash / GPT-4o (LLM).

## Setup Instructions

### Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in your API keys.
5. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local`.
4. Run the development server:
   ```bash
   npm run dev
   ```

## Core Agents

- **Listener Agent**: Real-time audio transcription and classification.
- **Watcher Agent**: Visual capture and OCR from slides.
- **Highlighter Agent**: Pedagogical importance scoring.
- **Architect Agent**: Instructional design mapping (Gagné's Nine Events).
- **Content Agent**: Generation of notes, flashcards, and assessments.
- **Simulated Student Agent**: Adversarial validation of learning materials.
