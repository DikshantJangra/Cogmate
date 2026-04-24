import json
import logging
from app.core.llm import get_gemini_client

async def synthesize_notes(ai_notes: str, student_notes: str) -> dict:
    """
    Takes AI generated notes and student notes, merges them, and identifies missing concepts.
    Returns a dictionary with 'merged' (markdown string) and 'gaps' (list of strings).
    """
    client = get_gemini_client()
    
    prompt = f"""
    You are an expert pedagogical assistant.
    Your task is to compare and merge two sets of notes: AI-extracted lecture notes and a student's personal notes.
    
    GUIDELINES:
    1. Merge the notes into a single, highly structured markdown document.
    2. Use clear headings (##, ###), bullet points, and bold text for key terms.
    3. Ensure the tone is educational and organized.
    4. identify any key concepts present in the AI notes but missing from the student's notes.
    
    AI EXTRACTED NOTES:
    {ai_notes}
    
    STUDENT PERSONAL NOTES:
    {student_notes}
    
    RESPONSE FORMAT:
    Return your response ONLY as a JSON object with two keys:
    - "merged": The final merged markdown notes (ensure proper escaping for JSON).
    - "gaps": A list of strings identifying missing concepts.
    
    Make the "merged" content professional, like a high-quality study guide.
    """
    
    try:
        response_text = await client.generate_content(prompt)
        
        # Clean up the response text in case it's wrapped in markdown code blocks
        clean_text = response_text.strip()
        if clean_text.startswith("```json"):
            clean_text = clean_text[7:]
        if clean_text.startswith("```"):
            clean_text = clean_text[3:]
        if clean_text.endswith("```"):
            clean_text = clean_text[:-3]
            
        result = json.loads(clean_text.strip())
        
        return {
            "merged": result.get("merged", "Failed to parse merged notes."),
            "gaps": result.get("gaps", [])
        }
    except Exception as e:
        logging.error(f"Error during synthesis LLM call: {e}")
        # Fallback in case of parsing or LLM failure
        return {
            "merged": f"# Integrated Lesson Notes\n\n## AI Generated Summary\n{ai_notes}\n\n## Your Personal Notes\n{student_notes}",
            "gaps": ["Error analyzing gaps. Please review notes manually."]
        }
