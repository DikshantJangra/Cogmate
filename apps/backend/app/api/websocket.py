from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
from app.core.graph import cogmate_app
from app.core.state import CogmateState

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.ui_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket, is_ui: bool = False):
        await websocket.accept()
        if is_ui:
            self.ui_connections.append(websocket)
            print(f"✅ UI Connected: {websocket.client}")
        else:
            self.active_connections.append(websocket)
            print(f"🎙️ Audio Stream Connected: {websocket.client}")

    def disconnect(self, websocket: WebSocket, is_ui: bool = False):
        if is_ui:
            if websocket in self.ui_connections:
                self.ui_connections.remove(websocket)
                print(f"❌ UI Disconnected")
        else:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
                print(f"❌ Audio Stream Disconnected")

    async def broadcast_to_ui(self, message: dict):
        for connection in self.ui_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to UI: {e}")
                pass

manager = ConnectionManager()

@router.websocket("/ws/audio")
async def audio_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    
    # Initialize state for this recording session
    state: CogmateState = {
        "transcript_buffer": [],
        "current_topic": "Live Class",
        "lesson_outline": [],
        "eval_score": 1.0,
        "confusion_points": [],
        "importance_tags": [],
        "slide_context": ""
    }

    try:
        while True:
            data = await websocket.receive_text()
            
            # Update local buffer
            state["transcript_buffer"].append(data)
            
            # Run the LangGraph pipeline
            try:
                # We use .ainvoke for async execution
                final_state = await cogmate_app.ainvoke(state)
                
                # Update current session state
                state.update(final_state)

                # Broadcast results to UI
                # Convert tags list to a comma separated string for the existing UI scaffold
                tag_str = ", ".join(state["importance_tags"]) if state["importance_tags"] else "Analyzing..."
                
                update = {
                    "type": "highlight",
                    "tag": tag_str,
                    "timestamp": "Just now"
                }
                await manager.broadcast_to_ui(update)
                
            except Exception as e:
                print(f"Error in LangGraph: {e}")
                
            await websocket.send_text(f"ACK: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)

@router.websocket("/ws/ui")
async def ui_endpoint(websocket: WebSocket):
    await manager.connect(websocket, is_ui=True)
    try:
        while True:
            await websocket.receive_text() # Keep alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, is_ui=True)
