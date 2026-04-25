from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import Optional
import os
import tempfile
import logging

router = APIRouter()

# Global whisper model cache (lazy load)
_whisper_model = None

def get_whisper_model():
    global _whisper_model
    if _whisper_model is None:
        try:
            from faster_whisper import WhisperModel
            logging.info("Loading faster-whisper model...")
            # Using 'base' for speed/memory balance on local dev machines
            _whisper_model = WhisperModel("base", device="cpu", compute_type="int8")
            logging.info("Whisper model loaded.")
        except ImportError:
            logging.error("faster-whisper not installed. Local ASR unavailable.")
            raise HTTPException(status_code=501, detail="Local ASR dependencies not installed.")
        except Exception as e:
            logging.error(f"Failed to load Whisper model: {str(e)}")
            raise HTTPException(status_code=500, detail="Failed to initialize local ASR model.")
    return _whisper_model

@router.post("")
async def transcribe_audio(file: UploadFile = File(...)):
    """
    Transcribe audio using local faster-whisper.
    """
    if not file.content_type.startswith("audio/"):
        logging.warning(f"Unexpected content type: {file.content_type}")
    
    model = get_whisper_model()
    
    # Save uploaded file to temp
    # We close the file so faster-whisper can open it cleanly
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name
    
    try:
        segments, info = model.transcribe(tmp_path, beam_size=5)
        text = " ".join([segment.text for segment in segments]).strip()
        return {"text": text, "language": info.language}
    except Exception as e:
        err_msg = str(e)
        if "ffmpeg" in err_msg.lower():
            err_msg = "FFmpeg not found on server. Please install ffmpeg to use local ASR."
        logging.error(f"Transcription error: {err_msg}")
        raise HTTPException(status_code=500, detail=err_msg)
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
