from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app import crud, models, schemas, auth
from app.catalog_seed import seed_catalog
from app.db import SessionLocal, engine

models.Base.metadata.create_all(bind=engine)
seed_catalog()

app = FastAPI(title="UADE Correlativas Tracker")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "ok"}


@app.post("/api/register", response_model=schemas.Token)
def register(payload: schemas.RegisterRequest, db: Session = Depends(get_db)):
    if crud.get_user_by_email(db, payload.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    user = crud.create_user(db, payload.email, payload.password)
    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@app.post("/api/login", response_model=schemas.Token)
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = crud.get_user_by_email(db, payload.email)
    if not user or not auth.verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = auth.create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@app.get("/api/me", response_model=schemas.User)
def me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user


@app.get("/api/catalog", response_model=list[schemas.CatalogCourse])
def list_catalog(db: Session = Depends(get_db)):
    return crud.list_catalog(db)


@app.get("/api/catalog/{course_id}/prereqs", response_model=list[schemas.CatalogCourse])
def list_prereqs(course_id: int, db: Session = Depends(get_db)):
    return crud.list_prereqs(db, course_id)


@app.get("/api/courses", response_model=list[schemas.UserCourseOverview])
def list_courses(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.list_user_course_overview(db, current_user.id)


@app.post("/api/courses", response_model=schemas.UserCourse)
def create_course(
    payload: schemas.UserCourseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    return crud.create_user_course(db, current_user.id, payload)


@app.put("/api/courses/{course_id}", response_model=schemas.UserCourse)
def update_course(
    course_id: int,
    payload: schemas.UserCourseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    course = crud.update_user_course(db, current_user.id, course_id, payload)
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    return course


@app.delete("/api/courses/{course_id}")
def delete_course(
    course_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth.get_current_user),
):
    ok = crud.delete_user_course(db, current_user.id, course_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Course not found")
    return {"deleted": True}


app.mount("/", StaticFiles(directory="app/static", html=True), name="static")


@app.get("/")
def index():
    return FileResponse("app/static/index.html")
