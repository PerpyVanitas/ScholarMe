# 5. RAG pgvector Setup

Date: 2026-07-24

## Status
Accepted

## Context
To power the AI Tutor and personalized quiz generation based on organizational documents and uploaded materials, we needed a fast, scalable vector store. Since we already use Supabase (PostgreSQL) for our primary relational data, introducing a separate vector database (like Pinecone) would add unnecessary architectural complexity and data synchronization overhead.

## Decision
We enabled the pgvector extension in our Supabase instance. We store document chunks and their corresponding embeddings in a esource_embeddings table. We use an RPC function match_resource_embeddings for cosine similarity searches.

## Consequences
- **Pros:** Keeps all data in a single Postgres database, simplifying backups, migrations, and joins between relational data (e.g., user profiles, access controls) and vector data.
- **Cons:** Postgres vector searches can become slow at massive scale (millions of vectors) without proper indexing (HNSW or IVFFlat). We must monitor index performance as the dataset grows.

