from typing import Dict, List
import json

def generate_html_lesson_pack(outline: List[Dict], topic: str) -> str:
    sections_html = ""
    for section in outline:
        sections_html += f"""
        <div class="section">
            <h2>{section['title']}</h2>
            <p><strong>Gagné Event:</strong> {section['gagne_event']}</p>
            <div class="content">{section['content']}</div>
        </div>
        """
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Cogmate Lesson: {topic}</title>
        <style>
            body {{ font-family: sans-serif; line-height: 1.6; max-width: 800px; margin: auto; padding: 20px; }}
            .section {{ border-bottom: 1px solid #ccc; padding: 20px 0; }}
            h1 {{ color: #2c3e50; }}
            h2 {{ color: #34495e; }}
        </style>
    </head>
    <body>
        <h1>Lesson Pack: {topic}</h1>
        {sections_html}
    </body>
    </html>
    """
    return html

def generate_pptx_placeholder(outline: List[Dict], topic: str) -> str:
    # Basic PPTX placeholder - in reality would use 'python-pptx'
    return f"PPTX binary data placeholder for topic: {topic}"
