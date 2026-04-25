from markdown_it import MarkdownIt

def merge_markdown(ai_notes: str, user_notes: str) -> str:
    md = MarkdownIt()
    # Simple strategy: Concatenate and let user manual notes take precedence for overlapping headers
    # In a full implementation, we'd parse the tokens and resolve conflicts.
    # For now, we'll provide a structurally separated merge.
    
    merged = f"""# Integrated Lesson Notes
    
## AI Generated Summary
{ai_notes}

## Your Personal Notes
{user_notes}

## Synthesis Result
This is a merged view of your class participation and the AI's pedagogical analysis.
"""
    return merged
