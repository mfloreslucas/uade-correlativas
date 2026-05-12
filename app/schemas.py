from pydantic import BaseModel, EmailStr, Field


class Token(BaseModel):
    access_token: str
    token_type: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class User(BaseModel):
    id: int
    email: EmailStr

    class Config:
        from_attributes = True


class CatalogCourse(BaseModel):
    id: int
    code: str
    name: str
    year: int | None = None
    term: str = ""
    plan: str = ""
    career: str = ""

    class Config:
        from_attributes = True


class Prerequisite(BaseModel):
    course_id: int
    prereq_id: int


class PrereqStatus(BaseModel):
    id: int
    code: str
    name: str
    status: str


class UserCourseBase(BaseModel):
    status: str = "planned"
    term: str = ""
    notes: str = ""


class UserCourseCreate(UserCourseBase):
    catalog_course_id: int


class UserCourseUpdate(BaseModel):
    status: str | None = None
    term: str | None = None
    notes: str | None = None


class UserCourse(BaseModel):
    id: int
    status: str
    term: str
    notes: str
    catalog_course: CatalogCourse

    class Config:
        from_attributes = True


class UserCourseOverview(BaseModel):
    id: int
    status: str
    term: str
    notes: str
    catalog_course: CatalogCourse
    prereqs: list[PrereqStatus]

    class Config:
        from_attributes = True
