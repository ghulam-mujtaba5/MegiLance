try:
    from sentence_transformers import SentenceTransformer
    print('✅ sentence-transformers is installed')
    model = SentenceTransformer('all-MiniLM-L6-v2')
    print(f'✅ Model loaded successfully')
    embedding = model.encode("test")
    print(f'✅ Generated embedding: {len(embedding)} dimensions')
except ImportError as e:
    print(f'❌ Not installed: {e}')
except Exception as e:
    print(f'❌ Error: {e}')
