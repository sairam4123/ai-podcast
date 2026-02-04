import { useState, useRef, useEffect } from "react";

export default function useRecorder() {
    const [state, setState] = useState<"idle" | "recording" | "paused">("idle");
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [amplitude, setAmplitude] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    const checkIntervalRef = useRef<number | null>(null);
    const lastLoudRef = useRef<number>(0);

    const startRecording = async (options?: { stopOnSilence?: boolean }) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            const chunks: BlobPart[] = [];
            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunks, { type: "audio/webm" });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                // Only set idle if we were truly recording, prevents state weirdness if already stopped
                setState((current) => current === "recording" ? "idle" : current);

                stopSilenceCheck();

                // Cleanup visualizer
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current);
                }
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                    audioContextRef.current = null;
                }
            };

            mediaRecorder.start();
            setState("recording");

            // Visualizer setup
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            sourceRef.current = source;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            // Silence detection setup
            if (options?.stopOnSilence) {
                lastLoudRef.current = Date.now();
                checkIntervalRef.current = window.setInterval(() => {
                    // We can check amplitude from the same analyser or create a new one. 
                    // Using the visualizer loop for amplitude calculation is cheaper, but let's check rms here separately or reuse `amplitude` state?
                    // Reusing the dataArray from visualizer might be cleaner.

                    // BUT: The visualizer loop (requestAnimationFrame) might run at different speeds.
                    // Let's rely on the separate interval for consistent timing.
                    // We need to call getByteFrequencyData or getFloatTimeDomainData
                    const timeData = new Float32Array(analyser.fftSize);
                    analyser.getFloatTimeDomainData(timeData);

                    let sum = 0;
                    for (let i = 0; i < timeData.length; i++) {
                        sum += timeData[i] * timeData[i];
                    }
                    const rms = Math.sqrt(sum / timeData.length);

                    if (rms > 0.02) { // Threshold for "loud"
                        lastLoudRef.current = Date.now();
                    }

                    if (Date.now() - lastLoudRef.current > 2000) { // 2 seconds of silence
                        stopRecording();
                    }
                }, 100);
            }

            const updateAmplitude = () => {
                if (mediaRecorder.state !== "recording") return;

                analyser.getByteFrequencyData(dataArray);
                // Calculate average or max amplitude
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const avg = sum / bufferLength;
                // Normalize roughly 0-1
                const norm = Math.min(avg / 128, 1);
                setAmplitude(norm);

                animationFrameRef.current = requestAnimationFrame(updateAmplitude);
            };

            updateAmplitude();

        } catch (err) {
            console.error("Error accessing microphone:", err);
            setState("idle");
        }
    };

    const stopSilenceCheck = () => {
        if (checkIntervalRef.current) {
            clearInterval(checkIntervalRef.current);
            checkIntervalRef.current = null;
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        stopSilenceCheck();
        // setState("idle"); // startRecorder.onstop handles this
    };

    useEffect(() => {
        return () => {
            stopRecording();
        };
    }, []);

    return {
        state,
        audioBlob,
        audioUrl,
        amplitude,
        startRecording,
        stopRecording,
    };
}
