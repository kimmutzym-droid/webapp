/**
 * Google Apps Script 블로그 자동화 (Render/OAuth 클라이언트 불필요 버전)
 *
 * 사용법은 저장소 루트의 APPS_SCRIPT_SETUP.md 참고.
 * 이 글쓰기 지침은 prompts/blog-writing-prompt.md 원본을 기반으로 함.
 * 원본 프롬프트를 수정하면 아래 WRITING_GUIDE 상수도 함께 반영할 것.
 *
 * 필요한 스크립트 속성 (프로젝트 설정 > 스크립트 속성):
 *   GEMINI_API_KEY - https://aistudio.google.com/apikey 에서 발급
 *   BLOG_ID        - 자동 발행할 Blogger 블로그 ID
 *
 * Blogger API는 Apps Script 고급 서비스 목록에서 빠졌기 때문에,
 * 고급 서비스 추가 없이 REST API를 OAuth 토큰으로 직접 호출한다.
 * 이를 위해 appsscript.json(매니페스트)에 blogger 권한(scope)을 직접 선언해야 함.
 * 자세한 설정 방법은 저장소 루트의 APPS_SCRIPT_SETUP.md 참고.
 */

const GEMINI_MODEL = 'gemini-2.0-flash';

const WRITING_GUIDE = `
너는 한국어 애드센스 블로그(Blogger/블로그스팟)용 SEO 글쓰기 전문가다.
오늘 날짜 기준으로 사람들이 많이 검색할 만한 핫한 주제를 스스로 하나 정하고, 아래 규칙에 따라 발행 가능한 글을 작성한다.
확인되지 않은 사실이나 수치, 날짜는 새로 지어내지 않는다. 확정되지 않은 정보(신청 기간, 금액, 일정 등)는
"변경될 수 있으니 공식 채널에서 최종 확인 필요"라고 명시한다.

[구조 규칙]
- H1은 쓰지 않는다 (Blogger 포스트 제목이 H1 역할).
- 제목 아래 1~2문장 도입부(키워드 포함).
- H2: 본문 큰 섹션 최소 3개. 마지막 H2는 "마무리"로 핵심 요약 + 다음 행동 안내.
- 문단은 2~4문장으로 짧게 나눈다.
- 같은 표현/문장 구조를 기계적으로 반복하지 않는다.

[중복 방지]
recent_posts로 최근 발행한 제목 목록이 주어지면, 같은 주제/제목/문장 구조를 피하고 다른 각도로 작성한다.

[출력 형식]
다른 설명 없이 아래 JSON 객체 하나만 출력한다 (마크다운 코드블록 금지):
{
  "title": "SEO 제목",
  "meta_description": "120자 내외 요약",
  "labels": ["라벨1", "라벨2", "라벨3"],
  "body_html": "<p>...</p><h2>...</h2>..."
}
본문은 1500자 이상(공백 제외), H2/H3 구조와 문단/목록을 포함한 HTML이어야 한다.
`;

function getProp_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) throw new Error(`스크립트 속성 "${key}"가 설정되지 않았습니다.`);
  return value;
}

function bloggerFetch_(method, path, payload) {
  const url = `https://www.googleapis.com/blogger/v3/${path}`;
  const options = {
    method,
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    muteHttpExceptions: true,
  };
  if (payload) {
    options.contentType = 'application/json';
    options.payload = JSON.stringify(payload);
  }
  const resp = UrlFetchApp.fetch(url, options);
  const code = resp.getResponseCode();
  if (code >= 300) {
    throw new Error(`Blogger API 오류 (${code}): ${resp.getContentText()}`);
  }
  return JSON.parse(resp.getContentText());
}

function getRecentPostTitles_(blogId, maxResults) {
  const data = bloggerFetch_('get', `blogs/${blogId}/posts?maxResults=${maxResults || 10}&fetchBodies=false`);
  const items = data.items || [];
  return items.map((p) => p.title);
}

function callGemini_(prompt) {
  const apiKey = getProp_('GEMINI_API_KEY');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
  };
  const resp = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  const code = resp.getResponseCode();
  if (code !== 200) {
    throw new Error(`Gemini API 오류 (${code}): ${resp.getContentText()}`);
  }
  const data = JSON.parse(resp.getContentText());
  const text = data.candidates[0].content.parts[0].text;
  const jsonText = text.trim().replace(/^```json/, '').replace(/^```/, '').replace(/```$/, '').trim();
  return JSON.parse(jsonText);
}

function generatePost_(recentTitles) {
  const prompt = `${WRITING_GUIDE}\n\nrecent_posts: ${JSON.stringify(recentTitles)}`;
  return callGemini_(prompt);
}

function publishToBlogger_(post) {
  const blogId = getProp_('BLOG_ID');
  return bloggerFetch_('post', `blogs/${blogId}/posts/`, {
    title: post.title,
    content: post.body_html,
    labels: post.labels || [],
  });
}

/**
 * 시간 기반 트리거에 연결할 진입점. 하루 한 번 실행하면 글 1개를 자동 생성/발행한다.
 */
function runDaily() {
  const blogId = getProp_('BLOG_ID');
  const recentTitles = getRecentPostTitles_(blogId, 10);
  const post = generatePost_(recentTitles);
  const published = publishToBlogger_(post);
  Logger.log(`발행 완료: ${published.url}`);
}
