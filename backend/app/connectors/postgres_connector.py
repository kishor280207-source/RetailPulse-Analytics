
from sqlalchemy import create_engine, MetaData, Table, select

from app.connectors.base import BaseConnector


class PostgreSQLConnector(BaseConnector):

    def __init__(self, config):
        super().__init__(config)

        self.engine = create_engine(
            config["connection_url"],
            pool_pre_ping=True
        )

    def test_connection(self):
        try:
            with self.engine.connect() as connection:
                connection.execute(select(1))

            return True

        except Exception as error:
            raise ConnectionError(
                f"PostgreSQL connection failed: {error}"
            )

    def fetch_records(self):
        self.test_connection()

        table_name = self.config.get("table_name")

        if not table_name:
            raise ValueError("Table name is required")

        metadata = MetaData()

        table = Table(
            table_name,
            metadata,
            autoload_with=self.engine
        )

        query = select(table)

        with self.engine.connect() as connection:
            result = connection.execute(query)

            records = [
                dict(row._mapping)
                for row in result
            ]

        return records

    def close(self):
        self.engine.dispose()
