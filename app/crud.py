from sqlalchemy.orm import Session

from app import models
from app.schemas import UserCourseCreate, UserCourseUpdate
from app.auth import hash_password


def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, email: str, password: str):
    user = models.User(email=email, password_hash=hash_password(password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_catalog(db: Session):
    return db.query(models.CatalogCourse).order_by(models.CatalogCourse.year).all()


def list_prereqs(db: Session, course_id: int):
    prereq_ids = (
        db.query(models.CatalogPrerequisite.prereq_id)
        .filter(models.CatalogPrerequisite.course_id == course_id)
        .all()
    )
    if not prereq_ids:
        return []
    ids = [row[0] for row in prereq_ids]
    return db.query(models.CatalogCourse).filter(models.CatalogCourse.id.in_(ids)).all()


def list_user_courses(db: Session, user_id: int):
    return (
        db.query(models.UserCourse)
        .filter(models.UserCourse.user_id == user_id)
        .order_by(models.UserCourse.created_at.desc())
        .all()
    )


def list_user_course_overview(db: Session, user_id: int):
    courses = list_user_courses(db, user_id)
    if not courses:
        return []
    catalog_ids = [course.catalog_course_id for course in courses]
    prereq_map = {course_id: [] for course_id in catalog_ids}
    prereqs = (
        db.query(models.CatalogPrerequisite)
        .filter(models.CatalogPrerequisite.course_id.in_(catalog_ids))
        .all()
    )
    prereq_ids = {prereq.prereq_id for prereq in prereqs}
    catalog_lookup = {}
    if prereq_ids:
        catalog_items = (
            db.query(models.CatalogCourse)
            .filter(models.CatalogCourse.id.in_(prereq_ids))
            .all()
        )
        catalog_lookup = {course.id: course for course in catalog_items}

    status_lookup = {course.catalog_course_id: course.status for course in courses}
    for prereq in prereqs:
        prereq_course = catalog_lookup.get(prereq.prereq_id)
        if not prereq_course:
            continue
        prereq_map[prereq.course_id].append(
            {
                "id": prereq_course.id,
                "code": prereq_course.code,
                "name": prereq_course.name,
                "status": status_lookup.get(prereq_course.id, "planned"),
            }
        )

    return [
        {
            "id": course.id,
            "status": course.status,
            "term": course.term,
            "notes": course.notes,
            "catalog_course": course.catalog_course,
            "prereqs": prereq_map.get(course.catalog_course_id, []),
        }
        for course in courses
    ]


def create_user_course(db: Session, user_id: int, payload: UserCourseCreate):
    course = models.UserCourse(
        user_id=user_id,
        catalog_course_id=payload.catalog_course_id,
        status=payload.status,
        term=payload.term,
        notes=payload.notes,
    )
    db.add(course)
    db.commit()
    db.refresh(course)
    return course


def update_user_course(
    db: Session, user_id: int, course_id: int, payload: UserCourseUpdate
):
    course = (
        db.query(models.UserCourse)
        .filter(models.UserCourse.user_id == user_id, models.UserCourse.id == course_id)
        .first()
    )
    if not course:
        return None
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(course, field, value)
    db.commit()
    db.refresh(course)
    return course


def delete_user_course(db: Session, user_id: int, course_id: int):
    course = (
        db.query(models.UserCourse)
        .filter(models.UserCourse.user_id == user_id, models.UserCourse.id == course_id)
        .first()
    )
    if not course:
        return False
    db.delete(course)
    db.commit()
    return True
