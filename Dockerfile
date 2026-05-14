FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app

RUN mkdir -p /data

ENV UVICORN_HOST=0.0.0.0
ENV UVICORN_PORT=8000
ENV DB_PATH=/data/app.db
ENV APP_SECRET=change-me

EXPOSE 8000

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
