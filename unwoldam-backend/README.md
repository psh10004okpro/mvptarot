# 🌙 운월담 타로 서비스 백엔드 API

10,031개의 타로 해석 데이터를 활용한 실시간 타로 리딩 서비스 백엔드입니다.

## 🚀 기술 스택

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose ODM)
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Joi

## 📋 주요 기능

### 1. 인증 시스템
- 회원가입/로그인 (JWT 기반)
- Access Token & Refresh Token
- 사용자 프로필 관리

### 2. 타로 리딩
- **오늘의 운세**: 일일 1회 무료 리딩
- **단일 카드**: 간단한 질문에 대한 답변
- **3장 카드 스프레드**: 과거-현재-미래
- **켈틱 크로스**: 10장 카드 종합 리딩 (프리미엄 전용)

### 3. 구독 관리
- **Free**: 일일 3회 무료 리딩
- **Basic**: 일일 10회 리딩 (₩9,900/월)
- **Premium**: 무제한 리딩 + 켈틱 크로스 (₩19,900/월)

### 4. 데이터 관리
- 78장 타로 카드 정보
- 10,031개 해석 데이터
- 리딩 히스토리 저장
- 카드 조합 해석

## 📁 프로젝트 구조

```
unwoldam-backend/
├── src/
│   ├── config/           # 설정 파일
│   │   ├── database.ts   # MongoDB 연결
│   │   └── constants.ts  # 상수 정의
│   ├── controllers/      # 요청 처리 로직
│   │   ├── authController.ts
│   │   ├── tarotController.ts
│   │   ├── cardController.ts
│   │   └── subscriptionController.ts
│   ├── models/          # 데이터 모델
│   │   ├── User.ts
│   │   ├── TarotCard.ts
│   │   ├── Reading.ts
│   │   ├── Interpretation.ts
│   │   └── Subscription.ts
│   ├── routes/          # API 라우트
│   │   ├── authRoutes.ts
│   │   ├── tarotRoutes.ts
│   │   ├── cardRoutes.ts
│   │   ├── subscriptionRoutes.ts
│   │   └── index.ts
│   ├── services/        # 비즈니스 로직
│   │   ├── authService.ts
│   │   ├── tarotService.ts
│   │   └── subscriptionService.ts
│   ├── middleware/      # 미들웨어
│   │   ├── auth.ts
│   │   ├── subscription.ts
│   │   ├── rateLimit.ts
│   │   └── errorHandler.ts
│   ├── utils/           # 유틸리티 함수
│   │   ├── jwt.ts
│   │   ├── response.ts
│   │   └── validation.ts
│   ├── types/           # TypeScript 타입
│   │   └── index.ts
│   └── server.ts        # Express 서버
├── tests/               # 테스트 파일
├── package.json
├── tsconfig.json
├── docker-compose.yml
├── .env
├── .env.example
└── README.md
```

## 🛠️ 설치 및 실행

### 1. 프로젝트 클론

```bash
cd unwoldam-backend
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정

`.env` 파일이 이미 생성되어 있습니다. 필요한 경우 값을 수정하세요:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/unwoldam_tarot
JWT_SECRET=your-secret-key
```

### 4. MongoDB 실행

Docker Compose를 사용하여 MongoDB 실행:

```bash
docker-compose up -d
```

MongoDB UI 접속 (Mongo Express):
- URL: http://localhost:8081
- Username: admin
- Password: admin123

### 5. 서버 실행

#### 개발 모드 (hot reload)
```bash
npm run dev
```

#### 프로덕션 빌드
```bash
npm run build
npm start
```

### 6. 서버 확인

브라우저에서 http://localhost:3000 접속

```json
{
  "success": true,
  "message": "🌙 운월담 타로 API 서버입니다.",
  "version": "1.0.0"
}
```

## 📡 API 엔드포인트

### 인증 (Authentication)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | 회원가입 | Public |
| POST | `/api/auth/login` | 로그인 | Public |
| POST | `/api/auth/refresh` | 토큰 갱신 | Public |
| POST | `/api/auth/logout` | 로그아웃 | Private |
| GET | `/api/auth/me` | 내 정보 조회 | Private |

### 타로 리딩 (Tarot Reading)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/tarot/daily-fortune` | 오늘의 운세 | Private |
| POST | `/api/tarot/reading/single` | 1장 카드 리딩 | Private |
| POST | `/api/tarot/reading/three-card` | 3장 카드 리딩 | Private |
| POST | `/api/tarot/reading/celtic-cross` | 켈틱 크로스 (10장) | Premium |
| GET | `/api/tarot/reading/history` | 리딩 히스토리 | Private |
| GET | `/api/tarot/reading/:id` | 특정 리딩 조회 | Private |

### 카드 정보 (Cards)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cards` | 전체 카드 목록 | Public |
| GET | `/api/cards/:id` | 특정 카드 정보 | Public |
| GET | `/api/cards/combination/interpret` | 카드 조합 해석 | Public |

### 구독 (Subscription)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/subscription/plans` | 구독 플랜 목록 | Public |
| POST | `/api/subscription/subscribe` | 구독 시작 | Private |
| GET | `/api/subscription/status` | 구독 상태 확인 | Private |
| PUT | `/api/subscription/cancel` | 구독 취소 | Private |
| GET | `/api/subscription/history` | 구독 히스토리 | Private |

### 음성 (Voice) - **NEW in Phase 2**

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/voice/synthesize` | 텍스트를 음성으로 변환 (TTS) | Private |
| POST | `/api/voice/synthesize/reading` | 타로 리딩 음성 생성 | Private |
| POST | `/api/voice/recognize` | 음성을 텍스트로 변환 (STT) | Private |
| POST | `/api/voice/recognize/analyze` | 음성 질문 인식 및 분석 | Private |
| GET | `/api/voice/speakers` | 사용 가능한 음성 목록 | Public |
| GET | `/api/voice/cache/stats` | 음성 캐시 통계 | Private |

## 📝 사용 예시

### 1. 회원가입

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "홍길동"
  }'
```

### 2. 로그인

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "...",
      "email": "user@example.com",
      "membershipType": "free"
    },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### 3. 타로 리딩 생성

```bash
curl -X POST http://localhost:3000/api/tarot/reading/three-card \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "type": "three-card",
    "question": "오늘 하루는 어떨까요?",
    "context": "general"
  }'
```

### 4. 전체 카드 조회

```bash
curl http://localhost:3000/api/cards
```

## 🔐 인증 방식

모든 Private 엔드포인트는 Authorization 헤더에 JWT 토큰이 필요합니다:

```
Authorization: Bearer YOUR_ACCESS_TOKEN
```

## 🗄️ 데이터베이스 스키마

### User
- email, password (bcrypt 해싱)
- membershipType: free | basic | premium
- dailyReadingCount (일일 리딩 횟수)

### TarotCard
- cardNumber (0-77)
- name, nameKo
- arcana: major | minor
- suit: wands | cups | swords | pentacles

### Reading
- userId (ref: User)
- type: daily | single | three-card | celtic-cross
- cards: [{ position, cardId, orientation }]
- interpretation

### Interpretation (10,031개 데이터)
- cardId
- orientation: upright | reversed
- context: general | love | career | health | spiritual
- interpretation
- qualityScore

### Subscription
- userId
- plan: basic | premium
- startDate, endDate
- status: active | cancelled | expired

## 🚦 Rate Limiting

- **일반 API**: 15분당 100 요청
- **인증 API**: 15분당 5 요청
- **회원가입**: 1시간당 3 요청
- **리딩 생성**: 1분당 10 요청

## 🧪 테스트

```bash
npm test
```

## 🔒 보안 기능

- Helmet (보안 헤더)
- CORS 설정
- Rate Limiting
- JWT 인증
- bcrypt 비밀번호 해싱
- Input validation (Joi)
- Error handling

## 📊 구현 상태

### ✅ Phase 1: 백엔드 인프라 구축 (완료)
- [x] Node.js + Express + TypeScript 프로젝트 초기화
- [x] MongoDB 데이터베이스 연동 및 스키마 설계
- [x] JWT 기반 인증 시스템
- [x] 타로 리딩 API 엔드포인트
- [x] 구독 관리 시스템
- [x] Rate Limiting 및 보안 기능

### ✅ Phase 2: AI 통합 및 개인화 시스템 (완료)
- [x] **RAG 시스템**: Vector DB (ChromaDB) + OpenAI Embeddings
- [x] **LLM 통합**: Claude 3.5 Sonnet API
- [x] **개인화 해석**: 사용자 맥락 기반 맞춤 리딩
- [x] **음성 기능**: CLOVA TTS/STT 통합
- [x] **음성 캐싱**: Redis 기반 오디오 캐시 시스템
- [x] **Prompt Templates**: MZ세대 스타일 다양한 템플릿

#### Phase 2 주요 기능

**🤖 AI-Powered 타로 해석**
- Claude 3.5 Sonnet을 활용한 개인화된 타로 해석
- Vector DB를 통한 10,031개 해석 데이터 의미 검색
- 사용자 나이, 관심사, 이전 리딩을 고려한 맞춤 해석
- 연애, 커리어, 건강, 영적 성장 등 맥락별 특화 프롬프트

**🎙️ 음성 타로 리딩**
- CLOVA Premium TTS: 4가지 음성 선택 (nara, nmammon, ndain, njinho)
- 감정, 속도, 피치 조절 가능
- Redis 기반 스마트 캐싱으로 비용 최적화
- 음성 질문 인식 및 자동 카테고리 분류

**💾 벡터 데이터베이스**
- ChromaDB를 통한 고속 의미 검색
- OpenAI text-embedding-3-small 모델
- 유사도 기반 최적 해석 검색
- 카드 조합 시너지 분석

### 🔜 Phase 3: 프론트엔드 개발 (예정)
- [ ] React/Next.js 프론트엔드 구축
- [ ] 타로 카드 UI/UX 디자인
- [ ] 리딩 결과 페이지
- [ ] 음성 리딩 플레이어
- [ ] 결제 시스템 통합

## 🚀 새로운 AI 기능 사용법

### 1. AI 개인화 리딩
```bash
# 사용자 맥락을 포함한 3장 카드 리딩
curl -X POST http://localhost:3000/api/tarot/reading/three-card \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question": "이직을 고민 중인데 어떤 선택이 좋을까요?",
    "context": "career"
  }'
```

### 2. 음성 변환 (TTS)
```bash
# 타로 해석을 음성으로 변환
curl -X POST http://localhost:3000/api/voice/synthesize \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "text": "오늘의 카드는 태양입니다. 밝은 에너지가 가득한 하루가 될 거예요.",
    "speaker": "nara"
  }' \
  --output tarot-reading.mp3
```

### 3. 음성 질문 인식 (STT)
```bash
# 음성 파일을 업로드하여 질문 분석
curl -X POST http://localhost:3000/api/voice/recognize/analyze \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@question.wav"
```

## 🛠️ AI 서비스 설정

### 필수 API 키 설정
`.env` 파일에 다음 API 키를 설정하세요:

```env
# Claude API
ANTHROPIC_API_KEY=your-anthropic-api-key

# OpenAI (Embeddings)
OPENAI_API_KEY=your-openai-api-key

# CLOVA Voice API
CLOVA_CLIENT_ID=your-clova-client-id
CLOVA_CLIENT_SECRET=your-clova-client-secret
```

### Redis 및 ChromaDB 실행

```bash
# Docker Compose로 모든 서비스 시작
docker-compose up -d

# 포함 서비스:
# - MongoDB (Port 27017)
# - Redis (Port 6379)
# - Mongo Express UI (Port 8081)
```

**참고**: ChromaDB는 별도 설치가 필요합니다:
```bash
pip install chromadb
chroma run --path ./chroma_data --port 8000
```

### 데이터 시딩

```bash
# 타로 카드 데이터 시딩
npm run seed:cards

# 해석 데이터를 Vector DB에 로드
npm run preprocess:data
```

## 🤝 기여

이슈와 PR은 언제나 환영합니다!

## 📄 라이선스

MIT License

## 👥 개발자

운월담 개발팀
