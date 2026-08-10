import os
from faster_whisper import WhisperModel

try:
    import torch
    device = "cuda" if torch.cuda.is_available() else "cpu"
except ImportError:
    device = "cpu"

# Use local model path to avoid broken symlink issues on Windows
LOCAL_MODEL_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "whisper-small")
LOCAL_MODEL_PATH = os.path.normpath(LOCAL_MODEL_PATH)

compute_type = "float16" if device == "cuda" else "float32"

print(f"Loading Whisper model from {LOCAL_MODEL_PATH} on {device} ({compute_type})...")
whisper_model = WhisperModel(LOCAL_MODEL_PATH, device=device, compute_type=compute_type)
print("Whisper model loaded.")

def transcribe_audio(tmp_path: str):
    segments, info = whisper_model.transcribe(tmp_path, beam_size=5)
    text = " ".join([s.text for s in segments]).strip()
    return text, info.language
