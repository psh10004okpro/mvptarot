import { TTSService } from '../../src/services/voice/ttsService';
import { STTService } from '../../src/services/voice/sttService';
import { AudioCache } from '../../src/services/voice/audioCache';

// Mock external services
jest.mock('axios');
jest.mock('../../src/services/voice/audioCache');

describe('Voice Services Tests', () => {
  let ttsService: TTSService;
  let sttService: STTService;
  let mockAudioCache: jest.Mocked<AudioCache>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockAudioCache = {
      get: jest.fn(),
      set: jest.fn(),
      getStats: jest.fn(),
    } as any;

    ttsService = new TTSService();
    (ttsService as any).audioCache = mockAudioCache;

    sttService = new STTService();
  });

  describe('TTS Service', () => {
    describe('synthesizeText', () => {
      it('should synthesize text to speech', async () => {
        const mockAudioBuffer = Buffer.from('fake-audio-data');
        const axios = require('axios');
        axios.post = jest.fn().mockResolvedValue({
          data: mockAudioBuffer,
          headers: { 'content-type': 'audio/mp3' },
        });

        const result = await ttsService.synthesizeText('안녕하세요');

        expect(result).toHaveProperty('audioBuffer');
        expect(result).toHaveProperty('duration');
        expect(result).toHaveProperty('format', 'mp3');
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringContaining('clova'),
          expect.objectContaining({
            text: '안녕하세요',
          }),
          expect.any(Object)
        );
      });

      it('should use different speakers', async () => {
        const speakers = ['nara', 'jinho', 'clara', 'matt'];
        const axios = require('axios');
        axios.post = jest.fn().mockResolvedValue({
          data: Buffer.from('audio'),
          headers: { 'content-type': 'audio/mp3' },
        });

        for (const speaker of speakers) {
          await ttsService.synthesizeText('테스트', { speaker });

          expect(axios.post).toHaveBeenLastCalledWith(
            expect.any(String),
            expect.objectContaining({
              speaker,
            }),
            expect.any(Object)
          );
        }
      });

      it('should adjust speech speed and pitch', async () => {
        const axios = require('axios');
        axios.post = jest.fn().mockResolvedValue({
          data: Buffer.from('audio'),
          headers: { 'content-type': 'audio/mp3' },
        });

        await ttsService.synthesizeText('테스트', {
          speed: 1.2,
          pitch: 0,
        });

        expect(axios.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            speed: 1.2,
            pitch: 0,
          }),
          expect.any(Object)
        );
      });

      it('should use cache for repeated text', async () => {
        mockAudioCache.get.mockResolvedValue({
          audioBuffer: Buffer.from('cached-audio'),
          duration: 5000,
          format: 'mp3',
          cacheKey: 'test-key',
        });

        const result = await ttsService.synthesizeText('반복 텍스트');

        expect(mockAudioCache.get).toHaveBeenCalled();
        expect(result.audioBuffer.toString()).toBe('cached-audio');
      });

      it('should cache newly generated audio', async () => {
        mockAudioCache.get.mockResolvedValue(null);

        const axios = require('axios');
        axios.post = jest.fn().mockResolvedValue({
          data: Buffer.from('new-audio'),
          headers: { 'content-type': 'audio/mp3' },
        });

        await ttsService.synthesizeText('새로운 텍스트');

        expect(mockAudioCache.set).toHaveBeenCalled();
      });
    });

    describe('generateReadingAudio', () => {
      it('should generate structured audio for reading', async () => {
        const axios = require('axios');
        axios.post = jest.fn().mockResolvedValue({
          data: Buffer.from('audio'),
          headers: { 'content-type': 'audio/mp3' },
        });

        const result = await ttsService.generateReadingAudio(
          '더 풀 카드가 나왔습니다.',
          'The Fool',
          'general'
        );

        expect(result).toHaveProperty('intro');
        expect(result).toHaveProperty('main');
        expect(result).toHaveProperty('totalDuration');
        expect(axios.post).toHaveBeenCalledTimes(2); // intro + main
      });

      it('should generate context-appropriate intro', async () => {
        const axios = require('axios');
        axios.post = jest.fn().mockResolvedValue({
          data: Buffer.from('audio'),
          headers: { 'content-type': 'audio/mp3' },
        });

        await ttsService.generateReadingAudio(
          '해석 내용',
          'The Lovers',
          'love'
        );

        const firstCall = axios.post.mock.calls[0][1];
        expect(firstCall.text).toContain('사랑');
      });
    });

    describe('Error Handling', () => {
      it('should handle API errors', async () => {
        const axios = require('axios');
        axios.post = jest.fn().mockRejectedValue(new Error('API Error'));

        await expect(
          ttsService.synthesizeText('테스트')
        ).rejects.toThrow('API Error');
      });

      it('should handle empty text', async () => {
        await expect(
          ttsService.synthesizeText('')
        ).rejects.toThrow('텍스트가 비어있습니다');
      });

      it('should handle text exceeding length limit', async () => {
        const longText = 'a'.repeat(10000);

        await expect(
          ttsService.synthesizeText(longText)
        ).rejects.toThrow('텍스트가 너무 깁니다');
      });
    });
  });

  describe('STT Service', () => {
    describe('recognizeSpeech', () => {
      it('should recognize speech from audio file', async () => {
        const axios = require('axios');
        axios.post = jest.fn().mockResolvedValue({
          data: {
            text: '오늘의 운세를 알려주세요',
            confidence: 0.95,
          },
        });

        const audioBuffer = Buffer.from('fake-audio');
        const result = await sttService.recognizeSpeech(audioBuffer);

        expect(result).toMatchObject({
          text: '오늘의 운세를 알려주세요',
          confidence: 0.95,
        });
      });

      it('should handle low confidence recognition', async () => {
        const axios = require('axios');
        axios.post = jest.fn().mockResolvedValue({
          data: {
            text: 'unclear audio',
            confidence: 0.3,
          },
        });

        const audioBuffer = Buffer.from('unclear-audio');
        const result = await sttService.recognizeSpeech(audioBuffer);

        expect(result.confidence).toBeLessThan(0.5);
        expect(result).toHaveProperty('text');
      });

      it('should support different audio formats', async () => {
        const formats = ['wav', 'mp3', 'ogg', 'm4a'];
        const axios = require('axios');

        for (const format of formats) {
          axios.post = jest.fn().mockResolvedValue({
            data: { text: '테스트', confidence: 0.9 },
          });

          const audioBuffer = Buffer.from('audio');
          await sttService.recognizeSpeech(audioBuffer, { format });

          expect(axios.post).toHaveBeenCalled();
        }
      });
    });

    describe('recognizeAndAnalyze', () => {
      it('should recognize and analyze question', async () => {
        const axios = require('axios');
        axios.post = jest.fn()
          .mockResolvedValueOnce({
            data: {
              text: '오늘의 사랑운이 궁금해요',
              confidence: 0.92,
            },
          })
          .mockResolvedValueOnce({
            data: {
              category: 'love',
              keywords: ['사랑', '운세', '오늘'],
              sentiment: 'neutral',
              suggestedQuestions: [
                '오늘의 연애운은 어떤가요?',
                '새로운 만남이 있을까요?',
              ],
            },
          });

        const audioBuffer = Buffer.from('audio');
        const result = await sttService.recognizeAndAnalyze(audioBuffer);

        expect(result).toMatchObject({
          text: '오늘의 사랑운이 궁금해요',
          category: 'love',
          keywords: expect.arrayContaining(['사랑', '운세']),
          sentiment: 'neutral',
          suggestedQuestions: expect.any(Array),
        });
      });

      it('should categorize different question types', async () => {
        const testCases = [
          { text: '오늘의 운세', expected: 'general' },
          { text: '사랑운이 어떤가요', expected: 'love' },
          { text: '직장에서 승진할 수 있을까요', expected: 'career' },
          { text: '건강은 괜찮을까요', expected: 'health' },
          { text: '내 영적 성장은', expected: 'spiritual' },
        ];

        const axios = require('axios');

        for (const testCase of testCases) {
          axios.post = jest.fn()
            .mockResolvedValueOnce({
              data: { text: testCase.text, confidence: 0.9 },
            })
            .mockResolvedValueOnce({
              data: { category: testCase.expected },
            });

          const result = await sttService.recognizeAndAnalyze(Buffer.from('audio'));
          expect(result.category).toBe(testCase.expected);
        }
      });
    });

    describe('Error Handling', () => {
      it('should handle empty audio buffer', async () => {
        await expect(
          sttService.recognizeSpeech(Buffer.from([]))
        ).rejects.toThrow('오디오 데이터가 비어있습니다');
      });

      it('should handle API errors', async () => {
        const axios = require('axios');
        axios.post = jest.fn().mockRejectedValue(new Error('STT API Error'));

        await expect(
          sttService.recognizeSpeech(Buffer.from('audio'))
        ).rejects.toThrow('STT API Error');
      });

      it('should handle unrecognizable audio', async () => {
        const axios = require('axios');
        axios.post = jest.fn().mockResolvedValue({
          data: {
            text: '',
            confidence: 0,
          },
        });

        const result = await sttService.recognizeSpeech(Buffer.from('noise'));
        expect(result.confidence).toBe(0);
        expect(result.text).toBe('');
      });
    });
  });

  describe('Audio Cache', () => {
    it('should track cache statistics', async () => {
      mockAudioCache.getStats.mockResolvedValue({
        totalCached: 150,
        hits: 1200,
        misses: 300,
        hitRate: 0.8,
        estimatedSavings: 45.5,
      });

      const stats = await mockAudioCache.getStats();

      expect(stats).toMatchObject({
        totalCached: 150,
        hits: 1200,
        misses: 300,
        hitRate: 0.8,
        estimatedSavings: 45.5,
      });
    });
  });
});
