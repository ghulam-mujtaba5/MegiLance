# @AI-HINT: Dockerfile for Advanced AI Service on Hugging Face Spaces
FROM python:3.10-slim

WORKDIR /app

# Install curl for health checks and build essentials
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Upgrade pip
RUN pip install --no-cache-dir --upgrade pip

# Copy requirements
COPY requirements_advanced.txt requirements.txt

# Install Python dependencies
# Note: Using CPU version of PyTorch to save space/memory
RUN pip install --no-cache-dir -r requirements.txt --extra-index-url https://download.pytorch.org/whl/cpu

# Copy application code
COPY . .

# Create a non-root user for security (required by some HF Spaces)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PORT=7860

# Expose the port
EXPOSE 7860

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:7860/health || exit 1

# Run the advanced application
CMD ["uvicorn", "main_advanced:app", "--host", "0.0.0.0", "--port", "7860"]