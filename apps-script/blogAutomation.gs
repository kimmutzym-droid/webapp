/**
 * Google Apps Script 블로그 글 반자동화 (구글시트 저장 버전)
 *
 * 매일 자동으로 Gemini가 글을 써서 구글시트에 한 줄씩 추가한다.
 * Blogger에 올리는 건 사람이 시트를 보고 직접 복사-붙여넣기 한다 (Blogger API 불필요).
 *
 * 사용법은 저장소 루트의 APPS_SCRIPT_SETUP.md 참고.
 * 글쓰기 지침은 prompts/blog-writing-prompt.md 원본을 기반으로 함.
 * 원본 프롬프트를 수정하면 아래 WRITING_GUIDE 상수도 함께 반영할 것.
 *
 * 필요한 스크립트 속성 (프로젝트 설정 > 스크립트 속성):
 *   GEMINI_API_KEY - https://aistudio.google.com/apikey 에서 발급
 *   SHEET_ID       - 결과를 저장할 구글시트 ID (시트 URL 중간의 긴 문자열)
 */

const GEMINI_MODEL = 'gemini-2.0-flash';
const SHEET_NAME = '글목록';
const HEADER = ['생성일시', '제목', 'meta_description', '라벨', '본문(HTML)', '상태'];

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
recent_posts로 최근 생성한 제목 목록이 주어지면, 같은 주제/제목/문장 구조를 피하고 다른 각도로 작성한다.

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

function getSheet_() {
  const sheetId = getProp_('SHEET_ID');
  const ss = SpreadsheetApp.openById(sheetId);
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADER);
  }
  return sheet;
}

function getRecentTitles_(sheet, maxResults) {
  const lastRow = sheet.getLastRow();
  if (lastRow <= 1) return [];
  const startRow = Math.max(2, lastRow - (maxResults || 10) + 1);
  const titles = sheet.getRange(startRow, 2, lastRow - startRow + 1, 1).getValues();
  return titles.map((row) => row[0]).filter(String);
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

/**
 * 시간 기반 트리거에 연결할 진입점. 하루 한 번 실행하면 글 1개를 생성해 시트에 추가한다.
 * Blogger 발행은 사람이 시트를 보고 직접 복사-붙여넣기 한다.
 */
function runDaily() {
  const sheet = getSheet_();
  const recentTitles = getRecentTitles_(sheet, 10);
  const post = generatePost_(recentTitles);
  sheet.appendRow([
    new Date(),
    post.title,
    post.meta_description,
    (post.labels || []).join(', '),
    post.body_html,
    '대기중',
  ]);
  Logger.log(`시트에 추가 완료: ${post.title}`);
}
