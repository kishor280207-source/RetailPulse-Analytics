
from app.services.integrations.csv_connector import read_csv_file
from app.services.integrations.postgres_connector import (
    test_postgres_connection
)
from app.services.integrations.rest_connector import (
    test_rest_connection
)


def get_connector(source_type):

    connectors = {
        "CSV": read_csv_file,
        "PostgreSQL": test_postgres_connection,
        "REST API": test_rest_connection
    }

    connector = connectors.get(source_type)

    if not connector:
        raise ValueError("Unsupported integration type")

    return connector
