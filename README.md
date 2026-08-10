# 🎓 Da Vinci — Voice-Based Intelligent Learning Assistant

<div align="center">

![Da Vinci Banner](https://img.shields.io/badge/Da%20Vinci-Voice%20Learning%20Assistant-4F46E5?style=for-the-badge&logo=graduation-cap&logoColor=white)

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![LangChain](https://img.shields.io/badge/LangChain-RAG-1C3C3C?style=flat-square&logo=chainlink&logoColor=white)](https://langchain.com)
[![ChromaDB](https://img.shields.io/badge/ChromaDB-Vector%20Store-FF6B35?style=flat-square)](https://trychroma.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

**An AI-powered study companion that understands your voice, reads your documents, and answers in your language.**

[Features](#-features) • [Demo](#-demo) • [Architecture](#-architecture) • [Getting Started](#-getting-started) • [API Docs](#-api-reference) • [Contributing](#-contributing)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎙️ **Voice Input** | Speak your questions — Whisper ASR transcribes and auto-detects language |
| 🔊 **Voice Output** | AI responses are spoken aloud using Google TTS in your language |
| 📄 **Document Q&A** | Upload PDF, DOCX, or TXT files and ask questions about their contents |
| 🧠 **RAG Pipeline** | Retrieval-Augmented Generation ensures grounded, cited answers |
| 🌐 **Multilingual** | Supports English, Hindi, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Odia |
| 🗂️ **Project Management** | Organize study sessions into subject-based projects |
| 📜 **Chat History** | Persistent conversation history with branching thread support |
| 📎 **Source Citations** | Every document-based answer shows the source file and snippet |

---

## 🖥️ Demo

```
User (voice/text): "Explain Newton's second law from my notes"
         ↓
  Whisper STT → Auto language detection
         ↓
  ChromaDB retrieves relevant chunks from uploaded notes
         ↓
  Qwen2.5-7B generates a grounded, cited answer
         ↓
  gTTS speaks the response aloud
         ↓
StudyBot: "According to your notes, Newton's second law states F = ma..."
          [Source: physics_notes.pdf] 🔊
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                  Frontend (React + Vite)              │
│                   http://localhost:3003               │
│   Sidebar │ ChatWindow │ ChatInput │ MessageBubble    │
└──────────────────────┬───────────────────────────────┘
                       │  REST API (proxied)
                       ▼
┌──────────────────────────────────────────────────────┐
│                Backend (FastAPI)                      │
│                 http://localhost:5003                 │
│                                                       │
│  /api/chat-text  /api/transcribe  /api/upload        │
│  /api/sessions   /api/history     /api/projects      │
└────┬──────────┬──────────┬──────────┬────────────────┘
     │          │          │          │
     ▼          ▼          ▼          ▼
 ChromaDB   SQLite3   HuggingFace  gTTS / Whisper
 Vectors    History   Inference    (Local Models)
```

### AI / ML Stack

| Component | Model / Library | Role |
|---|---|---|
| **LLM** | `Qwen/Qwen2.5-7B-Instruct` | Chat responses & multilingual translation |
| **Speech-to-Text** | `faster-whisper` (small) | Voice transcription + language detection |
| **Text-to-Speech** | `gTTS` | Speak AI responses in 9 languages |
| **Embeddings** | `all-MiniLM-L6-v2` | Encode documents for semantic search |
| **Vector Store** | `ChromaDB` | Store & retrieve relevant document chunks |
| **RAG** | `LangChain` | Retrieval-Augmented Generation pipeline |

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ (or use the portable version at `E:/project/nodejs`)
- A [HuggingFace](https://huggingface.co) account and API token

### 1. Clone the Repository

```bash
git clone https://github.com/immanueli2005-dev/Voice-Based-Intelligent-Learning-Assistant2.git
cd Voice-Based-Intelligent-Learning-Assistant2
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your HuggingFace token
```

**.env file:**
```env
HF_TOKEN=hf_your_token_here
CHROMA_DB_PATH=./data/chroma_db
```

### 3. Download Whisper Model

```bash
python download_model.py
```

> This downloads the `faster-whisper-small` model (~460 MB) to `./data/whisper-small/`

### 4. Frontend Setup

```bash
cd ../frontend
npm install
```

### 5. Run the Project

**Terminal 1 — Backend:**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 5003
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

| Service | URL |
|---|---|
| 🌐 Frontend | http://localhost:3003 |
| ⚙️ Backend API | http://localhost:5003 |
| 📖 Swagger Docs | http://localhost:5003/docs |

---

## 📁 Project Structure

```
Voice-Based-Intelligent-Learning-Assistant2/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── database.py              # SQLite session & history management
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   ├── chat.py              # /api/chat-text endpoint
│   │   ├── transcribe.py        # /api/transcribe + /api/translate
│   │   ├── upload.py            # /api/upload document ingestion
│   │   ├── history.py           # /api/history
│   │   └── projects.py          # /api/projects
│   ├── services/
│   │   ├── llm_service.py       # HuggingFace Inference client
│   │   ├── rag_service.py       # ChromaDB retriever (lazy-loaded)
│   │   ├── stt_service.py       # Whisper speech-to-text
│   │   ├── tts_service.py       # gTTS text-to-speech
│   │   └── ingest_service.py    # PDF/DOCX/TXT chunking & ingestion
│   ├── models/
│   │   └── schemas.py           # Pydantic request/response models
│   └── data/                    # (gitignored) DB, vectors, models
│
└── frontend/
    ├── index.html
    ├── vite.config.js           # Vite proxy → backend:5003
    ├── tailwind.config.js
    └── src/
        ├── App.jsx              # Root component & state management
        ├── index.css
        └── components/
            ├── Sidebar.jsx      # Project & session navigator
            ├── ChatWindow.jsx   # Message thread & file upload
            ├── ChatInput.jsx    # Text input + microphone
            ├── MessageBubble.jsx # Message rendering with citations
            └── LanguageSelector.jsx
```

---

## 🌐 Multilingual Support

| Language | Code | Voice In | Voice Out |
|---|---|---|---|
| English | `en` | ✅ | ✅ |
| Hindi | `hi` | ✅ | ✅ |
| Tamil | `ta` | ✅ | ✅ |
| Telugu | `te` | ✅ | ✅ |
| Kannada | `kn` | ✅ | ✅ |
| Malayalam | `ml` | ✅ | ✅ |
| Bengali | `bn` | ✅ | ✅ |
| Marathi | `mr` | ✅ | ✅ |
| Odia | `or` | ✅ | ✅ |

Voice input is **auto-detected** by Whisper. Non-English input is translated to English for the RAG pipeline, and responses are generated back in your chosen language.

---

## 📄 Document Ingestion Pipeline

```
Upload File (PDF / DOCX / TXT)
        ↓
   Parse with PyMuPDF / Docx2txt / TextLoader
        ↓
   Chunk: 1000 chars, 100 overlap
   (RecursiveCharacterTextSplitter)
        ↓
   Embed with all-MiniLM-L6-v2
        ↓
   Store in ChromaDB (tagged with sessionId + fileName)
        ↓
   On Query → Top-3 semantically similar chunks retrieved
        ↓
   Injected into LLM prompt as context
        ↓
   Answer with source citations shown in UI
```

---

## 🔌 API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/api/chat-text` | Send query, get AI response + audio URL |
| `POST` | `/api/transcribe` | Upload audio → transcription + language |
| `POST` | `/api/translate` | Translate text to English |
| `POST` | `/api/upload` | Upload and ingest a document |
| `DELETE` | `/api/documents` | Remove document vectors |
| `GET` | `/api/sessions` | List all sessions |
| `POST` | `/api/sessions` | Create a new session |
| `PUT` | `/api/sessions/{id}` | Rename a session |
| `DELETE` | `/api/sessions/{id}` | Delete a session |
| `GET` | `/api/history` | Get message history for a session |
| `GET` | `/api/projects` | List all projects |
| `POST` | `/api/projects` | Create a project |
| `PUT` | `/api/projects/{id}` | Rename a project |
| `DELETE` | `/api/projects/{id}` | Delete a project |

> Full interactive docs available at **http://localhost:5003/docs**

---

## 🛠️ Tech Stack

**Backend**
- [FastAPI](https://fastapi.tiangolo.com/) — REST API framework
- [LangChain](https://langchain.com/) — RAG pipeline orchestration
- [ChromaDB](https://trychroma.com/) — Vector database
- [faster-whisper](https://github.com/SYSTRAN/faster-whisper) — Speech recognition
- [gTTS](https://gtts.readthedocs.io/) — Text-to-speech
- [sentence-transformers](https://sbert.net/) — Text embeddings
- [PyMuPDF](https://pymupdf.readthedocs.io/) — PDF parsing
- [SQLite](https://sqlite.org/) — Chat history storage

**Frontend**
- [React 18](https://react.dev/) — UI framework
- [Vite](https://vitejs.dev/) — Build tool & dev server
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [Axios](https://axios-http.com/) — HTTP client
- [Lucide React](https://lucide.dev/) — Icons

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Immanuel**
- GitHub: [@immanueli2005-dev](https://github.com/immanueli2005-dev)

---

<div align="center">
  Made with ❤️ for students everywhere
</div>
