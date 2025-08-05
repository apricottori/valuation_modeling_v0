# Firebase 설정 가이드

## 1. Firebase 프로젝트 생성

### 1.1 Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 만들기" 클릭

### 1.2 프로젝트 설정
1. **프로젝트 이름**: `valuation-63e9e` (또는 원하는 이름)
2. **Google Analytics**: 선택사항 (추천)
3. **프로젝트 생성** 클릭

## 2. 웹 앱 추가

### 2.1 웹 앱 등록
1. 프로젝트 대시보드에서 웹 아이콘(</>) 클릭
2. **앱 닉네임**: `Valuation Assistant`
3. **Firebase Hosting 설정**: 선택사항
4. **앱 등록** 클릭

### 2.2 설정 정보 복사
등록 후 제공되는 설정 정보를 복사:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDrCgfYA2l-Md5Rt80GrveeEBuoUkrU-I8",
  authDomain: "valuation-63e9e.firebaseapp.com",
  projectId: "valuation-63e9e",
  storageBucket: "valuation-63e9e.firebasestorage.app",
  messagingSenderId: "808223833573",
  appId: "1:808223833573:web:112705926963c93536830c",
  measurementId: "G-LWYL8E7DS9"
};
```

## 3. Authentication 설정

### 3.1 Authentication 활성화
1. 왼쪽 메뉴에서 **Authentication** 클릭
2. **시작하기** 클릭

### 3.2 로그인 방법 설정
1. **로그인 방법** 탭 클릭
2. **이메일/비밀번호** 활성화
3. **익명 로그인** 활성화 (중요!)
4. **저장** 클릭

## 4. Firestore Database 설정

### 4.1 Firestore 생성
1. 왼쪽 메뉴에서 **Firestore Database** 클릭
2. **데이터베이스 만들기** 클릭
3. **테스트 모드에서 시작** 선택 (개발용)
4. **위치 선택**: `asia-northeast3 (서울)` 추천
5. **완료** 클릭

### 4.2 보안 규칙 설정
1. **규칙** 탭 클릭
2. 다음 규칙으로 교체:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자 데이터 접근 규칙
    match /users/{userId} {
      // 익명 사용자와 인증된 사용자 모두 접근 가능
      allow read, write: if request.auth != null;
    }
    
    // 기본 규칙 (개발 환경용)
    match /{document=**} {
      // 개발 환경에서는 모든 접근 허용 (프로덕션에서는 제거)
      allow read, write: if true;
    }
  }
}
```

3. **게시** 클릭

## 5. 환경 변수 설정

### 5.1 .env 파일 생성
프로젝트 루트에 `.env` 파일 생성:

```env
# Firebase 설정
FIREBASE_API_KEY=AIzaSyDrCgfYA2l-Md5Rt80GrveeEBuoUkrU-I8
FIREBASE_AUTH_DOMAIN=valuation-63e9e.firebaseapp.com
FIREBASE_PROJECT_ID=valuation-63e9e
FIREBASE_STORAGE_BUCKET=valuation-63e9e.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=808223833573
FIREBASE_APP_ID=1:808223833573:web:112705926963c93536830c
FIREBASE_MEASUREMENT_ID=G-LWYL8E7DS9

# Google AI Studio API 키
GOOGLE_AI_API_KEY=your-google-ai-api-key

# Alpha Vantage API 키 (선택사항)
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-api-key

# Financial Modeling Prep API 키 (선택사항)
FMP_API_KEY=your-fmp-api-key
```

## 6. 배포 설정

### 6.1 Firebase Hosting (선택사항)
1. **Hosting** 메뉴 클릭
2. **시작하기** 클릭
3. **빌드 명령어**: `npm run build` (또는 빈 값)
4. **공개 디렉토리**: `.` (현재 디렉토리)
5. **배포** 클릭

### 6.2 로컬 개발 서버
```bash
# Python 3
python -m http.server 8000

# Node.js
npx serve .

# 또는 VS Code Live Server 확장 사용
```

## 7. 문제 해결

### 7.1 권한 오류 해결
- **오류**: `Missing or insufficient permissions`
- **해결**: Firestore 보안 규칙 확인 및 수정

### 7.2 인증 오류 해결
- **오류**: `Firebase: Error (auth/operation-not-allowed)`
- **해결**: Authentication에서 익명 로그인 활성화

### 7.3 초기화 오류 해결
- **오류**: `Firebase App named '[DEFAULT]' already exists`
- **해결**: Firebase 초기화 코드 중복 제거

## 8. 보안 고려사항

### 8.1 프로덕션 환경
- Firestore 보안 규칙 강화
- API 키 환경 변수로 관리
- HTTPS 필수

### 8.2 데이터 백업
- 정기적인 데이터 백업
- 사용자 데이터 암호화 고려

## 9. 모니터링

### 9.1 Firebase Analytics
- 사용자 행동 추적
- 성능 모니터링
- 오류 추적

### 9.2 Firestore 사용량
- 읽기/쓰기 횟수 모니터링
- 비용 최적화

---

**참고**: 이 가이드는 개발 환경을 위한 것입니다. 프로덕션 배포 시에는 보안 설정을 강화해야 합니다. 