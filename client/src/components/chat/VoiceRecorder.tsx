import React, { useState, useEffect, useRef } from 'react';
import { Trash2, SendHorizonal, AlertCircle } from 'lucide-react';

interface VoiceRecorderProps {
  onSend: (audioBlob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let isMounted = true;

    const startRecording = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!isMounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        audioChunksRef.current = [];

        // Check supported MIME type
        const mimeType = MediaRecorder.isTypeSupported('audio/webm')
          ? 'audio/webm'
          : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : '';

        const mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType })
          : new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current = mediaRecorder;
        mediaRecorder.start(100);

        // Start timer
        timerRef.current = setInterval(() => {
          setSeconds((prev) => prev + 1);
        }, 1000);
      } catch (err: any) {
        console.error('Error accessing microphone:', err);
        setError('Microphone access denied or not available');
      }
    };

    startRecording();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
  };

  const handleStopAndSend = () => {
    if (!mediaRecorderRef.current) return;

    const recorder = mediaRecorderRef.current;
    recorder.onstop = () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: recorder.mimeType || 'audio/webm',
      });
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      onSend(audioBlob, seconds);
    };

    if (recorder.state !== 'inactive') {
      recorder.stop();
    }
  };

  const handleCancelRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }
    onCancel();
  };

  if (error) {
    return (
      <div className="h-[62px] bg-[#111b21] px-4 flex items-center justify-between border-t border-[#222e35] flex-1">
        <div className="flex items-center gap-2 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
        <button
          onClick={onCancel}
          className="text-xs text-[#8696a0] hover:text-[#e9edef] underline"
        >
          Dismiss
        </button>
      </div>
    );
  }

  return (
    <div className="h-[62px] bg-[#111b21] px-4 flex items-center justify-between border-t border-[#222e35] flex-1 animate-in fade-in duration-150">
      {/* Cancel button */}
      <button
        type="button"
        onClick={handleCancelRecording}
        className="p-2 text-[#8696a0] hover:text-red-400 hover:bg-[#202c33] rounded-full transition"
        title="Discard recording"
      >
        <Trash2 className="w-5 h-5" />
      </button>

      {/* Recording indicator & timer */}
      <div className="flex items-center gap-4 flex-1 justify-center max-w-md px-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping inline-block" />
          <span className="text-[#e9edef] font-mono text-sm font-semibold">
            {formatTimer(seconds)}
          </span>
        </div>

        {/* Animated waveform bars simulation */}
        <div className="flex items-center gap-1 h-5 overflow-hidden flex-1 justify-center">
          {Array.from({ length: 24 }).map((_, i) => (
            <span
              key={i}
              className="w-1 bg-[#00a884] rounded-full transition-all duration-150"
              style={{
                height: `${Math.max(4, Math.floor(Math.sin((seconds * 4 + i) * 0.8) * 16 + 10))}px`,
                opacity: 0.6 + (i % 3) * 0.2,
              }}
            />
          ))}
        </div>
      </div>

      {/* Send button */}
      <button
        type="button"
        onClick={handleStopAndSend}
        className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] text-[#111b21] flex items-center justify-center transition shadow-md flex-shrink-0"
        title="Send voice note"
      >
        <SendHorizonal className="w-5 h-5 translate-x-[1px]" />
      </button>
    </div>
  );
};

export default VoiceRecorder;
