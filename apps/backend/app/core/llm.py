import os
import google.generativeai as genai
from typing import List, Dict, Optional
import logging

class GeminiClient:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self.api_key:
            logging.warning("GOOGLE_API_KEY not set. Using MockGeminiClient.")
            self.model = None
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def generate_content(self, prompt: str) -> str:
        if self.model is None:
            raise ValueError("No model initialized. Check API key.")
        response = self.model.generate_content(prompt)
        return response.text

# Singleton instance
_client = None

def get_gemini_client():
    global _client
    if _client is None:
        _client = GeminiClient()
    return _client
