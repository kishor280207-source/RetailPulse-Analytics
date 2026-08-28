from sqlalchemy import Column, Integer, String, ForeignKey, Text
from app.database.database import Base


class ImportError(Base):
    __tablename__ = "import_errors"

    id = Column(Integer, primary_key=True, index=True)
    import_id = Column(Integer, ForeignKey("import_history.id"), nullable=False)

    row_number = Column(Integer, nullable=False)
    error_reason = Column(String, nullable=False)
    row_data = Column(Text, nullable=True) 