import axios from 'axios';
import FormData from 'form-data';
import { VOICE_CONFIG } from '../../config/voiceConfig';
import dotenv from 'dotenv';

dotenv.config();

interface RecognitionResult {
  text: string;
  confidence: number;
}

interface QuestionAnalysis {
  text: string;
  category: 'love' | 'career' | 'general' | 'health' | 'spiritual';
  keywords: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
}

class STTService {
  private clientId: string;
  private clientSecret: string;
  private sttUrl: string;

  constructor() {
    this.clientId = process.env.CLOVA_CLIENT_ID || '';
    this.clientSecret = process.env.CLOVA_CLIENT_SECRET || '';
    this.sttUrl = process.env.CLOVA_STT_URL || 'https://naveropenapi.apigw.ntruss.com/recog/v1/stt';
  }

  /**
   * Recognize speech from audio buffer
   */
  async recognizeSpeech(
    audioBuffer: Buffer,
    language: string = 'ko-KR'
  ): Promise<RecognitionResult> {
    try {
      // Validate audio buffer
      if (!audioBuffer || audioBuffer.length === 0) {
        throw new Error('Empty audio buffer');
      }

      // Create form data
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav'
      });

      // Make STT request
      const response = await axios.post(
        this.sttUrl,
        formData,
        {
          params: {
            lang: language
          },
          headers: {
            'X-NCP-APIGW-API-KEY-ID': this.clientId,
            'X-NCP-APIGW-API-KEY': this.clientSecret,
            ...formData.getHeaders()
          }
        }
      );

      const text = response.data.text || '';
      const confidence = response.data.confidence || 0;

      console.log(`✅ Recognized speech: "${text}" (confidence: ${confidence})`);

      return {
        text,
        confidence
      };
    } catch (error: any) {
      console.error('Error recognizing speech:', error.response?.data || error.message);
      throw new Error(`STT recognition failed: ${error.message}`);
    }
  }

  /**
   * Process and analyze tarot question
   */
  processQuestion(text: string): QuestionAnalysis {
    const lowerText = text.toLowerCase().replace(/\s+/g, ' ').trim();

    // Determine category
    const category = this.categorizeQuestion(lowerText);

    // Extract keywords
    const keywords = this.extractKeywords(lowerText);

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(lowerText);

    return {
      text,
      category,
      keywords,
      sentiment
    };
  }

  /**
   * Recognize and process question
   */
  async recognizeAndProcess(audioBuffer: Buffer): Promise<QuestionAnalysis> {
    const recognition = await this.recognizeSpeech(audioBuffer);
    return this.processQuestion(recognition.text);
  }

  /**
   * Categorize question based on content
   */
  private categorizeQuestion(text: string): QuestionAnalysis['category'] {
    // Love-related keywords
    const loveKeywords = ['사랑', '연애', '관계', '남자친구', '여자친구', '짝사랑', '이별', '재회', '결혼', '배우자'];
    if (loveKeywords.some(kw => text.includes(kw))) {
      return 'love';
    }

    // Career-related keywords
    const careerKeywords = ['일', '직장', '회사', '커리어', '승진', '이직', '취업', '사업', '돈', '재물', '금전', '수입'];
    if (careerKeywords.some(kw => text.includes(kw))) {
      return 'career';
    }

    // Health-related keywords
    const healthKeywords = ['건강', '몸', '병', '질병', '치료', '회복', '아프', '통증'];
    if (healthKeywords.some(kw => text.includes(kw))) {
      return 'health';
    }

    // Spiritual-related keywords
    const spiritualKeywords = ['영적', '명상', '깨달음', '수행', '마음', '정신', '영혼'];
    if (spiritualKeywords.some(kw => text.includes(kw))) {
      return 'spiritual';
    }

    return 'general';
  }

  /**
   * Extract keywords from question
   */
  private extractKeywords(text: string): string[] {
    const keywords: string[] = [];

    // Common tarot question keywords
    const importantKeywords = [
      '사랑', '연애', '관계', '일', '직장', '돈', '재물', '건강', '미래', '과거',
      '현재', '선택', '결정', '변화', '기회', '위기', '성공', '실패', '행복', '고민'
    ];

    importantKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        keywords.push(keyword);
      }
    });

    return keywords.slice(0, 5);
  }

  /**
   * Analyze sentiment of question
   */
  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    // Positive keywords
    const positiveKeywords = ['좋', '행복', '성공', '기회', '희망', '발전', '성장', '기쁨'];
    const positiveCount = positiveKeywords.filter(kw => text.includes(kw)).length;

    // Negative keywords
    const negativeKeywords = ['힘들', '어려', '걱정', '불안', '두려', '슬프', '고민', '문제', '위기'];
    const negativeCount = negativeKeywords.filter(kw => text.includes(kw)).length;

    if (positiveCount > negativeCount) {
      return 'positive';
    } else if (negativeCount > positiveCount) {
      return 'negative';
    }

    return 'neutral';
  }

  /**
   * Validate audio file
   */
  validateAudio(buffer: Buffer, maxDuration?: number): {
    valid: boolean;
    error?: string;
  } {
    // Check buffer size
    if (!buffer || buffer.length === 0) {
      return {
        valid: false,
        error: 'Empty audio buffer'
      };
    }

    // Check maximum size (roughly estimate duration)
    const maxSizeBytes = (maxDuration || VOICE_CONFIG.stt.maxDuration) * 16000 * 2; // 16kHz, 16-bit
    if (buffer.length > maxSizeBytes) {
      return {
        valid: false,
        error: `Audio file too large (max ${maxDuration || VOICE_CONFIG.stt.maxDuration}s)`
      };
    }

    return { valid: true };
  }

  /**
   * Clean and normalize recognized text
   */
  cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ') // Normalize spaces
      .replace(/[^\w\s가-힣?!.,]/g, '') // Remove special characters except Korean and basic punctuation
      .substring(0, 500); // Limit length
  }

  /**
   * Generate suggested questions based on category
   */
  getSuggestedQuestions(category: QuestionAnalysis['category']): string[] {
    const suggestions: Record<QuestionAnalysis['category'], string[]> = {
      love: [
        '그 사람은 나를 어떻게 생각하나요?',
        '앞으로 우리 관계는 어떻게 될까요?',
        '좋은 인연을 만날 수 있을까요?'
      ],
      career: [
        '현재 직장에서 계속 일하는 것이 좋을까요?',
        '이직 시기는 언제가 좋을까요?',
        '재정 상황이 나아질까요?'
      ],
      health: [
        '건강 상태는 어떻게 될까요?',
        '지금 하는 치료가 효과가 있을까요?',
        '건강을 위해 무엇을 해야 할까요?'
      ],
      spiritual: [
        '내 영적 성장을 위해 무엇이 필요한가요?',
        '지금 내가 나아가야 할 방향은 무엇인가요?',
        '내 삶의 목적은 무엇인가요?'
      ],
      general: [
        '오늘 하루는 어떻게 될까요?',
        '지금 나에게 필요한 조언은 무엇인가요?',
        '앞으로 어떻게 해야 할까요?'
      ]
    };

    return suggestions[category] || suggestions.general;
  }
}

// Singleton instance
const sttService = new STTService();

export default sttService;
export { STTService, RecognitionResult, QuestionAnalysis };
