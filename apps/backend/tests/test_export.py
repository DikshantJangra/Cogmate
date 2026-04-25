from app.core.export import generate_html_lesson_pack

def test_generate_html_lesson_pack():
    outline = [
        {"title": "Intro", "gagne_event": "Gain Attention", "content": "Welcome!"}
    ]
    html = generate_html_lesson_pack(outline, "Test Topic")
    assert "Lesson Pack: Test Topic" in html
    assert "Gain Attention" in html
    assert "Welcome!" in html
