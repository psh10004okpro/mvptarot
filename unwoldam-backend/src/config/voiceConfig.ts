export const VOICE_CONFIG = {
  // TTS (Text-to-Speech) Configuration
  tts: {
    // CLOVA TTS speakers
    speakers: {
      nara: {
        name: 'nara',
        description: '따뜻하고 친근한 여성 목소리',
        gender: 'female',
        recommended: true
      },
      nmammon: {
        name: 'nmammon',
        description: '차분하고 안정적인 여성 목소리',
        gender: 'female'
      },
      ndain: {
        name: 'ndain',
        description: '밝고 경쾌한 여성 목소리',
        gender: 'female'
      },
      njinho: {
        name: 'njinho',
        description: '깊이 있는 남성 목소리',
        gender: 'male'
      }
    },

    // Default settings
    defaultSpeaker: process.env.TTS_DEFAULT_SPEAKER || 'nara',
    defaultSpeed: 0,  // -5 to 5, 0 is normal
    defaultPitch: 0,  // -5 to 5, 0 is normal
    defaultEmotion: 0, // 0 to 2 (Premium voices only)

    // Format settings
    format: 'mp3', // mp3 or opus
    sampleRate: 24000, // 16000 or 24000

    // Text limits
    maxLength: 500, // Maximum characters per request

    // Cache settings
    cacheEnabled: process.env.TTS_CACHE_ENABLED === 'true',
    cacheExpiry: parseInt(process.env.TTS_CACHE_EXPIRY || '86400', 10), // 24 hours

    // Emotion presets for different reading types
    emotions: {
      daily: {
        emotion: 1, // Bright
        speed: 0,
        pitch: 1
      },
      love: {
        emotion: 1, // Warm
        speed: -1,
        pitch: 0
      },
      career: {
        emotion: 0, // Neutral
        speed: 0,
        pitch: 0
      },
      warning: {
        emotion: 0, // Serious
        speed: -2,
        pitch: -1
      }
    },

    // Pre-generated common phrases (for cost optimization)
    commonPhrases: [
      '안녕하세요, 운월담입니다.',
      '오늘의 운세를 알려드릴게요.',
      '카드를 뽑아주세요.',
      '잠시만 기다려주세요.',
      '타로 리딩을 시작하겠습니다.',
      '이 카드가 전하는 메시지는',
      '오늘의 카드는',
      '감사합니다.'
    ]
  },

  // STT (Speech-to-Text) Configuration
  stt: {
    // Recognition settings
    language: 'ko-KR', // Korean
    model: 'general', // 'general' or 'premium'

    // Audio settings
    maxDuration: parseInt(process.env.AUDIO_MAX_DURATION || '30', 10), // seconds
    sampleRate: 16000,
    encoding: 'LINEAR16', // LINEAR16 or FLAC

    // Processing
    enableAutomaticPunctuation: true,
    enableWordTimeOffsets: false,
    profanityFilter: false
  },

  // Cost optimization settings
  costOptimization: {
    // Use cache for repeated phrases
    useCacheFirst: true,

    // Pre-generate common phrases on startup
    preGenerateCommon: true,

    // Minimum cache duration before regeneration
    minCacheDuration: 3600, // 1 hour

    // Maximum cache size (number of items)
    maxCacheSize: 1000
  },

  // Audio file storage
  storage: {
    // Local storage path
    localPath: './uploads/audio',

    // S3 configuration (optional)
    useS3: process.env.USE_S3_STORAGE === 'true',
    s3Bucket: process.env.S3_BUCKET_NAME || 'unwoldam-audio',
    s3Region: process.env.S3_REGION || 'ap-northeast-2',

    // CDN URL
    cdnUrl: process.env.CDN_URL || ''
  }
};

export const VOICE_PRESETS = {
  // Daily fortune reading
  dailyFortune: {
    speaker: 'nara',
    emotion: 1,
    speed: 0,
    pitch: 1
  },

  // Love reading
  loveReading: {
    speaker: 'nara',
    emotion: 1,
    speed: -1,
    pitch: 0
  },

  // Career reading
  careerReading: {
    speaker: 'nmammon',
    emotion: 0,
    speed: 0,
    pitch: 0
  },

  // General reading
  generalReading: {
    speaker: 'nara',
    emotion: 0,
    speed: 0,
    pitch: 0
  },

  // Meditation/spiritual
  spiritualReading: {
    speaker: 'nmammon',
    emotion: 0,
    speed: -2,
    pitch: -1
  }
};

export default VOICE_CONFIG;
