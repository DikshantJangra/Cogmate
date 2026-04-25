# apps/backend/tests/test_highlighter.py
import pytest
from app.core.agents import highlighter_node
from app.core.state import CogmateState

@pytest.mark.asyncio
async def test_highlighter_scores_importance():
    state: CogmateState = {
        "transcript_buffer": ["This is a very important concept: Backpropagation."],
        "current_topic": "AI",
        "lesson_outline": [],
        "eval_score": 0.0,
        "confusion_points": [],
        "importance_tags": [],
        "slide_context": ""
    }
    result = await highlighter_node(state)
    # Mock result should add some scoring/tagging metadata
    assert "importance_tags" in result
