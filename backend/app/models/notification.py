from sqlalchemy import Column, Integer, String, DateTime, Boolean
from datetime import datetime

from app.database.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)

    company_id = Column(Integer, nullable=False)
    user_id = Column(Integer, nullable=True) 

    type = Column(String, nullable=False)
    priority = Column(String, default="Medium") 

    title = Column(String, nullable=False)
    message = Column(String, nullable=False)

    resource_type = Column(String, nullable=True) 
    resource_id = Column(String, nullable=True)

    is_read = Column(Boolean, default=False)
    read_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)  

    
    dedup_key = Column(String, nullable=True, index=True)

    status = Column(String, nullable=True)