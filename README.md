# 파이썬 개념 테스트

동아리 학생용 파이썬 개념 학습·수준별(상/중/하) 테스트 웹앱입니다.
교사는 수업 자료(텍스트/.ipynb)를 올려 개념·문제를 자동 생성하거나 직접 만들고,
학생 응시 현황을 확인합니다. 학생은 구글 계정으로 로그인해 개념을 학습하고 테스트를 풉니다.

## 실행

```bash
npm install
npm run dev
```

`http://localhost:3000` 접속. Firebase 설정이 필요합니다 (아래 참고).

## Firebase 설정 (필수)

이 앱은 Firebase Authentication(구글 로그인)과 Firestore(개념/문제/결과 저장)를 사용합니다.

1. `.env.local.example`을 복사해 `.env.local`을 만들고, Firebase 콘솔 > 프로젝트 설정 > 일반 >
   내 앱 > SDK 설정 및 구성에서 `firebaseConfig` 값을 채웁니다. (이 값들은 비밀키가 아니라
   클라이언트에 노출되는 공개 설정값입니다.)
2. `NEXT_PUBLIC_TEACHER_EMAILS`에 교사로 인식할 구글 이메일을 콤마로 구분해 넣습니다.
   이 목록에 있는 이메일로 로그인하면 `/teacher`로, 그 외는 `/student`로 이동합니다.
3. Firebase 콘솔 > **Authentication > Sign-in method**에서 **Google** 제공업체를 켭니다.
4. Firebase 콘솔 > **Firestore Database**에서 데이터베이스를 만듭니다(테스트 모드로 시작해도 됩니다).
5. Firestore **규칙(Rules)** 탭에 이 저장소의 [`firestore.rules`](firestore.rules) 내용을 그대로
   붙여넣고 게시합니다. `isTeacher()`에 있는 이메일을 `NEXT_PUBLIC_TEACHER_EMAILS`와 동일하게
   맞춰주세요(콘솔 규칙은 환경변수를 못 읽어서 직접 이메일을 적어야 합니다).
6. 학생이 결과를 저장할 때 브라우저 콘솔에 "이 쿼리에는 색인이 필요합니다(The query
   requires an index)" 같은 오류와 함께 링크가 뜨면, 그 링크를 클릭해 Firestore 색인을
   한 번 만들어주면 됩니다(자동 생성).
7. Vercel에 배포한다면, 같은 환경변수들을 Vercel 프로젝트 설정 > Environment Variables에도
   등록하고, Firebase 콘솔 > Authentication > Settings > **승인된 도메인**에 배포 도메인을
   추가해야 로그인이 동작합니다. (localhost는 기본적으로 허용되어 있습니다.)

## 화면 구조

- `/` — 랜딩 페이지. 로그인 안 했으면 "Google로 로그인" 버튼, 로그인하면 이메일에 따라
  `/teacher` 또는 `/student`로 자동 이동합니다.
- `/teacher` — 교사 대시보드 (개념/학생 수, 최근 응시 기록 요약)
  - `/teacher/materials` — 자료 붙여넣기 또는 `.ipynb` 업로드 → 개념·문제 자동 생성
  - `/teacher/concepts` — 개념 목록/삭제, 템플릿에서 빠르게 추가, 직접 만들기
  - `/teacher/concepts/new`, `/teacher/concepts/[id]/edit` — 개념 이름·설명·상중하 문제를
    직접 작성/수정하는 폼
  - `/teacher/students` — 로그인한 학생 목록 + 전체 응시 기록, 학생 기록 삭제
- `/student` — 개념 목록 + 내 최근 기록
  - `/student/concepts/[id]` — 개념 학습
  - `/student/concepts/[id]/difficulty` — 난이도(상/중/하) 선택
  - `/student/concepts/[id]/test?level=...` — 문제 풀이 → 결과 → 오답 리뷰 (한 화면에서
    단계 전환). 결과는 Firestore `results` 컬렉션에 저장됩니다.

접근 제어는 화면(레이아웃)에서 이메일 기반으로 1차로 막고, Firestore 보안 규칙에서
실제 쓰기 권한을 최종적으로 강제합니다.

## 개념 만드는 방법 두 가지

1. **자료에서 자동 생성** (`/teacher/materials`): `src/lib/conceptData.ts`에 미리 정의한
   6개 개념(변수와 자료형/조건문/반복문/리스트/딕셔너리/함수)의 키워드가 붙여넣은 텍스트에
   있는지로 판단해 자동으로 만듭니다. 실제 서비스에서는 이 부분을 LLM 기반 추출/문제
   생성으로 교체할 수 있습니다 (`src/lib/extractConcepts.ts`).
2. **직접 만들기** (`/teacher/concepts/new`): 자료 없이 개념 이름·설명과 상/중/하별 문제를
   직접 입력합니다. `/teacher/concepts`에서 템플릿 6개를 그대로 추가할 수도 있습니다.

## 데이터 모델 (Firestore)

- `concepts/{id}` — 개념 제목/설명/문제(상중하), 만들어진 방식(source: template/material/custom)
- `users/{uid}` — 로그인한 사용자 프로필과 역할(teacher/student) — 학생 관리 화면에서 사용
- `results/{id}` — 학생의 테스트 응시 기록(개념/난이도/점수/시각)

## 상태 저장

- 개념 목록: Firestore, 실시간 구독 (교사가 추가하면 학생 화면에도 바로 반영)
- 진행 중인 테스트 답안: 저장하지 않음 — 새로고침/뒤로가기 시 항상 새 문제로 다시 시작되고,
  안내 배너로 이전 진행 상황이 사라졌음을 알려줍니다.
- 테스트 결과: 완료 시 Firestore에 저장, 교사/학생 화면에서 조회

## 배포

`next.js + firebase + vercel` 스택입니다. 위 Firebase 설정을 마친 뒤 Vercel에 배포하면 됩니다.
