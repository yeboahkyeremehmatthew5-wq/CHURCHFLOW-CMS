from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
import bcrypt

from database import engine, Base, get_db
import models
import schemas


# ==========================================================
# CREATE DATABASE TABLES
# ==========================================================

Base.metadata.create_all(bind=engine)


# ==========================================================
# DATABASE STRUCTURE FIXES
# ==========================================================

try:

    with engine.begin() as connection:

        connection.execute(
            text(
                "ALTER TABLE users "
                "ADD COLUMN IF NOT EXISTS password VARCHAR"
            )
        )

except Exception as error:

    print("Database structure check:", error)


# ==========================================================
# FASTAPI APPLICATION
# ==========================================================

app = FastAPI(
    title="ChurchFlow CMS API",
    description="Church Management System API",
    version="1.0.0"
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://127.0.0.1:5501",
        "http://localhost:5501"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# ==========================================================
# PASSWORD FUNCTIONS
# ==========================================================

def hash_password(password: str):

    return bcrypt.hashpw(
        password.encode("utf-8"),
        bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(
    plain_password: str,
    hashed_password: str
):

    try:

        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8")
        )

    except Exception:

        return False


# ==========================================================
# ROOT
# ==========================================================

@app.get("/")
def root():

    return {
        "message": "Church Management System API is running"
    }


# ==========================================================
# API TEST
# ==========================================================

@app.get("/api/test")
def api_test():

    return {
        "message": "ChurchFlow API is working correctly"
    }


# ==========================================================
# MEMBERS
# ==========================================================

@app.post("/members")
def create_member(
    member: schemas.MemberCreate,
    db: Session = Depends(get_db)
):

    name_parts = member.name.strip().split(" ", 1)

    first_name = name_parts[0]

    last_name = (
        name_parts[1]
        if len(name_parts) > 1
        else ""
    )

    new_member = models.Member(

        first_name=first_name,

        last_name=last_name,

        gender=member.gender,

        date_of_birth=member.dob,

        phone=member.phone,

        address=member.address,

        membership_date=member.date_joined,

        department=member.department,

        status=member.status
    )

    db.add(new_member)

    db.commit()

    db.refresh(new_member)

    return {
        "id": new_member.id,

        "name": (
            new_member.first_name
            + " "
            + new_member.last_name
        ).strip(),

        "gender": new_member.gender,

        "dob": new_member.date_of_birth,

        "phone": new_member.phone,

        "address": new_member.address,

        "date_joined": new_member.membership_date,

        "department": new_member.department,

        "status": new_member.status
    }


@app.get("/members")
def get_members(
    db: Session = Depends(get_db)
):

    members = db.query(
        models.Member
    ).all()

    result = []

    for member in members:

        result.append({

            "id": member.id,

            "name": (
                member.first_name
                + " "
                + member.last_name
            ).strip(),

            "gender": member.gender,

            "dob": member.date_of_birth,

            "phone": member.phone,

            "email": member.email,

            "address": member.address,

            "date_joined": member.membership_date,

            "department": member.department,

            "status": member.status
        })

    return result


@app.get("/members/{member_id}")
def get_member(
    member_id: int,
    db: Session = Depends(get_db)
):

    member = db.query(
        models.Member
    ).filter(
        models.Member.id == member_id
    ).first()

    if not member:

        raise HTTPException(
            status_code=404,
            detail="Member not found"
        )

    return {

        "id": member.id,

        "name": (
            member.first_name
            + " "
            + member.last_name
        ).strip(),

        "gender": member.gender,

        "dob": member.date_of_birth,

        "phone": member.phone,

        "email": member.email,

        "address": member.address,

        "date_joined": member.membership_date,

        "department": member.department,

        "status": member.status
    }


@app.put("/members/{member_id}")
def update_member(
    member_id: int,
    member: schemas.MemberCreate,
    db: Session = Depends(get_db)
):

    existing_member = db.query(
        models.Member
    ).filter(
        models.Member.id == member_id
    ).first()

    if not existing_member:

        raise HTTPException(
            status_code=404,
            detail="Member not found"
        )

    name_parts = member.name.strip().split(" ", 1)

    existing_member.first_name = name_parts[0]

    existing_member.last_name = (
        name_parts[1]
        if len(name_parts) > 1
        else ""
    )

    existing_member.gender = member.gender

    existing_member.date_of_birth = member.dob

    existing_member.phone = member.phone

    existing_member.address = member.address

    existing_member.membership_date = member.date_joined

    existing_member.department = member.department

    existing_member.status = member.status

    db.commit()

    db.refresh(existing_member)

    return {
        "message": "Member updated successfully"
    }


@app.delete("/members/{member_id}")
def delete_member(
    member_id: int,
    db: Session = Depends(get_db)
):

    member = db.query(
        models.Member
    ).filter(
        models.Member.id == member_id
    ).first()

    if not member:

        raise HTTPException(
            status_code=404,
            detail="Member not found"
        )

    db.delete(member)

    db.commit()

    return {
        "message": "Member deleted successfully"
    }


# ==========================================================
# ATTENDANCE
# ==========================================================

@app.post("/attendance")
def create_attendance(
    attendance: schemas.AttendanceCreate,
    db: Session = Depends(get_db)
):

    new_attendance = models.Attendance(

        member_id=attendance.member_id,

        attendance_date=attendance.attendance_date,

        status=attendance.status
    )

    db.add(new_attendance)

    db.commit()

    db.refresh(new_attendance)

    return new_attendance


@app.get("/attendance")
def get_attendance(
    db: Session = Depends(get_db)
):

    return db.query(
        models.Attendance
    ).all()


@app.delete("/attendance/{attendance_id}")
def delete_attendance(
    attendance_id: int,
    db: Session = Depends(get_db)
):

    attendance = db.query(
        models.Attendance
    ).filter(
        models.Attendance.id == attendance_id
    ).first()

    if not attendance:

        raise HTTPException(
            status_code=404,
            detail="Attendance record not found"
        )

    db.delete(attendance)

    db.commit()

    return {
        "message": "Attendance deleted successfully"
    }


# ==========================================================
# DEPARTMENTS
# ==========================================================

@app.post("/departments")
def create_department(
    department: schemas.DepartmentCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(
        models.Department
    ).filter(
        models.Department.name == department.name
    ).first()

    if existing:

        raise HTTPException(
            status_code=400,
            detail="Department already exists"
        )

    new_department = models.Department(

        name=department.name,

        description=department.description
    )

    db.add(new_department)

    db.commit()

    db.refresh(new_department)

    return new_department


@app.get("/departments")
def get_departments(
    db: Session = Depends(get_db)
):

    return db.query(
        models.Department
    ).order_by(
        models.Department.id
    ).all()


@app.put("/departments/{department_id}")
def update_department(
    department_id: int,
    department: schemas.DepartmentCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(
        models.Department
    ).filter(
        models.Department.id == department_id
    ).first()

    if not existing:

        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    existing.name = department.name

    existing.description = department.description

    db.commit()

    db.refresh(existing)

    return existing


@app.delete("/departments/{department_id}")
def delete_department(
    department_id: int,
    db: Session = Depends(get_db)
):

    department = db.query(
        models.Department
    ).filter(
        models.Department.id == department_id
    ).first()

    if not department:

        raise HTTPException(
            status_code=404,
            detail="Department not found"
        )

    db.delete(department)

    db.commit()

    return {
        "message": "Department deleted successfully"
    }


# ==========================================================
# EVENTS
# ==========================================================

@app.post("/events")
def create_event(
    event: schemas.EventCreate,
    db: Session = Depends(get_db)
):

    new_event = models.Event(

        title=event.title,

        date=event.date,

        time=event.time,

        venue=event.venue,

        description=event.description
    )

    db.add(new_event)

    db.commit()

    db.refresh(new_event)

    return new_event


@app.get("/events")
def get_events(
    db: Session = Depends(get_db)
):

    return db.query(
        models.Event
    ).order_by(
        models.Event.date
    ).all()


@app.put("/events/{event_id}")
def update_event(
    event_id: int,
    event: schemas.EventCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(
        models.Event
    ).filter(
        models.Event.id == event_id
    ).first()

    if not existing:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    existing.title = event.title

    existing.date = event.date

    existing.time = event.time

    existing.venue = event.venue

    existing.description = event.description

    db.commit()

    db.refresh(existing)

    return existing


@app.delete("/events/{event_id}")
def delete_event(
    event_id: int,
    db: Session = Depends(get_db)
):

    event = db.query(
        models.Event
    ).filter(
        models.Event.id == event_id
    ).first()

    if not event:

        raise HTTPException(
            status_code=404,
            detail="Event not found"
        )

    db.delete(event)

    db.commit()

    return {
        "message": "Event deleted successfully"
    }


# ==========================================================
# OFFERINGS
# ==========================================================

@app.post("/offerings")
def create_offering(
    offering: schemas.OfferingCreate,
    db: Session = Depends(get_db)
):

    new_offering = models.Offering(

        date=offering.date,

        amount=offering.amount,

        category=offering.category,

        description=offering.description
    )

    db.add(new_offering)

    db.commit()

    db.refresh(new_offering)

    return new_offering


@app.get("/offerings")
def get_offerings(
    db: Session = Depends(get_db)
):

    return db.query(
        models.Offering
    ).order_by(
        models.Offering.date.desc()
    ).all()


@app.put("/offerings/{offering_id}")
def update_offering(
    offering_id: int,
    offering: schemas.OfferingCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(
        models.Offering
    ).filter(
        models.Offering.id == offering_id
    ).first()

    if not existing:

        raise HTTPException(
            status_code=404,
            detail="Offering not found"
        )

    existing.date = offering.date

    existing.amount = offering.amount

    existing.category = offering.category

    existing.description = offering.description

    db.commit()

    db.refresh(existing)

    return existing


@app.delete("/offerings/{offering_id}")
def delete_offering(
    offering_id: int,
    db: Session = Depends(get_db)
):

    offering = db.query(
        models.Offering
    ).filter(
        models.Offering.id == offering_id
    ).first()

    if not offering:

        raise HTTPException(
            status_code=404,
            detail="Offering not found"
        )

    db.delete(offering)

    db.commit()

    return {
        "message": "Offering deleted successfully"
    }


# ==========================================================
# USERS
# ==========================================================

@app.post("/users")
def create_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):

    # ======================================================
    # CHECK USERNAME
    # ======================================================

    existing_username = db.query(
        models.User
    ).filter(
        models.User.username == user.username
    ).first()

    if existing_username:

        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )


    # ======================================================
    # CHECK EMAIL
    # ======================================================

    existing_email = db.query(
        models.User
    ).filter(
        models.User.email == user.email
    ).first()

    if existing_email:

        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )


    # ======================================================
    # HASH PASSWORD
    # ======================================================

    hashed_password = hash_password(
        user.password
    )


    # ======================================================
    # CREATE USER
    # ======================================================
    # Public signup accounts are ALWAYS members.
    # The role sent by the browser is NOT trusted.

    new_user = models.User(

        username=user.username,

        email=user.email,

        password=hashed_password,

        role="member"
    )


    db.add(new_user)

    db.commit()

    db.refresh(new_user)


    # ======================================================
    # RETURN SAFE USER INFORMATION
    # ======================================================

    return {

        "id": new_user.id,

        "username": new_user.username,

        "email": new_user.email,

        "role": new_user.role,

        "message": "User created successfully"
    }


@app.get("/users")
def get_users(
    db: Session = Depends(get_db)
):

    users = db.query(
        models.User
    ).order_by(
        models.User.id
    ).all()

    # Password is deliberately NOT returned.

    return [

        {
            "id": user.id,

            "username": user.username,

            "email": user.email,

            "role": user.role
        }

        for user in users
    ]


@app.get("/users/{user_id}")
def get_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = db.query(
        models.User
    ).filter(
        models.User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {

        "id": user.id,

        "username": user.username,

        "email": user.email,

        "role": user.role
    }


@app.put("/users/{user_id}")
def update_user(
    user_id: int,
    user: schemas.UserUpdate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(
        models.User
    ).filter(
        models.User.id == user_id
    ).first()

    if not existing_user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )


    # ======================================================
    # CHECK USERNAME
    # ======================================================

    username_check = db.query(
        models.User
    ).filter(
        models.User.username == user.username,
        models.User.id != user_id
    ).first()

    if username_check:

        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )


    # ======================================================
    # CHECK EMAIL
    # ======================================================

    email_check = db.query(
        models.User
    ).filter(
        models.User.email == user.email,
        models.User.id != user_id
    ).first()

    if email_check:

        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )


    existing_user.username = user.username

    existing_user.email = user.email

    existing_user.role = user.role


    # ======================================================
    # CHANGE PASSWORD IF PROVIDED
    # ======================================================

    if user.password:

        existing_user.password = hash_password(
            user.password
        )


    db.commit()

    db.refresh(existing_user)

    return {

        "id": existing_user.id,

        "username": existing_user.username,

        "email": existing_user.email,

        "role": existing_user.role,

        "message": "User updated successfully"
    }


@app.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db)
):

    user = db.query(
        models.User
    ).filter(
        models.User.id == user_id
    ).first()

    if not user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    db.delete(user)

    db.commit()

    return {
        "message": "User deleted successfully"
    }


# ==========================================================
# LOGIN
# ==========================================================

@app.post("/login")
def login(
    login_data: schemas.LoginRequest,
    db: Session = Depends(get_db)
):

    user = db.query(
        models.User
    ).filter(
        models.User.username == login_data.username
    ).first()


    if not user:

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )


    if not user.password:

        raise HTTPException(
            status_code=401,
            detail="This user does not have a password yet"
        )


    password_correct = verify_password(
        login_data.password,
        user.password
    )


    if not password_correct:

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )


    return {

        "message": "Login successful",

        "username": user.username,

        "role": user.role
    }


# ==========================================================
# SETTINGS
# ==========================================================

@app.post("/settings")
def create_settings(
    setting: schemas.SettingCreate,
    db: Session = Depends(get_db)
):

    existing = db.query(
        models.Setting
    ).first()

    if existing:

        existing.system_name = setting.system_name

        existing.theme = setting.theme

        db.commit()

        db.refresh(existing)

        return existing


    new_setting = models.Setting(

        system_name=setting.system_name,

        theme=setting.theme
    )

    db.add(new_setting)

    db.commit()

    db.refresh(new_setting)

    return new_setting


@app.get("/settings")
def get_settings(
    db: Session = Depends(get_db)
):

    setting = db.query(
        models.Setting
    ).first()

    if not setting:

        return None

    return setting
# ==========================================================
# DASHBOARD API
# ==========================================================

from datetime import date


@app.get("/dashboard")
def get_dashboard(
    db: Session = Depends(get_db)
):
    # ------------------------------------------------------
    # TOTAL MEMBERS
    # ------------------------------------------------------

    total_members = db.query(
        models.Member
    ).count()


    # ------------------------------------------------------
    # MALE MEMBERS
    # ------------------------------------------------------

    male_members = db.query(
        models.Member
    ).filter(
        models.Member.gender.ilike("Male")
    ).count()


    # ------------------------------------------------------
    # FEMALE MEMBERS
    # ------------------------------------------------------

    female_members = db.query(
        models.Member
    ).filter(
        models.Member.gender.ilike("Female")
    ).count()


    # ------------------------------------------------------
    # ACTIVE MEMBERS
    # ------------------------------------------------------

    active_members = db.query(
        models.Member
    ).filter(
        models.Member.status.ilike("Active")
    ).count()


    # ------------------------------------------------------
    # TODAY'S ATTENDANCE
    # ------------------------------------------------------

    today = date.today()

    today_attendance = db.query(
        models.Attendance
    ).filter(
        models.Attendance.attendance_date == today,
        models.Attendance.status.ilike("Present")
    ).count()


    # ------------------------------------------------------
    # UPCOMING EVENTS
    # ------------------------------------------------------

    upcoming_events = db.query(
        models.Event
    ).filter(
        models.Event.date >= today
    ).count()


    # ------------------------------------------------------
    # RETURN DASHBOARD DATA
    # ------------------------------------------------------

    return {
        "total_members": total_members,
        "male_members": male_members,
        "female_members": female_members,
        "active_members": active_members,
        "today_attendance": today_attendance,
        "upcoming_events": upcoming_events
    }