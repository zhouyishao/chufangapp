from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserCreate(BaseModel):
  username: str = Field(min_length=3, max_length=32)
  password: str = Field(min_length=6, max_length=72)
  nickname: Optional[str] = Field(default=None, max_length=32)


class UserRead(BaseModel):
  id: int
  username: str
  nickname: Optional[str]
  created_at: datetime
  updated_at: datetime


class UserListItem(BaseModel):
  id: int
  username: str
  nickname: Optional[str]
