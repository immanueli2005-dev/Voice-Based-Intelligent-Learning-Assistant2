import os
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings

CHROMA_DB_PATH = os.environ.get("CHROMA_DB_PATH", "./data/chroma_db")
os.makedirs(CHROMA_DB_PATH, exist_ok=True)

# Lazy-loaded singletons — initialized on first use to avoid
# torch deadlock when Whisper (ctranslate2) and sentence-transformers
# both load at the same time during uvicorn startup.
_embeddings = None
_vectorstore = None

def _get_vectorstore():
    global _embeddings, _vectorstore
    if _vectorstore is None:
        try:
            import torch
            device = "cuda" if torch.cuda.is_available() else "cpu"
        except ImportError:
            device = "cpu"

        print(f"[rag_service] Loading embeddings model on {device}...")
        _embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={"device": device}
        )
        print("[rag_service] Connecting to ChromaDB...")
        _vectorstore = Chroma(
            persist_directory=CHROMA_DB_PATH,
            embedding_function=_embeddings
        )
        print("[rag_service] Ready.")
    return _vectorstore

def get_retriever(session_id: str):
    return _get_vectorstore().as_retriever(
        search_kwargs={
            "k": 3,
            "filter": {"sessionId": session_id}
        }
    )

def add_documents(chunks):
    _get_vectorstore().add_documents(chunks)

def delete_document_vectors(session_id: str, file_name: str):
    _get_vectorstore()._collection.delete(
        where={"$and": [{"sessionId": session_id}, {"fileName": file_name}]}
    )
