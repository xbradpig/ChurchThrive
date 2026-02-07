import { Audio, AVPlaybackStatus } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/lib/supabase/client';

export type RecordingState = 'idle' | 'recording' | 'paused' | 'stopped';

export interface RecordingSession {
  id: string;
  uri: string;
  duration: number; // milliseconds
  size: number; // bytes
  createdAt: Date;
}

export class AudioRecorder {
  private recording: Audio.Recording | null = null;
  private state: RecordingState = 'idle';
  private startTime: number = 0;
  private pausedDuration: number = 0;
  private lastPauseTime: number = 0;
  private currentSession: RecordingSession | null = null;

  async initialize(): Promise<void> {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        throw new Error('Audio recording permission not granted');
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });
    } catch (error) {
      console.error('Failed to initialize audio recorder:', error);
      throw error;
    }
  }

  async startRecording(): Promise<void> {
    if (this.state === 'recording') {
      console.warn('Recording already in progress');
      return;
    }

    try {
      await this.initialize();

      // Create recording with high quality settings
      const { recording } = await Audio.Recording.createAsync({
        isMeteringEnabled: true,
        android: {
          extension: '.m4a',
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: 'audio/webm',
          bitsPerSecond: 128000,
        },
      });

      this.recording = recording;
      this.state = 'recording';
      this.startTime = Date.now();
      this.pausedDuration = 0;

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.state = 'idle';
      throw error;
    }
  }

  async pauseRecording(): Promise<void> {
    if (this.state !== 'recording' || !this.recording) {
      console.warn('No active recording to pause');
      return;
    }

    try {
      await this.recording.pauseAsync();
      this.state = 'paused';
      this.lastPauseTime = Date.now();
      console.log('Recording paused');
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }

  async resumeRecording(): Promise<void> {
    if (this.state !== 'paused' || !this.recording) {
      console.warn('No paused recording to resume');
      return;
    }

    try {
      await this.recording.startAsync();
      this.state = 'recording';
      this.pausedDuration += Date.now() - this.lastPauseTime;
      console.log('Recording resumed');
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<RecordingSession> {
    if (!this.recording || (this.state !== 'recording' && this.state !== 'paused')) {
      throw new Error('No active recording to stop');
    }

    try {
      const status = await this.recording.getStatusAsync();
      await this.recording.stopAndUnloadAsync();

      const uri = this.recording.getURI();
      if (!uri) {
        throw new Error('Failed to get recording URI');
      }

      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new Error('Recording file not found');
      }

      const actualDuration = status.durationMillis || 0;
      const session: RecordingSession = {
        id: `recording_${Date.now()}`,
        uri,
        duration: actualDuration,
        size: fileInfo.size || 0,
        createdAt: new Date(),
      };

      this.currentSession = session;
      this.state = 'stopped';
      this.recording = null;

      console.log('Recording stopped:', session);
      return session;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      this.state = 'idle';
      this.recording = null;
      throw error;
    }
  }

  async cancelRecording(): Promise<void> {
    if (!this.recording) {
      return;
    }

    try {
      const uri = this.recording.getURI();
      await this.recording.stopAndUnloadAsync();

      // Delete the recording file
      if (uri) {
        await FileSystem.deleteAsync(uri, { idempotent: true });
      }

      this.recording = null;
      this.state = 'idle';
      this.currentSession = null;
      console.log('Recording cancelled');
    } catch (error) {
      console.error('Failed to cancel recording:', error);
      throw error;
    }
  }

  /**
   * Save recording to permanent local storage
   */
  async saveLocally(session: RecordingSession, filename: string): Promise<string> {
    try {
      const directory = `${FileSystem.documentDirectory}recordings/`;
      const dirInfo = await FileSystem.getInfoAsync(directory);

      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
      }

      const newUri = `${directory}${filename}.m4a`;
      await FileSystem.moveAsync({
        from: session.uri,
        to: newUri,
      });

      console.log('Recording saved locally:', newUri);
      return newUri;
    } catch (error) {
      console.error('Failed to save recording locally:', error);
      throw error;
    }
  }

  /**
   * Upload recording to Supabase Storage
   */
  async uploadToStorage(
    localUri: string,
    storagePath: string
  ): Promise<{ url: string; path: string }> {
    try {
      // Read file as base64
      const fileBase64 = await FileSystem.readAsStringAsync(localUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert base64 to blob
      const response = await fetch(`data:audio/m4a;base64,${fileBase64}`);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('sermon-recordings')
        .upload(storagePath, blob, {
          contentType: 'audio/m4a',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('sermon-recordings')
        .getPublicUrl(data.path);

      console.log('Recording uploaded to storage:', urlData.publicUrl);
      return { url: urlData.publicUrl, path: data.path };
    } catch (error) {
      console.error('Failed to upload recording:', error);
      throw error;
    }
  }

  /**
   * Get current recording duration in milliseconds
   */
  async getCurrentDuration(): Promise<number> {
    if (!this.recording || this.state === 'idle') {
      return 0;
    }

    try {
      const status = await this.recording.getStatusAsync();
      return status.durationMillis || 0;
    } catch (error) {
      console.error('Failed to get recording duration:', error);
      return 0;
    }
  }

  getState(): RecordingState {
    return this.state;
  }

  getCurrentSession(): RecordingSession | null {
    return this.currentSession;
  }

  /**
   * Clean up old recordings (older than 30 days)
   */
  async cleanupOldRecordings(): Promise<number> {
    try {
      const directory = `${FileSystem.documentDirectory}recordings/`;
      const dirInfo = await FileSystem.getInfoAsync(directory);

      if (!dirInfo.exists) {
        return 0;
      }

      const files = await FileSystem.readDirectoryAsync(directory);
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      let deletedCount = 0;

      for (const file of files) {
        const filePath = `${directory}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);

        if (fileInfo.exists && fileInfo.modificationTime) {
          if (fileInfo.modificationTime * 1000 < thirtyDaysAgo) {
            await FileSystem.deleteAsync(filePath, { idempotent: true });
            deletedCount++;
          }
        }
      }

      console.log(`Cleaned up ${deletedCount} old recordings`);
      return deletedCount;
    } catch (error) {
      console.error('Failed to cleanup old recordings:', error);
      return 0;
    }
  }
}

// Singleton instance
export const audioRecorder = new AudioRecorder();
