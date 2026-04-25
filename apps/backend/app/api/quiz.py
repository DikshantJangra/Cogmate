from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List
import json
import logging
from app.core.llm import get_gemini_client

router = APIRouter()

class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

class QuizResponse(BaseModel):
    quiz: List[QuizQuestion]

@router.post("/generate", response_model=QuizResponse)
async def generate_quiz(content: str = Body(..., embed=True)):
    if not content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    
    prompt = f"""
    You are an expert examiner. Generate a quiz based on the following lecture notes.
    
    NOTES:
    {content}
    
    Create 5 multiple-choice questions. 
    Return the response ONLY as a JSON array of objects with keys:
    "question", "options" (list of 4 strings), "correct_answer", and "explanation".
    """
    
    try:
        gemini = get_gemini_client()
        response_text = await gemini.generate_content(prompt)
        
        # Clean up response
        clean_text = response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
            
        quiz_data = json.loads(clean_text.strip())
        return QuizResponse(quiz=quiz_data)
        
    except Exception as e:
        logging.error(f"Error generating quiz: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate quiz.")
