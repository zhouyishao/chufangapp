from datetime import datetime

from sqlmodel import Session

from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate


class UserService:
  def __init__(self, user_repository: UserRepository) -> None:
    self.user_repository = user_repository

  def create_user(self, session: Session, payload: UserCreate) -> User:
    existing = self.user_repository.get_by_username(session, payload.username)
    if existing is not None:
      raise ValueError("USERNAME_ALREADY_EXISTS")

    now = datetime.utcnow()
    user = User(
      username=payload.username,
      password_hash=hash_password(payload.password),
      nickname=payload.nickname,
      created_at=now,
      updated_at=now,
    )
    return self.user_repository.create(session, user)

  def delete_user(self, session: Session, user_id: int) -> User:
    user = self.user_repository.get_by_id(session, user_id)
    if user is None:
      raise ValueError("USER_NOT_FOUND")
    return self.user_repository.soft_delete(session, user)
