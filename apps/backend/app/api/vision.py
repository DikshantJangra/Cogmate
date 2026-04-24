import base64
import binascii
import io
import logging
import asyncio
from typing import List, Optional

from fastapi import APIRouter, HTTPException, UploadFile, File
from pydantic import BaseModel
from PIL import Image

try:
    import pytesseract
except ImportError:
    pytesseract = None

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

router = APIRouter()

class VisionChunk(BaseModel):
    text: str

class VisionResponse(BaseModel):
    text: str
    chunks: List[VisionChunk]

@router.post("", response_model=VisionResponse)
async def process_vision(
    image_b64: Optional[str] = None,
    file: Optional[UploadFile] = File(None)
):
    """
    Processes either a base64 image or a PDF/Image file.
    """
    raw_text = ""

    if image_b64:
        raw_text = await _process_b64_image(image_b64)
    elif file:
        content_type = file.content_type
        if content_type == "application/pdf":
            raw_text = await _process_pdf(file)
        else:
            raw_text = await _process_image_file(file)
    else:
        raise HTTPException(status_code=400, detail="Either image_b64 or file must be provided.")

    # Clean text and split into chunks
    clean_text = raw_text.strip()
    # Split by lines for chunks as expected by the pipeline
    chunks = [VisionChunk(text=line.strip()) for line in clean_text.split("\n") if line.strip()]

    return VisionResponse(
        text=clean_text,
        chunks=chunks
    )

async def _process_b64_image(b64_data: str) -> str:
    if "base64," in b64_data:
        b64_data = b64_data.split("base64,")[1]

    try:
        image_bytes = base64.b64decode(b64_data)
        img = Image.open(io.BytesIO(image_bytes))
        return await asyncio.to_thread(pytesseract.image_to_string, img)
    except Exception as e:
        logging.error(f"B64 OCR failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to process base64 image.")

async def _process_image_file(file: UploadFile) -> str:
    try:
        content = await file.read()
        img = Image.open(io.BytesIO(content))
        return await asyncio.to_thread(pytesseract.image_to_string, img)
    except Exception as e:
        logging.error(f"Image file OCR failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to process image file.")

async def _process_pdf(file: UploadFile) -> str:
    if not pdfplumber:
        raise HTTPException(status_code=500, detail="pdfplumber not installed.")
    
    try:
        content = await file.read()
        pdf_text = ""
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                pdf_text += page.extract_text() or ""
        return pdf_text
    except Exception as e:
        logging.error(f"PDF extraction failed: {str(e)}")
        raise HTTPException(status_code=400, detail="Failed to process PDF.")
