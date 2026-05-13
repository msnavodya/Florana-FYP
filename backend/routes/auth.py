# Define backend API routes for Auth features.
from datetime import datetime, timedelta

from fastapi import APIRouter, HTTPException, Request
from pymongo.errors import AutoReconnect, ServerSelectionTimeoutError

try:
    from .. import database
    from ..schemas.user import UserCreate, UserLogin
    from ..utils import auth_store
    from ..utils.security import create_token, hash_password, verify_password
except ImportError:
    import database
    from schemas.user import UserCreate, UserLogin
    import utils.auth_store as auth_store
    from utils.security import create_token, hash_password, verify_password


router = APIRouter(prefix="/auth", tags=["Auth"])

ACCESS_TOKEN_EXPIRE_MINUTES = 60
REFRESH_TOKEN_EXPIRE_DAYS = 7


def _create_tokens(email, role="user"):
    access_token = create_token(
        data={"sub": email, "role": role},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    refresh_token = create_token(
        data={"sub": email, "role": role},
        expires_delta=timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS),
    )
    return access_token, refresh_token


def _user_response(user_data, user_id):
    return {
        "_id": user_id,
        "id": user_id,
        "email": user_data["email"],
        "full_name": user_data.get("full_name", ""),
        "contact": user_data.get("contact"),
        "location": user_data.get("location"),
        "role": user_data.get("role", "user"),
    }


@router.post("/signup")
def signup(user: UserCreate):
    try:
        users_collection = database.get_users_collection()
        use_local_store = users_collection is None

        if len(user.password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

        normalized_email = user.email.lower()

        if use_local_store:
            existing_user = auth_store.find_user_by_email(normalized_email)
        else:
            existing_user = users_collection.find_one({"email": normalized_email})

        if existing_user:
            raise HTTPException(status_code=400, detail="Email already registered")

        hashed_pw = hash_password(user.password)

        if use_local_store:
            stored_user = auth_store.create_user(
                {
                    "full_name": user.full_name,
                    "email": normalized_email,
                    "hashed_password": hashed_pw,
                    "contact": user.contact,
                    "location": user.location,
                }
            )
            if stored_user is None:
                raise HTTPException(status_code=400, detail="Email already registered")
            user_id = stored_user["_id"]
            response_user = _user_response(stored_user, user_id)
        else:
            user_dict = user.dict()
            user_dict["email"] = normalized_email
            user_dict["hashed_password"] = hashed_pw
            user_dict.pop("password")
            user_dict["created_at"] = datetime.utcnow()
            user_dict["is_active"] = True
            user_dict["role"] = "user"

            result = users_collection.insert_one(user_dict)
            user_id = str(result.inserted_id)
            response_user = _user_response(user_dict, user_id)

        access_token, refresh_token = _create_tokens(normalized_email, "user")

        return {
            "message": "User created successfully",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": "user",
            "user": response_user,
            "storage": "local" if use_local_store else "mongodb",
        }
    except HTTPException:
        raise
    except (ServerSelectionTimeoutError, AutoReconnect) as e:
        print(f"MongoDB connection error: {str(e)}")
        raise HTTPException(status_code=503, detail="Database connection failed. Please start MongoDB.")
    except Exception as e:
        print(f"Signup error: {str(e)}")
        raise HTTPException(status_code=500, detail="Signup failed. Please try again.")


@router.post("/login")
def login(user: UserLogin, request: Request):
    try:
        users_collection = database.get_users_collection()
        login_history_collection = database.get_login_history_collection()
        use_local_store = users_collection is None

        normalized_email = user.email.lower()

        if use_local_store:
            auth_store.ensure_admin_user()
            db_user = auth_store.find_user_by_email(normalized_email)
        else:
            if normalized_email == "admin@florana.com":
                existing_admin = users_collection.find_one({"email": normalized_email})
                if not existing_admin:
                    users_collection.insert_one(
                        {
                            "full_name": "Florana Admin",
                            "email": normalized_email,
                            "hashed_password": hash_password("123456"),
                            "contact": None,
                            "location": None,
                            "created_at": datetime.utcnow(),
                            "is_active": True,
                            "role": "admin",
                        }
                    )
            db_user = users_collection.find_one({"email": normalized_email})

        if not db_user:
            raise HTTPException(status_code=401, detail="Invalid email or password")

        if not db_user.get("is_active", True):
            raise HTTPException(status_code=403, detail="Account is inactive")

        hashed_pw = db_user.get("hashed_password", "")
        if not hashed_pw or not verify_password(user.password, hashed_pw):
            raise HTTPException(status_code=401, detail="Invalid email or password")

        user_id = str(db_user["_id"])
        role = db_user.get("role", "user")
        access_token, refresh_token = _create_tokens(normalized_email, role)
        response_user = _user_response(db_user, user_id)

        try:
            login_record = {
                "user_email": normalized_email,
                "user_id": user_id,
                "login_time": datetime.utcnow().isoformat(),
                "ip_address": request.client.host if request.client else "unknown",
            }
            if use_local_store or login_history_collection is None:
                auth_store.save_login(login_record)
            else:
                login_history_collection.insert_one(login_record)
        except Exception as e:
            print(f"Warning: Failed to save login history: {str(e)}")

        return {
            "message": "Login successful",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "role": role,
            "user": response_user,
            "storage": "local" if use_local_store else "mongodb",
        }
    except HTTPException:
        raise
    except (ServerSelectionTimeoutError, AutoReconnect) as e:
        print(f"MongoDB connection error: {str(e)}")
        raise HTTPException(status_code=503, detail="Database connection failed. Please start MongoDB.")
    except Exception as e:
        print(f"Login error: {str(e)}")
        raise HTTPException(status_code=500, detail="Login failed. Please try again.")
