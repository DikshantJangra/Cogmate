from app.core.state import CogmateState

def process_frame(frame_data: str, state: CogmateState) -> CogmateState:
    # Mock implementation of vision/OCR processing
    # In a real scenario, this would use MinerU, Tesseract, or a Vision LLM
    mock_ocr_text = "Mock OCR text from slide"
    return {**state, "slide_context": mock_ocr_text}
