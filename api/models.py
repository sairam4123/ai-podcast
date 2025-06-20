import datetime
import functools
from typing import Optional
from sqlmodel import DateTime, SQLModel, Field, Relationship, Column, String, func
from sqlalchemy.dialects.postgresql import ARRAY
from uuid import uuid4, UUID
from sqlalchemy.sql import and_
from sqlalchemy.orm import foreign

utcnow = functools.partial(datetime.datetime.now, tz=datetime.timezone.utc)

class UserProfile(SQLModel, table=True):
    id: UUID = Field(primary_key=True)
    display_name: str
    username: str = Field(unique=True)

    podcasts: list["Podcast"] = Relationship(back_populates="profile")


class Podcast(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: str | None = None
    duration: float | None = None  # Duration in seconds
    cover: str | None = None

    profile_id: UUID | None = Field(foreign_key="userprofile.id")
    profile: UserProfile = Relationship(back_populates="podcasts")

    language: str | None = None
    tags: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String)))

    like_count: int = Field(default=0)
    dislike_count: int = Field(default=0)
    view_count: int = Field(default=0)
    trending_score: float = Field(default=0.0)
    is_featured: bool = Field(default=False)

    authors: list["PodcastAuthorPodcast"] = Relationship(back_populates="podcast")
    episodes: list["PodcastEpisode"] = Relationship(back_populates="podcast")

    task: Optional["PodcastGenerationTask"] = Relationship(
        back_populates="podcast",
        sa_relationship_kwargs={
        "lazy": "joined",
    }
    )
    created_at: datetime.datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime, server_default=func.now(), nullable=False)
    )
    updated_at: datetime.datetime = Field(
        default_factory=utcnow,
        sa_column=Column(
            DateTime,
            server_default=func.now(),
            onupdate=func.now(),
            nullable=False,
        )
    )

    conversations: list["Conversation"] = Relationship(
        back_populates="podcast",
    )

class PodcastAuthorPersona(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    bio: str | None = None
    background: str | None = None
    profile_image: str | None = None

    gender: str | None = None
    country: str | None = None

    friendlyness: float = Field(default=0.0)
    trustworthiness: float = Field(default=0.0)
    expertise: str | None = None

    authored_podcasts: list["PodcastAuthorPodcast"] = Relationship(back_populates="author")

    outgoing_relationships: list["PodcastAuthorDynamics"] = Relationship(
        back_populates="author",
        sa_relationship_kwargs={"foreign_keys": "[PodcastAuthorDynamics.other_author_id]"}
    )
    incoming_relationships: list["PodcastAuthorDynamics"] = Relationship(
        back_populates="other_author",
        sa_relationship_kwargs={"foreign_keys": "[PodcastAuthorDynamics.author_id]"}
    )

    created_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), nullable=False))
    updated_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), server_onupdate=func.now(), onupdate=datetime.datetime.now))
    


class PodcastAuthorPodcast(SQLModel, table=True):
    podcast_id: UUID = Field(foreign_key="podcast.id", primary_key=True)
    author_id: UUID = Field(foreign_key="podcastauthorpersona.id", primary_key=True)

    podcast: Podcast = Relationship(back_populates="authors")
    author: PodcastAuthorPersona = Relationship(back_populates="authored_podcasts")

    is_host: bool = Field(default=False)

    conversations: list["Conversation"] = Relationship(
        back_populates="podcast_author",
        sa_relationship_kwargs={
            "lazy": "joined",
            "primaryjoin": lambda: and_(
            Conversation.podcast_id == foreign(PodcastAuthorPodcast.podcast_id),
            Conversation.speaker_id == foreign(PodcastAuthorPodcast.author_id),
            ),
            "uselist": True,
        }
    )


class PodcastAuthorDynamics(SQLModel, table=True):
    author_id: UUID = Field(foreign_key="podcastauthorpersona.id", primary_key=True)
    other_author_id: UUID = Field(foreign_key="podcastauthorpersona.id", primary_key=True)

    author: PodcastAuthorPersona = Relationship(back_populates="outgoing_relationships", sa_relationship_kwargs={
        "foreign_keys": "[PodcastAuthorDynamics.author_id]"
    })
    other_author: PodcastAuthorPersona = Relationship(back_populates="incoming_relationships", sa_relationship_kwargs={
        "foreign_keys": "[PodcastAuthorDynamics.other_author_id]"
    })

    trust: float = Field(default=0.0)
    likes: int = Field(default=0)
    hates: int = Field(default=0)
    relationship: str | None = None
    background: str | None = None


class PodcastEpisode(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    number: int
    title: str
    description: str | None = None
    cover: str | None = None
    audio_file: str | None = None  # Path to the audio file

    podcast_id: UUID = Field(foreign_key="podcast.id")
    podcast: Podcast = Relationship(back_populates="episodes")

    conversations: list["Conversation"] = Relationship(back_populates="episode")

    created_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), nullable=False))
    updated_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), server_onupdate=func.now(), onupdate=datetime.datetime.now))


class Conversation(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    text: str
    start_time: float | None = None
    end_time: float | None = None

    speaker_id: UUID = Field(foreign_key="podcastauthorpersona.id")
    speaker: PodcastAuthorPersona = Relationship()

    podcast_id: UUID | None = Field(foreign_key="podcast.id")
    podcast: Podcast | None = Relationship(back_populates="conversations")

    episode_id: UUID = Field(foreign_key="podcastepisode.id")
    episode: PodcastEpisode = Relationship(back_populates="conversations")

    podcast_author: "PodcastAuthorPodcast" = Relationship(
        back_populates="conversations",
        sa_relationship_kwargs={
            "lazy": "joined",
            "primaryjoin":lambda: and_(
                Conversation.podcast_id == foreign(PodcastAuthorPodcast.podcast_id),
                Conversation.speaker_id == foreign(PodcastAuthorPodcast.author_id),
            ),
            "uselist": False,
        },
    )

class PodcastGenerationTask(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    status: str = Field(default="pending")  # pending, in_progress, completed, failed
    progress: int = Field(default=0)  # Progress percentage (0-100)

    progress_message: str | None = None
    error_message: str | None = None

    podcast_id: UUID | None = Field(foreign_key="podcast.id")
    podcast: Optional[Podcast] = Relationship(back_populates="task", sa_relationship_kwargs={
        "lazy": "joined",
    })

    created_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), nullable=False))
    updated_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), server_onupdate=func.now(), onupdate=datetime.datetime.now))