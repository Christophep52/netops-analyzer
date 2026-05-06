FROM python:3.11-slim

# Instalar o utilitário iputils-ping que suporta setuid ou dgram sockets sem root restrito
RUN apt-get update && apt-get install -y iputils-ping && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Diretório para o SQLite
RUN mkdir -p /app/data

# O comando de execução
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
