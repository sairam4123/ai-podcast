import contextlib
from sqlalchemy import NullPool
from sqlmodel import create_engine, Session


# Make it async

engine = create_engine(
    "postgresql://postgres:aipodcast-123@db.kzgbfmhlcmfjknkbvggg.supabase.co:5432/postgres",
    echo=True, poolclass=NullPool)

@contextlib.contextmanager
def session_maker():
    sess = Session(engine)
    try:
        yield sess
    except Exception as e:
        sess.rollback()
        raise e
    finally:
        sess.close()

def get_session():
    with session_maker() as session:
        yield session