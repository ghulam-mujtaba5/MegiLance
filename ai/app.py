# @AI-HINT: HuggingFace Spaces entry point - imports from main.py
# This file exists for HF Spaces compatibility (expects app.py by default)

from main import app

# Re-export for uvicorn
if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.getenv("PORT", 7860))
    uvicorn.run(app, host="0.0.0.0", port=port)
