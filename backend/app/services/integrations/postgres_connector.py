
from sqlalchemy import create_engine, text
from sqlalchemy.engine import URL


def test_postgres_connection(config: dict):
    """
    Test an external PostgreSQL connection.
    """

    required = ["host", "port", "database", "username", "password"]

    for field in required:
        if not config.get(field):
            return {
                "success": False,
                "message": f"Missing configuration: {field}"
            }

    engine = None

    try:
        url = URL.create(
            drivername="postgresql+psycopg2",
            username=config["username"],
            password=config["password"],
            host=config["host"],
            port=int(config["port"]),
            database=config["database"]
        )

        engine = create_engine(url, pool_pre_ping=True)

        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))

        return {
            "success": True,
            "message": "PostgreSQL connection successful"
        }

    except Exception as error:
        return {
            "success": False,
            "message": "PostgreSQL connection failed",
            "details": str(error)
        }

    finally:
        if engine:
            engine.dispose()
