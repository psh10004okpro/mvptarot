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

## 📊 다음 단계

### Phase 2: 데이터 통합 (Day 4-5)
- [ ] 10,031개 타로 해석 데이터 임포트
- [ ] 78장 타로 카드 기본 데이터 임포트
- [ ] 데이터 검증 및 품질 관리

### Phase 3: 프론트엔드 개발 (Day 6-10)
- [ ] React/Next.js 프론트엔드 구축
- [ ] 타로 카드 UI/UX 디자인
- [ ] 리딩 결과 페이지
- [ ] 결제 시스템 통합

## 🤝 기여

이슈와 PR은 언제나 환영합니다!

## 📄 라이선스

MIT License

## 👥 개발자

운월담 개발팀
