# 새친구 관리 PWA

교회 유아부 새친구 관리를 위한 Progressive Web App입니다.

## 기능

- 새친구 리스트 조회 (사진, 이름, 성별, 나이, 생년월일)
- 새친구 상세 정보 조회 및 편집
- 교육 1~3차 체크박스 표시
- 등반 완료 시 별 아이콘 + 수료일 표시
- 검색 기능 (이름 검색)
- 필터 기능 (등반제외, 방문제외, 등록일자로부터)
- 사진 업로드 (자동 리사이징)
- Firebase Authentication (자동 로그인)
- Firebase Firestore (데이터 저장)
- Firebase Storage (이미지 저장)

## 개발 환경 설정

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 빌드

```bash
npm run build
```

## GitHub Pages 배포

1. GitHub 저장소 생성
2. Settings > Pages > Source를 "GitHub Actions"로 설정
3. 코드를 main 브랜치에 푸시하면 자동 배포됨

## PWA 설치 방법

### iOS (Safari)
1. Safari로 앱 URL 접속
2. 공유 버튼 클릭
3. "홈 화면에 추가" 선택

### Android (Chrome)
1. Chrome으로 앱 URL 접속
2. 메뉴 버튼 클릭
3. "홈 화면에 추가" 선택

## 기술 스택

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Firebase (Auth, Firestore, Storage)
- next-pwa
