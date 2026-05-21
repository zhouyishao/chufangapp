from typing import Generic, List, TypeVar

from pydantic import BaseModel, Field

ItemT = TypeVar("ItemT")


class PageParams(BaseModel):
  page: int = Field(default=1, ge=1)
  page_size: int = Field(default=20, ge=1, le=100)


class Paginated(BaseModel, Generic[ItemT]):
  items: List[ItemT]
  page: int
  page_size: int
  total: int
