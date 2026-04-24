from app.api.vision import process_vision
from app.core.synthesis import synthesize_notes
from app.core.vector_store import store_chunks
import logging

async def process_pipeline(image_b64: str, student_notes: str, session_id: str = "default") -> dict:
    """
    Connects the vision and synthesis pipelines.
    Extracts text from the image using the vision router logic,
    then synthesizes that text with the student's notes.
    """
    logging.info(f"Starting process_pipeline for session {session_id}.")
    
    ocr_text = ""
    try:
        vision_response = await process_vision(image_b64=image_b64)
        ocr_text = vision_response.text
        
        # Phase 2 Step 2: Store OCR chunks in Vector DB
        if ocr_text.strip():
            # Split by double newline for simple chunking
            chunks = [c.strip() for c in ocr_text.split("\n\n") if c.strip()]
            if not chunks: # fallback if no double newlines
                chunks = [ocr_text.strip()]
            await store_chunks(chunks, session_id=session_id)
            
    except Exception as e:
        logging.error(f"OCR extraction in pipeline failed: {str(e)}")
        
    if not ocr_text.strip():
        ocr_text = "No text detected from image"
        logging.info("Fallback triggered: OCR text was empty.")
    
    logging.info(f"OCR step finished. Extracted {len(ocr_text)} characters.")
    logging.info("Initiating synthesis LLM call.")
    
    synthesis_result = {}
    try:
        synthesis_result = await synthesize_notes(ai_notes=ocr_text, student_notes=student_notes)
    except Exception as e:
        logging.error(f"Synthesis in pipeline failed: {str(e)}")
        synthesis_result = {
            "merged": f"Error generating merged notes. OCR Text fallback: {ocr_text}",
            "gaps": ["Error analyzing gaps."]
        }
    
    logging.info("Synthesis complete. Returning merged pipeline result.")
    
    return {
        "ocr_text": ocr_text,
        "merged": synthesis_result.get("merged", ""),
        "gaps": synthesis_result.get("gaps", [])
    }
