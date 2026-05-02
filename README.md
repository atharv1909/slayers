# CatalysisAI 

**Team:** slayers 
**Our Solution:** CatalysisAI  
**Client:** GPS Renewables (India's first Ethanol-to-Jet plant)

---

## What We Built

CatalysisAI is an AI-powered molecular discovery operating system that compresses months of catalyst R&D into hours. Scientists input a target reaction, and the platform autonomously scouts databases, generates novel catalyst candidates using generative AI, predicts performance, visualizes 3D molecular structures, and logs experimental feedback into a closed loop that continuously improves predictions.

Built specifically for GPS Renewables' Ethanol-to-Jet pathway — where discovering the right catalyst is the bottleneck between prototype and gigaton-scale sustainable aviation fuel.

---

## Architecture (In progress)

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js 14)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │  Discovery   │  │  3D Viewer   │  │   Synthetic Biology    │ │
│  │  Dashboard   │  │  (3Dmol.js)  │  │   (ReactFlow Canvas)   │ │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬─────────────┘ │
│         │                 │                      │               │
│  ┌──────▼───────────────────────────────────────▼─────────────┐ │
│  │              Zustand Global State (Screen Awareness)        │ │
│  └──────────────────────────┬──────────────────────────────────┘ │
│                             │                                     │
│  ┌──────────────────────────▼──────────────────────────────────┐ │
│  │                   AI Co-Pilot Sidebar                       │ │
│  │              (Context-Aware Groq Chat)                      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────┬───────────────────────────────────┘
                              │ API Routes
┌─────────────────────────────▼───────────────────────────────────┐
│                    PYTHON AI BACKEND                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │              Multi-Agent Discovery Swarm                │    │
│  │                                                         │    │
│  │  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────────┐  │    │
│  │  │  Scout  │→ │ Designer │→ │ Oracle │→ │   Sage   │  │    │
│  │  │ Agent   │  │  Agent   │  │ Agent  │  │  Agent   │  │    │
│  │  │(Search) │  │  (Gen)   │  │(Pred.) │  │(Insight) │  │    │
│  │  └────┬────┘  └────┬─────┘  └───┬────┘  └────┬─────┘  │    │
│  │       └────────────┴────────────┴─────────────┘        │    │
│  │                    LangChain Orchestrator               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  RAG Engine  │  │  Retraining  │  │  Pathway Optimizer  │   │
│  │  (ChromaDB)  │  │  Pipeline    │  │  (Flux Analysis)    │   │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
└─────────────────────────────┬───────────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                         DATA LAYER                               │
│  ┌──────────────────┐          ┌──────────────────────────────┐  │
│  │   Supabase       │          │       ChromaDB               │  │
│  │   PostgreSQL     │          │  (Vector embeddings for RAG) │  │
│  │   + Realtime     │          └──────────────────────────────┘  │
│  │   + Auth (RLS)   │                                            │
│  └──────────────────┘                                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## Repo 

```
catalysis-ai/
│
├── README.md
│
├── ai/                              ← Python AI Backend (THIS FOLDER)
│   ├── requirements.txt
│   ├── config.py                    ← API keys, model configs
│   │
│   ├── agents/                      ← LangChain Multi-Agent Swarm
│   │   ├── __init__.py
│   │   ├── base_agent.py            ← Abstract base for all agents
│   │   ├── scout_agent.py           ← Literature + DB search agent
│   │   ├── designer_agent.py        ← Generative SMILES agent
│   │   ├── oracle_agent.py          ← Property prediction agent
│   │   ├── sage_agent.py            ← Synthesis + ranking agent
│   │   └── swarm_orchestrator.py    ← LangChain orchestration logic
│   │
│   ├── workflows/                   ← LangGraph workflow definitions
│   │   ├── __init__.py
│   │   ├── discovery_workflow.py    ← Main discovery pipeline graph
│   │   ├── retrain_workflow.py      ← Model feedback loop
│   │   └── pathway_workflow.py      ← Metabolic pathway optimization
│   │
│   ├── rag/                         ← Retrieval Augmented Generation
│   │   ├── __init__.py
│   │   ├── knowledge_base.py        ← Chemistry KB loader + chunker
│   │   ├── vector_store.py          ← ChromaDB interface
│   │   └── retriever.py             ← Contextual retrieval for agents
│   │
│   ├── tools/                       ← LangChain custom tools
│   │   ├── __init__.py
│   │   ├── database_tools.py        ← Supabase query tools
│   │   ├── chem_tools.py            ← RDKit + SMILES validation tools
│   │   └── prediction_tools.py      ← Heuristic property predictors
│   │
│   └── schemas/                     ← Pydantic data models
│       ├── __init__.py
│       ├── candidate.py
│       └── experiment.py
│
├── frontend/                        ← Next.js 14 App (separate folder)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   ├── lib/
│   │   └── stores/
│   ├── package.json
│   └── ...
│
└── scripts/
    ├── seed_db.py                   ← Populate Supabase with synthetic data
    └── index_kb.py                  ← Index chemistry knowledge base into ChromaDB
```

---

## AI Pipeline — How It Works

### 1. Discovery Swarm (Multi-Agent)
When a scientist inputs a reaction like `"CO2 + H2 → Methanol"`:

1. **Scout Agent** queries Materials Project, Open Catalyst DB, and BRENDA for known catalysts. Uses semantic search via ChromaDB to find relevant literature.
2. **Designer Agent** receives known SMILES + reaction context, calls GPT-4o with chain-of-thought prompting to generate 8 novel catalyst structures. Validates each with RDKit.
3. **Oracle Agent** runs heuristic property prediction (activity, selectivity, stability) using a pre-trained surrogate model. Flags uncertainty.
4. **Sage Agent** synthesizes findings, ranks candidates by weighted score, generates natural language insight report.

### 2. RAG Knowledge Base
Chemistry papers + catalyst databases are chunked and embedded into ChromaDB. Agents retrieve relevant context before generation — grounding outputs in real catalysis science rather than hallucination.

### 3. Feedback Loop (Retraining)
When lab results are logged, the retraining workflow compares predicted vs. actual, computes error vectors, adjusts surrogate model weights, and updates predictions for similar candidates.

### 4. Metabolic Pathway Optimizer
Uses constraint-based flux analysis (mocked FBA) to identify bottleneck enzymes in synthetic biology pathways (Cellulose → Ethanol → Jet Fuel).

---

## Setup

```bash
# Python AI backend
cd ai/
pip install -r requirements.txt

# Index knowledge base
python ../scripts/index_kb.py

# Seed database
python ../scripts/seed_db.py

# Frontend
cd ../frontend/
npm install
npm run dev
```

### Environment Variables
```
GROQ_API_KEY=(*&^%
CHROMA_PERSIST_DIR=./chroma_db
```

---


## Carbon Impact

CatalysisAI estimates **-2.4 tons CO₂e per batch** for the Ethanol-to-Jet pathway vs conventional jet fuel production. Every candidate is scored on its carbon footprint — making sustainability a first-class metric alongside yield and selectivity.

---
