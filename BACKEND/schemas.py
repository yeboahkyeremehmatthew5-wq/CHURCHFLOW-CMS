from pydantic import BaseModel
from datetime import date, time
from typing import Optional


# ==========================================================
# MEMBER SCHEMAS
# ==========================================================

class MemberCreate(BaseModel):
    name: str
    gender: Optional[str] = None
    dob: Optional[date] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_joined: Optional[date] = None
    department: Optional[str] = None
    status: Optional[str] = "Active"


class MemberResponse(BaseModel):
    id: int
    name: str
    gender: Optional[str] = None
    dob: Optional[date] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    date_joined: Optional[date] = None
    department: Optional[str] = None
    status: Optional[str] = None

    class Config:
        from_attributes = True


# ==========================================================
# ATTENDANCE SCHEMAS
# ==========================================================

class AttendanceCreate(BaseModel):
    member_id: int
    attendance_date: date
    status: str


class AttendanceResponse(AttendanceCreate):
    id: int

    class Config:
        from_attributes = True


# ==========================================================
# EVENT SCHEMAS
# ==========================================================

class EventCreate(BaseModel):
    title: str
    date: date
    time: time
    venue: str
    description: Optional[str] = None


class EventResponse(EventCreate):
    id: int

    class Config:
        from_attributes = True


# ==========================================================
# OFFERING SCHEMAS
# ==========================================================

class OfferingCreate(BaseModel):
    date: date
    amount: str
    category: str
    description: Optional[str] = None


class OfferingResponse(OfferingCreate):
    id: int

    class Config:
        from_attributes = True


# ==========================================================
# USER SCHEMAS
# ==========================================================

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    role: str


class UserUpdate(BaseModel):
    username: str
    email: str
    role: str
    password: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    role: str

    class Config:
        from_attributes = True


# ==========================================================
# LOGIN SCHEMAS
# ==========================================================

class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    message: str
    username: str
    role: str


# ==========================================================
# DEPARTMENT SCHEMAS
# ==========================================================

class DepartmentCreate(BaseModel):
    name: str
    description: Optional[str] = None


class DepartmentResponse(DepartmentCreate):
    id: int

    class Config:
        from_attributes = True


# ==========================================================
# SETTINGS SCHEMAS
# ==========================================================

class SettingCreate(BaseModel):
    system_name: str
    theme: str


class SettingResponse(SettingCreate):
    id: int

    class Config:
        from_attributes = True