from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import ForeignKey
from sqlalchemy import DateTime
from sqlalchemy.sql import func

from app.database.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, ForeignKey("companies.id"))

    name = Column(String, nullable=False)

    email = Column(String, unique=True)

    password = Column(String)

    role = Column(String)

    status = Column(String)

    last_login = Column(DateTime)

    created_at = Column(DateTime(timezone=True), server_default=func.now())