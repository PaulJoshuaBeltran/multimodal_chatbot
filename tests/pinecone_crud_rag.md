Note: kb - knowledge base

1. Create in Pinecone & MongoDB (POST) / List from MongoDB (GET)
- http://trance-ankle-unsaddle.ngrok-free.dev/api/knowledge/(kb_id)/documents
- Content-Type: application/json
- Body:
{
    "title": title,
    "text": "content
}

2. List (GET) / Update (PATCH) / Delete (DELETE) from Pinecone & MongoDB
- http://trance-ankle-unsaddle.ngrok-free.dev/api/knowledge/(kb_id)/documents/(doc_id)
- Content-Type: application/json
- Body:
{
    "title": title,
    "text": "content
}

3. RAG Usage
- http://trance-ankle-unsaddle.ngrok-free.dev/api/chat/rag
- Content-Type: application/json
- Body:
{
    "kbId": kb_id,
    "query": "input query to compare,
    "topK": K amount of most similar with input query
}