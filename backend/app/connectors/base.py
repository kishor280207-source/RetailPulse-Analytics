
from abc import ABC, abstractmethod
from typing import Any


class BaseConnector(ABC):

    def __init__(self, config: dict):
        self.config = config

    @abstractmethod
    def test_connection(self) -> bool:
        pass

    @abstractmethod
    def fetch_records(self) -> list[dict[str, Any]]:
        pass
