from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

# We will use the same DATABASE_URL as the frontend
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:pass@localhost:5432/cogmate").replace("postgresql://", "postgresql+asyncpg://")
engine = create_async_engine(DATABASE_URL)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
