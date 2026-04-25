# apps/backend/tests/test_vision.py
from app.core.vision import process_frame
from app.core.state import CogmateState

def test_process_frame_extracts_text():
    # Mock frame (usually would be a base64 string or image path)
    mock_frame = "base64_encoded_slide_image"
    
    state: CogmateState = {
        "transcript_buffer": [],
        "current_topic": "AI",
        "lesson_outline": [],
        "eval_score": 0.0,
        "confusion_points": [],
        "importance_tags": [],
        "slide_context": ""
    }
    
    # process_frame should return updated state with extracted text
    result = process_frame(mock_frame, state)
    assert "slide_context" in result
    assert result["slide_context"] == "Mock OCR text from slide"
