import { useEffect, useRef, useState } from "react";
import ActionModal from "../@components/ActionModal";
import useRecognizeAudio from "../api/recognizeAudio";
import { cn } from "../lib/cn";
import { FaMicrophone } from "react-icons/fa";

// type RecordingState = "idle" | "recording" | "stopped";

// type SilenceStopOptions = {
//   /** Peak/RMS normalized 0..1 considered "loud" (post-smoothing). Default 0.03 */
//   threshold?: number;
//   /** How long the signal must stay below threshold to stop (ms). Default 1500 */
//   durationMs?: number;
//   /** Don't auto-stop before this much recording time (ms). Default 1200 */
//   minRecordMs?: number;
//   /** Smoothing factor for EMA (0..1). Higher=snappier. Default 0.35 */
//   smoothing?: number;
//   /** Use RMS instead of peak; more robust to crackles. Default true */
//   useRms?: boolean;
// };

// function pickMime(): string | undefined {
//   const candidates = [
//     "audio/webm;codecs=opus",
//     "audio/webm",
//     "audio/ogg;codecs=opus",
//     "audio/mp4;codecs=mp4a.40.2", // Safari-ish if available
//   ];
//   return candidates.find((t) => MediaRecorder.isTypeSupported(t));
// }

export function useRecorder() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [amplitude, setAmplitude] = useState(0);
  const [state, setState] = useState<"idle" | "recording" | "stopped">("idle");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const checkIntervalRef = useRef<number | null>(null);
  const lastLoudRef = useRef<number>(0);

  const startRecording = async () => {
    setAudioUrl(null);
    setAudioBlob(null);
    setAmplitude(0);
    chunksRef.current = [];
    setState("recording");

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
      ? "audio/webm;codecs=opus"
      : "audio/webm";
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mime });
      setAudioBlob(blob);
      setAudioUrl(URL.createObjectURL(blob));
      setState("stopped");
      stopSilenceCheck();
    };

    // Start analyser for amplitude
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    src.connect(analyser);
    audioCtxRef.current = ctx;
    analyserRef.current = analyser;

    const data = new Uint8Array(analyser.fftSize);
    lastLoudRef.current = Date.now();

    // Start recording
    recorder.start(250);

    // Check every 200ms
    checkIntervalRef.current = window.setInterval(() => {
      analyser.getByteTimeDomainData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);
      setAmplitude(rms);

      if (rms > 0.02) lastLoudRef.current = Date.now();

      // Stop if silent for 1.5 seconds
      if (Date.now() - lastLoudRef.current > 1500) {
        stopRecording();
      }
    }, 200);
  };

  const stopSilenceCheck = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
      checkIntervalRef.current = null;
    }
    analyserRef.current?.disconnect();
    audioCtxRef.current?.close();
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    stopSilenceCheck();
  };

  return {
    audioUrl,
    audioBlob,
    amplitude,
    state,
    startRecording,
    stopRecording,
  };
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
  const {
    audioUrl,
    audioBlob,
    amplitude,
    state,
    startRecording,
    // stopRecording,
  } = useRecorder();

  useEffect(() => {
    if (isVisible) {
      startRecording().catch((err) => {
        console.error("Error starting recording:", err);
        setIsVisible(false);
      });
    }
  }, [isVisible]);

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
        <div className="mb-4 flex items-center">
          {/* <button
            onClick={() =>
              state === "recording" ? stopRecording() : startRecording()
            }
            className="mr-2 px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
          >
            {state === "recording" ? <FaStop /> : <FaPlay />}
          </button> */}
          {/* <button
            onClick={stopRecording}
            disabled={state !== "recording"}
            className="px-4 py-2 bg-red-600 text-white rounded disabled:bg-gray-400"
          >
            Stop Recording
          </button> */}
        </div>
        {/* <div className="mb-4">
          <strong>Status:</strong> {state}
        </div> */}
        <div className="mb-4 w-full text-center">
          <FaMicrophone
            size={32}
            className={"inline-block"}
            style={{
              color: state === "recording" ? "red" : "black",
              scale: amplitude * 1.1 + 1,
            }}
          />
        </div>
        <div>
          <audio controls src={audioUrl ?? ""} className="w-full" />
          {audioUrl && (
            <div className="mt-2">
              <a
                href={audioUrl}
                download="recording.webm"
                className="text-blue-600 underline"
              >
                Download Recording
              </a>
            </div>
          )}
        </div>
        {state === "recording" && (
          <progress className="w-full" value={amplitude} max={1}></progress>
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
