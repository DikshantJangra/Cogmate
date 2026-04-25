import pytest
from app.core.agents import architect_node
from app.core.state import CogmateState

@pytest.mark.asyncio
async def test_architect_node_generates_full_gagne_outline():
    state: CogmateState = {
        "transcript_buffer": ["Let's talk about gravity.", "It pulls things down."],
        "current_topic": "Gravity",
        "lesson_outline": [],
        "eval_score": 0.0,
        "confusion_points": [],
        "importance_tags": [],
        "slide_context": ""
    }
    
    result = await architect_node(state)
    events = [section["gagne_event"] for section in result["lesson_outline"]]
    
    expected_events = [
        "Gain Attention",
        "Inform Learners of Objectives",
        "Stimulate Recall of Prior Learning",
        "Present the Content",
        "Provide Learning Guidance",
        "Elicit Performance",
        "Provide Feedback",
        "Assess Performance",
        "Enhance Retention and Transfer"
    ]
    
    for event in expected_events:
        assert event in events
