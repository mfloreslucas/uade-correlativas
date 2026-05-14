# Mapa de correlativas

Proyecto base para planificar materias, guardar progreso y sincronizar entre dispositivos.

## Requisitos
- Docker + Docker Compose

## Inicio rapido

```bash
docker compose up --build
```

Abrir `http://localhost:8010`.

## Desarrollo local (opcional)

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Notas
- La base de datos SQLite queda en el volumen `app_data`.
- Configura `APP_SECRET` antes de publicar.
- Si cambias el plan o correlativas, borra el volumen para re-seedear.
