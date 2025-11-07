import { Router } from 'express';
import ttsService from '../services/voice/ttsService';
import sttService from '../services/voice/sttService';
import { authenticate } from '../middleware/auth';
import { memoryUpload } from '../middleware/upload';
import { sendSuccess, sendError } from '../utils/response';
import { HTTP_STATUS } from '../config/constants';
import { VOICE_CONFIG } from '../config/voiceConfig';
import Joi from 'joi';

const router = Router();

/**
 * @route   POST /api/voice/synthesize
 * @desc    Convert text to speech
 * @access  Private
 */
router.post('/synthesize', authenticate, async (req, res, next) => {
  try {
    const schema = Joi.object({
      text: Joi.string().required().max(VOICE_CONFIG.tts.maxLength),
      speaker: Joi.string().optional(),
      emotion: Joi.number().min(0).max(2).optional(),
      speed: Joi.number().min(-5).max(5).optional(),
      pitch: Joi.number().min(-5).max(5).optional(),
      readingType: Joi.string().valid('daily', 'love', 'career', 'general', 'spiritual').optional()
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return sendError(res, error.details[0].message, HTTP_STATUS.BAD_REQUEST);
    }

    const { text, speaker, emotion, speed, pitch } = value;

    // Generate audio
    const audio = await ttsService.synthesizeSpeech(text, {
      speaker,
      emotion,
      speed,
      pitch
    });

    // Return audio as response
    res.setHeader('Content-Type', audio.contentType);
    res.setHeader('Content-Length', audio.buffer.length);
    res.setHeader('X-Audio-Duration', audio.duration.toString());
    res.setHeader('X-From-Cache', audio.fromCache.toString());

    return res.send(audio.buffer);
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/voice/synthesize/reading
 * @desc    Generate audio for tarot reading (intro + main)
 * @access  Private
 */
router.post('/synthesize/reading', authenticate, async (req, res, next) => {
  try {
    const schema = Joi.object({
      interpretation: Joi.string().required().max(1000),
      cardName: Joi.string().required(),
      readingType: Joi.string().valid('daily', 'love', 'career', 'general', 'spiritual').default('general')
    });

    const { error, value } = schema.validate(req.body);

    if (error) {
      return sendError(res, error.details[0].message, HTTP_STATUS.BAD_REQUEST);
    }

    const { interpretation, cardName, readingType } = value;

    // Generate reading audio
    const audioResult = await ttsService.createTarotReading(
      interpretation,
      cardName,
      readingType
    );

    // Return metadata (actual audio would be streamed separately or saved to file)
    return sendSuccess(res, {
      intro: {
        duration: audioResult.introAudio.duration,
        size: audioResult.introAudio.buffer.length,
        fromCache: audioResult.introAudio.fromCache
      },
      main: {
        duration: audioResult.mainAudio.duration,
        size: audioResult.mainAudio.buffer.length,
        fromCache: audioResult.mainAudio.fromCache
      },
      totalDuration: audioResult.introAudio.duration + audioResult.mainAudio.duration
    }, 'Audio generated successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/voice/recognize
 * @desc    Convert speech to text
 * @access  Private
 */
router.post('/recognize', authenticate, memoryUpload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Audio file is required', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate audio
    const validation = sttService.validateAudio(req.file.buffer);
    if (!validation.valid) {
      return sendError(res, validation.error || 'Invalid audio file', HTTP_STATUS.BAD_REQUEST);
    }

    // Recognize speech
    const result = await sttService.recognizeSpeech(req.file.buffer);

    // Clean text
    const cleanedText = sttService.cleanText(result.text);

    return sendSuccess(res, {
      text: cleanedText,
      confidence: result.confidence,
      originalText: result.text
    }, 'Speech recognized successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/voice/recognize/analyze
 * @desc    Convert speech to text and analyze tarot question
 * @access  Private
 */
router.post('/recognize/analyze', authenticate, memoryUpload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return sendError(res, 'Audio file is required', HTTP_STATUS.BAD_REQUEST);
    }

    // Validate audio
    const validation = sttService.validateAudio(req.file.buffer);
    if (!validation.valid) {
      return sendError(res, validation.error || 'Invalid audio file', HTTP_STATUS.BAD_REQUEST);
    }

    // Recognize and process
    const analysis = await sttService.recognizeAndProcess(req.file.buffer);

    // Get suggested questions
    const suggestions = sttService.getSuggestedQuestions(analysis.category);

    return sendSuccess(res, {
      ...analysis,
      suggestedQuestions: suggestions
    }, 'Question analyzed successfully');
  } catch (err) {
    next(err);
  }
});

/**
 * @route   GET /api/voice/speakers
 * @desc    Get available TTS speakers
 * @access  Public
 */
router.get('/speakers', (req, res) => {
  const speakers = ttsService.getAvailableSpeakers();
  return sendSuccess(res, speakers, 'Available speakers retrieved');
});

/**
 * @route   GET /api/voice/cache/stats
 * @desc    Get audio cache statistics
 * @access  Private (Admin only)
 */
router.get('/cache/stats', authenticate, async (req, res, next) => {
  try {
    const stats = await ttsService.getCacheStats();
    return sendSuccess(res, stats, 'Cache statistics retrieved');
  } catch (err) {
    next(err);
  }
});

/**
 * @route   POST /api/voice/cache/pregenerate
 * @desc    Pre-generate common phrases
 * @access  Private (Admin only)
 */
router.post('/cache/pregenerate', authenticate, async (req, res, next) => {
  try {
    await ttsService.preGenerateCommonPhrases();
    return sendSuccess(res, null, 'Common phrases pre-generated successfully');
  } catch (err) {
    next(err);
  }
});

export default router;
