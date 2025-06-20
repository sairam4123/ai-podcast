import contextlib
from sqlalchemy import NullPool
from sqlmodel import create_engine, Session


# Make it async

engine = create_engine(
    "postgresql://postgres:aipodcast-123@db.kzgbfmhlcmfjknkbvggg.supabase.co:5432/postgres?pgbouncer=true",
    echo=True, poolclass=NullPool)

@contextlib.contextmanager
def session_maker():
    yield Session(engine)

def get_session():
    with session_maker() as session:
        yield session