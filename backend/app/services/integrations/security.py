
import os
from cryptography.fernet import Fernet


def get_fernet():
    key = os.getenv("INTEGRATION_ENCRYPTION_KEY")

    if not key:
        raise RuntimeError(
            "INTEGRATION_ENCRYPTION_KEY is not configured"
        )

    return Fernet(key.encode())


def encrypt_credentials(credentials):

    if not credentials:
        return None

    import json

    encrypted = get_fernet().encrypt(
        json.dumps(credentials).encode()
    )

    return encrypted.decode()


def decrypt_credentials(encrypted_credentials):

    if not encrypted_credentials:
        return {}

    import json

    decrypted = get_fernet().decrypt(
        encrypted_credentials.encode()
    )

    return json.loads(decrypted.decode())
