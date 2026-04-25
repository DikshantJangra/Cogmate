from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from app.core.export import generate_markdown, generate_pptx
import io

router = APIRouter()

@router.post("/md")
async def export_markdown(content: str = Body(..., embed=True)):
    if not content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    
    file_buf = generate_markdown(content)
    return StreamingResponse(
        file_buf,
        media_type="text/markdown",
        headers={"Content-Disposition": "attachment; filename=cogmate_notes.md"}
    )

@router.post("/pptx")
async def export_pptx(content: str = Body(..., embed=True)):
    if not content.strip():
        raise HTTPException(status_code=400, detail="Content cannot be empty")
    
    file_buf = generate_pptx(content)
    return StreamingResponse(
        file_buf,
        media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
        headers={"Content-Disposition": "attachment; filename=cogmate_slides.pptx"}
    )
