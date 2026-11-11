
import csv
import io


def read_csv_file(file_content: bytes):
    """
    Read uploaded CSV file and return records.
    """

    try:
        text = file_content.decode("utf-8-sig")

        reader = csv.DictReader(io.StringIO(text))

        if not reader.fieldnames:
            raise ValueError("CSV file has no column headers")

        records = []

        for row in reader:
            cleaned_row = {
                str(key).strip(): (
                    value.strip() if isinstance(value, str) else value
                )
                for key, value in row.items()
                if key is not None
            }

            records.append(cleaned_row)

        return records

    except UnicodeDecodeError:
        raise ValueError("CSV must use UTF-8 encoding")

    except csv.Error as error:
        raise ValueError(f"Invalid CSV file: {error}")
