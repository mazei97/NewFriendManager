# Firebase 설정 가이드

## Firestore 보안 규칙 설정

### 인증 기반 보안 규칙 (권장)

Firebase Console에서 다음과 같이 설정하세요:

1. **Firebase Console 접속**
   - https://console.firebase.google.com 접속
   - `remnant-new` 프로젝트 선택

2. **Firestore Database로 이동**
   - 왼쪽 메뉴에서 "Firestore Database" 클릭
   - 상단 탭에서 "규칙(Rules)" 클릭

3. **보안 규칙 수정**

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // member 컬렉션: 인증된 사용자만 접근 가능
       match /member/{memberId} {
         allow read, write: if request.auth != null;
       }
       
       // friends 컬렉션: 인증된 사용자만 접근 가능
       match /friends/{friendId} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

4. **게시 버튼 클릭**

## Firebase Authentication 설정

1. **Authentication 활성화**
   - Firebase Console > Authentication 메뉴
   - "시작하기" 클릭

2. **이메일/비밀번호 인증 활성화**
   - "Sign-in method" 탭
   - "이메일/비밀번호" 활성화

3. **사용자 추가**
   - "Users" 탭
   - "사용자 추가" 클릭
   - 이메일: `remnant@iyewon.org`
   - 비밀번호: 원하는 비밀번호 설정

## 로그인 정보

- 계정: `remnant@iyewon.org`
- 비밀번호: Firebase Console에서 설정한 비밀번호

## 주의사항

- 인증된 사용자만 데이터에 접근할 수 있습니다
- 로그인 후 비밀번호는 기기에 저장되어 자동 로그인됩니다
