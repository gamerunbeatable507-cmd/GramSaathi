/**
 * Multilingual Web Speech API Service for GramSaathi
 * Supports 8 Indian Languages (EN, HI, MR, TA, TE, BN, GU, KN)
 * Full two-way voice interaction: Voice Input (STT) + Spoken Diagnosis & Solution (TTS)
 */

const LOCALE_MAP = {
  en: 'en-IN',
  hi: 'hi-IN',
  mr: 'mr-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
  gu: 'gu-IN',
  kn: 'kn-IN'
};

export const speechService = {
  isSupported() {
    return 'speechSynthesis' in window;
  },

  isRecognitionSupported() {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  },

  speak(text, lang = 'hi', onEnd = null) {
    if (!('speechSynthesis' in window)) {
      console.warn("Speech synthesis not supported in this browser");
      if (onEnd) onEnd();
      return;
    }

    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const utterance = new SpeechSynthesisUtterance(text);
    const targetLocale = LOCALE_MAP[lang] || lang || 'hi-IN';
    utterance.lang = targetLocale;

    // Try to pick matching voice if available in browser
    const voices = window.speechSynthesis.getVoices();
    const matchedVoice = voices.find(v => v.lang === targetLocale || v.lang.startsWith(lang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.rate = 0.92; // Clear, compassionate pacing for rural patient comprehension
    utterance.pitch = 1.0;

    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = (e) => {
        console.warn("Speech synthesis notice:", e);
        onEnd();
      };
    }

    window.speechSynthesis.speak(utterance);
  },

  stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  },

  startVoiceRecognition(lang = 'hi', onResult, onError, onStart = null) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      if (onError) onError("Voice recognition is not supported in this browser.");
      return null;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = LOCALE_MAP[lang] || lang || 'hi-IN';

    if (onStart) {
      recognition.onstart = onStart;
    }

    recognition.onresult = (event) => {
      if (event.results && event.results[0] && event.results[0][0]) {
        const transcript = event.results[0][0].transcript;
        if (onResult) onResult(transcript);
      }
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
      if (onError) onError(err.error || "Recognition failed");
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn("Recognition already started or permission blocked:", e);
    }

    return recognition;
  }
};
