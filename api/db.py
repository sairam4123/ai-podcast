import contextlib
from sqlmodel import create_engine, Session


# Make it async

engine = create_engine(
    "postgresql://postgres:aipodcast-123@db.kzgbfmhlcmfjknkbvggg.supabase.co:5432/postgres",)

@contextlib.contextmanager
def session_maker():
    yield Session(engine)

def get_session():
    with session_maker() as session:
        yield session