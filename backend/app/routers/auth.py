import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.core_models import User
from app.schemas.auth_schemas import (
    UserCreate,
    UserOut,
    LoginRequest,
    Token,
    ForgotPasswordRequest,
    ResetPasswordRequest,
)
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# In-memory reset-code store for the pilot (swap for Redis/email in production)
_reset_codes: dict[str, str] = {}


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        full_name=payload.full_name,
        email=payload.email,
        mobile_number=payload.mobile_number,
        hashed_password=hash_password(payload.password),
        role=payload.role,
        panchayat_id=payload.panchayat_id,
        ward_id=payload.ward_id,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    token = create_access_token({"sub": user.id, "role": user.role.value})
    return Token(access_token=token, user=user)


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    # Always return 200 (don't leak which emails exist)
    if user:
        code = f"{secrets.randbelow(999999):06d}"
        _reset_codes[payload.email] = code
        # In production this is emailed/SMS'd. For the pilot we log it.
        print(f"[GramConnect AI] Password reset code for {payload.email}: {code}")
    return {"message": "If that email exists, a reset code has been sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordRequest, db: Session = Depends(get_db)):
    expected = _reset_codes.get(payload.email)
    if not expected or expected != payload.reset_code:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code")
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    del _reset_codes[payload.email]
    return {"message": "Password updated successfully"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
