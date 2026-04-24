from fastapi import Request, HTTPException, Depends
from sqlalchemy.future import select
from sqlalchemy import text
from app.core.database import get_db

async def get_current_user(request: Request, db = Depends(get_db)):
    session_token = request.cookies.get("better-auth.session_token")
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Direct query to the session table created by Prisma/Better-Auth
    result = await db.execute(
        text("SELECT \"userId\" FROM session WHERE token = :token AND \"expiresAt\" > NOW()"),
        {"token": session_token}
    )
    session = result.fetchone()
    
    if not session:
        raise HTTPException(status_code=401, detail="Invalid or expired session")
        
    return {"id": session[0]}
