from sqlalchemy import Column
from sqlalchemy import Integer
from sqlalchemy import String
from sqlalchemy import DateTime
from sqlalchemy.sql import func

from app.database.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, unique=True, nullable=False)

    industry = Column(String)

    email = Column(String, unique=True)

    address = Column(String)

    phone = Column(String)

    created_at = Column(DateTime(timezone=True), server_default=func.now())