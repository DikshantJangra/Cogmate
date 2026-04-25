from fastapi import FastAPI
from app.api.websocket import router as ws_router
from dotenv import load_dotenv
import os

load_dotenv()

app = FastAPI(title="Cogmate Backend")
app.include_router(ws_router)

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "cogmate-backend"}
