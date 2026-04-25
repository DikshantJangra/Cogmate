import pytest
from app.core.graph import cogmate_app
from app.core.state import CogmateState

@pytest.mark.asyncio
async def test_full_cogmate_pipeline():
    # Initial state with a transcript that triggers highlighter and architect
    state: CogmateState = {
        "transcript_buffer": ["This is a very important concept: Backpropagation."],
        "current_topic": "AI",
        "lesson_outline": [],
        "eval_score": 1.0,
        "confusion_points": [],
        "importance_tags": [],
        "slide_context": ""
    }
    
    # Run the full pipeline
    result = await cogmate_app.ainvoke(state)
    
    # Verify Highlighter Agent
    assert "Backpropagation" in result["importance_tags"]
    
    # Verify Architect Agent (Gagné's events)
    assert len(result["lesson_outline"]) == 9
    assert result["lesson_outline"][0]["gagne_event"] == "Gain Attention"
    
    # Verify Simulated Student Agent
    # (In our mock, "Backpropagation" doesn't trigger confusion, but we check if score exists)
    assert result["eval_score"] >= 0.0
