import { useEffect, useRef, useState } from "react";
import ActionModal from "../@components/ActionModal";
import { FaMicrophone, FaStop, FaRotateRight, FaToggleOn, FaToggleOff } from "react-icons/fa6";
import useRecorder from "../api/useRecorder";
import { cn } from "../lib/cn";
import { TextArea } from "../@components/TextArea";
import { PiSpinnerGap } from "react-icons/pi";
import useSendLiveQuestion from "../api/sendLiveQuestion";
import toast from "react-hot-toast";
import { Select } from "../@components/Select";

// Polyfill for SpeechRecognition type support
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const LANGUAGES = [
  { label: "English (US)", value: "en-US" },
  { label: "English (UK)", value: "en-GB" },
  { label: "English (IN)", value: "en-IN" },
  { label: "Spanish", value: "es-ES" },
  { label: "French", value: "fr-FR" },
  { label: "German", value: "de-DE" },
  { label: "Hindi", value: "hi-IN" },
  { label: "Japanese", value: "ja-JP" },
];

export function RecordModal({
  isVisible,
  setIsVisible,
  podcast_id,
}: {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  podcast_id: string;
}) {
  const {
    state,
    amplitude,
    startRecording,
    stopRecording,
  } = useRecorder();

  const [transcript, setTranscript] = useState("");
  const [stopOnSilence, setStopOnSilence] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const recognitionRef = useRef<any>(null);

  const { mutate: sendQuestion, isLoading: isSending } = useSendLiveQuestion({
    onSuccess: () => {
      toast.success("Question submitted successfully!");
      setIsVisible(false);
      setTranscript("");
    },
    onError: () => {
      toast.error("Failed to submit question. Please try again.");
    }
  });

  const startSession = () => {
    setTranscript("");
    startRecording({ stopOnSilence }).catch((err) => {
      console.error("Error starting recording:", err);
    });

    // Initialize SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } else {
      console.warn("Speech Recognition API not supported in this browser.");
    }
  };

  const handleStop = () => {
    stopRecording();
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  };

  useEffect(() => {
    if (isVisible) {
      startSession();
    } else {
      handleStop();
    }

    return () => {
      handleStop();
    }
  }, [isVisible, stopOnSilence, language]);

  // Sync state
  useEffect(() => {
    if (state === "idle" && recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, [state]);

  const handleRestart = () => {
    handleStop();
    setTimeout(() => {
      startSession();
    }, 100);
  }

  return (
    <ActionModal
      title="Ask a Question"
      description="Speak clearly to record your question. You can edit the text before sending."
      isOpen={isVisible}
      onClose={() => {
        setIsVisible(false);
        handleStop();
      }}
      className="max-w-xl"
    >
      <div className="flex flex-col gap-6">

        {/* Visualizer & Status */}
        <div className="flex flex-col items-center justify-center py-6 bg-surface/30 rounded-2xl border border-tertiary/10 relative overflow-hidden transition-all duration-300 min-h-[160px]">
          {state === "recording" && (
            <div
              className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent pointer-events-none transition-opacity duration-300"
              style={{ opacity: Math.min(amplitude * 5, 1) }}
            />
          )}

          <div className="relative z-10 p-4 rounded-full bg-surface border border-tertiary/20 shadow-xl transition-transform duration-100"
            style={{ transform: `scale(${1 + amplitude * 0.2})` }}>
            <FaMicrophone
              size={32}
              className={cn(
                "transition-colors duration-300",
                state === "recording" ? "text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]" : "text-tertiary"
              )}
            />
          </div>

          <p className="mt-4 text-sm font-medium text-tertiary animate-pulse">
            {state === "recording" ? "Listening..." : "Recording Paused"}
          </p>

          {/* Controls: Language & Silence */}
          <div className="absolute top-3 right-4 flex flex-col items-end gap-3 z-30">
            {/* Language Selector */}
            <div className="w-40 relative">
              <Select
                options={LANGUAGES}
                value={language}
                onChange={setLanguage}
                className="w-full"
                placeholder="Select Language"
              />
            </div>

            {/* Silence Toggle */}
            <div className="flex items-center gap-2 bg-surface/80 px-2.5 py-1.5 rounded-lg backdrop-blur-md border border-tertiary/20">
              <span className="text-xs text-tertiary font-medium">Stop on silence</span>
              <button
                onClick={() => setStopOnSilence(!stopOnSilence)}
                className="text-primary hover:text-primary-foreground transition-colors flex items-center"
              >
                {stopOnSilence ? <FaToggleOn size={22} /> : <FaToggleOff size={22} className="text-tertiary" />}
              </button>
            </div>
          </div>
        </div>

        {/* Text Area */}
        <div className="space-y-2">
          <TextArea
            label="Transcript Preview"
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your speech will appear here..."
            rows={4}
            className="text-lg font-medium leading-relaxed bg-surface border-tertiary/20 text-tertiary-foreground"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-2 gap-3">
          {/* Left side actions (Restart) */}
          <div>
            {state !== "recording" && (
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-highlight text-tertiary font-medium transition-colors text-sm border border-tertiary/10"
              >
                <FaRotateRight />
                Record Again
              </button>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex gap-3">
            {state === "recording" ? (
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 font-medium transition-all"
              >
                <FaStop className="text-sm" />
                Stop Recording
              </button>
            ) : (
              <button
                onClick={() => {
                  sendQuestion({ question: transcript, podcast_id });
                }}
                disabled={!transcript.trim() || isSending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-white text-slate-900 border border-slate-200 hover:bg-slate-100 font-medium transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {isSending ? <PiSpinnerGap className="animate-spin text-lg" /> : null}
                Send Question
              </button>
            )}
          </div>
        </div>

      </div>
    </ActionModal>
  );
}
