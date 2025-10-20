import { useRef, useState } from "react";
import ActionModal from "../@components/ActionModal";
import useRecognizeAudio from "../api/recognizeAudio";
import { cn } from "../lib/cn";

type RecordingState = "idle" | "recording" | "stopped";

export function useRecorder() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [state, setState] = useState<RecordingState>("idle");
  const chunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    setAudioUrl(null);
    setState("idle");
    chunks.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        setAudioUrl(URL.createObjectURL(blob));
        setState("stopped");
        setAudioBlob(blob);
      };

      mediaRecorder.start();
      setState("recording");
    } catch (err) {
      setState("idle");
      throw err;
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
  };

  return { audioUrl, audioBlob, state, startRecording, stopRecording };
}

export function RecordModal({
  isVisible,
  setIsVisible,
  podcast_id,
}: {
  isVisible: boolean;
  setIsVisible: (isVisible: boolean) => void;
  podcast_id: string;
}) {
  const { audioUrl, audioBlob, state, startRecording, stopRecording } =
    useRecorder();

  const { mutate, isLoading } = useRecognizeAudio();
  return (
    <ActionModal
      title="Recording Modal"
      isOpen={isVisible}
      onClose={() => {
        setIsVisible(false);
      }}
    >
      <div>
        <h2>Record Audio</h2>
        <div className="mb-4 flex items-center">
          <button
            onClick={startRecording}
            disabled={state === "recording"}
            className="mr-2 px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            Start Recording
          </button>
          <button
            onClick={stopRecording}
            disabled={state !== "recording"}
            className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
          >
            Stop Recording
          </button>
        </div>
        <div className="mb-4">
          <strong>Status:</strong> {state}
        </div>
        {audioUrl && (
          <div>
            <audio controls src={audioUrl} className="w-full" />
            <div className="mt-2">
              <a
                href={audioUrl}
                download="recording.webm"
                className="text-blue-600 underline"
              >
                Download Recording
              </a>
            </div>
          </div>
        )}
        {audioBlob && (
          <div
            className={cn(
              "text-white bg-green-600 px-4 py-2 rounded mt-4 cursor-pointer inline-block",
              isLoading && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => {
              mutate({
                audioBlob,
                podcast_id,
              });
            }}
          >
            Submit
          </div>
        )}
      </div>
    </ActionModal>
  );
}
