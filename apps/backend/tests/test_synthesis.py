from app.core.synthesis import merge_markdown

def test_merge_markdown():
    ai_notes = "# Gravity\nGravity is a force."
    user_notes = "# Gravity\nGravity makes apples fall."
    
    # Simple concatenation for now to prove structure
    merged = merge_markdown(ai_notes, user_notes)
    assert "Gravity is a force" in merged
    assert "Gravity makes apples fall" in merged
