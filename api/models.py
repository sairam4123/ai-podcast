import datetime
import functools
from typing import Optional
from sqlmodel import DateTime, Float, SQLModel, Field, Relationship, Column, String, func, JSON
from sqlalchemy.dialects.postgresql import ARRAY
from uuid import uuid4, UUID
from sqlalchemy.sql import and_
from sqlalchemy.orm import foreign

# utcnow = functools.partial(datetime.datetime.now, datetime.timezone.utc)
utcnow = lambda: datetime.datetime.now(datetime.timezone.utc).replace(tzinfo=None)

# class GenerationStyle:
#     def __init__(self, topic: str, style: str, language: str, description: str,):
#         self.topic = topic
#         self.style = style
#         self.language = language
#         self.description = description

#     def __composite_values__(self):
#         return self.topic, self.style, self.language, self.description

#     def __repr__(self):
#         return f"{self.topic} - {self.style} - {self.language} - {self.description}"

class UserProfile(SQLModel, table=True):
    id: UUID = Field(primary_key=True)
    display_name: str
    username: str = Field(unique=True)

    podcasts: list["Podcast"] = Relationship(back_populates="profile")
    play_history: list["UserPlayHistory"] = Relationship(back_populates="user")
    recommendations: list["PodcastRecommendation"] = Relationship(back_populates="user")
    like_history: list["UserLikeHistory"] = Relationship(back_populates="user")
    questions: list["PodcastQuestion"] = Relationship(back_populates="user")

class UserPlayHistory(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="userprofile.id")
    podcast_id: UUID = Field(foreign_key="podcast.id", ondelete="CASCADE")
    last_played_at: datetime.datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime, server_default=func.now(), nullable=False)
    )

    last_known_position: float = Field(default=0.0, sa_column=Column(Float, server_default="0.0", nullable=False))  # in seconds

    user: UserProfile = Relationship(back_populates="play_history")
    podcast: "Podcast" = Relationship()

class UserLikeHistory(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="userprofile.id")
    podcast_id: UUID = Field(foreign_key="podcast.id", ondelete="CASCADE")
    liked_at: datetime.datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime, server_default=func.now(), nullable=False)
    )
    is_like: bool = Field(default=True)  # True for like
    is_dislike: bool = Field(default=False)  # True for dislike

    user: UserProfile = Relationship(back_populates="like_history")
    podcast: "Podcast" = Relationship(back_populates="liked_by_users")

class PodcastRecommendation(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="userprofile.id", ondelete="CASCADE")
    podcast_id: UUID = Field(foreign_key="podcast.id", ondelete="CASCADE")
    recommended_at: datetime.datetime = Field(
        default_factory=utcnow,
        sa_column=Column(DateTime, server_default=func.now(), nullable=False)
    )

    user: UserProfile = Relationship(back_populates="recommendations")
    podcast: "Podcast" = Relationship(back_populates="recommendations")

class Podcast(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: str | None = None
    duration: float | None = None  # Duration in seconds
    cover: str | None = None

    profile_id: UUID | None = Field(foreign_key="userprofile.id", ondelete="SET NULL")
    profile: UserProfile = Relationship(back_populates="podcasts")

    language: str | None = None
    tags: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String)))

    like_count: int = Field(default=0)
    dislike_count: int = Field(default=0)
    view_count: int = Field(default=0)
    trending_score: float = Field(default=0.0)
    is_featured: bool = Field(default=False)
    is_generating: bool = Field(default=False, nullable=True)
    is_public: bool = Field(default=True, nullable=True)

    type: str = Field(default="generated") # generated, interactive
    authors: list["PodcastAuthorPodcast"] = Relationship(back_populates="podcast")
    episodes: list["PodcastEpisode"] = Relationship(back_populates="podcast")

    task: Optional["PodcastGenerationTask"] = Relationship(
        back_populates="podcast",
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
        ),
    )

    conversations: list["Conversation"] = Relationship(
        back_populates="podcast",
    )

    played_by_users: list["UserPlayHistory"] = Relationship(back_populates="podcast")
    liked_by_users: list["UserLikeHistory"] = Relationship(back_populates="podcast")

    recommendations: list["PodcastRecommendation"] = Relationship(back_populates="podcast")

class PodcastAuthorPersona(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    bio: str | None = None
    background: str | None = None
    profile_image: str | None = None
    voice: str | None = None  # Voice identifier for TTS

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

    answers: list["PodcastQuestion"] = Relationship(back_populates="persona")

    created_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), nullable=False))
    updated_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), server_onupdate=func.now(), onupdate=datetime.datetime.now))
    


class PodcastAuthorPodcast(SQLModel, table=True):
    podcast_id: UUID = Field(foreign_key="podcast.id", primary_key=True, ondelete="CASCADE")
    author_id: UUID = Field(foreign_key="podcastauthorpersona.id", primary_key=True)

    podcast: Podcast = Relationship(back_populates="authors")
    author: PodcastAuthorPersona = Relationship(back_populates="authored_podcasts")

    is_host: bool = Field(default=False)

    conversations: list["Conversation"] = Relationship(
        back_populates="podcast_author",
        sa_relationship_kwargs={
            "primaryjoin": lambda: and_(
            Conversation.podcast_id == foreign(PodcastAuthorPodcast.podcast_id), # type: ignore # type: ignore
            Conversation.speaker_id == foreign(PodcastAuthorPodcast.author_id), # type: ignore
            ),
            "uselist": True,
        },
    )


class PodcastAuthorDynamics(SQLModel, table=True):
    author_id: UUID = Field(foreign_key="podcastauthorpersona.id", primary_key=True, ondelete="CASCADE")
    other_author_id: UUID = Field(foreign_key="podcastauthorpersona.id", primary_key=True, ondelete="CASCADE")

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

    podcast_id: UUID = Field(foreign_key="podcast.id", ondelete="CASCADE")
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

    podcast_id: UUID | None = Field(foreign_key="podcast.id", ondelete="CASCADE")
    podcast: Podcast | None = Relationship(back_populates="conversations")

    episode_id: UUID = Field(foreign_key="podcastepisode.id", ondelete="CASCADE")
    episode: PodcastEpisode = Relationship(back_populates="conversations")

    podcast_author: "PodcastAuthorPodcast" = Relationship(
        back_populates="conversations",
        sa_relationship_kwargs={
            "primaryjoin":lambda: and_(
                Conversation.podcast_id == foreign(PodcastAuthorPodcast.podcast_id), # type: ignore
                Conversation.speaker_id == foreign(PodcastAuthorPodcast.author_id), # type: ignore
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

    podcast_id: UUID | None = Field(foreign_key="podcast.id", ondelete="SET NULL")
    podcast: Optional[Podcast] = Relationship(back_populates="task")

    generation_data: dict | None = Field(
        default=None, sa_column=Column(JSON, nullable=True)
    )  # JSON or other data related to the generation task

    created_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), nullable=False))
    updated_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), server_onupdate=func.now(), onupdate=datetime.datetime.now))

class PodcastQuestion(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    podcast_id: UUID = Field(foreign_key="podcast.id", ondelete="CASCADE")
    question: str
    answer: str | None = None
    persona_id: UUID | None = Field(foreign_key="podcastauthorpersona.id")  # The persona who answered the question
    user_id: UUID | None = Field(foreign_key="userprofile.id")  # The user who asked the question
    persona: PodcastAuthorPersona | None = Relationship()
    user: UserProfile | None = Relationship(back_populates="questions")

    created_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), nullable=False))
    updated_at: datetime.datetime | None = Field(
        default_factory=utcnow,sa_column=Column(
        DateTime, server_default=func.now(), server_onupdate=func.now(), onupdate=datetime.datetime.now))


class Quota(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    quota_key: str = Field()
    max_value: int = Field()


class QuotaPlanOverride(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    plan_id: UUID = Field(foreign_key="subscriptionplan.id", ondelete="CASCADE")
    value: int = Field()
    quota_id: UUID = Field(foreign_key="quota.id", ondelete="CASCADE")


class SubscriptionPlan(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    plan_key: str = Field()

    name: str = Field()

class QuotaUsage(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    
    quota_id: UUID = Field(foreign_key="quota.id", ondelete="CASCADE")
    user_id: UUID = Field(foreign_key="userprofile.id", ondelete="CASCADE")

    value: int = Field()

    carryover: int = Field()


class UserSubscription(SQLModel, table=True):
    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: UUID = Field(foreign_key="userprofile.id", ondelete="CASCADE")
    plan_id: UUID = Field(foreign_key="subscriptionplan.id", ondelete="SET NULL", nullable=True)
    start_date: datetime.datetime = Field(default_factory=utcnow)
    end_date: datetime.datetime | None = None
    is_active: bool = Field(default=True)