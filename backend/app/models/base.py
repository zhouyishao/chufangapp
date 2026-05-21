from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel


class TimestampSoftDeleteModel(SQLModel):
  id: Optional[int] = Field(default=None, primary_key=True)
  created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
  updated_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)
  deleted_at: Optional[datetime] = Field(default=None, nullable=True)
