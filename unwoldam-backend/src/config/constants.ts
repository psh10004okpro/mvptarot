export const MEMBERSHIP_TYPES = {
  FREE: 'free',
  BASIC: 'basic',
  PREMIUM: 'premium'
} as const;

export const READING_TYPES = {
  DAILY: 'daily',
  SINGLE: 'single',
  THREE_CARD: 'three-card',
  CELTIC_CROSS: 'celtic-cross'
} as const;

export const READING_CONTEXTS = {
  GENERAL: 'general',
  LOVE: 'love',
  CAREER: 'career',
  HEALTH: 'health',
  SPIRITUAL: 'spiritual'
} as const;

export const CARD_ORIENTATIONS = {
  UPRIGHT: 'upright',
  REVERSED: 'reversed'
} as const;

export const ARCANA_TYPES = {
  MAJOR: 'major',
  MINOR: 'minor'
} as const;

export const SUITS = {
  WANDS: 'wands',
  CUPS: 'cups',
  SWORDS: 'swords',
  PENTACLES: 'pentacles'
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
} as const;

export const DAILY_READING_LIMITS = {
  [MEMBERSHIP_TYPES.FREE]: parseInt(process.env.FREE_DAILY_READING_LIMIT || '3', 10),
  [MEMBERSHIP_TYPES.BASIC]: parseInt(process.env.BASIC_DAILY_READING_LIMIT || '10', 10),
  [MEMBERSHIP_TYPES.PREMIUM]: parseInt(process.env.PREMIUM_DAILY_READING_LIMIT || '999', 10)
} as const;

export const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Basic',
    price: 9900,
    currency: 'KRW',
    dailyLimit: DAILY_READING_LIMITS.basic,
    features: [
      '일일 10회 타로 리딩',
      '3장 카드 스프레드',
      '기본 해석 제공',
      '리딩 히스토리 저장'
    ]
  },
  PREMIUM: {
    name: 'Premium',
    price: 19900,
    currency: 'KRW',
    dailyLimit: DAILY_READING_LIMITS.premium,
    features: [
      '무제한 타로 리딩',
      '켈틱 크로스 스프레드',
      'AI 음성 리딩',
      '상세 해석 및 조언',
      '리딩 히스토리 무제한 저장',
      '우선 고객 지원'
    ]
  }
} as const;

export const TAROT_POSITIONS = {
  THREE_CARD: {
    PAST: { position: 0, name: '과거', description: '과거의 상황이나 원인' },
    PRESENT: { position: 1, name: '현재', description: '현재의 상황이나 상태' },
    FUTURE: { position: 2, name: '미래', description: '미래의 전망이나 결과' }
  },
  CELTIC_CROSS: {
    PRESENT_SITUATION: { position: 0, name: '현재 상황', description: '당신의 현재 상태' },
    CHALLENGE: { position: 1, name: '장애물', description: '극복해야 할 도전' },
    FOUNDATION: { position: 2, name: '기반', description: '상황의 근본 원인' },
    RECENT_PAST: { position: 3, name: '최근 과거', description: '최근에 일어난 일' },
    CROWN: { position: 4, name: '최선의 결과', description: '가능한 최고의 결과' },
    NEAR_FUTURE: { position: 5, name: '가까운 미래', description: '곧 일어날 일' },
    SELF: { position: 6, name: '당신의 자세', description: '당신의 태도와 접근' },
    ENVIRONMENT: { position: 7, name: '주변 환경', description: '외부 영향' },
    HOPES_FEARS: { position: 8, name: '희망과 두려움', description: '내면의 감정' },
    OUTCOME: { position: 9, name: '최종 결과', description: '예상되는 결과' }
  }
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
} as const;

export const ERROR_MESSAGES = {
  // Auth errors
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  USER_ALREADY_EXISTS: '이미 존재하는 이메일입니다.',
  UNAUTHORIZED: '인증이 필요합니다.',
  INVALID_TOKEN: '유효하지 않은 토큰입니다.',
  TOKEN_EXPIRED: '토큰이 만료되었습니다.',

  // Reading errors
  DAILY_LIMIT_REACHED: '오늘의 무료 리딩 횟수를 모두 사용했습니다.',
  SUBSCRIPTION_REQUIRED: '이 기능은 구독이 필요합니다.',
  INVALID_CARD_COUNT: '카드 개수가 올바르지 않습니다.',

  // General errors
  NOT_FOUND: '요청한 리소스를 찾을 수 없습니다.',
  INTERNAL_ERROR: '서버 오류가 발생했습니다.',
  VALIDATION_ERROR: '입력값이 올바르지 않습니다.'
} as const;
