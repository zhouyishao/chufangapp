from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session

from app.core.database import get_session
from app.core.pagination import PageParams, Paginated
from app.core.response import ApiResponse, ok
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserListItem, UserRead
from app.services.user_service import UserService

router = APIRouter()

user_repository = UserRepository()
user_service = UserService(user_repository=user_repository)


def get_db_session() -> Session:
  with get_session() as session:
    yield session


@router.post("", response_model=ApiResponse[UserRead])
def create_user(payload: UserCreate, session: Session = Depends(get_db_session)):
  try:
    user = user_service.create_user(session, payload)
  except ValueError as exc:
    if str(exc) == "USERNAME_ALREADY_EXISTS":
      raise HTTPException(status_code=400, detail="username already exists")
    raise
  return ok(UserRead.model_validate(user))


@router.get("", response_model=ApiResponse[Paginated[UserListItem]])
def list_users(
  params: PageParams = Depends(),
  session: Session = Depends(get_db_session),
):
  users, total = user_repository.list_paginated(
    session=session, page=params.page, page_size=params.page_size
  )
  data = Paginated[UserListItem](
    items=[UserListItem.model_validate(u) for u in users],
    page=params.page,
    page_size=params.page_size,
    total=total,
  )
  return ok(data)


@router.get("/{user_id}", response_model=ApiResponse[UserRead])
def get_user(user_id: int, session: Session = Depends(get_db_session)):
  user = user_repository.get_by_id(session, user_id)
  if user is None:
    raise HTTPException(status_code=404, detail="user not found")
  return ok(UserRead.model_validate(user))


@router.delete("/{user_id}", response_model=ApiResponse[UserRead])
def delete_user(user_id: int, session: Session = Depends(get_db_session)):
  try:
    user = user_service.delete_user(session, user_id)
  except ValueError as exc:
    if str(exc) == "USER_NOT_FOUND":
      raise HTTPException(status_code=404, detail="user not found")
    raise
  return ok(UserRead.model_validate(user))
