// Firebase 설정 관리
class FirebaseConfig {
    constructor() {
        this.config = this.getFirebaseConfig();
        this.isInitialized = false;
        this.auth = null;
        this.db = null;
    }

    // 환경별 Firebase 설정 가져오기
    getFirebaseConfig() {
        // 실제 Firebase 설정값 (환경 변수 대신 직접 설정)
        return {
            apiKey: "AIzaSyDrCgfYA2l-Md5Rt80GrveeEBuoUkrU-I8",
            authDomain: "valuation-63e9e.firebaseapp.com",
            projectId: "valuation-63e9e",
            storageBucket: "valuation-63e9e.firebasestorage.app",
            messagingSenderId: "808223833573",
            appId: "1:808223833573:web:112705926963c93536830c",
            measurementId: "G-LWYL8E7DS9"
        };
    }

    // Firebase 초기화
    initializeFirebase() {
        if (this.isInitialized) {
            console.warn('Firebase is already initialized');
            return;
        }

        try {
            console.log('Firebase 초기화 시작...');
            console.log('Firebase 설정:', this.config);
            console.log('현재 도메인:', window.location.hostname);
            
            // Firebase 앱 초기화
            firebase.initializeApp(this.config);
            console.log('Firebase 앱 초기화 완료');
            
            // Firestore 및 Auth 인스턴스 생성
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.analytics = firebase.analytics();
            console.log('Firebase 서비스 초기화 완료');
            
            // Firestore 설정 (개발 환경에서 캐시 비활성화)
            if (window.location.hostname === 'localhost') {
                this.db.settings({
                    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
                });
                console.log('로컬 개발 환경 설정 적용');
            }
            
            this.isInitialized = true;
            console.log('Firebase 초기화 완료');
            
            // 인증 상태 변경 리스너
            this.setupAuthStateListener();
            
        } catch (error) {
            console.error('Firebase 초기화 실패:', error);
            throw error;
        }
    }

    // 인증 상태 변경 리스너 설정
    setupAuthStateListener() {
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('User is signed in:', user.email);
                this.onUserSignIn(user);
            } else {
                console.log('User is signed out');
                this.onUserSignOut();
            }
        });
    }

    // 사용자 로그인 시 처리
    onUserSignIn(user) {
        // 앱 컨테이너 표시, 인증 컨테이너 숨김
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('app-container').style.display = 'block';
        
        // 사용자별 데이터 로드
        this.loadUserData(user.uid);
        
        // 사용자 설정 로드 (API 키 포함)
        this.loadUserSettings(user.uid);
        
        // UI 업데이트 (로그인 상태 표시)
        this.updateUIForAuthenticatedUser(user);
    }

    // 사용자 로그아웃 시 처리
    onUserSignOut() {
        // 인증 컨테이너 표시, 앱 컨테이너 숨김
        document.getElementById('auth-container').style.display = 'flex';
        document.getElementById('app-container').style.display = 'none';
        
        // 로그인 폼을 기본으로 표시
        this.showLoginForm();
        
        // 로컬 데이터 초기화
        if (window.dataManager) {
            window.dataManager.clearData();
        }
        
        // UI 업데이트 (로그아웃 상태 표시)
        this.updateUIForUnauthenticatedUser();
    }

    // 사용자 데이터 로드
    async loadUserData(userId) {
        try {
            if (!this.db) {
                console.warn('Firestore not initialized');
                return null;
            }
            
            const doc = await this.db.collection('valuations').doc(userId).get();
            if (doc.exists) {
                const userData = doc.data();
                console.log('User data loaded from Firebase');
                return userData;
            } else {
                console.log('No user data found in Firebase');
                return null;
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            return null;
        }
    }

    // 사용자 데이터 저장
    async saveUserData(userId, data) {
        try {
            if (!this.db) {
                console.warn('Firestore not initialized');
                return false;
            }
            
            await this.db.collection('valuations').doc(userId).set(data);
            console.log('User data saved to Firebase');
            return true;
        } catch (error) {
            console.error('Error saving user data:', error);
            return false;
        }
    }

    // UI 업데이트 - 인증된 사용자
    updateUIForAuthenticatedUser(user) {
        // 헤더에 사용자 정보 표시
        const userInfoElement = document.createElement('div');
        userInfoElement.className = 'user-info';
        
        userInfoElement.innerHTML = `
            <span class="user-email">${user.email}</span>
            <button id="settingsBtn" class="btn-settings" title="설정">⚙️</button>
            <button id="signOutBtn" class="btn-signout">로그아웃</button>
        `;
        
        // 기존 사용자 정보 제거 후 새로 추가
        const existingUserInfo = document.querySelector('.user-info');
        if (existingUserInfo) {
            existingUserInfo.remove();
        }
        
        // login-container에 추가
        const loginContainer = document.querySelector('.login-container');
        if (loginContainer) {
            loginContainer.innerHTML = '';
            loginContainer.appendChild(userInfoElement);
        }
        
        // 설정 버튼 이벤트
        document.getElementById('settingsBtn').addEventListener('click', () => {
            this.showSettingsPage(user);
        });
        
        // 로그아웃 버튼 이벤트
        document.getElementById('signOutBtn').addEventListener('click', () => {
            this.auth.signOut();
        });
    }

    // UI 업데이트 - 비인증 사용자
    updateUIForUnauthenticatedUser() {
        // 사용자 정보 제거
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            userInfo.remove();
        }
    }

    // 인증 이벤트 리스너 설정
    setupAuthEventListeners() {
        // 로그인 버튼
        document.getElementById('login-btn').addEventListener('click', () => {
            this.handleLogin();
        });

        // 회원가입 버튼
        document.getElementById('signup-btn').addEventListener('click', () => {
            this.handleSignup();
        });

        // 비밀번호 재설정 버튼
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.handlePasswordReset();
        });

        // 폼 전환 링크들
        document.getElementById('show-signup-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showSignupForm();
        });

        document.getElementById('show-login-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        document.getElementById('forgot-password-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showResetForm();
        });

        document.getElementById('back-to-login-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });

        // Enter 키 이벤트
        document.getElementById('login-email').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        document.getElementById('login-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleLogin();
        });

        document.getElementById('signup-email').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSignup();
        });

        document.getElementById('signup-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSignup();
        });

        document.getElementById('signup-confirm-password').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSignup();
        });

        document.getElementById('reset-email').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handlePasswordReset();
        });
    }

    // 로그인 처리
    async handleLogin() {
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;
        const rememberMe = document.getElementById('login-remember').checked;

        // 입력 검증
        if (!email || !password) {
            this.showError('이메일과 비밀번호를 모두 입력해주세요.');
            return;
        }

        try {
            // 로그인 상태 유지 설정
            const persistence = rememberMe ? 
                firebase.auth.Auth.Persistence.LOCAL : 
                firebase.auth.Auth.Persistence.SESSION;
            
            await this.auth.setPersistence(persistence);
            
            // 로그인 시도
            await this.auth.signInWithEmailAndPassword(email, password);
            this.hideError();
            
        } catch (error) {
            this.showError(this.getErrorMessage(error.code));
        }
    }

    // 회원가입 처리
    async handleSignup() {
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        // 입력 검증
        if (!email || !password || !confirmPassword) {
            this.showError('모든 필드를 입력해주세요.');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (password.length < 6) {
            this.showError('비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }

        try {
            console.log('회원가입 시도:', { email, passwordLength: password.length });
            console.log('Firebase Auth 상태:', this.auth);
            console.log('Firebase 설정:', this.config);
            
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            console.log('회원가입 성공:', userCredential.user);
            
            this.hideError();
            this.showLoginForm();
            this.showError('회원가입이 완료되었습니다. 로그인해주세요.', 'success');
            
        } catch (error) {
            console.error('회원가입 오류 상세:', {
                code: error.code,
                message: error.message,
                email: error.email,
                credential: error.credential
            });
            this.showError(this.getErrorMessage(error.code));
        }
    }

    // 비밀번호 재설정 처리
    async handlePasswordReset() {
        const email = document.getElementById('reset-email').value.trim();

        if (!email) {
            this.showError('이메일을 입력해주세요.');
            return;
        }

        try {
            await this.auth.sendPasswordResetEmail(email);
            this.hideError();
            this.showLoginForm();
            this.showError('비밀번호 재설정 이메일을 발송했습니다. 이메일을 확인해주세요.', 'success');
            
        } catch (error) {
            this.showError(this.getErrorMessage(error.code));
        }
    }

    // 폼 표시 함수들
    showLoginForm() {
        document.getElementById('login-form').classList.add('active');
        document.getElementById('signup-form').classList.remove('active');
        document.getElementById('reset-form').classList.remove('active');
        this.hideError();
    }

    showSignupForm() {
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('signup-form').classList.add('active');
        document.getElementById('reset-form').classList.remove('active');
        this.hideError();
    }

    showResetForm() {
        document.getElementById('login-form').classList.remove('active');
        document.getElementById('signup-form').classList.remove('active');
        document.getElementById('reset-form').classList.add('active');
        this.hideError();
    }

    // 오류 메시지 표시
    showError(message, type = 'error') {
        const errorElement = document.getElementById('auth-error');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        
        if (type === 'success') {
            errorElement.style.background = '#d4edda';
            errorElement.style.color = '#155724';
            errorElement.style.border = '1px solid #c3e6cb';
        } else {
            errorElement.style.background = '#fee';
            errorElement.style.color = '#c33';
            errorElement.style.border = '1px solid #fcc';
        }
    }

    // 오류 메시지 숨김
    hideError() {
        document.getElementById('auth-error').style.display = 'none';
    }

    // Firebase 오류 코드를 한글 메시지로 변환
    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': '등록되지 않은 이메일입니다.',
            'auth/wrong-password': '비밀번호가 올바르지 않습니다.',
            'auth/invalid-email': '유효하지 않은 이메일 형식입니다.',
            'auth/weak-password': '비밀번호가 너무 약합니다. 최소 6자 이상 입력해주세요.',
            'auth/email-already-in-use': '이미 사용 중인 이메일입니다.',
            'auth/too-many-requests': '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.',
            'auth/network-request-failed': '네트워크 연결을 확인해주세요.',
            'auth/user-disabled': '비활성화된 계정입니다.',
            'auth/operation-not-allowed': '이 작업은 허용되지 않습니다.',
            'auth/invalid-credential': '유효하지 않은 인증 정보입니다.',
            'auth/account-exists-with-different-credential': '다른 방법으로 가입된 계정입니다.',
            'auth/requires-recent-login': '보안을 위해 다시 로그인해주세요.',
            'auth/credential-already-in-use': '이미 사용 중인 인증 정보입니다.',
            'auth/timeout': '요청 시간이 초과되었습니다.',
            'auth/cancelled-popup-request': '팝업 요청이 취소되었습니다.',
            'auth/popup-blocked': '팝업이 차단되었습니다. 팝업 차단을 해제해주세요.',
            'auth/popup-closed-by-user': '팝업이 사용자에 의해 닫혔습니다.',
            'auth/invalid-action-code': '유효하지 않은 작업 코드입니다.',
            'auth/expired-action-code': '만료된 작업 코드입니다.',
            'auth/invalid-verification-code': '유효하지 않은 인증 코드입니다.',
            'auth/invalid-verification-id': '유효하지 않은 인증 ID입니다.',
            'auth/missing-verification-code': '인증 코드가 누락되었습니다.',
            'auth/missing-verification-id': '인증 ID가 누락되었습니다.',
            'auth/quota-exceeded': '할당량을 초과했습니다.',
            'auth/retry-phone-auth': '전화 인증을 다시 시도해주세요.',
            'auth/invalid-phone-number': '유효하지 않은 전화번호입니다.',
            'auth/missing-phone-number': '전화번호가 누락되었습니다.',
            'auth/invalid-recaptcha-token': '유효하지 않은 reCAPTCHA 토큰입니다.',
            'auth/missing-recaptcha-token': 'reCAPTCHA 토큰이 누락되었습니다.',
            'auth/invalid-app-credential': '유효하지 않은 앱 인증 정보입니다.',
            'auth/missing-app-credential': '앱 인증 정보가 누락되었습니다.',
            'auth/session-expired': '세션이 만료되었습니다.',
            'auth/unauthorized-domain': '허용되지 않은 도메인입니다.',
            'auth/invalid-api-key': '유효하지 않은 API 키입니다.',
            'auth/invalid-user-token': '유효하지 않은 사용자 토큰입니다.',
            'auth/invalid-tenant-id': '유효하지 않은 테넌트 ID입니다.',
            'auth/unsupported-tenant-operation': '지원되지 않는 테넌트 작업입니다.',
            'auth/invalid-login-credentials': '유효하지 않은 로그인 정보입니다.',
            'auth/missing-client-type': '클라이언트 타입이 누락되었습니다.',
            'auth/missing-or-invalid-nonce': 'nonce가 누락되었거나 유효하지 않습니다.',
            'auth/app-deleted': '앱이 삭제되었습니다.',
            'auth/app-not-authorized': '앱이 승인되지 않았습니다.',
            'auth/argument-error': '인수 오류가 발생했습니다.',
            'auth/invalid-app-id': '유효하지 않은 앱 ID입니다.',
            'auth/invalid-argument': '유효하지 않은 인수입니다.',
            'auth/invalid-config': '유효하지 않은 설정입니다.',
            'auth/invalid-custom-token': '유효하지 않은 사용자 정의 토큰입니다.',
            'auth/invalid-disabled-field': '유효하지 않은 비활성화 필드입니다.',
            'auth/invalid-display-name': '유효하지 않은 표시 이름입니다.',
            'auth/invalid-email-verified': '유효하지 않은 이메일 인증 상태입니다.',
            'auth/invalid-hash-algorithm': '유효하지 않은 해시 알고리즘입니다.',
            'auth/invalid-hash-block-size': '유효하지 않은 해시 블록 크기입니다.',
            'auth/invalid-hash-derived-key-length': '유효하지 않은 해시 파생 키 길이입니다.',
            'auth/invalid-hash-key': '유효하지 않은 해시 키입니다.',
            'auth/invalid-hash-memory-cost': '유효하지 않은 해시 메모리 비용입니다.',
            'auth/invalid-hash-parallelization': '유효하지 않은 해시 병렬화입니다.',
            'auth/invalid-hash-rounds': '유효하지 않은 해시 라운드입니다.',
            'auth/invalid-hash-salt-separator': '유효하지 않은 해시 솔트 구분자입니다.',
            'auth/invalid-id-token': '유효하지 않은 ID 토큰입니다.',
            'auth/invalid-last-sign-in-time': '유효하지 않은 마지막 로그인 시간입니다.',
            'auth/invalid-page-token': '유효하지 않은 페이지 토큰입니다.',
            'auth/invalid-password': '유효하지 않은 비밀번호입니다.',
            'auth/invalid-password-hash': '유효하지 않은 비밀번호 해시입니다.',
            'auth/invalid-password-salt': '유효하지 않은 비밀번호 솔트입니다.',
            'auth/invalid-phone-number': '유효하지 않은 전화번호입니다.',
            'auth/invalid-photo-url': '유효하지 않은 사진 URL입니다.',
            'auth/invalid-provider-data': '유효하지 않은 제공자 데이터입니다.',
            'auth/invalid-provider-id': '유효하지 않은 제공자 ID입니다.',
            'auth/invalid-session-cookie-duration': '유효하지 않은 세션 쿠키 기간입니다.',
            'auth/invalid-uid': '유효하지 않은 UID입니다.',
            'auth/invalid-user-import': '유효하지 않은 사용자 가져오기입니다.',
            'auth/maximum-user-count-exceeded': '최대 사용자 수를 초과했습니다.',
            'auth/missing-hash-algorithm': '해시 알고리즘이 누락되었습니다.',
            'auth/missing-uid': 'UID가 누락되었습니다.',
            'auth/reserved-claims': '예약된 클레임입니다.',
            'auth/session-cookie-expired': '세션 쿠키가 만료되었습니다.',
            'auth/session-cookie-revoked': '세션 쿠키가 취소되었습니다.',
            'auth/uid-already-exists': 'UID가 이미 존재합니다.',
            'auth/email-already-exists': '이메일이 이미 존재합니다.',
            'auth/phone-number-already-exists': '전화번호가 이미 존재합니다.',
            'auth/project-not-found': '프로젝트를 찾을 수 없습니다.',
            'auth/insufficient-permission': '권한이 부족합니다.',
            'auth/internal-error': '내부 오류가 발생했습니다.',
            'auth/invalid-credential': '유효하지 않은 인증 정보입니다.',
            'auth/invalid-email': '유효하지 않은 이메일입니다.',
            'auth/operation-not-allowed': '허용되지 않은 작업입니다.',
            'auth/user-disabled': '사용자가 비활성화되었습니다.',
            'auth/user-not-found': '사용자를 찾을 수 없습니다.',
            'auth/weak-password': '비밀번호가 너무 약합니다.',
            'auth/wrong-password': '잘못된 비밀번호입니다.',
            'auth/too-many-requests': '너무 많은 요청이 있었습니다.',
            'auth/network-request-failed': '네트워크 요청에 실패했습니다.',
            'auth/requires-recent-login': '최근 로그인이 필요합니다.',
            'auth/credential-already-in-use': '인증 정보가 이미 사용 중입니다.',
            'auth/timeout': '요청 시간이 초과되었습니다.',
            'auth/cancelled-popup-request': '팝업 요청이 취소되었습니다.',
            'auth/popup-blocked': '팝업이 차단되었습니다.',
            'auth/popup-closed-by-user': '팝업이 사용자에 의해 닫혔습니다.',
            'auth/invalid-action-code': '유효하지 않은 작업 코드입니다.',
            'auth/expired-action-code': '만료된 작업 코드입니다.',
            'auth/invalid-verification-code': '유효하지 않은 인증 코드입니다.',
            'auth/invalid-verification-id': '유효하지 않은 인증 ID입니다.',
            'auth/missing-verification-code': '인증 코드가 누락되었습니다.',
            'auth/missing-verification-id': '인증 ID가 누락되었습니다.',
            'auth/quota-exceeded': '할당량을 초과했습니다.',
            'auth/retry-phone-auth': '전화 인증을 다시 시도해주세요.',
            'auth/missing-phone-number': '전화번호가 누락되었습니다.',
            'auth/invalid-recaptcha-token': '유효하지 않은 reCAPTCHA 토큰입니다.',
            'auth/missing-recaptcha-token': 'reCAPTCHA 토큰이 누락되었습니다.',
            'auth/invalid-app-credential': '유효하지 않은 앱 인증 정보입니다.',
            'auth/missing-app-credential': '앱 인증 정보가 누락되었습니다.',
            'auth/session-expired': '세션이 만료되었습니다.',
            'auth/unauthorized-domain': '허용되지 않은 도메인입니다.',
            'auth/invalid-api-key': '유효하지 않은 API 키입니다.',
            'auth/invalid-user-token': '유효하지 않은 사용자 토큰입니다.',
            'auth/invalid-tenant-id': '유효하지 않은 테넌트 ID입니다.',
            'auth/unsupported-tenant-operation': '지원되지 않는 테넌트 작업입니다.',
            'auth/invalid-login-credentials': '유효하지 않은 로그인 정보입니다.',
            'auth/missing-client-type': '클라이언트 타입이 누락되었습니다.',
            'auth/missing-or-invalid-nonce': 'nonce가 누락되었거나 유효하지 않습니다.',
            'auth/app-deleted': '앱이 삭제되었습니다.',
            'auth/app-not-authorized': '앱이 승인되지 않았습니다.',
            'auth/argument-error': '인수 오류가 발생했습니다.',
            'auth/invalid-app-id': '유효하지 않은 앱 ID입니다.',
            'auth/invalid-argument': '유효하지 않은 인수입니다.',
            'auth/invalid-config': '유효하지 않은 설정입니다.',
            'auth/invalid-custom-token': '유효하지 않은 사용자 정의 토큰입니다.',
            'auth/invalid-disabled-field': '유효하지 않은 비활성화 필드입니다.',
            'auth/invalid-display-name': '유효하지 않은 표시 이름입니다.',
            'auth/invalid-email-verified': '유효하지 않은 이메일 인증 상태입니다.',
            'auth/invalid-hash-algorithm': '유효하지 않은 해시 알고리즘입니다.',
            'auth/invalid-hash-block-size': '유효하지 않은 해시 블록 크기입니다.',
            'auth/invalid-hash-derived-key-length': '유효하지 않은 해시 파생 키 길이입니다.',
            'auth/invalid-hash-key': '유효하지 않은 해시 키입니다.',
            'auth/invalid-hash-memory-cost': '유효하지 않은 해시 메모리 비용입니다.',
            'auth/invalid-hash-parallelization': '유효하지 않은 해시 병렬화입니다.',
            'auth/invalid-hash-rounds': '유효하지 않은 해시 라운드입니다.',
            'auth/invalid-hash-salt-separator': '유효하지 않은 해시 솔트 구분자입니다.',
            'auth/invalid-id-token': '유효하지 않은 ID 토큰입니다.',
            'auth/invalid-last-sign-in-time': '유효하지 않은 마지막 로그인 시간입니다.',
            'auth/invalid-page-token': '유효하지 않은 페이지 토큰입니다.',
            'auth/invalid-password': '유효하지 않은 비밀번호입니다.',
            'auth/invalid-password-hash': '유효하지 않은 비밀번호 해시입니다.',
            'auth/invalid-password-salt': '유효하지 않은 비밀번호 솔트입니다.',
            'auth/invalid-photo-url': '유효하지 않은 사진 URL입니다.',
            'auth/invalid-provider-data': '유효하지 않은 제공자 데이터입니다.',
            'auth/invalid-provider-id': '유효하지 않은 제공자 ID입니다.',
            'auth/invalid-session-cookie-duration': '유효하지 않은 세션 쿠키 기간입니다.',
            'auth/invalid-uid': '유효하지 않은 UID입니다.',
            'auth/invalid-user-import': '유효하지 않은 사용자 가져오기입니다.',
            'auth/maximum-user-count-exceeded': '최대 사용자 수를 초과했습니다.',
            'auth/missing-hash-algorithm': '해시 알고리즘이 누락되었습니다.',
            'auth/missing-uid': 'UID가 누락되었습니다.',
            'auth/reserved-claims': '예약된 클레임입니다.',
            'auth/session-cookie-expired': '세션 쿠키가 만료되었습니다.',
            'auth/session-cookie-revoked': '세션 쿠키가 취소되었습니다.',
            'auth/uid-already-exists': 'UID가 이미 존재합니다.',
            'auth/email-already-exists': '이메일이 이미 존재합니다.',
            'auth/phone-number-already-exists': '전화번호가 이미 존재합니다.',
            'auth/project-not-found': '프로젝트를 찾을 수 없습니다.',
            'auth/insufficient-permission': '권한이 부족합니다.',
            'auth/internal-error': '내부 오류가 발생했습니다.'
        };

        return errorMessages[errorCode] || '알 수 없는 오류가 발생했습니다.';
    }

    // 설정 페이지 표시
    showSettingsPage(user) {
        // 모든 페이지 숨기기
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        
        // 설정 페이지 표시
        document.getElementById('page6').classList.add('active');
        
        // 네비게이션 스텝 비활성화
        document.querySelectorAll('.step').forEach(step => {
            step.classList.remove('active');
        });
        
        // 사용자 정보 설정
        document.getElementById('settings-email').textContent = user.email;
        document.getElementById('settings-created').textContent = user.metadata?.creationTime ? 
            new Date(user.metadata.creationTime).toLocaleDateString('ko-KR') : '알 수 없음';
        
        // 설정 페이지 이벤트 리스너 설정
        this.setupSettingsEventListeners(user);
        
        // 저장된 API 키 로드
        this.loadUserSettings(user.uid);
    }
    
    // 설정 페이지 이벤트 리스너 설정
    setupSettingsEventListeners(user) {
        // 메인으로 돌아가기 버튼
        document.getElementById('back-to-main').addEventListener('click', () => {
            this.hideSettingsPage();
        });
        
        // 데이터 내보내기 버튼
        document.getElementById('export-data-settings').addEventListener('click', () => {
            if (window.dataManager) {
                window.dataManager.exportData();
            }
        });
        
        // 데이터 가져오기 버튼
        document.getElementById('import-data-settings').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });
        
        // API 키 저장 버튼
        document.getElementById('save-api-key').addEventListener('click', () => {
            this.saveApiKey(user.uid);
        });
        
        // API 키 입력 필드에서 Enter 키 이벤트
        document.getElementById('gemini-api-key').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.saveApiKey(user.uid);
            }
        });
    }
    
    // 설정 페이지 숨기기
    hideSettingsPage() {
        // 설정 페이지 숨기기
        document.getElementById('page6').classList.remove('active');
        
        // 메인 페이지 표시
        document.getElementById('page1').classList.add('active');
        
        // 네비게이션 스텝 활성화
        document.querySelector('.step[data-step="1"]').classList.add('active');
    }
    
    // API 키 저장
    async saveApiKey(userId) {
        const apiKey = document.getElementById('gemini-api-key').value.trim();
        
        if (!apiKey) {
            this.showSettingsMessage('API 키를 입력해주세요.', 'error');
            return;
        }
        
        try {
            // Firebase에 사용자 설정 저장
            await this.db.collection('userSettings').doc(userId).set({
                geminiApiKey: apiKey,
                updatedAt: new Date()
            }, { merge: true });
            
            // API 키 상태 업데이트
            document.getElementById('api-key-status').textContent = '설정됨';
            document.getElementById('api-key-status').style.color = '#27ae60';
            
            // 메인 페이지의 API 키 필드에도 업데이트
            const mainApiKeyField = document.getElementById('apiKey');
            if (mainApiKeyField) {
                mainApiKeyField.value = apiKey;
            }
            
            this.showSettingsMessage('API 키가 성공적으로 저장되었습니다.', 'success');
            
        } catch (error) {
            console.error('API 키 저장 오류:', error);
            this.showSettingsMessage('API 키 저장에 실패했습니다.', 'error');
        }
    }
    
    // 사용자 설정 로드
    async loadUserSettings(userId) {
        try {
            const doc = await this.db.collection('userSettings').doc(userId).get();
            
            if (doc.exists) {
                const settings = doc.data();
                
                // API 키 설정
                if (settings.geminiApiKey) {
                    document.getElementById('gemini-api-key').value = settings.geminiApiKey;
                    document.getElementById('api-key-status').textContent = '설정됨';
                    document.getElementById('api-key-status').style.color = '#27ae60';
                    
                    // 메인 페이지의 API 키 필드에도 설정
                    const mainApiKeyField = document.getElementById('apiKey');
                    if (mainApiKeyField) {
                        mainApiKeyField.value = settings.geminiApiKey;
                    }
                } else {
                    document.getElementById('api-key-status').textContent = '미설정';
                    document.getElementById('api-key-status').style.color = '#e74c3c';
                }
            } else {
                document.getElementById('api-key-status').textContent = '미설정';
                document.getElementById('api-key-status').style.color = '#e74c3c';
            }
            
        } catch (error) {
            console.error('사용자 설정 로드 오류:', error);
            document.getElementById('api-key-status').textContent = '로드 실패';
            document.getElementById('api-key-status').style.color = '#e74c3c';
        }
    }
    
    // 설정 페이지 메시지 표시
    showSettingsMessage(message, type = 'info') {
        // 기존 메시지 제거
        const existingMessage = document.querySelector('.settings-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // 새 메시지 생성
        const messageElement = document.createElement('div');
        messageElement.className = `settings-message ${type}`;
        messageElement.textContent = message;
        
        // 설정 컨테이너에 추가
        const settingsContainer = document.querySelector('.settings-container');
        settingsContainer.insertBefore(messageElement, settingsContainer.firstChild);
        
        // 3초 후 자동 제거
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 3000);
    }

    // 데이터 자동 저장 설정
    setupAutoSave() {
        console.log('Auto-save setup completed');
    }
}

// 전역 Firebase 설정 인스턴스
window.firebaseConfig = new FirebaseConfig(); 