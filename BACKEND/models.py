from sqlalchemy import Column, Integer, String, Date, Time
from database import Base


# ==========================================================
# MEMBERS
# ==========================================================

class Member(Base):
    __tablename__ = "members"

    id = Column(Integer, primary_key=True, index=True)

    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)

    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)

    gender = Column(String, nullable=True)

    date_of_birth = Column(Date, nullable=True)

    address = Column(String, nullable=True)

    department = Column(String, nullable=True)

    membership_date = Column(Date, nullable=True)

    status = Column(String, nullable=True)


# ==========================================================
# ATTENDANCE
# ==========================================================

class Attendance(Base):
    __tablename__ = "attendance"

    id = Column(Integer, primary_key=True, index=True)

    member_id = Column(Integer, nullable=False)

    attendance_date = Column(Date, nullable=False)

    status = Column(String, nullable=False)


# ==========================================================
# EVENTS
# ==========================================================

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)

    title = Column(String, nullable=False)

    date = Column(Date, nullable=False)

    time = Column(Time, nullable=False)

    venue = Column(String, nullable=False)

    description = Column(String, nullable=True)


# ==========================================================
# OFFERINGS
# ==========================================================

class Offering(Base):
    __tablename__ = "offerings"

    id = Column(Integer, primary_key=True, index=True)

    date = Column(Date, nullable=False)

    amount = Column(String, nullable=False)

    category = Column(String, nullable=False)

    description = Column(String, nullable=True)


# ==========================================================
# USERS
# ==========================================================

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    username = Column(
        String,
        nullable=False,
        unique=True
    )

    email = Column(
        String,
        nullable=False,
        unique=True
    )

    password = Column(
        String,
        nullable=False
    )

    role = Column(
        String,
        nullable=False
    )


# ==========================================================
# DEPARTMENTS
# ==========================================================

class Department(Base):
    __tablename__ = "departments"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(
        String,
        nullable=False,
        unique=True
    )

    description = Column(
        String,
        nullable=True
    )


# ==========================================================
# SETTINGS
# ==========================================================

class Setting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)

    system_name = Column(
        String,
        nullable=False
    )

    theme = Column(
        String,
        nullable=False
    )