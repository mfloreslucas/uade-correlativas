from app.db import SessionLocal
from app import models


def seed_catalog():
    db = SessionLocal()
    try:
        if db.query(models.CatalogCourse).first():
            return
        courses = [
            {"code": "3.4.069", "name": "Fundamentos de Informatica", "year": 1, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.164", "name": "Sistemas de Informacion I", "year": 1, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "2.1.002", "name": "Pensamiento Critico y Comunicacion", "year": 1, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.043", "name": "Teoria de Sistemas", "year": 1, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.1.050", "name": "Elementos de Algebra y Geometria", "year": 1, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.071", "name": "Programacion I", "year": 1, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.3.121", "name": "Sistemas de Representacion", "year": 1, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.2.178", "name": "Fundamentos de Quimica", "year": 1, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.072", "name": "Arquitectura de Computadores", "year": 1, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.1.024", "name": "Matematica Discreta", "year": 1, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.1.051", "name": "Algebra", "year": 1, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.074", "name": "Programacion II", "year": 2, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.207", "name": "Sistemas de Informacion II", "year": 2, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.075", "name": "Sistemas Operativos", "year": 2, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.1.052", "name": "Fisica I", "year": 2, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.1.053", "name": "Calculo I", "year": 2, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.077", "name": "Programacion III", "year": 2, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.208", "name": "Paradigma Orientado a Objetos", "year": 2, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.078", "name": "Fundamentos de Telecomunicaciones", "year": 2, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.209", "name": "Ingenieria de Datos I", "year": 2, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.1.054", "name": "Calculo II", "year": 2, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.210", "name": "Proceso de Desarrollo de Software", "year": 3, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.211", "name": "Seminario de Integracion Profesional", "year": 3, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.212", "name": "Teleinformatica y Redes", "year": 3, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.213", "name": "Ingenieria de Datos II", "year": 3, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.1.049", "name": "Probabilidad y Estadistica", "year": 3, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "2.4.216", "name": "Examen de Ingles", "year": 3, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.082", "name": "Aplicaciones Interactivas", "year": 3, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.214", "name": "Ingenieria de Software", "year": 3, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.1.055", "name": "Fisica II", "year": 3, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.215", "name": "Teoria de la Computacion", "year": 3, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.1.056", "name": "Estadistica Avanzada", "year": 3, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.216", "name": "Desarrollo de Aplicaciones I", "year": 4, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.089", "name": "Direccion de Proyectos Informaticos", "year": 4, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.217", "name": "Ciencia de Datos", "year": 4, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.092", "name": "Seguridad e Integridad de la Informacion", "year": 4, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.1.025", "name": "Modelado y Simulacion", "year": 4, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "1", "name": "Optativa I", "year": 4, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.218", "name": "Desarrollo de Aplicaciones II", "year": 4, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.086", "name": "Evaluacion de Proyectos Informaticos", "year": 4, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.096", "name": "Inteligencia Artificial", "year": 4, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.219", "name": "Tecnologia y Medio Ambiente", "year": 4, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "PPS06", "name": "Practica Profesional Supervisada", "year": 4, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "2", "name": "Optativa II", "year": 5, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.094", "name": "Arquitectura de Aplicaciones", "year": 5, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.220", "name": "Tendencias Tecnologicas", "year": 5, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.100", "name": "Proyecto Final de Ingenieria en Informatica", "year": 5, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.098", "name": "Calidad de Software", "year": 5, "term": "1", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3", "name": "Optativa III", "year": 5, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.221", "name": "Negocios Tecnologicos", "year": 5, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "3.4.135", "name": "Tecnologia e Innovacion", "year": 5, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
            {"code": "2.3.056", "name": "Derecho Informatico", "year": 5, "term": "2", "plan": "1621", "career": "Ingenieria en Informatica", "university": "UADE"},
        ]
        catalog = {}
        for course in courses:
            obj = models.CatalogCourse(**course)
            db.add(obj)
            db.flush()
            catalog[course["code"]] = obj

        prerequisites = [
            ("3.4.071", "3.4.069"),
            ("3.4.072", "3.4.069"),
            ("3.4.072", "3.4.043"),
            ("3.1.024", "3.1.050"),
            ("3.1.051", "3.1.050"),
            ("3.4.074", "3.4.071"),
            ("3.4.207", "3.4.164"),
            ("3.4.075", "3.4.072"),
            ("3.4.075", "3.4.071"),
            ("3.1.053", "3.1.051"),
            ("3.1.053", "3.1.050"),
            ("3.4.077", "3.4.074"),
            ("3.4.208", "3.4.074"),
            ("3.4.078", "3.4.072"),
            ("3.4.209", "3.4.207"),
            ("3.4.209", "3.4.074"),
            ("3.1.054", "3.1.053"),
            ("3.4.210", "3.4.077"),
            ("3.4.210", "3.4.208"),
            ("3.4.212", "3.4.078"),
            ("3.4.213", "3.4.209"),
            ("3.1.049", "3.1.053"),
            ("3.1.049", "3.1.024"),
            ("3.4.082", "3.4.077"),
            ("3.4.082", "3.4.208"),
            ("3.4.214", "3.4.207"),
            ("3.1.055", "3.1.052"),
            ("3.4.215", "3.1.024"),
            ("3.4.215", "3.4.077"),
            ("3.1.056", "3.1.049"),
            ("3.4.216", "3.4.082"),
            ("3.4.216", "3.4.214"),
            ("3.4.217", "3.4.213"),
            ("3.4.217", "3.1.056"),
            ("3.4.218", "3.4.216"),
            ("3.4.096", "3.4.215"),
            ("3.4.096", "3.1.056"),
            ("3.4.094", "3.4.218"),
            ("3.4.094", "3.4.214"),
            ("3.4.100", "3.4.218"),
            ("3.4.100", "3.4.214"),
            ("3.4.100", "PPS06"),
            ("3.4.098", "3.4.214"),
            ("3.4.211", "3.4.074"),
            ("3.4.211", "3.4.207"),
            ("3.4.211", "3.4.209"),
            ("3.1.025", "3.1.054"),
            ("3.4.089", "3.4.207"),
            ("3.4.092", "3.4.212"),
            ("3.4.086", "3.1.049"),
        ]
        for course_code, prereq_code in prerequisites:
            if course_code in catalog and prereq_code in catalog:
                db.add(
                    models.CatalogPrerequisite(
                        course_id=catalog[course_code].id,
                        prereq_id=catalog[prereq_code].id,
                    )
                )
        db.commit()
    finally:
        db.close()


if __name__ == "__main__":
    seed_catalog()
