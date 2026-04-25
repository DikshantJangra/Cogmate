from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import List, Dict
import json
import asyncio
import datetime
import logging
from app.core.graph import cogmate_app
from app.core.state import CogmateState

router = APIRouter()


class ConnectionManager:
    def __init__(self):
        self.audio_connections: List[WebSocket] = []
        self.ui_connections: List[WebSocket] = []
        # One shared session state per lecture (last-write-wins for simplicity)
        self.session_state: CogmateState = {
            "transcript_buffer": [],
            "current_topic": "Live Lecture",
            "lesson_outline": [],
            "eval_score": 1.0,
            "confusion_points": [],
            "importance_tags": [],
            "final_summary": "",
            "slide_context": "",
            "rewrite_count": 0,
            "model_config": None,
        }

    async def connect_audio(self, ws: WebSocket):
        await ws.accept()
        self.audio_connections.append(ws)

    async def connect_ui(self, ws: WebSocket):
        await ws.accept()
        self.ui_connections.append(ws)
        # Send current state immediately on connect
        await ws.send_json(self._build_snapshot())

    def disconnect(self, ws: WebSocket):
        self.audio_connections = [c for c in self.audio_connections if c != ws]
        self.ui_connections = [c for c in self.ui_connections if c != ws]

    async def broadcast_ui(self, payload: dict):
        dead = []
        for ws in self.ui_connections:
            try:
                await ws.send_json(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.ui_connections.remove(ws)

    async def process_transcript_chunk(self, text: str, timestamp: str | None, topic: str | None = None, model_config: dict | None = None):
        if topic:
            self.session_state["current_topic"] = topic
        if model_config:
            self.session_state["model_config"] = model_config
        
        # Append to rolling buffer (keep last 60 chunks to avoid unbounded growth)
        self.session_state["transcript_buffer"].append(text)
        if len(self.session_state["transcript_buffer"]) > 60:
            self.session_state["transcript_buffer"] = self.session_state["transcript_buffer"][-60:]

        # Broadcast raw transcript chunk immediately for low-latency display
        await self.broadcast_ui({
            "type": "transcript_chunk",
            "text": text,
            "timestamp": timestamp,
        })

        # Run LangGraph pipeline asynchronously (don't block the receive loop)
        asyncio.create_task(_run_pipeline(dict(self.session_state)))

    def _build_snapshot(self) -> dict:
        s = self.session_state
        return {
            "type": "snapshot",
            "transcript": s["transcript_buffer"],
            "outline": s["lesson_outline"],
            "tags": s["importance_tags"],
            "confusion": s["confusion_points"],
            "eval_score": s["eval_score"],
            "topic": s["current_topic"],
            "final_summary": s.get("final_summary", ""),
        }


manager = ConnectionManager()


@router.websocket("/ws/audio")
async def audio_endpoint(websocket: WebSocket):
    await manager.connect_audio(websocket)
    try:
        while True:
            raw = await websocket.receive_text()

            try:
                msg = json.loads(raw)
                text = msg.get("text", raw)
                topic = msg.get("topic")
                timestamp = msg.get("timestamp")
                model_config = msg.get("model_config")
            except (json.JSONDecodeError, AttributeError):
                text = raw
                topic = None
                timestamp = None
                model_config = None

            await manager.process_transcript_chunk(text, timestamp, topic, model_config)
            await websocket.send_text("ACK")
    except WebSocketDisconnect:
        manager.disconnect(websocket)


async def _run_pipeline(state: CogmateState):
    try:
        logging.info(f"Running LangGraph pipeline for topic: {state['current_topic']}")
        final_state = await cogmate_app.ainvoke(state)
        manager.session_state.update(final_state)
        logging.info("Pipeline complete. Broadcasting snapshot.")
        await manager.broadcast_ui(manager._build_snapshot())
    except Exception as e:
        logging.error(f"Pipeline error: {str(e)}")
        await manager.broadcast_ui({"type": "error", "message": str(e)})


async def _run_summarizer(state: CogmateState):
    try:
        from app.core.agents import summarizer_node
        logging.info("Running summarizer agent...")
        final_state = await summarizer_node(state)
        manager.session_state["final_summary"] = final_state.get("final_summary", "")
        await manager.broadcast_ui(manager._build_snapshot())
    except Exception as e:
        logging.error(f"Summarizer error: {str(e)}")
        await manager.broadcast_ui({"type": "error", "message": f"Summarizer failed: {str(e)}"})


@router.websocket("/ws/ui")
async def ui_endpoint(websocket: WebSocket):
    await manager.connect_ui(websocket)
    try:
        while True:
            # Accept control messages (e.g. topic change, reset)
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
                msg_type = msg.get("type")
                
                if msg_type == "transcript_chunk":
                    await manager.process_transcript_chunk(
                        text=msg.get("text", ""),
                        timestamp=msg.get("timestamp"),
                        topic=msg.get("topic"),
                        model_config=msg.get("model_config")
                    )
                elif msg_type == "set_topic":
                    manager.session_state["current_topic"] = msg.get("topic", "Live Lecture")
                    if msg.get("model_config"):
                        manager.session_state["model_config"] = msg.get("model_config")
                elif msg_type == "summarize":
                    if msg.get("model_config"):
                        manager.session_state["model_config"] = msg.get("model_config")
                    asyncio.create_task(_run_summarizer(dict(manager.session_state)))
                elif msg_type == "reset":
                    manager.session_state["transcript_buffer"] = []
                    manager.session_state["lesson_outline"] = []
                    manager.session_state["importance_tags"] = []
                    manager.session_state["confusion_points"] = []
                    manager.session_state["eval_score"] = 1.0
                    manager.session_state["rewrite_count"] = 0
                    manager.session_state["final_summary"] = ""
                    await manager.broadcast_ui(manager._build_snapshot())
            except Exception:
                pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.get("/api/lecture/snapshot")
async def get_snapshot():
    """REST fallback to get current lecture state."""
    return manager._build_snapshot()


class InjectRequest(BaseModel):
    text: str
    topic: str | None = None


@router.post("/api/lecture/inject")
async def inject_transcript(req: InjectRequest):
    """Manually inject a transcript chunk (for testing without the Listener app)."""
    if req.topic:
        manager.session_state["current_topic"] = req.topic
    manager.session_state["transcript_buffer"].append(req.text)
    if len(manager.session_state["transcript_buffer"]) > 60:
        manager.session_state["transcript_buffer"] = manager.session_state["transcript_buffer"][-60:]

    await manager.broadcast_ui({
        "type": "transcript_chunk",
        "text": req.text,
        "timestamp": datetime.datetime.utcnow().isoformat(),
    })
    asyncio.create_task(_run_pipeline(dict(manager.session_state)))
    return {"ok": True}
