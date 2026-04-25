from typing import TypedDict, List

class LessonSection(TypedDict):
    title: str
    gagne_event: str
    bloom_level: str
    content: str

class CogmateState(TypedDict):
    transcript_buffer: List[str]
    current_topic: str
    lesson_outline: List[LessonSection]
    eval_score: float
    confusion_points: List[str]
    importance_tags: List[str]
    slide_context: str
    rewrite_count: int
