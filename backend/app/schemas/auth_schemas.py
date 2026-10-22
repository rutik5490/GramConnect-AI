from typing import Optional
from pydantic import BaseModel, EmailStr
from app.models.core_models import UserRole


class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    mobile_number: Optional[str] = None
    password: str
    role: UserRole = UserRole.DATA_ENTRY_OPERATOR
    panchayat_id: Optional[str] = None
    ward_id: Optional[str] = None


class UserOut(BaseModel):
    id: str
    full_name: str
    email: str
    mobile_number: Optional[str] = None
    role: UserRole
    panchayat_id: Optional[str] = None
    ward_id: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str
