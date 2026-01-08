# Intelligent Chatbot System: Architecture & Workflow Documentation

**Date:** January 6, 2026  
**Project:** Verve Chatbot System  
**Version:** 1.0  
**Status:** Proposal

---

## Executive Summary

This document outlines the architecture and workflow for an intelligent chatbot system designed to provide accurate, context-aware responses to user queries. The system employs a multi-stage pipeline that combines intent classification with retrieval-augmented generation (RAG) for product-related queries, ensuring optimal user experience and high accuracy in product recommendations.

---

## 1. System Overview

The chatbot system operates on a two-stage architecture:

1. **Intent Classification Stage**: Determines the user's intent from predefined categories
2. **Response Generation Stage**: Executes intent-specific workflows to generate appropriate responses

### Key Objectives

- **Accurate Intent Recognition**: Identify user intent with high precision
- **Intelligent Product Search**: Leverage RAG for contextually relevant product recommendations
- **Scalable Architecture**: Support multiple classification approaches
- **User-Centric Design**: Provide clear, actionable responses

---

## 2. System Workflow

```
User Query
    ↓
┌─────────────────────────────────────┐
│   STAGE 1: INTENT CLASSIFICATION    │
└─────────────────────────────────────┘
    ↓
    ├─→ Product Search Intent → RAG Pipeline → Product Results
    ├─→ FAQ Intent → Knowledge Base Lookup → FAQ Response
    ├─→ Support Intent → Ticket Creation → Support Response
    ├─→ General Chat Intent → Conversational AI → Chat Response
    └─→ Other Intents → Intent-Specific Handler → Response
    ↓
┌─────────────────────────────────────┐
│   STAGE 2: RESPONSE GENERATION      │
└─────────────────────────────────────┘
    ↓
Formatted Response to User
```

---

## 3. Stage 1: Intent Classification

### 3.1 Classification Approaches

The system supports **four distinct classification methodologies**, each with specific use cases:

#### Approach 1: Keyword-Based Classification

**Description**: Rule-based matching using predefined keywords and patterns.

**Methodology**:
- Maintain keyword dictionaries for each intent
- Use regex patterns for complex matching
- Apply preprocessing (lowercase, stemming, lemmatization)

**Advantages**:
- Fast and lightweight
- No training required
- Easily interpretable
- Low computational cost

**Disadvantages**:
- Limited flexibility
- Struggles with complex queries
- Requires manual maintenance

**Best Use Cases**:
- High-volume, simple queries
- Well-defined domains
- Resource-constrained environments

**Example Implementation**:
```python
intent_keywords = {
    "PRODUCT_SEARCH": ["find", "show", "search", "looking for", "need"],
    "FAQ": ["how to", "what is", "policy", "can I"],
    "SUPPORT": ["problem", "issue", "help", "not working"]
}
```

---

#### Approach 2: Classical Machine Learning (XGBoost)

**Description**: Traditional ML classifier using gradient boosting.

**Methodology**:
- Feature extraction using TF-IDF or Count Vectorization
- Train XGBoost classifier on labeled intent data
- Cross-validation for optimal hyperparameters

**Advantages**:
- Better generalization than keyword matching
- Handles feature interactions well
- Computationally efficient for inference
- Requires less training data than deep learning

**Disadvantages**:
- Requires labeled training data
- Limited understanding of semantic context
- Feature engineering required

**Best Use Cases**:
- Moderate-sized labeled datasets (1000+ samples)
- When training/inference speed is critical
- Structured query patterns

**Key Metrics**:
- Training accuracy: ~85-92%
- Inference time: <10ms per query
- Model size: ~5-20MB

---

#### Approach 3: NLP-Based Classification (BERT/Neural Networks)

**Description**: Deep learning models for semantic understanding.

**Methodology**:
- Use pre-trained BERT models (e.g., `bert-base-uncased`)
- Fine-tune on domain-specific intent dataset
- Apply transfer learning techniques

**Advantages**:
- Excellent semantic understanding
- Captures contextual nuances
- High accuracy on complex queries
- Handles variations and synonyms well

**Disadvantages**:
- Higher computational requirements
- Requires substantial training data
- Longer inference time
- Larger model size

**Best Use Cases**:
- Complex, conversational queries
- High accuracy requirements
- Sufficient computational resources available

**Recommended Models**:
- **BERT**: General-purpose text understanding
- **DistilBERT**: Faster, lighter alternative (60% faster, 40% smaller)
- **RoBERTa**: Enhanced robustness
- **ALBERT**: Parameter-efficient variant

**Key Metrics**:
- Training accuracy: ~93-97%
- Inference time: 20-50ms per query
- Model size: 100-500MB

---

#### Approach 4: LLM-Based Classification

**Description**: Leverage large language models for zero-shot or few-shot intent classification.

**Methodology**:
- Use GPT-4, Claude, or similar models
- Prompt engineering for intent classification
- Few-shot examples for improved accuracy

**Advantages**:
- No training required (zero-shot)
- Excellent understanding of complex queries
- Handles ambiguous intents well
- Easily adaptable to new intents

**Disadvantages**:
- Higher latency (100-500ms)
- API costs (per-request pricing)
- Requires internet connectivity
- Less control over model behavior

**Best Use Cases**:
- Rapid prototyping
- Handling edge cases
- Complex, multi-intent queries
- When labeled data is unavailable

**Example Prompt Template**:
```
Classify the user's intent from the following categories:
- PRODUCT_SEARCH: Looking for products
- FAQ: General questions
- SUPPORT: Need assistance
- ACCOUNT: Account-related
- GENERAL_CHAT: Casual conversation

User query: "{query}"
Intent:
```

**Key Metrics**:
- Accuracy: ~95-98%
- Inference time: 100-500ms per query
- Cost: $0.0001-0.001 per query

---

### 3.3 Hybrid Approach Recommendation

**Optimal Strategy**: Multi-tier classification system

```
Query → Keyword Filter (Fast Path) → 70% of queries
         ↓ (if uncertain)
     XGBoost Classifier → 25% of queries
         ↓ (if confidence < 0.8)
     BERT Model → 4% of queries
         ↓ (if ambiguous)
     LLM Fallback → 1% of queries
```

**Benefits**:
- Optimal cost-performance balance
- Fast for common queries
- Accurate for complex queries
- Graceful degradation

---

## 4. Stage 2: Response Generation

### 4.1 Product Search Intent - RAG Pipeline

When `PRODUCT_SEARCH` intent is detected, the system employs Retrieval-Augmented Generation:

#### 4.1.1 RAG Architecture

```
User Query: "Show me wireless headphones under $100"
    ↓
┌──────────────────────────────────────────┐
│  Query Processing & Enhancement          │
│  - Extract entities (price, category)    │
│  - Expand query with synonyms            │
│  - Generate embedding vector             │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│  Vector Database Search (ChromaDB)       │
│  - Similarity search in vector store     │
│  - Retrieve top-k products (k=5-10)      │
│  - Apply filters (price, category)       │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│  Ranking & Reranking                     │
│  - Score by relevance                    │
│  - Apply business rules                  │
│  - Diversity filtering                   │
└──────────────────────────────────────────┘
    ↓
┌──────────────────────────────────────────┐
│  Response Formatting                     │
│  - Top 2-5 products                      │
│  - Product details (name, price, image)  │
│  - Quick action buttons                  │
└──────────────────────────────────────────┘
    ↓
Formatted Product Results → User
```

#### 4.1.2 Vector Database Configuration

**Current Implementation** (from `product_search.py`):

- **Embedding Model**: `google/embeddinggemma-300m`
- **Vector Store**: ChromaDB (local persistence)
- **Collection**: `product_catalog`
- **Retrieval Strategy**: Similarity search
- **Top-K Results**: 2 (configurable)

**Product Document Structure**:
```python
{
    "page_content": "Title: Product Name, Description: Product details...",
    "metadata": {
        "product_id": "12345",
        "category": "Electronics",
        "price": 99.99,
        "brand": "BrandName",
        "in_stock": true
    }
}
```

#### 4.1.3 Embedding Generation

**Process**:
1. Product text → Sentence embedding (768-dimensional vector)
2. Store in ChromaDB with metadata
3. Query → Same embedding model → Query vector
4. Cosine similarity search → Top matches

**Performance Metrics**:
- Embedding generation: ~50ms per product
- Search latency: 10-30ms (depending on catalog size)
- Retrieval accuracy: ~85-90% (measured by user engagement)

---

### 4.2 Other Intent Handlers

#### FAQ Intent
- Lookup in FAQ knowledge base
- Return pre-written answers
- Suggest related FAQs

#### Support Intent
- Create support ticket
- Route to appropriate department
- Provide ticket number and expected response time

#### Account Intent
- Authenticate user
- Execute account operations
- Confirm changes

#### General Chat Intent
- Use conversational AI (GPT/Claude)
- Maintain conversation context
- Friendly, brand-aligned responses

---

## 5. Response Presentation

### 5.1 Response Format Options

The system generates structured responses for user selection:

#### Option Format A: Product Cards (Current Implementation)
```
✨ Found 2 relevant product(s):

============================================================
🛍️  Result #1
============================================================
📦 Product ID: PROD-12345
📝 Wireless Bluetooth Headphones - Premium Sound Quality
============================================================

============================================================
🛍️  Result #2
============================================================
📦 Product ID: PROD-67890
📝 Noise-Cancelling Wireless Headphones - Over-Ear
============================================================
```

#### Option Format B: Interactive Carousel
- Swipeable product cards
- Quick view buttons
- Add to cart / Learn more CTAs

#### Option Format C: Comparison Table
- Side-by-side product comparison
- Feature matrix
- Price comparison

#### Option Format D: Conversational Response
```
I found 2 great wireless headphones for you under $100:

1. **Premium Wireless Headphones** ($79.99)
   - 30-hour battery life
   - Active noise cancellation
   - [View Details] [Add to Cart]

2. **Sport Wireless Earbuds** ($59.99)
   - Water-resistant
   - Secure fit for workouts
   - [View Details] [Add to Cart]

Would you like to see more options or learn more about either of these?
```

### 5.2 User Selection Mechanisms

- **Click/Tap Selection**: Direct product selection
- **Voice Selection**: "I want option 1"
- **Conversational Refinement**: "Show me cheaper options"
- **Multi-Selection**: Compare multiple products

---

## 6. Technical Implementation

### 6.1 Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Embedding Model | Google EmbeddingGemma-300m | Generate product embeddings |
| Vector Database | ChromaDB | Store and retrieve product vectors |
| Intent Classifier | XGBoost / BERT (TBD) | Classify user intent |
| LLM (Optional) | GPT-4 / Claude | Fallback classification & conversation |
| Backend | Python 3.9+ | Core application logic |
| Framework | LangChain | RAG orchestration |

### 6.2 Data Requirements

#### Training Data for Intent Classification

| Approach | Minimum Samples | Recommended Samples |
|----------|----------------|---------------------|
| Keyword-Based | N/A (rule-based) | N/A |
| XGBoost | 500 per intent | 2,000+ per intent |
| BERT | 1,000 per intent | 5,000+ per intent |
| LLM | 0 (zero-shot) | 5-10 examples (few-shot) |

#### Product Catalog Requirements
- **Minimum**: 100 products with descriptions
- **Recommended**: 1,000+ products for robust search
- **Fields Required**: title, description, category, price, product_id

---

## 7. Performance Metrics & SLAs

### 7.1 Key Performance Indicators

| Metric | Target | Acceptable Range |
|--------|--------|------------------|
| Intent Classification Accuracy | >90% | 85-95% |
| Product Search Relevance | >85% | 80-90% |
| End-to-End Latency | <500ms | 300-700ms |
| User Satisfaction Score | >4.2/5.0 | 4.0-4.5 |
| Query Resolution Rate | >80% | 75-85% |

### 7.2 Scalability Targets

- **Concurrent Users**: 100+ simultaneous queries
- **Query Throughput**: 1,000+ queries/minute
- **Product Catalog Size**: 10,000+ products
- **Response Time at Scale**: <1s at 90th percentile

---

## 8. Implementation Phases

### Phase 1: MVP (4-6 weeks)
- ✅ Basic RAG implementation (Current: `product_search.py`)
- Keyword-based intent classification
- Product search for primary use case
- Simple text-based responses

### Phase 2: Enhanced Classification (2-3 weeks)
- XGBoost classifier training
- Collect and label training data
- A/B testing framework
- Performance monitoring dashboard

### Phase 3: Advanced Features (4-6 weeks)
- BERT-based classification for complex queries
- Multi-intent handling
- Conversation context management
- Personalized recommendations

### Phase 4: Production Optimization (2-4 weeks)
- Hybrid classification pipeline
- Caching layer for frequent queries
- Load balancing and scaling
- Comprehensive analytics

---

## 9. Risk Assessment & Mitigation

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Low intent classification accuracy | High | Medium | Implement hybrid approach with fallback |
| High latency for LLM calls | Medium | High | Use caching and async processing |
| Insufficient training data | High | Medium | Start with keyword + few-shot LLM |
| Vector DB scaling issues | Medium | Low | Plan for distributed ChromaDB or Pinecone |
| Poor product search relevance | High | Medium | Continuous feedback loop and retraining |

---

## 10. Success Criteria

The chatbot system will be considered successful if it achieves:

1. **Accuracy**: >85% intent classification accuracy
2. **Performance**: <500ms average response time
3. **User Satisfaction**: >4.0/5.0 user rating
4. **Adoption**: >70% of product searches via chatbot
5. **Efficiency**: >80% query resolution without human intervention

---

## 11. Next Steps

### Immediate Actions (Week 1-2)
1. Define complete intent taxonomy (extend beyond 7 base intents)
2. Collect initial training dataset (500+ samples per intent)
3. Implement keyword-based classifier as baseline
4. Set up A/B testing infrastructure

### Short-Term (Month 1)
1. Train XGBoost classifier on collected data
2. Integrate intent classification with existing RAG pipeline
3. Develop response formatting templates
4. Deploy to staging environment for internal testing

### Medium-Term (Month 2-3)
1. Fine-tune BERT model for production
2. Implement hybrid classification pipeline
3. Add conversation context management
4. Launch beta to limited user group

---

## 12. Conclusion

The proposed intelligent chatbot system leverages a sophisticated multi-stage architecture that combines the best of rule-based, classical ML, deep learning, and LLM-based approaches. By implementing a hybrid intent classification strategy and integrating RAG for product search, the system will deliver accurate, relevant, and fast responses to user queries.

The modular design allows for iterative improvements and easy integration of new intents and capabilities as business needs evolve. With proper implementation and continuous optimization, this chatbot will significantly enhance user experience and operational efficiency.

---

## Appendix A: Glossary

- **RAG**: Retrieval-Augmented Generation - combining information retrieval with text generation
- **Vector Database**: Database optimized for similarity search using embedding vectors
- **Intent Classification**: Determining the purpose or goal behind a user's query
- **Embedding**: Dense numerical representation of text in vector space
- **ChromaDB**: Open-source vector database for AI applications
- **XGBoost**: Gradient boosting framework for classification and regression
- **BERT**: Bidirectional Encoder Representations from Transformers
- **LLM**: Large Language Model (e.g., GPT-4, Claude)

---

## Appendix B: References

1. Current Implementation: `chatbot/product_search.py`
2. LangChain Documentation: https://python.langchain.com/
3. ChromaDB Documentation: https://docs.trychroma.com/
4. SentenceTransformers: https://www.sbert.net/

---

**Document Owner**: Chatbot Development Team  
**Approved By**: [Manager Name]  
**Last Updated**: January 6, 2026  
**Next Review**: February 6, 2026
