import os
import logging
from google import genai

class GeminiClient:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            logging.warning("GOOGLE_API_KEY not set.")
            self.client = None
        else:
            self.client = genai.Client(api_key=self.api_key)

    async def generate_content(self, prompt: str) -> str:
        if self.client is None:
            raise ValueError("No model initialized. Check GOOGLE_API_KEY.")
        import asyncio
        response = await asyncio.to_thread(
            self.client.models.generate_content,
            model="gemini-2.0-flash",
            contents=prompt,
        )
        return response.text

_client = None

def get_gemini_client():
    global _client
    if _client is None:
        _client = GeminiClient()
    return _client
