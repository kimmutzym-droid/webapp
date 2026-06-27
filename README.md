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

## Render.com에 무료로 배포하기 (터미널 없이, 클릭으로)

1. 이 GitHub 저장소를 본인 GitHub 계정에 두고 (이미 되어 있음), https://render.com 에 가입 후 GitHub 계정을 연결한다.
2. Render 대시보드에서 "New +" → "Web Service" 선택 → 이 저장소(`webapp`) 선택.
3. 설정값 입력:
   - **Root Directory**: 비워둠 (저장소 루트 그대로)
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
4. "Environment" 탭에서 아래 환경변수를 추가한다 (`backend/.env.example` 참고):
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
   - `GEMINI_API_KEY`
   - `APP_BASE_URL`, `FRONTEND_URL` → 둘 다 Render가 배포 후 알려주는 주소로 입력 (예: `https://your-app.onrender.com`)
   - `GOOGLE_REDIRECT_URI`는 `https://your-app.onrender.com/api/auth/google/callback`로 설정
5. 배포가 끝나면 Google Cloud Console의 OAuth 클라이언트 설정에서 "승인된 리디렉션 URI"에 위 4번의 `GOOGLE_REDIRECT_URI`와 동일한 주소를 추가한다.
6. 이제 `https://your-app.onrender.com`으로 접속하면 컴퓨터를 꺼도 서버가 계속 돌아가는 자동화 대시보드를 바로 쓸 수 있다.

Render 무료 플랜은 일정 시간 요청이 없으면 서버가 잠들었다가 다음 요청 때 다시 깨어나는 특성이 있어, 예약 발행 시간이 정확히 맞지 않을 수 있다. 정시 발행이 중요하면 유료 플랜(Starter, 월 $7 수준)으로 올리는 것을 권장한다.

## 주요 기능
- Google 계정으로 로그인해 여러 Blogger 블로그를 한 대시보드에서 연결/관리
- 블로그별로 하루 최대 발행 수(최대 20개)와 발행 시간대를 독립적으로 설정
- 프롬프트 입력 → AI가 키워드 분석 + SEO 글 작성(제목/메타 설명/라벨/본문) → 발행할 블로그를 선택해 큐에 등록
- 스케줄러가 설정된 시간대에 큐에서 글을 꺼내 Blogger API로 자동 발행 (일일 한도 자동 체크)
- PWA로 브라우저에서 데스크탑/모바일에 설치 가능

## TODO
- `frontend/public/icon-192.png`, `icon-512.png` 추가 (PWA 설치 아이콘)
