# utils/security.py
from passlib.context import CryptContext
from passlib.exc import UnknownHashError
from datetime import datetime, timedelta
from jose import jwt

SECRET_KEY = "your_secret_key_here"
ALGORITHM = "HS256"

# Use pbkdf2_sha256 as the default hasher to avoid bcrypt backend issues on this setup.
# Keep bcrypt in the list so previously-created bcrypt hashes can still be verified.
pwd_context = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    """Hash a password using the default passlib scheme."""
    try:
        return pwd_context.hash(password)
    except Exception as e:
        print(f"Error hashing password: {str(e)}")
        raise

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    # Handle empty or invalid hashes
    if not hashed_password or not password:
        return False
    
    try:
        result = pwd_context.verify(password, hashed_password)
        return result
    except UnknownHashError:
        # If hash is unrecognized, return False (invalid credentials)
        print("Warning: Invalid hash format detected for password verification")
        return False
    except Exception as e:
        print(f"Error verifying password: {str(e)}")
        return False

def create_token(data: dict, expires_delta: timedelta):
    """Create a JWT token"""
    try:
        to_encode = data.copy()
        expire = datetime.utcnow() + expires_delta
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    except Exception as e:
        print(f"Error creating token: {str(e)}")
        raise
