# MegiLance AI Microservice

This service provides real AI capabilities using open-source models.

## Features

- **Embeddings**: Uses `sentence-transformers/all-MiniLM-L6-v2` to generate 384-dimensional vector embeddings for semantic search.
- **Text Generation**: Uses `google/flan-t5-small` for text generation (proposals, descriptions).
- **Sentiment Analysis**: Uses `distilbert-base-uncased-finetuned-sst-2-english` for analyzing text sentiment.

## Setup

### Local Development

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the service:
   ```bash
   uvicorn main:app --reload --port 7860
   ```

3. Test the endpoints:
   - Swagger UI: http://localhost:7860/docs
   - Embeddings: `POST /ai/embeddings`
   - Generate: `POST /ai/generate`

### Deployment to Hugging Face Spaces

1. Create a new Space on Hugging Face (Docker SDK).
2. Run the deployment script from the root of the repository:
   ```bash
   python deploy_to_hf.py <YOUR_HF_WRITE_TOKEN>
   ```
   Or set `HF_TOKEN` environment variable.

## API Reference

### `POST /ai/embeddings`
Generates a vector embedding for the input text.
- Input: `{"text": "string"}`
- Output: `{"embedding": [float], "dimensions": 384}`

### `POST /ai/generate`
Generates text based on a prompt.
- Input: `{"prompt": "string", "max_length": 100}`
- Output: `{"generated_text": "string"}`

### `POST /ai/sentiment`
Analyzes sentiment of the input text.
- Input: `{"text": "string"}`
- Output: `{"sentiment": "POSITIVE" | "NEGATIVE", "score": float}`
