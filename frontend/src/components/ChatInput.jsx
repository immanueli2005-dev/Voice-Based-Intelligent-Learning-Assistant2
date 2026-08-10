import React, { useState, useRef, useEffect } from 'react';
import { Send, Mic, Square, Paperclip, Loader2, X, RefreshCw, Check, AlertCircle, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

export default function ChatInput({ onSendText, onUploadFile, isProcessing, languageCode, setLanguageCode, theme }) {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Voice Modal States
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [voiceModalState, setVoiceModalState] = useState('idle'); // 'idle' | 'recording' | 'transcribing' | 'review' | 'error'
  const [transcribedText, setTranscribedText] = useState('');
  const [detectedLanguage, setDetectedLanguage] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [voiceError, setVoiceError] = useState('');

  // Custom Language Dropdown States & Ref
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const LANGUAGES = [
    { code: 'bn', name: 'Bengali (বাংলা)' },
    { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
    { code: 'en', name: 'English' },
    { code: 'mr', name: 'Marathi (मराठी)' },
    { code: 'hi', name: 'Hindi (हिन्दी)' },
    { code: 'te', name: 'Telugu (తెలుగు)' },
    { code: 'ta', name: 'Tamil (தமிழ்)' },
    { code: 'ml', name: 'Malayalam (മലയാളം)' }
  ];

  const getLanguageName = (code) => {
    const found = LANGUAGES.find(l => l.code === code);
    return found ? found.name : 'English';
  };

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);

  const handleSend = () => {
    if (inputText.trim() && !isProcessing) {
      onSendText(inputText.trim());
      setInputText('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Start Recording inside the Voice Modal
  const startRecording = async () => {
    setVoiceError('');
    setTranscribedText('');
    setTranslatedText('');
    setVoiceModalState('recording');
    setShowVoiceModal(true);

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognitionRef.current = recognition;
        recognition.continuous = true;
        recognition.interimResults = true;

        const LANG_TAGS = {
          en: 'en-US',
          hi: 'hi-IN',
          ta: 'ta-IN',
          te: 'te-IN',
          kn: 'kn-IN',
          or: 'or-IN',
          mr: 'mr-IN',
          ml: 'ml-IN',
          bn: 'bn-IN'
        };
        recognition.lang = LANG_TAGS[languageCode] || 'en-US';

        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          const textResult = finalTranscript || interimTranscript;
          setTranscribedText(textResult);
        };

        recognition.onerror = (e) => {
          console.error("Speech recognition error:", e);
          if (e.error === 'not-allowed') {
            setVoiceError("Microphone access denied. Please verify browser permissions.");
            setVoiceModalState('error');
          }
        };

        recognition.onend = () => {
          // Handled manually or via standard stops
        };

        recognition.start();
      } catch (err) {
        console.error("Web Speech initialization error:", err);
        setVoiceError("Failed to initialize speech recognition.");
        setVoiceModalState('error');
      }
    } else {
      // Whisper Audio Fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
          stream.getTracks().forEach(track => track.stop());

          setVoiceModalState('transcribing');
          
          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          try {
            const res = await axios.post('/api/transcribe', formData, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (res.data.transcription) {
              setTranscribedText(res.data.transcription);
              setDetectedLanguage(res.data.languageCode || '');
              setTranslatedText(res.data.translation || '');
              setVoiceModalState('review');
            } else {
              throw new Error("No transcription returned");
            }
          } catch (err) {
            console.error("Transcription failed:", err);
            setVoiceError("I couldn't transcribe your voice. Please record again.");
            setVoiceModalState('error');
          }
        };

        mediaRecorder.start();
      } catch (err) {
        console.error('Error accessing microphone', err);
        setVoiceError("Microphone access denied. Please check your browser permissions.");
        setVoiceModalState('error');
      }
    }
  };

  // Stop recording inside the modal
  const stopRecording = async () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (err) {
        console.error("Error stopping SpeechRecognition:", err);
      }
      
      setVoiceModalState('transcribing');
      setDetectedLanguage(languageCode);

      if (languageCode !== 'en' && transcribedText.trim()) {
        try {
          const res = await axios.post('/api/translate', {
            text: transcribedText,
            languageCode: languageCode
          });
          setTranslatedText(res.data.translation || '');
        } catch (err) {
          console.error("Translation API error:", err);
        }
      }
      setVoiceModalState('review');
    } else {
      if (mediaRecorderRef.current && voiceModalState === 'recording') {
        mediaRecorderRef.current.stop();
      }
    }
  };

  const handleCancelVoiceModal = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.stop();
      } catch (err) {
        console.error("Error stopping recognition on cancel:", err);
      }
      recognitionRef.current = null;
    }
    setShowVoiceModal(false);
    setVoiceModalState('idle');
    setTranscribedText('');
    setDetectedLanguage('');
    setTranslatedText('');
    setVoiceError('');
  };

  const handleConfirmSend = () => {
    if (transcribedText.trim()) {
      onSendText(transcribedText.trim(), detectedLanguage);
      handleCancelVoiceModal();
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUploadFile(selectedFile);
      setSelectedFile(null);
    }
  };

  return (
    <div className="relative max-w-3xl mx-auto w-full">
      
      {/* File Upload Attachment Preview */}
      <AnimatePresence>
        {selectedFile && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute -top-14 left-0 right-0 flex items-center justify-between glass-panel px-4 py-2.5 rounded-xl border border-white/10 shadow-2xl"
          >
            <div className="flex items-center gap-2 text-sm">
              <Paperclip className="w-4 h-4 text-zinc-400" />
              <span className="truncate max-w-[200px] text-zinc-800 dark:text-zinc-200 font-medium">{selectedFile.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={handleUpload}
                disabled={isProcessing}
                className="text-xs bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-100 font-semibold text-white dark:text-zinc-950 px-3 py-1.5 rounded-lg transition-all cursor-pointer shadow-sm"
              >
                Upload
              </button>
              <button onClick={() => setSelectedFile(null)} className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/5 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Input Textarea Bar */}
      <div className="flex items-center gap-2 rounded-full border shadow-xl bg-white/70 backdrop-blur-md p-1.5 w-full border-sky-200/50 pl-4">
        {/* Text Area */}
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message to StudyBot..."
          disabled={isProcessing}
          className="flex-1 bg-transparent outline-none resize-none px-2 py-2 text-sm leading-relaxed text-slate-800 placeholder-slate-400"
          style={{ height: '36px', minHeight: '36px' }}
          rows={1}
        />

        {/* Action Controls (Globe Lang, Voice, Send) */}
        <div className="flex items-center gap-1 shrink-0 pr-1">
          {/* Custom Language Selector Dropdown Popover */}
          <div className="relative" ref={langDropdownRef}>
            <button
              type="button"
              onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
              disabled={isProcessing}
              className="p-2 hover:bg-sky-100/70 rounded-full transition-all cursor-pointer flex items-center justify-center text-sky-600"
              title={`Select Language (Current: ${getLanguageName(languageCode)})`}
            >
              <Globe className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {isLangDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: -10, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute bottom-12 right-0 w-56 rounded-xl border shadow-2xl z-50 flex flex-col gap-0.5 p-1.5"
                  style={{
                    backgroundColor: '#ffffff',
                    borderColor: 'rgba(14, 165, 233, 0.2)',
                    color: '#0f172a'
                  }}
                >
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => {
                        setLanguageCode(lang.code);
                        setIsLangDropdownOpen(false);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm transition-all cursor-pointer font-medium border border-transparent"
                      style={{
                        backgroundColor: languageCode === lang.code ? '#bae6fd' : 'transparent',
                        color: languageCode === lang.code ? '#0369a1' : '#475569'
                      }}
                    >
                      {lang.name}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mic Trigger */}
          <button
            type="button"
            onClick={startRecording}
            disabled={isProcessing}
            className="p-2 hover:bg-sky-100/70 rounded-full flex items-center justify-center transition-all cursor-pointer text-sky-600"
            title="Voice Speech Input"
          >
            <Mic className="w-5 h-5" />
          </button>
          
          {/* Send Trigger */}
          <button
            onClick={handleSend}
            disabled={(!inputText.trim()) || isProcessing}
            className="p-2.5 rounded-full flex items-center justify-center transition-all shadow-md"
            style={{
              backgroundColor: (inputText.trim() && !isProcessing) ? '#0284c7' : '#e2e8f0',
              color: (inputText.trim() && !isProcessing) ? '#ffffff' : '#94a3b8',
              cursor: (inputText.trim() && !isProcessing) ? 'pointer' : 'not-allowed'
            }}
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Voice Input Modal Overlay (Speech-to-Text with edit/confirmation workflow) */}
      <AnimatePresence>
        {showVoiceModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 10 }}
              className="w-full max-w-md rounded-xl shadow-2xl p-6 relative overflow-hidden backdrop-blur-2xl border-2 border-sky-300/50"
              style={{
                backgroundColor: 'rgba(224, 242, 254, 0.95)',
                color: '#0f172a'
              }}
            >
              {/* Glowing Background Radial */}
              <div className="absolute top-[-30px] right-[-30px] w-[160px] h-[160px] bg-sky-400/20 blur-[45px] rounded-full pointer-events-none" />

              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold" style={{ color: '#0369a1' }}>
                  Voice Assistant
                </h3>
                <button 
                  onClick={handleCancelVoiceModal} 
                  className="p-1 rounded-lg transition hover:bg-sky-200/50 cursor-pointer"
                  style={{ color: '#0369a1' }}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Unified Voice Status Visualizer */}
              <div className="flex flex-col items-center justify-center py-4 text-center border-b mb-4" style={{ borderColor: 'rgba(14, 165, 233, 0.2)' }}>
                <div className="relative flex items-center justify-center mb-4">
                  {/* Glowing animations depending on states */}
                  {voiceModalState === 'recording' && (
                    <>
                      <span className="absolute inline-flex h-20 w-20 rounded-full bg-sky-400/40 animate-ping"></span>
                      <span className="absolute inline-flex h-24 w-24 rounded-full bg-sky-400/20 animate-pulse"></span>
                    </>
                  )}
                  {voiceModalState === 'transcribing' && (
                    <>
                      <span className="absolute inline-flex h-20 w-20 rounded-full bg-blue-400/30 animate-ping"></span>
                      <span className="absolute inline-flex h-24 w-24 rounded-full bg-blue-400/20 animate-pulse"></span>
                    </>
                  )}
                  {voiceModalState === 'review' && (
                    <span className="absolute inline-flex h-20 w-20 rounded-full bg-sky-400/10 animate-pulse"></span>
                  )}
                  
                  <div className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all text-white ${
                    voiceModalState === 'recording' ? 'bg-gradient-to-br from-sky-400 to-blue-600 shadow-sky-400/30' :
                    voiceModalState === 'transcribing' ? 'bg-gradient-to-br from-blue-600 to-indigo-600 shadow-blue-500/30 animate-pulse' :
                    'bg-gradient-to-br from-sky-500 to-blue-500 shadow-sky-500/20'
                  }`}>
                    {voiceModalState === 'transcribing' ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : (
                      <Mic className="w-7 h-7" />
                    )}
                  </div>
                </div>

                <p className="font-semibold text-sm animate-pulse" style={{ color: 'var(--text-primary)' }}>
                  {voiceModalState === 'recording' && 'Listening... Speak now.'}
                  {voiceModalState === 'transcribing' && 'Converting speech to text...'}
                  {voiceModalState === 'review' && 'Transcription Complete'}
                  {voiceModalState === 'error' && 'Error Occurred'}
                </p>
                <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {voiceModalState === 'recording' && `Recording in ${getLanguageName(languageCode)}`}
                  {voiceModalState === 'transcribing' && 'Decoding audio via faster-whisper'}
                  {voiceModalState === 'review' && 'Verify and edit the message below'}
                  {voiceModalState === 'error' && 'Recording failed'}
                </p>
              </div>

              {/* Unified Content Display Box (Always visible!) */}
              <div className="flex flex-col gap-3 mt-4">
                {/* Spoken Text Block */}
                <div className="flex flex-col gap-1 w-full text-left">
                  <label className="text-[11px] font-semibold px-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    Spoken Text ({getLanguageName(detectedLanguage || languageCode)})
                  </label>
                  <textarea
                    value={transcribedText}
                    onChange={(e) => setTranscribedText(e.target.value)}
                    disabled={voiceModalState === 'transcribing'}
                    className="w-full bg-white/5 rounded-xl px-4 py-2.5 outline-none text-sm leading-relaxed min-h-[95px] resize-y"
                    style={{
                      backgroundColor: 'var(--bg-input)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                    placeholder={voiceModalState === 'recording' ? "Speak to start transcribing live in real-time..." : "Transcribed text will appear here..."}
                  />
                </div>

                {/* English Translation Block (Shows if selected language is not English) */}
                {languageCode !== 'en' && (
                  <div className="flex flex-col gap-1 w-full text-left">
                    <label className="text-[11px] font-semibold px-1 uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                      English Translation
                    </label>
                    <div 
                      className="w-full rounded-xl px-4 py-2.5 text-xs italic leading-relaxed min-h-[52px] select-none border"
                      style={{
                        backgroundColor: 'var(--bg-input)',
                        borderColor: 'var(--border-color)',
                        color: 'var(--text-secondary)'
                      }}
                    >
                      {voiceModalState === 'recording' && !transcribedText ? (
                        <span>Waiting for speech...</span>
                      ) : voiceModalState === 'transcribing' ? (
                        <span className="animate-pulse flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                          <Loader2 className="w-3 h-3 animate-spin" /> Translating spoken word...
                        </span>
                      ) : translatedText ? (
                        translatedText
                      ) : (
                        <span>Translation will appear here when you stop speaking.</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Error message displays inline if occurred */}
                {voiceModalState === 'error' && (
                  <div className="flex items-center gap-2 text-red-400 text-xs py-1.5 px-2 bg-red-950/20 border border-red-500/10 rounded-xl">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{voiceError || "An error occurred during voice session."}</span>
                  </div>
                )}

                {/* Bottom Control Buttons Section */}
                <div className="flex items-center justify-between mt-2 gap-2">
                  {voiceModalState === 'recording' && (
                    <button 
                      onClick={stopRecording}
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white rounded-full font-semibold text-xs shadow-lg transition cursor-pointer w-full"
                    >
                      <Square className="w-3.5 h-3.5 fill-current" />
                      Stop & Translate
                    </button>
                  )}

                  {voiceModalState === 'transcribing' && (
                    <button 
                      disabled
                      className="flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-100 text-sky-600 rounded-full font-semibold text-xs transition cursor-not-allowed w-full"
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Translating Voice...
                    </button>
                  )}

                  {(voiceModalState === 'review' || voiceModalState === 'error') && (
                    <>
                      <button
                        onClick={startRecording}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-sky-300 bg-white text-sky-600 hover:bg-sky-50 transition font-semibold text-xs cursor-pointer flex-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Record Again
                      </button>
                      
                      <button
                        onClick={handleConfirmSend}
                        disabled={!transcribedText.trim()}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-white bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 transition font-semibold text-xs cursor-pointer flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Confirm & Send
                      </button>
                    </>
                  )}
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
