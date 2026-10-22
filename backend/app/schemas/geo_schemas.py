from typing import Optional
from pydantic import BaseModel


class PanchayatCreate(BaseModel):
    name: str
    district: str
    state: str = "Maharashtra"
    pincode: Optional[str] = None
    sarpanch_name: Optional[str] = None
    contact_number: Optional[str] = None
    subscription_plan: str = "pilot"


class PanchayatOut(PanchayatCreate):
    id: str

    class Config:
        from_attributes = True


class WardCreate(BaseModel):
    panchayat_id: str
    name: str
    ward_number: int
    population: int = 0
    households: int = 0
    assigned_gram_sevak_id: Optional[str] = None
    local_issues: Optional[str] = None


class WardUpdate(BaseModel):
    name: Optional[str] = None
    population: Optional[int] = None
    households: Optional[int] = None
    assigned_gram_sevak_id: Optional[str] = None
    local_issues: Optional[str] = None


class WardOut(WardCreate):
    id: str

    class Config:
        from_attributes = True


class WardStats(BaseModel):
    ward_id: str
    ward_name: str
    ward_number: int
    total_citizens: int
    total_complaints: int
    open_complaints: int
