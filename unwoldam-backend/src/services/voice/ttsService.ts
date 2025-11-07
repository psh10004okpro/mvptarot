import axios from 'axios';
import audioCacheService from './audioCache';
import { VOICE_CONFIG, VOICE_PRESETS } from '../../config/voiceConfig';
import dotenv from 'dotenv';

dotenv.config();

interface TTSOptions {
  speaker?: string;
  emotion?: number;
  speed?: number;
  pitch?: number;
  format?: 'mp3' | 'opus';
}

interface AudioResult {
  buffer: Buffer;
  contentType: string;
  duration: number;
  fromCache: boolean;
}

interface TarotReadingAudio {
  introAudio: AudioResult;
  mainAudio: AudioResult;
  url?: string;
}

class TTSService {
  private clientId: string;
  private clientSecret: string;
  private ttsUrl: string;

  constructor() {
    this.clientId = process.env.CLOVA_CLIENT_ID || '';
    this.clientSecret = process.env.CLOVA_CLIENT_SECRET || '';
    this.ttsUrl = process.env.CLOVA_TTS_URL || 'https://naveropenapi.apigw.ntruss.com/tts-premium/v1/tts';
  }

  /**
   * Synthesize speech from text using CLOVA TTS
   */
  async synthesizeSpeech(
    text: string,
    options: TTSOptions = {}
  ): Promise<AudioResult> {
    try {
      // Validate text length
      if (text.length > VOICE_CONFIG.tts.maxLength) {
        text = text.substring(0, VOICE_CONFIG.tts.maxLength);
      }

      const speaker = options.speaker || VOICE_CONFIG.tts.defaultSpeaker;
      const emotion = options.emotion ?? VOICE_CONFIG.tts.defaultEmotion;
      const speed = options.speed ?? VOICE_CONFIG.tts.defaultSpeed;
      const pitch = options.pitch ?? VOICE_CONFIG.tts.defaultPitch;
      const format = options.format || VOICE_CONFIG.tts.format;

      // Check cache first
      if (VOICE_CONFIG.tts.cacheEnabled) {
        const cached = await audioCacheService.getFromCache(text, speaker);
        if (cached) {
          console.log('✅ Audio retrieved from cache');
          return {
            ...cached,
            fromCache: true
          };
        }
      }

      // Make TTS request
      const response = await axios.post(
        this.ttsUrl,
        null,
        {
          params: {
            speaker,
            text,
            volume: 0, // -5 to 5
            speed,
            pitch,
            emotion,
            format
          },
          headers: {
            'X-NCP-APIGW-API-KEY-ID': this.clientId,
            'X-NCP-APIGW-API-KEY': this.clientSecret,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          responseType: 'arraybuffer'
        }
      );

      const audioBuffer = Buffer.from(response.data);
      const contentType = format === 'mp3' ? 'audio/mpeg' : 'audio/opus';
      const duration = this.estimateDuration(text);

      // Cache the result
      if (VOICE_CONFIG.tts.cacheEnabled) {
        await audioCacheService.cacheAudio(
          text,
          speaker,
          audioBuffer,
          contentType,
          duration
        );
      }

      console.log(`✅ Generated TTS audio for "${text.substring(0, 30)}..." (${audioBuffer.length} bytes)`);

      return {
        buffer: audioBuffer,
        contentType,
        duration,
        fromCache: false
      };
    } catch (error: any) {
      console.error('Error synthesizing speech:', error.response?.data || error.message);
      throw new Error(`TTS synthesis failed: ${error.message}`);
    }
  }

  /**
   * Get cached audio or return null
   */
  async getCachedAudio(text: string, speaker?: string): Promise<AudioResult | null> {
    const speakerName = speaker || VOICE_CONFIG.tts.defaultSpeaker;

    const cached = await audioCacheService.getFromCache(text, speakerName);

    if (cached) {
      return {
        ...cached,
        fromCache: true
      };
    }

    return null;
  }

  /**
   * Create optimized audio for tarot reading
   */
  async createTarotReading(
    interpretation: string,
    cardName: string,
    readingType: 'daily' | 'love' | 'career' | 'general' | 'spiritual' = 'general'
  ): Promise<TarotReadingAudio> {
    try {
      // Get preset for reading type
      const preset = this.getPresetForType(readingType);

      // Generate intro audio
      const introText = `오늘의 카드는 ${cardName}입니다.`;
      const introAudio = await this.synthesizeSpeech(introText, preset);

      // Generate main interpretation audio
      const mainAudio = await this.synthesizeSpeech(interpretation, preset);

      return {
        introAudio,
        mainAudio
      };
    } catch (error) {
      console.error('Error creating tarot reading audio:', error);
      throw error;
    }
  }

  /**
   * Batch synthesize multiple texts
   */
  async synthesizeBatch(
    texts: string[],
    options: TTSOptions = {}
  ): Promise<AudioResult[]> {
    const results: AudioResult[] = [];

    for (const text of texts) {
      try {
        const audio = await this.synthesizeSpeech(text, options);
        results.push(audio);

        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error synthesizing text: "${text}"`, error);
        // Continue with next text
      }
    }

    return results;
  }

  /**
   * Pre-generate common phrases
   */
  async preGenerateCommonPhrases(): Promise<void> {
    if (!VOICE_CONFIG.costOptimization.preGenerateCommon) {
      return;
    }

    await audioCacheService.preGenerateCommonPhrases(
      async (text: string, speaker: string) => {
        const result = await this.synthesizeSpeech(text, { speaker });
        return {
          buffer: result.buffer,
          contentType: result.contentType,
          duration: result.duration
        };
      }
    );
  }

  /**
   * Get voice preset for reading type
   */
  private getPresetForType(type: string): TTSOptions {
    switch (type) {
      case 'daily':
        return VOICE_PRESETS.dailyFortune;
      case 'love':
        return VOICE_PRESETS.loveReading;
      case 'career':
        return VOICE_PRESETS.careerReading;
      case 'spiritual':
        return VOICE_PRESETS.spiritualReading;
      default:
        return VOICE_PRESETS.generalReading;
    }
  }

  /**
   * Estimate audio duration based on text length
   */
  private estimateDuration(text: string): number {
    // Average speaking rate: ~150 words per minute in Korean
    // Average Korean characters per word: ~2-3
    const charsPerSecond = 5; // Rough estimate
    return Math.ceil(text.length / charsPerSecond);
  }

  /**
   * Split long text into chunks
   */
  private splitText(text: string, maxLength: number = VOICE_CONFIG.tts.maxLength): string[] {
    if (text.length <= maxLength) {
      return [text];
    }

    const chunks: string[] = [];
    const sentences = text.split(/[.!?]/);

    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > maxLength) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
        }
        currentChunk = sentence;
      } else {
        currentChunk += sentence + '.';
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Get available speakers
   */
  getAvailableSpeakers(): Array<{
    name: string;
    description: string;
    gender: string;
    recommended: boolean;
  }> {
    return Object.values(VOICE_CONFIG.tts.speakers);
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<any> {
    return await audioCacheService.getCacheStats();
  }
}

// Singleton instance
const ttsService = new TTSService();

export default ttsService;
export { TTSService, TTSOptions, AudioResult, TarotReadingAudio };
