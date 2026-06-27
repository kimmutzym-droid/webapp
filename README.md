# Blogger 자동화 플랫폼

여러 Blogger(블로그스팟) 블로그의 글 작성과 예약 발행을 자동화하는 웹앱.

## 구조
- `backend/`: Express API + SQLite + node-cron 스케줄러. Google OAuth로 Blogger 연동, Gemini API(무료 티어)로 콘텐츠 생성, Pollinations.ai(무료)로 이미지 생성.
- `frontend/`: React(Vite) PWA 대시보드. 블로그 연결/시간대 설정, 포스트 작성(대상 블로그 선택), 발행 현황 모니터링.
- `prompts/`: 키워드 분석 및 글쓰기 AI 프롬프트 템플릿.

## 시작하기

### 백엔드
```bash
cd backend
cp .env.example .env   # GOOGLE_CLIENT_ID/SECRET, GEMINI_API_KEY 입력
npm install
npm run dev
```

### 프론트엔드
```bash
cd frontend
npm install
npm run dev
```

프론트는 `http://localhost:5173`, 백엔드는 `http://localhost:4000`에서 실행됩니다.

## 주요 기능
- Google 계정으로 로그인해 여러 Blogger 블로그를 한 대시보드에서 연결/관리
- 블로그별로 하루 최대 발행 수(최대 20개)와 발행 시간대를 독립적으로 설정
- 프롬프트 입력 → AI가 키워드 분석 + SEO 글 작성(제목/메타 설명/라벨/본문) → 발행할 블로그를 선택해 큐에 등록
- 스케줄러가 설정된 시간대에 큐에서 글을 꺼내 Blogger API로 자동 발행 (일일 한도 자동 체크)
- PWA로 브라우저에서 데스크탑/모바일에 설치 가능

## TODO
- `frontend/public/icon-192.png`, `icon-512.png` 추가 (PWA 설치 아이콘)
