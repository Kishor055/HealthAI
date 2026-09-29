from typing import Optional
from pydantic import BaseModel, Field

class UserRegister(BaseModel):
    email: str = Field(..., min_length=3, description="User email address")
    password: str = Field(..., min_length=6, description="Security password")
    full_name: str
    role: Optional[str] = "patient"  # patient, clinician, admin, pharmacist
    blood_type: Optional[str] = "O+"
    allergies: Optional[str] = "None recorded"
    institution: Optional[str] = "HealthAI Network"

class UserLogin(BaseModel):
    email: str = Field(..., min_length=3)
    password: str

class UserOut(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    blood_type: Optional[str] = None
    allergies: Optional[str] = None
    institution: Optional[str] = None
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserOut

class FirebaseVerifyRequest(BaseModel):
    id_token: str
    email: Optional[str] = None
    full_name: Optional[str] = None

class GuestLoginRequest(BaseModel):
    role: Optional[str] = "patient"
    alias: Optional[str] = "Guest Clinician / Patient"
