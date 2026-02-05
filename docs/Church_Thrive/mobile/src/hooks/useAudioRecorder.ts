import { useState, useEffect, useCallback, useRef } from 'react';
import { audioRecorder, RecordingSession, RecordingState } from '@/lib/audio/recorder';

interface UseAudioRecorderResult {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  state: RecordingState;
  session: RecordingSession | null;
  error: string | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<RecordingSession | null>;
  cancelRecording: () => Promise<void>;
  saveLocally: (filename: string) => Promise<string | null>;
  uploadToStorage: (localUri: string, storagePath: string) => Promise<{ url: string; path: string } | null>;
}

export function useAudioRecorder(): UseAudioRecorderResult {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [session, setSession] = useState<RecordingSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const isRecording = state === 'recording';
  const isPaused = state === 'paused';

  // Update duration while recording
  useEffect(() => {
    if (isRecording) {
      durationInterval.current = setInterval(async () => {
        const currentDuration = await audioRecorder.getCurrentDuration();
        setDuration(currentDuration);
      }, 100); // Update every 100ms
    } else {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
        durationInterval.current = null;
      }
    }

    return () => {
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
    };
  }, [isRecording]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      await audioRecorder.startRecording();
      setState('recording');
      setDuration(0);
      setSession(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start recording';
      setError(message);
      console.error('Start recording error:', err);
    }
  }, []);

  const pauseRecording = useCallback(async () => {
    try {
      setError(null);
      await audioRecorder.pauseRecording();
      setState('paused');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to pause recording';
      setError(message);
      console.error('Pause recording error:', err);
    }
  }, []);

  const resumeRecording = useCallback(async () => {
    try {
      setError(null);
      await audioRecorder.resumeRecording();
      setState('recording');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to resume recording';
      setError(message);
      console.error('Resume recording error:', err);
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<RecordingSession | null> => {
    try {
      setError(null);
      const recordingSession = await audioRecorder.stopRecording();
      setState('stopped');
      setSession(recordingSession);
      setDuration(recordingSession.duration);
      return recordingSession;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to stop recording';
      setError(message);
      console.error('Stop recording error:', err);
      setState('idle');
      return null;
    }
  }, []);

  const cancelRecording = useCallback(async () => {
    try {
      setError(null);
      await audioRecorder.cancelRecording();
      setState('idle');
      setDuration(0);
      setSession(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cancel recording';
      setError(message);
      console.error('Cancel recording error:', err);
    }
  }, []);

  const saveLocally = useCallback(async (filename: string): Promise<string | null> => {
    if (!session) {
      setError('No recording session to save');
      return null;
    }

    try {
      setError(null);
      const localUri = await audioRecorder.saveLocally(session, filename);
      return localUri;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save recording';
      setError(message);
      console.error('Save recording error:', err);
      return null;
    }
  }, [session]);

  const uploadToStorage = useCallback(
    async (
      localUri: string,
      storagePath: string
    ): Promise<{ url: string; path: string } | null> => {
      try {
        setError(null);
        const result = await audioRecorder.uploadToStorage(localUri, storagePath);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to upload recording';
        setError(message);
        console.error('Upload recording error:', err);
        return null;
      }
    },
    []
  );

  return {
    isRecording,
    isPaused,
    duration,
    state,
    session,
    error,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
    saveLocally,
    uploadToStorage,
  };
}
