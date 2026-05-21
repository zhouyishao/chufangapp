from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict

DataT = TypeVar("DataT")


class ApiResponse(BaseModel, Generic[DataT]):
  model_config = ConfigDict(from_attributes=True)

  code: int
  message: str
  data: Optional[DataT]


def ok(data: DataT, message: str = "OK") -> ApiResponse[DataT]:
  return ApiResponse(code=0, message=message, data=data)


def err(code: int, message: str, data: Optional[DataT] = None) -> ApiResponse[Optional[DataT]]:
  return ApiResponse(code=code, message=message, data=data)
