
import csv
import os

from app.connectors.base import BaseConnector


class CSVConnector(BaseConnector):

    def test_connection(self) -> bool:
        file_path = self.config.get("file_path")

        if not file_path:
            raise ValueError("CSV file path is required")

        if not os.path.isfile(file_path):
            raise FileNotFoundError("CSV file not found")

        return True

    def fetch_records(self) -> list[dict]:

        self.test_connection()

        file_path = self.config.get("file_path")
        delimiter = self.config.get("delimiter", ",")

        records = []

        with open(
            file_path,
            mode="r",
            encoding="utf-8-sig",
            newline=""
        ) as file:

            reader = csv.DictReader(
                file,
                delimiter=delimiter
            )

            if not reader.fieldnames:
                raise ValueError("CSV file has no headers")

            for row in reader:
                records.append(dict(row))

        return records
