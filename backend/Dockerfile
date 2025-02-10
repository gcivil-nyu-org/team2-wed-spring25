FROM python:3.11

WORKDIR /nightwalkers

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY nightwalkers/ .

# Run Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]