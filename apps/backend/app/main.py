from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api.websocket import router as ws_router
from app.api.synthesis import router as synthesis_router
from app.api.vision import router as vision_router
from app.api.process import router as process_router
from app.api.rag import router as rag_router
from app.api.export import router as export_router
from app.api.quiz import router as quiz_router
from app.api.transcript import router as transcript_router
from app.core.auth import get_current_user
from dotenv import load_dotenv
import os
import logging

load_dotenv()
logging.basicConfig(level=logging.INFO)

app = FastAPI(title="Cogmate Backend")

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)
app.include_router(synthesis_router, prefix="/api/synthesis", tags=["Synthesis"])
app.include_router(vision_router, prefix="/api/vision", tags=["Vision"])
app.include_router(process_router, prefix="/api/process", tags=["Process"])
app.include_router(rag_router, prefix="/api/rag", tags=["RAG"])
app.include_router(export_router, prefix="/api/export", tags=["Export"])
app.include_router(quiz_router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(transcript_router, prefix="/api/transcript", tags=["ASR"])

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "cogmate-backend"}

@app.get("/me")
async def read_users_me(current_user = Depends(get_current_user)):
    return current_user
