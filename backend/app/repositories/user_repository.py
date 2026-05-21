from datetime import datetime
from typing import List, Optional, Tuple

from sqlmodel import Session, col, func, select

from app.models.user import User


class UserRepository:
  def get_by_id(self, session: Session, user_id: int) -> Optional[User]:
    statement = select(User).where(User.id == user_id, User.deleted_at.is_(None))
    return session.exec(statement).first()

  def get_by_username(self, session: Session, username: str) -> Optional[User]:
    statement = select(User).where(
      col(User.username) == username,
      User.deleted_at.is_(None),
    )
    return session.exec(statement).first()

  def create(self, session: Session, user: User) -> User:
    session.add(user)
    session.commit()
    session.refresh(user)
    return user

  def list_paginated(
    self, session: Session, page: int, page_size: int
  ) -> Tuple[List[User], int]:
    count_statement = (
      select(func.count())
      .select_from(User)
      .where(User.deleted_at.is_(None))
    )
    total = session.exec(count_statement).one()

    statement = (
      select(User)
      .where(User.deleted_at.is_(None))
      .order_by(User.id.desc())
      .offset((page - 1) * page_size)
      .limit(page_size)
    )
    users = list(session.exec(statement).all())
    return users, int(total)

  def soft_delete(self, session: Session, user: User) -> User:
    user.deleted_at = datetime.utcnow()
    user.updated_at = datetime.utcnow()
    session.add(user)
    session.commit()
    session.refresh(user)
    return user
