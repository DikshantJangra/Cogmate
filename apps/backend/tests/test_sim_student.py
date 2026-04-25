# apps/backend/tests/test_sim_student.py
import pytest
from app.core.agents import sim_student_node
from app.core.state import CogmateState

@pytest.mark.asyncio
async def test_sim_student_detects_confusion():
    state: CogmateState = {
        "transcript_buffer": ["Vague explanation of quantum physics."],
        "current_topic": "Quantum Physics",
        "lesson_outline": [
            {"title": "Intro", "gagne_event": "Present the Content", "content": "It's complicated."}
        ],
        "eval_score": 1.0, # High initially
        "confusion_points": [],
        "importance_tags": [],
        "slide_context": ""
    }
    
    result = await sim_student_node(state)
    assert result["eval_score"] < 0.8
    assert len(result["confusion_points"]) > 0
    assert "confused" in result["confusion_points"][0].lower()
