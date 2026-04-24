import chromadb
from chromadb.config import Settings
import os
import uuid
import logging

# Setup persistent storage path
PERSIST_DIRECTORY = os.path.join(os.getcwd(), "chroma_db")

# Initialize ChromaDB client
client = chromadb.PersistentClient(path=PERSIST_DIRECTORY)

def get_collection(session_id: str = "default"):
    """
    Returns a ChromaDB collection for a specific session.
    """
    collection_name = f"session_{session_id}"
    return client.get_or_create_collection(name=collection_name)

async def store_chunks(chunks: list[str], session_id: str = "default"):
    """
    Stores a list of text chunks in the session's collection.
    """
    if not chunks:
        return

    collection = get_collection(session_id)
    ids = [str(uuid.uuid4()) for _ in chunks]
    
    try:
        collection.add(
            documents=chunks,
            ids=ids
        )
        logging.info(f"Successfully stored {len(chunks)} chunks in collection {session_id}.")
    except Exception as e:
        logging.error(f"Failed to store chunks in ChromaDB: {str(e)}")

async def query_chunks(query: str, session_id: str = "default", n_results: int = 5) -> list[str]:
    """
    Queries the session's collection for relevant chunks.
    """
    try:
        collection = get_collection(session_id)
        results = collection.query(
            query_texts=[query],
            n_results=n_results
        )
        return results["documents"][0] if results["documents"] else []
    except Exception as e:
        logging.error(f"Failed to query ChromaDB: {str(e)}")
        return []
