import contextlib
from sqlalchemy import NullPool
from sqlmodel import create_engine, Session
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine

# Make it async

engine = create_async_engine(
    "postgresql+asyncpg://postgres:aipodcast-123@db.kzgbfmhlcmfjknkbvggg.supabase.co:5432/postgres",
    echo=True, poolclass=NullPool)

@contextlib.asynccontextmanager
async def session_maker():
    sess = AsyncSession(engine)
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