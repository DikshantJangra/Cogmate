import os
import logging
import asyncio
from google import genai
import httpx

class GeminiClient:
    def __init__(self, api_key: str = None, model: str = "gemini-2.0-flash"):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        self.model = model
        if not self.api_key:
            logging.warning("GOOGLE_API_KEY not set.")
            self.client = None
        else:
            self.client = genai.Client(api_key=self.api_key)

    async def generate_content(self, prompt: str, retries: int = 2) -> str:
        if self.client is None:
            raise ValueError("No model initialized. Check GOOGLE_API_KEY.")
        
        last_err = None
        for i in range(retries + 1):
            try:
                response = await asyncio.to_thread(
                    self.client.models.generate_content,
                    model=self.model,
                    contents=prompt,
                )
                return response.text
            except Exception as e:
                last_err = e
                if "429" in str(e):
                    wait = (i + 1) * 2
                    logging.warning(f"Rate limited (429). Retrying in {wait}s...")
                    await asyncio.sleep(wait)
                    continue
                raise e
        raise last_err

class OpenAICompatibleClient:
    def __init__(self, api_key: str, base_url: str, model: str):
        self.api_key = api_key
        self.base_url = base_url
        self.model = model

    async def generate_content(self, prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": 0.7
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url.rstrip('/')}/chat/completions",
                headers=headers,
                json=payload,
                timeout=60.0
            )
            response.raise_for_status()
            data = response.json()
            return data["choices"][0]["message"]["content"]

def get_llm_client(config: dict | None = None):
    if not config:
        return GeminiClient()
    
    provider = config.get("providerId")
    api_key = config.get("apiKey")
    base_url = config.get("baseUrl")
    model = config.get("modelString") or config.get("modelId")
    
    if provider == "google":
        return GeminiClient(api_key=api_key, model=model or "gemini-2.0-flash")
    elif api_key and base_url and model:
        return OpenAICompatibleClient(api_key=api_key, base_url=base_url, model=model)
    
    return GeminiClient()

_client = None

def get_gemini_client():
    global _client
    if _client is None:
        _client = GeminiClient()
    return _client
