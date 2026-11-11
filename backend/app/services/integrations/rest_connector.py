
import requests


def test_rest_connection(config: dict, credentials: dict = None):
    """
    Test an external REST API.
    """

    url = config.get("url")

    if not url:
        return {
            "success": False,
            "message": "REST API URL is required"
        }

    if not url.startswith(("https://", "http://")):
        return {
            "success": False,
            "message": "Invalid REST API URL"
        }

    headers = config.get("headers", {}).copy()

    credentials = credentials or {}

    token = credentials.get("token")

    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        response = requests.get(
            url,
            headers=headers,
            timeout=15
        )

        response.raise_for_status()

        return {
            "success": True,
            "message": "REST API connection successful",
            "details": f"HTTP Status: {response.status_code}"
        }

    except requests.RequestException as error:
        return {
            "success": False,
            "message": "REST API connection failed",
            "details": str(error)
        }
