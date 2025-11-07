import apiClient from './api';
import { AudioResult, VoiceOptions } from '@types/models';

interface QuestionAnalysis {
  text: string;
  category: 'love' | 'career' | 'general' | 'health' | 'spiritual';
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  suggestedQuestions: string[];
}

interface SpeakerInfo {
  name: string;
  description: string;
  gender: string;
  recommended: boolean;
}

class VoiceService {
  /**
   * Synthesize text to speech
   */
  async synthesizeText(
    text: string,
    options?: VoiceOptions
  ): Promise<Blob> {
    const response = await apiClient.post('/voice/synthesize', {
      text,
      ...options,
    }, {
      responseType: 'blob',
    });

    return response.data as unknown as Blob;
  }

  /**
   * Generate audio for tarot reading
   */
  async generateReadingAudio(
    interpretation: string,
    cardName: string,
    readingType: string = 'general'
  ): Promise<{
    intro: AudioResult;
    main: AudioResult;
    totalDuration: number;
  }> {
    const response = await apiClient.post<{
      intro: AudioResult;
      main: AudioResult;
      totalDuration: number;
    }>('/voice/synthesize/reading', {
      interpretation,
      cardName,
      readingType,
    });

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '음성 생성에 실패했습니다.');
  }

  /**
   * Recognize speech from audio file
   */
  async recognizeSpeech(audioBlob: Blob): Promise<{ text: string; confidence: number }> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    const response = await apiClient.upload<{ text: string; confidence: number }>(
      '/voice/recognize',
      formData
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '음성 인식에 실패했습니다.');
  }

  /**
   * Recognize and analyze speech
   */
  async recognizeAndAnalyze(audioBlob: Blob): Promise<QuestionAnalysis> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.wav');

    const response = await apiClient.upload<QuestionAnalysis>(
      '/voice/recognize/analyze',
      formData
    );

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '음성 분석에 실패했습니다.');
  }

  /**
   * Get available speakers
   */
  async getAvailableSpeakers(): Promise<SpeakerInfo[]> {
    const response = await apiClient.get<SpeakerInfo[]>('/voice/speakers');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '음성 목록을 불러오는데 실패했습니다.');
  }

  /**
   * Get audio cache statistics
   */
  async getCacheStats(): Promise<{
    totalCached: number;
    hits: number;
    misses: number;
    hitRate: number;
    estimatedSavings: number;
  }> {
    const response = await apiClient.get<{
      totalCached: number;
      hits: number;
      misses: number;
      hitRate: number;
      estimatedSavings: number;
    }>('/voice/cache/stats');

    if (response.data.success && response.data.data) {
      return response.data.data;
    }

    throw new Error(response.data.error || '캐시 통계를 불러오는데 실패했습니다.');
  }

  /**
   * Convert blob to base64 for React Native
   */
  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('Failed to convert blob to base64'));
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Play audio from base64
   */
  async playAudioFromBase64(base64: string): Promise<void> {
    // This will be implemented with react-native-sound
    // For now, just a placeholder
    console.log('Playing audio:', base64.substring(0, 50) + '...');
  }
}

// Singleton instance
const voiceService = new VoiceService();

export default voiceService;
