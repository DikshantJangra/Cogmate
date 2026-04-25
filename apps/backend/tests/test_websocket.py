from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_audio_broadcast_to_ui():
    with client.websocket_connect("/ws/ui") as ui_socket:
        with client.websocket_connect("/ws/audio") as audio_socket:
            audio_socket.send_text("Important concept")
            
            # UI should receive a highlight broadcast
            ui_data = ui_socket.receive_json()
            assert ui_data["type"] == "highlight"
            assert "Important concept" in ui_data["tag"]
            
            # Audio socket should still get its ACK
            audio_data = audio_socket.receive_text()
            assert "ACK" in audio_data
