# CBMC 김해한마음지회 웹사이트 — 배포 및 운영 가이드

## 1단계: GitHub 저장소 생성 및 Push

### 1-1. GitHub에서 새 저장소 만들기
1. https://github.com/new 접속
2. Repository name: `cbmc-gimhae`
3. Public 선택
4. "Create repository" 클릭
5. **README 추가하지 않기** (빈 저장소로 생성)

### 1-2. 로컬에서 Push
터미널(또는 Git Bash)에서 `cbmc-gimhae` 폴더로 이동 후:

```bash
cd cbmc-gimhae
git init
git add -A
git commit -m "CBMC 김해한마음지회 웹사이트 v1.0 — 통합 완성"
git branch -M main
git remote add origin https://github.com/kodhjj/cbmc-gimhae.git
git push -u origin main
```

---

## 2단계: Netlify 연결

### 2-1. Netlify에 GitHub 저장소 연결
1. https://app.netlify.com 접속 → 로그인
2. "Add new site" → "Import an existing project"
3. "Deploy with GitHub" 선택
4. `kodhjj/cbmc-gimhae` 저장소 선택
5. 설정 확인:
   - Branch: `main`
   - Build command: (비워두기)
   - Publish directory: `.`
6. "Deploy site" 클릭

### 2-2. 사이트 이름 변경
1. Site settings → Domain management
2. "Options" → "Edit site name"
3. `cbmc-gimhae` 입력 → 저장
4. URL: `https://cbmc-gimhae.netlify.app`

---

## 3단계: Notion 자동 연동 설정

### 3-1. Notion Integration 생성
1. https://www.notion.so/profile/integrations 접속
2. "새 통합 만들기" 클릭
3. 이름: `CBMC Website`
4. 유형: 내부
5. "제출" → **Internal Integration Secret** 복사 (ntn_xxxxx...)

### 3-2. Notion DB에 통합 연결
1. Notion에서 "📋 토요조찬포럼 일정 DB" 페이지 열기
2. 오른쪽 상단 "..." 메뉴 → "연결" → "CBMC Website" 선택

### 3-3. Netlify 환경변수 설정
1. Netlify 대시보드 → Site settings → Environment variables
2. 다음 2개 추가:

| Key | Value |
|-----|-------|
| `NOTION_API_KEY` | `ntn_xxxxx...` (3-1에서 복사한 키) |
| `NOTION_FORUM_DB_ID` | `faa5b72b-7a3b-4bc0-bb72-3d07478764e0` |

3. "Save" 클릭
4. Deploys → "Trigger deploy" → "Deploy site" 클릭

---

## 4단계: 주간 업데이트 방법

### Notion에서 포럼 일정 관리
포럼이 끝나면 Notion DB에서:
1. 해당 포럼의 **상태**를 "완료"로 변경
2. YouTube 링크를 해당 행에 입력
3. 웹사이트가 자동으로 최신 일정을 표시합니다 (5분 캐시)

### 새 포럼 추가
Notion DB에 새 행 추가:
- 제목, 날짜, 강사, 성경본문, 상태(예정), 카테고리 입력
- 웹사이트에 자동 반영

### 코드 수정이 필요한 경우
```bash
# 파일 수정 후
git add -A
git commit -m "2월 28일 포럼 강의 영상 추가"
git push
# → Netlify가 자동으로 새 버전 배포
```

---

## 파일 구조

```
cbmc-gimhae/
├── index.html          ← 메인 웹페이지 (전체 통합)
├── 404.html            ← 404 에러 페이지
├── netlify.toml        ← Netlify 설정 (CSP, 리다이렉트, Functions)
├── netlify/functions/
│   └── forum-schedule.js  ← Notion API 중간 서버 (서버리스)
├── robots.txt          ← 검색엔진 크롤링 설정
├── sitemap.xml         ← 검색엔진 사이트맵
├── _redirects          ← URL 리다이렉트 규칙
├── cbmc-members.pdf    ← 회원 명부 PDF
├── img-*.jpg           ← 이미지 파일들 (30+개)
└── DEPLOY-GUIDE.md     ← 이 가이드
```

---

## Notion DB 구조 (📋 토요조찬포럼 일정 DB)

| 속성 | 유형 | 설명 |
|------|------|------|
| 제목 | Title | 포럼 제목 |
| 날짜 | Date | 포럼 날짜 |
| 강사 | Text | 강사 이름 및 소속 |
| 성경본문 | Text | 성경 구절 |
| 상태 | Select | 예정 / 진행중 / 완료 / 휴강 |
| 카테고리 | Select | 조찬주회 / 특별포럼 / 연합수련회 / 휴강 |
| YouTube 5분 | URL | 5분 요약 영상 링크 |
| YouTube 2분 | URL | 2분 하이라이트 링크 |
| PDF 자료 | URL | 성경공부 자료 다운로드 |
| 요약 | Text | 포럼 내용 요약 |

---

## 연동 흐름도

```
[Notion DB] → /api/forum-schedule (Netlify Function) → [웹사이트 JavaScript]
     ↑                                                         ↓
  목사님이 Notion에서                                    방문자가 최신 일정을
  일정 추가/수정                                         자동으로 확인
```

API 실패 시: 기존 HTML에 하드코딩된 일정이 그대로 표시됩니다 (안전장치).

---

*제작: 엘림G선교회 · 2026년 2월*
