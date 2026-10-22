from typing import Optional
from pydantic import BaseModel
from app.models.citizen_models import Gender, Language


class CitizenCreate(BaseModel):
    name: str
    mobile_number: str
    address: Optional[str] = None
    ward_id: str
    family_id: Optional[str] = None
    gender: Optional[Gender] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    annual_income: Optional[int] = None
    category: Optional[str] = None
    preferred_language: Language = Language.MARATHI
    notes: Optional[str] = None


class CitizenUpdate(BaseModel):
    name: Optional[str] = None
    mobile_number: Optional[str] = None
    address: Optional[str] = None
    ward_id: Optional[str] = None
    family_id: Optional[str] = None
    gender: Optional[Gender] = None
    age: Optional[int] = None
    occupation: Optional[str] = None
    annual_income: Optional[int] = None
    category: Optional[str] = None
    preferred_language: Optional[Language] = None
    notes: Optional[str] = None


class CitizenOut(CitizenCreate):
    id: str
    citizen_code: str

    class Config:
        from_attributes = True


class FamilyCreate(BaseModel):
    family_head_name: str
    ward_id: str
    address: Optional[str] = None
    ration_card_number: Optional[str] = None


class FamilyOut(FamilyCreate):
    id: str

    class Config:
        from_attributes = True
