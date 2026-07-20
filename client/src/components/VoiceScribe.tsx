import React, { useState, useEffect } from "react";
import { Mic, MicOff, Check, Loader2 } from "lucide-react";

declare const process: {
  env: {
    NEXT_PUBLIC_BASE_URL?: string;
    BASEURL?: string;
  };
};

export const VoiceScribe: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null); // Added missing state
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    // Check if browser supports Web Speech API
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      rec.onerror = (err: any) => {
        console.error("Speech Recognition Error:", err);
        setError("Voice input failed. Try speaking again.");
      };

      setRecognition(rec);
    } else {
      setError("Web Speech API is not supported in this browser.");
    }
  }, []);

  const handleToggleRecording = () => {
    if (!recognition) return;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setError(null);
      setResponse(null);
      setSuccessMessage(null);
      setTranscript("");
      recognition.start();
      setIsRecording(true);
    }
  };

  const handleProcessScribe = async () => {
    if (!transcript.trim()) {
      setError("No transcription recorded yet.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BASEURL || "http://localhost:5005";
      const res = await fetch(`${baseUrl}/api/v1/ai/parse-scribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rawText: transcript }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to parse notes.");
      }

      setResponse(data.data);
      setSuccessMessage("Notes successfully processed and filed!");
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      {/* AI Scribe Console Panel */}
      <div className="flex items-center gap-2 mb-3">
        <span className="flex h-2 w-2 rounded-full bg-teal-500" />
        <h3 className="text-sm font-semibold text-gray-800">Hands-Free AI Voice Scribe</h3>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-start gap-4">
          <button
            type="button"
            onClick={handleToggleRecording}
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-5 py-3 rounded-lg font-medium text-sm transition-all shadow-sm flex-shrink-0 ${isRecording
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-teal-600 hover:bg-teal-700 text-white'
              }`}
          >
            {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            {isRecording ? 'Stop Transcribing' : 'Record Voice Entry'}
          </button>

          {/* Changed from readOnly input to editable textarea */}
          <div className="flex-1">
            <textarea
              rows={2}
              placeholder="Click record and start speaking clinical findings... (Or type directly here to correct text)"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              disabled={isRecording || loading}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-700 font-normal placeholder-gray-400 focus:bg-white focus:border-teal-500 focus:ring-2 focus:ring-teal-100 focus:outline-none resize-none transition-all disabled:opacity-70"
            />
          </div>

          <button
            type="button"
            onClick={handleProcessScribe}
            disabled={loading || !transcript.trim() || isRecording}
            className="flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-40 text-white font-medium text-sm px-6 py-3 rounded-lg transition-all flex-shrink-0"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
            File to History
          </button>
        </div>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="mt-3 text-xs bg-red-50 text-red-700 border border-red-100 p-2.5 rounded-md">
          ⚠️ {error}
        </div>
      )}
      {successMessage && (
        <div className="mt-3 text-xs bg-green-50 text-green-800 border border-green-100 p-2.5 rounded-md font-medium">
          ✓ {successMessage}
        </div>
      )}
    </div>
  );
};