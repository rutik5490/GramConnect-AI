from datetime import datetime, timedelta
from typing import Iterable

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import get_settings
from app.database import get_db
from app.models.core_models import User

settings = get_settings()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_minutes: int | None = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(
        minutes=expires_minutes or settings.ACCESS_TOKEN_EXPIRE_MINUTES
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_citizen_token(citizen_id: str, mobile_number: str) -> str:
    """Citizen tokens are tagged type=citizen and last longer (30 days) since
    re-sending OTPs on every app open would be poor UX for a village app."""
    to_encode = {
        "sub": citizen_id,
        "mobile_number": mobile_number,
        "type": "citizen",
        "exp": datetime.utcnow() + timedelta(days=30),
    }
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    payload = decode_token(token)
    if payload.get("type") == "citizen":
        raise HTTPException(status_code=401, detail="Citizen tokens cannot access staff endpoints")
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token payload")
    user = db.query(User).filter(User.id == user_id).first()
    if user is None or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user


def get_current_citizen(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):
    from app.models.citizen_models import Citizen  # local import avoids circular import

    payload = decode_token(token)
    if payload.get("type") != "citizen":
        raise HTTPException(status_code=401, detail="Staff tokens cannot access citizen endpoints")
    citizen_id = payload.get("sub")
    citizen = db.query(Citizen).filter(Citizen.id == citizen_id).first()
    if citizen is None:
        raise HTTPException(status_code=401, detail="Citizen not found")
    return citizen


def require_roles(*allowed_roles: Iterable[str]):
    """Dependency factory for RBAC: require_roles("super_admin", "panchayat_admin")"""

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role.value not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{current_user.role.value}' is not permitted to perform this action",
            )
        return current_user

    return dependency
