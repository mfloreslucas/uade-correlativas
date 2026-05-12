from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    courses = relationship("UserCourse", back_populates="user", cascade="all, delete-orphan")


class CatalogCourse(Base):
    __tablename__ = "catalog_courses"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, nullable=False, unique=True, index=True)
    name = Column(String, nullable=False)
    year = Column(Integer, nullable=True)
    term = Column(String, default="")
    plan = Column(String, default="")
    career = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    prerequisites = relationship(
        "CatalogPrerequisite",
        foreign_keys="CatalogPrerequisite.course_id",
        cascade="all, delete-orphan",
    )
    dependents = relationship(
        "CatalogPrerequisite",
        foreign_keys="CatalogPrerequisite.prereq_id",
        cascade="all, delete-orphan",
    )
    user_courses = relationship("UserCourse", back_populates="catalog_course")


class CatalogPrerequisite(Base):
    __tablename__ = "catalog_prerequisites"

    id = Column(Integer, primary_key=True, index=True)
    course_id = Column(Integer, ForeignKey("catalog_courses.id"), nullable=False, index=True)
    prereq_id = Column(Integer, ForeignKey("catalog_courses.id"), nullable=False, index=True)


class UserCourse(Base):
    __tablename__ = "user_courses"
    __table_args__ = (UniqueConstraint("user_id", "catalog_course_id"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    catalog_course_id = Column(Integer, ForeignKey("catalog_courses.id"), nullable=False)
    status = Column(String, default="planned")
    term = Column(String, default="")
    notes = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="courses")
    catalog_course = relationship("CatalogCourse", back_populates="user_courses")
