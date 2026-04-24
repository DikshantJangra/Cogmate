from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import logging
from app.core.vector_store import query_chunks
from app.core.llm import get_gemini_client

router = APIRouter()

class QueryRequest(BaseModel):
    question: str
    session_id: str = "default"

class QueryResponse(BaseModel):
    answer: str
    sources: List[str]

@router.post("/query", response_model=QueryResponse)
async def rag_query(request: QueryRequest):
    if not request.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    
    logging.info(f"Received RAG query for session {request.session_id}: {request.question}")
    
    try:
        # 1. Query vector DB
        relevant_chunks = await query_chunks(request.question, session_id=request.session_id, n_results=3)
        
        if not relevant_chunks:
            context = "No relevant context found in the vector database."
        else:
            context = "\n\n".join(relevant_chunks)
        
        # 2. Pass results + question to LLM
        prompt = f"""
        You are an AI classroom assistant. Use the provided context to answer the student's question.
        
        STRICT RULES:
        1. Answer based ONLY on the provided context.
        2. If the answer is not in the context, explicitly state: "The lecture material does not contain this information." Then, provide a brief general explanation if helpful.
        3. CITE YOUR SOURCES. Mention which part of the context you are using.
        
        CONTEXT:
        {context}
        
        STUDENT QUESTION:
        {request.question}
        
        Answer with clear markdown formatting.
        """
        
        gemini = get_gemini_client()
        answer = await gemini.generate_content(prompt)
        
        return QueryResponse(
            answer=answer,
            sources=relevant_chunks
        )
        
    except Exception as e:
        logging.error(f"Error in RAG query: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal processing error during RAG.")
