from jose import jwt
from datetime import datetime, timedelta

SECRET_KEY = "RetailPulseSecretKey123"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
def create_refresh_token(data: dict):

    expire = datetime.utcnow() + timedelta(days=7)

    data.update({"exp": expire})

    return jwt.encode(
        data,
        SECRET_KEY,
        algorithm=ALGORITHM
    )