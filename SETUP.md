# 5단계로 바로 쓰는 법 (Render 무료 배포)

이 앱은 이미 다 만들어져 있습니다. 아래 5단계만 따라 하면 바로 블로그 자동 발행이 시작됩니다.

## 1단계. Render 가입 + 서비스 생성

1. https://render.com 접속 → GitHub 계정으로 가입/로그인
2. "New +" → "Web Service" 클릭
3. 이 저장소(`kimmutzym-droid/webapp`) 선택, 브랜치는 `claude/adsense-blog-automation-6g1wf5` 선택
4. 아래처럼 입력:
   - Build Command: `npm run build`
   - Start Command: `npm start`
   - Instance Type: Free

아직 "Create Web Service"는 누르지 말고, 2단계 환경변수까지 같이 입력한 다음 생성하세요.

## 2단계. Google API 키 발급 (구글 로그인 + 블로그 연결용)

1. https://console.cloud.google.com 접속 → 새 프로젝트 생성
2. 좌측 메뉴 "API 및 서비스" → "라이브러리"에서 **Blogger API v3** 검색 → 사용(Enable)
3. "API 및 서비스" → "OAuth 동의 화면" 만들기 (외부, 테스트 모드로 충분)
4. "사용자 인증 정보" → "사용자 인증 정보 만들기" → "OAuth 클라이언트 ID" → 유형: 웹 애플리케이션
5. "승인된 리디렉션 URI"에 아래 주소 추가 (Render에서 서비스 만들면 나오는 주소, 예: `https://내앱이름.onrender.com/api/auth/google/callback`)
6. 생성되면 나오는 **클라이언트 ID**, **클라이언트 보안 비밀번호**를 복사해둠

## 3단계. Gemini API 키 발급 (글 자동 작성용, 무료)

1. https://aistudio.google.com/apikey 접속 → 로그인 → "Create API key" 클릭
2. 나오는 키를 복사해둠

## 4단계. Render에 환경변수 입력 후 배포

Render 서비스 설정의 "Environment" 탭에서 아래 값을 입력합니다.

| 키 | 값 |
|---|---|
| `GOOGLE_CLIENT_ID` | 2단계에서 받은 클라이언트 ID |
| `GOOGLE_CLIENT_SECRET` | 2단계에서 받은 클라이언트 보안 비밀번호 |
| `GOOGLE_REDIRECT_URI` | `https://내앱이름.onrender.com/api/auth/google/callback` |
| `GEMINI_API_KEY` | 3단계에서 받은 키 |
| `APP_BASE_URL` | `https://내앱이름.onrender.com` |
| `FRONTEND_URL` | `https://내앱이름.onrender.com` (위와 동일) |
| `SESSION_SECRET` | 아무 임의의 긴 문자열 (예: `asdkj239jasdlkj239`) |
| `DB_PATH` | `./data/app.db` |

입력 후 "Create Web Service" (또는 "Deploy") 클릭 → 빌드/배포가 끝날 때까지 기다림 (몇 분 걸림).

> 주소(`내앱이름.onrender.com`)는 서비스를 만들면 Render가 알려줍니다. 그 주소를 2단계 리디렉션 URI와 `APP_BASE_URL`/`FRONTEND_URL`에 그대로 넣어야 합니다 (먼저 서비스를 만들어 주소를 확인한 뒤, Google Cloud Console에 가서 리디렉션 URI를 등록해도 됩니다).

## 5단계. 접속해서 블로그 연결

1. 배포된 주소(`https://내앱이름.onrender.com`) 접속
2. "Google 계정으로 연결" 버튼 클릭 → 로그인 → 권한 허용
3. 자동 발행할 Blogger 블로그 선택
4. 하루 발행 글 수, 발행 시간대 설정
5. 완료 — 이후부터는 글 생성과 발행이 자동(매분 체크하는 스케줄러)으로 진행됩니다.

---

막히는 단계가 있으면 어느 단계인지, 어떤 에러/화면이 나오는지 알려주시면 같이 해결합니다.
