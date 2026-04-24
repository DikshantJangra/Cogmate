from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from .auth import get_current_user

app = FastAPI(title="Cogmate API", version="0.1.0")

# Set up CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the actual frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Welcome to Cogmate API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.get("/me")
async def read_users_me(current_user = Depends(get_current_user)):
    return current_user

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
