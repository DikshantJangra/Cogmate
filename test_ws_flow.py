import asyncio
import websockets
import json

async def simulate_transcript():
    uri = "ws://localhost:8000/ws/audio"
    async with websockets.connect(uri) as websocket:
        msg = {
            "text": "Welcome to the class on Neural Networks. Today we will discuss Backpropagation.",
            "is_partial": False,
            "timestamp": "2026-04-25T10:00:00Z"
        }
        await websocket.send(json.dumps(msg))
        print(f"Sent: {msg}")
        
        response = await websocket.recv()
        print(f"Received: {response}")

if __name__ == "__main__":
    asyncio.run(simulate_transcript())
