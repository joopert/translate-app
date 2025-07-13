from datetime import datetime
from enum import Enum
from urllib.parse import urlparse

from beanie import Document
from pydantic import BaseModel, Field, field_validator

from backend.utils.helpers import basic_normalize


class LearningStyle(str, Enum):
    NO_PREFERENCE = "no preference"  # cannot just remove this, because in site override we already select null;
    # how do we know if it's null or no preference?
    VISUAL = "visual"  # create diagrams
    # AUDIO = "audio"
    ANALOGIES = "analogies"  # use analogies


class FamiliarityLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class Config(BaseModel):
    familiarity: FamiliarityLevel | None = Field(None, description="The user's familiarity level with the topic.")
    background: str | None = Field(None, description="The user's background or prior knowledge. ")
    context: str | None = Field(None, description="Add specific context or scenario for the interaction.")
    strict_adherence: bool | None = Field(
        None, description="Whether the AI should strictly adhere to the provided page content."
    )
    summary: bool | None = Field(None, description="Whether a summary of the information is required.")
    purpose: str | None = Field(None, description="The primary purpose or goal of the user's interaction.")
    learning_style: LearningStyle | None = Field(None, description="The user's preferred learning style.")

    @field_validator("background", "context", "purpose", mode="before")
    @classmethod
    def empty_str_to_none(cls, v: str | None) -> str | None:
        """Replace empty string with None."""
        if v == "":
            return None
        return v


class ProfileIn(BaseModel):
    name: str = Field(..., description="Display name for the profile")
    config: Config


class Profile(Document, ProfileIn):
    owner_id: str = Field(..., description="Owner ID", exclude=True)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    @classmethod
    async def find_by_name(cls, owner_id: str, name: str) -> "Profile | None":
        return await cls.find_one({"owner_id": owner_id, "name": name})

    class Settings:
        name = "profiles"
        indexes = [
            "owner_id",
            "id",
        ]

    # @classmethod
    # async def find_by_domain_and_site_id(cls, domain: str, site_id: str) -> "Site | None":
    #     """Find a site by domain and site_id"""
    #     return await cls.find_one({"domain": domain, "site_id": site_id, "active": True})


class WebsiteOverrideCreate(BaseModel):
    domain: str = Field(..., description="Website domain (e.g., 'stackoverflow.com')")
    profile_id: str | None = Field(None, description="Base profile ID")
    config: Config = Field(..., description="Specific overrides for this website")

    @field_validator("domain", mode="after")
    def normalize_domain(cls, v: str) -> str:
        """
        Normalizes the domain by removing 'www.' and scheme/path.
        e.g., 'https://www.google.com/search' -> 'google.com'
        """
        if not v:
            return v
        normalized_url = basic_normalize(v)
        print(f"{normalized_url=}")
        parsed_url = urlparse(normalized_url)
        print(f"{parsed_url=}")
        return parsed_url.hostname or v


class WebsiteOverride(Document, WebsiteOverrideCreate):
    owner_id: str = Field(..., description="Owner ID", exclude=True)
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)

    class Settings:
        name = "website_overrides"
        indexes = [
            "owner_id",
            "domain",
        ]


# TODO: need to set default_profile in user settings
