from sqlmodel import SQLModel, Field, Relationship, Column, String
from sqlalchemy.dialects.postgresql import ARRAY
from uuid import uuid4, UUID


class UserProfile(SQLModel, table=True):
    id: UUID | None = Field(default_factory=uuid4, primary_key=True)
    display_name: str

    podcasts: list["Podcast"] = Relationship(back_populates="profile")


class Podcast(SQLModel, table=True):
    id: UUID | None = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: str | None = None
    duration: int | None = None  # Duration in seconds
    cover: str | None = None

    profile_id: UUID = Field(foreign_key="userprofile.id")
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


class PodcastAuthorPersona(SQLModel, table=True):
    id: UUID | None = Field(default_factory=uuid4, primary_key=True)
    name: str
    bio: str | None = None
    background: str | None = None
    profile_image: str | None = None

    friendlyness: float = Field(default=0.0)
    trustworthiness: float = Field(default=0.0)
    expertise: str | None = None

    authored_podcasts: list["PodcastAuthorPodcast"] = Relationship(back_populates="author")

    outgoing_relationships: list["PodcastAuthorDynamics"] = Relationship(
        back_populates="author",
        sa_relationship_kwargs={"primaryjoin": "PodcastAuthorDynamics.author_id == PodcastAuthorPersona.id"}
    )
    incoming_relationships: list["PodcastAuthorDynamics"] = Relationship(
        back_populates="other_author",
        sa_relationship_kwargs={"primaryjoin": "PodcastAuthorDynamics.other_author_id == PodcastAuthorPersona.id"}
    )


class PodcastAuthorPodcast(SQLModel, table=True):
    podcast_id: UUID = Field(foreign_key="podcast.id", primary_key=True)
    author_id: UUID = Field(foreign_key="podcastauthorpersona.id", primary_key=True)

    podcast: Podcast = Relationship(back_populates="authors")
    author: PodcastAuthorPersona = Relationship(back_populates="authored_podcasts")

    is_host: bool = Field(default=False)


class PodcastAuthorDynamics(SQLModel, table=True):
    author_id: UUID = Field(foreign_key="podcastauthorpersona.id", primary_key=True)
    other_author_id: UUID = Field(foreign_key="podcastauthorpersona.id", primary_key=True)

    author: PodcastAuthorPersona = Relationship(back_populates="outgoing_relationships")
    other_author: PodcastAuthorPersona = Relationship(back_populates="incoming_relationships")

    trust: float = Field(default=0.0)
    likes: int = Field(default=0)
    hates: int = Field(default=0)
    relationship: str | None = None
    background: str | None = None


class PodcastEpisode(SQLModel, table=True):
    id: UUID | None = Field(default_factory=uuid4, primary_key=True)
    number: int
    title: str
    description: str | None = None
    cover: str | None = None
    audio_file: str

    podcast_id: UUID = Field(foreign_key="podcast.id")
    podcast: Podcast = Relationship(back_populates="episodes")

    conversations: list["Conversation"] = Relationship(back_populates="episode")


class Conversation(SQLModel, table=True):
    id: UUID | None = Field(default_factory=uuid4, primary_key=True)
    text: str
    start_time: int | None = None
    end_time: int | None = None

    speaker_id: UUID = Field(foreign_key="podcastauthorpersona.id")
    speaker: PodcastAuthorPersona = Relationship()

    episode_id: UUID = Field(foreign_key="podcastepisode.id")
    episode: PodcastEpisode = Relationship(back_populates="conversations")
