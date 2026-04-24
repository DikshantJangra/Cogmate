from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import logging
from app.core.process import process_pipeline

router = APIRouter()

class ProcessRequest(BaseModel):
    image_b64: str
    student_notes: str
    session_id: str = "default"

class ProcessResponse(BaseModel):
    ocr_text: str
    merged: str
    gaps: List[str]

@router.post("", response_model=ProcessResponse)
async def run_process_pipeline(request: ProcessRequest):
    if not request.image_b64.strip() or not request.student_notes.strip():
        raise HTTPException(status_code=400, detail="Both image_b64 and student_notes must not be empty.")
    
    logging.info(f"Starting /process endpoint pipeline for session {request.session_id}.")
    
    try:
        result = await process_pipeline(
            image_b64=request.image_b64, 
            student_notes=request.student_notes,
            session_id=request.session_id
        )
        
        logging.info("Successfully completed /process endpoint pipeline.")
        return ProcessResponse(**result)
        
    except Exception as e:
        logging.error(f"Error in /process endpoint pipeline: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal processing error.")
