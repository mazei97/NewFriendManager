# 새친구 관리 앱

교회 유아부 새친구를 관리하는 React Native 앱입니다.

## 기능

- 새친구 정보 등록 (이름, 나이, 부모님 이름, 연락처, 주소)
- 새친구 목록 조회
- 방문 날짜 기록
- 메모 작성
- Firebase Firestore 연동

## 설치 방법

```bash
# 프로젝트 디렉토리로 이동
cd NewFriendManager

# 패키지 설치
npm install

# 개발 서버 시작
npm start
```

## 실행 방법

```bash
# Android 실행
npm run android

# iOS 실행 (macOS 필요)
npm run ios
```

## Firebase 설정

이 프로젝트는 기존 Firebase 프로젝트 `remnant-new`를 사용합니다.
- Project ID: remnant-new
- Firestore 컬렉션: `friends`

## 기술 스택

- React Native (Expo)
- TypeScript
- Firebase Firestore
- React Hooks
