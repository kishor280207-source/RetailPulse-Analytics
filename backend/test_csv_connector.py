
from app.connectors.csv_connector import CSVConnector

config = {
    "file_path": "test_connector.csv"
}

connector = CSVConnector(config)

print("Connection:", connector.test_connection())

records = connector.fetch_records()

print("Total Records:", len(records))

for record in records:
    print(record)
