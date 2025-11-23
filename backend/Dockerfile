# Simplified Dockerfile for MegiLance backend with Turso (libSQL)
# No need for GCC - all pure Python packages!
FROM python:3.13-slim

WORKDIR /app

# No system dependencies needed - pure Python!

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app

# Create uploads directory
RUN mkdir -p /app/uploads && chown -R appuser:appuser /app/uploads

USER appuser

# Environment variables
ENV PATH=/usr/local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# Use gunicorn with uvicorn workers for production
CMD ["gunicorn", "main:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000", "--access-logfile", "-", "--error-logfile", "-"]