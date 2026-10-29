from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database.database import Base


class AccessReview(Base):
    __tablename__ = "access_reviews"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, nullable=False)

    user_id = Column(Integer, nullable=False)
    user_name = Column(String, nullable=True)

    reviewed_by = Column(Integer, nullable=True)
    reviewed_by_name = Column(String, nullable=True)

    role_at_review = Column(String, nullable=True)
    decision = Column(String, nullable=False)  
    new_role = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    review_period = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
