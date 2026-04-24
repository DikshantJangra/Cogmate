from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from app.core.synthesis import synthesize_notes

router = APIRouter()

class SynthesisRequest(BaseModel):
    ai_notes: str
    student_notes: str

class SynthesisResponse(BaseModel):
    merged: str
    gaps: List[str]

@router.post("", response_model=SynthesisResponse)
async def create_synthesis(request: SynthesisRequest):
    if not request.ai_notes.strip() or not request.student_notes.strip():
        raise HTTPException(status_code=400, detail="Both ai_notes and student_notes must not be empty.")
    
    try:
        result = await synthesize_notes(request.ai_notes, request.student_notes)
        return SynthesisResponse(
            merged=result["merged"],
            gaps=result["gaps"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error during synthesis: {str(e)}")
