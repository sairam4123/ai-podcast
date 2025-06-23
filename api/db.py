import contextlib
from sqlalchemy import NullPool
from sqlmodel import create_engine, Session
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

# Make it async

# db_url = "postgresql+asyncpg://postgres:aipodcast-123@db.kzgbfmhlcmfjknkbvggg.supabase.co:5432/postgres"
db_url = "postgresql+asyncpg://postgres.kzgbfmhlcmfjknkbvggg:ai-podcast-123@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"
engine = create_async_engine(
    db_url,
    echo=True)

@contextlib.asynccontextmanager
async def session_maker():
    sess = AsyncSession(engine, expire_on_commit=False)
    try:
        yield sess
    except Exception as e:
        await sess.rollback()
        raise e
    finally:
        await sess.close()

async def get_session():
    async with session_maker() as session:
        yield session