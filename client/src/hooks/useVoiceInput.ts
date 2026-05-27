import { useState, useRef, useCallback } from 'react';

interface VoiceInputState {
  isListening: boolean;
  supported: boolean;
  start: () => void;
  stop: () => void;
}

export function useVoiceInput(
  value: string,
  onChange: (text: string) => void,
): VoiceInputState {
  const [isListening, setIsListening] = useState(false);
  const startBaselineRef = useRef('');
  const displayBaselineRef = useRef('');
  const transcriptRef = useRef(''); // latest full transcript from onresult
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<any>(null);
  const chunksRef = useRef<Blob[]>([]);

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  const speechSupported = !!SpeechRecognition;
  const mediaSupported =
    typeof window !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const supported = speechSupported || mediaSupported;

  const stop = useCallback(() => {
    // displayBaseline accumulates committed text; transcriptRef holds latest uncommitted.
    // On iOS isFinal is unreliable, so transcriptRef may be the only source of truth.
    const spokenFromDisplay = displayBaselineRef.current.substring(startBaselineRef.current.length);
    const spokenPending = transcriptRef.current;
    const recognized = spokenFromDisplay + spokenPending;
    const originalBaseline = startBaselineRef.current;

    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);

    if (recognized) {
      fetch('/api/voice/punctuate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: recognized }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.text) {
            const sep = originalBaseline && !originalBaseline.endsWith(' ') && !originalBaseline.endsWith('\n') ? '' : '';
            onChange(originalBaseline + sep + data.text);
          }
        })
        .catch(() => {});
    }
  }, [onChange]);

  const start = useCallback(() => {
    if (!supported) return;
    startBaselineRef.current = value;
    displayBaselineRef.current = value;
    transcriptRef.current = '';
    setIsListening(true);

    if (speechSupported) {
      const recognition = new SpeechRecognition();
      recognition.lang = 'zh-CN';
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: any) => {
        // On iOS, isFinal is unreliable — use both final and interim
        let interim = '';
        let finalOnly = '';
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalOnly += result[0].transcript;
          } else {
            interim += result[0].transcript;
          }
        }
        // transcriptRef always holds the latest complete transcript (final + interim)
        // so stop() always has text to send for punctuation, even if isFinal never fired
        const fullTranscript = finalOnly + interim;
        transcriptRef.current = fullTranscript;
        if (fullTranscript) {
          const baseline = displayBaselineRef.current;
          const sep = baseline && !baseline.endsWith(' ') && !baseline.endsWith('\n') ? '' : '';
          onChange(baseline + sep + fullTranscript);
        }
      };

      recognition.onerror = () => {
        recognitionRef.current = null;
        setIsListening(false);
      };

      recognition.onend = () => {
        if (!recognitionRef.current) return;
        // Commit transcript to display baseline so continuous mode works
        if (transcriptRef.current) {
          const baseline = displayBaselineRef.current;
          const sep = baseline && !baseline.endsWith(' ') && !baseline.endsWith('\n') ? '' : '';
          displayBaselineRef.current = baseline + sep + transcriptRef.current;
          transcriptRef.current = '';
        }
        try {
          recognition.start();
        } catch {
          recognitionRef.current = null;
          setIsListening(false);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      return;
    }

    // Fallback: MediaRecorder for browsers without SpeechRecognition
    if (mediaSupported) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          chunksRef.current = [];

          const mimeType = MediaRecorder.isTypeSupported('audio/mp4')
            ? 'audio/mp4'
            : 'audio/webm';

          const recorder = new MediaRecorder(stream, { mimeType });
          mediaRecorderRef.current = recorder;

          recorder.ondataavailable = (e) => {
            if (e.data.size > 0) chunksRef.current.push(e.data);
          };

          recorder.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            mediaRecorderRef.current = null;

            const blob = new Blob(chunksRef.current, { type: mimeType });
            chunksRef.current = [];

            if (blob.size === 0) return;

            try {
              const form = new FormData();
              form.append('audio', blob, `recording.${mimeType === 'audio/mp4' ? 'mp4' : 'webm'}`);
              const res = await fetch('/api/voice/transcribe', {
                method: 'POST',
                body: form,
              });
              if (!res.ok) throw new Error('Transcription failed');
              const data = await res.json();
              if (data.text) {
                const baseline = displayBaselineRef.current;
                const sep = baseline && !baseline.endsWith(' ') && !baseline.endsWith('\n') ? '' : '';
                onChange(baseline + sep + data.text);
              }
            } catch {
              // silently fail
            }
          };

          recorder.onerror = () => {
            stream.getTracks().forEach((t) => t.stop());
            mediaRecorderRef.current = null;
            setIsListening(false);
          };

          recorder.start();
        })
        .catch(() => {
          setIsListening(false);
        });
    }
  }, [supported, speechSupported, mediaSupported, value, onChange]);

  return { isListening, supported, start, stop };
}
