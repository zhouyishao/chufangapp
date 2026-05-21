from typing import Optional

from sqlmodel import Field

from app.models.base import TimestampSoftDeleteModel


class User(TimestampSoftDeleteModel, table=True):
  __tablename__ = "users"

  username: str = Field(index=True, nullable=False, unique=True, max_length=32)
  password_hash: str = Field(nullable=False, max_length=255)
  nickname: Optional[str] = Field(default=None, max_length=32)
