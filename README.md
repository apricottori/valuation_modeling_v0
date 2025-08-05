# Valuation Assistant - 기업가치평가 시뮬레이션 도구

## 📋 프로젝트 개요

Valuation Assistant는 기업의 재무 데이터를 기반으로 확률론적 시나리오 모델링을 통해 기업가치를 평가하는 웹 기반 도구입니다. Monte Carlo 시뮬레이션을 활용하여 다양한 시나리오 하에서의 기업가치 분포를 분석하고, 투자 의사결정을 지원합니다.

## 🏗️ 시스템 아키텍처

### 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **차트 라이브러리**: Chart.js
- **외부 API**: Google AI Studio (Gemini), Alpha Vantage, Financial Modeling Prep
- **데이터 저장**: localStorage

### 파일 구조
```
valuation_modeling_v0/
├── index.html              # 메인 UI 구조
├── css/
│   └── style.css          # 스타일링
├── js/
│   ├── app.js             # 메인 애플리케이션 로직
│   ├── dataManager.js     # 데이터 관리 모듈
│   └── simulation.js      # 시뮬레이션 엔진
├── README.md              # 프로젝트 문서
└── API_INTEGRATION_GUIDE.md # API 통합 가이드
```

## 🎯 주요 기능

### 1. 재무 구조 분석 (Page 1)
- **기업 정보 입력**: 기업명, 할인율, 세율, 예측기간 등
- **AI 기업 분석**: Google AI Studio API를 활용한 기업 정보 자동 분석
- **재무 데이터 자동 로딩**: Alpha Vantage, Yahoo Finance, Financial Modeling Prep API 연동
- **손익계산서 입력**: 매출, 매출원가, 영업이익 등
- **사업부문 설정**: 다중 사업부문별 매출 분할
- **비용 구조 분석**: 변동비/고정비 비율 설정

### 2. 확률론적 시나리오 모델링 (Page 2)
- **사업부문별 시나리오 설정**: 각 사업부문에 대한 다중 시나리오 정의
- **성장 모델 지원**:
  - CAGR (복합연평균성장률)
  - Growth (영구성장률 수렴)
  - Logistic (로지스틱 성장)
- **확률 분포 설정**: 각 시나리오별 발생 확률 정의
- **AI Review**: 시나리오 설정에 대한 AI 기반 검토

### 3. 모델 시각화 (Page 3)
- **시나리오 선택**: 각 사업부문별 시나리오 조합 선택
- **연도별 차트**: 매출, 비용, 영업이익 추이 시각화
- **재무 요약 테이블**: 연도별 핵심 지표 요약

### 4. 시뮬레이션 및 가치평가 (Page 4)
- **Monte Carlo 시뮬레이션**: 1,000-10,000회 반복 시뮬레이션
- **가치 분포 분석**: 기업가치의 확률 분포 시각화
- **통계 지표**: 평균, 중간값, 표준편차, 분위수 등

### 5. 투자 분석 (Page 5)
- **Upside/Downside 분석**: 현재가치 대비 상승/하락 확률
- **투자 지표**: 기대 수익률, 손익비, 샤프 비율
- **리스크 분석**: 투자 위험도 평가

## 🔧 핵심 클래스 및 모듈

### ValueWebApp (app.js)
메인 애플리케이션 클래스로 전체 UI와 비즈니스 로직을 관리합니다.

**주요 메서드:**
- `initializeApp()`: 애플리케이션 초기화
- `setupEventListeners()`: 이벤트 리스너 설정
- `navigateToPage(pageNumber)`: 페이지 네비게이션
- `formatNumber(num)`: 숫자 포맷팅
- `formatCurrency(num)`: 통화 포맷팅

### DataManager (dataManager.js)
데이터 저장, 로드, 검증을 담당하는 모듈입니다.

**주요 메서드:**
- `saveData(data)`: 데이터 저장
- `getData()`: 데이터 로드
- `exportData()`: 데이터 내보내기
- `importData(data)`: 데이터 가져오기
- `validateData(data)`: 데이터 유효성 검사

### SimulationEngine (simulation.js)
Monte Carlo 시뮬레이션을 실행하는 엔진입니다.

**주요 메서드:**
- `runSimulation(iterationCount, progressCallback)`: 메인 시뮬레이션 실행
- `runSingleSimulation(data)`: 단일 시뮬레이션 실행
- `forecastRevenue()`: 매출 예측
- `forecastCosts()`: 비용 예측
- `calculateFCF()`: 자유현금흐름 계산
- `calculateEnterpriseValue()`: 기업가치 계산

## 📊 데이터 구조

### 재무 구조 (Financial Structure)
```javascript
{
  companyInfo: {
    name: string,           // 기업명
    discountRate: number,   // 할인율 (%)
    taxRate: number,        // 세율 (%)
    forecastPeriod: number, // 예측기간 (년)
    terminalGrowthRate: number, // 영구성장률 (%)
    marketValue: number,    // 현재 기업가치
    apiKey: string          // API 키
  },
  incomeStatement: {
    revenue: number,        // 매출
    costOfGoodsSold: number, // 매출원가
    grossProfit: number,    // 매출총이익
    operatingIncome: number // 영업이익
  },
  businessSegments: [       // 사업부문 배열
    {
      name: string,         // 사업부문명
      revenue: number       // 매출액
    }
  ],
  costStructure: {          // 비용 구조
    cogs: { amount: number, variableRatio: number, fixedRatio: number },
    depreciation: { amount: number, variableRatio: number, fixedRatio: number },
    labor: { amount: number, variableRatio: number, fixedRatio: number },
    rd: { amount: number, variableRatio: number, fixedRatio: number },
    advertising: { amount: number, variableRatio: number, fixedRatio: number },
    other: { amount: number, variableRatio: number, fixedRatio: number }
  }
}
```

### 시나리오 모델 (Scenario Model)
```javascript
{
  segmentScenarios: {       // 사업부문별 시나리오
    [segmentName]: [
      {
        name: string,       // 시나리오명
        probability: number, // 발생 확률 (%)
        growthModel: string, // 성장 모델 (cagr/growth/logistic)
        meanGrowthRate: number, // 평균 성장률 (%)
        stdDevGrowthRate: number, // 성장률 표준편차 (%)
        tam: number,        // TAM (최대 시장 잠재력)
        inflectionPoint: number, // 변곡점 (년)
        note: string        // 메모
      }
    ]
  },
  fixedCostGrowth: {        // 고정비 성장률
    cogs: { mean: number, stdDev: number },
    depreciation: { mean: number, stdDev: number },
    labor: { mean: number, stdDev: number },
    rd: { mean: number, stdDev: number },
    advertising: { mean: number, stdDev: number },
    other: { mean: number, stdDev: number }
  }
}
```

## 🚀 사용 방법

### 1. 초기 설정
1. `index.html` 파일을 웹 브라우저에서 열기
2. Google AI Studio에서 API 키 발급 (https://aistudio.google.com/app/apikey)
3. Page 1에서 기업 정보 입력

### 2. 재무 데이터 입력
1. **수동 입력**: 손익계산서, 사업부문, 비용 구조 직접 입력
2. **자동 로딩**: 기업명 입력 후 "재무 데이터 로딩" 버튼 클릭
3. **AI 분석**: "기업 분석 요청" 버튼으로 AI 기반 분석 실행

### 3. 시나리오 설정
1. Page 2로 이동
2. 각 사업부문별로 시나리오 추가
3. 성장 모델 선택 및 매개변수 설정
4. 발생 확률 설정 (총합 100%가 되도록)

### 4. 시뮬레이션 실행
1. Page 4로 이동
2. 시뮬레이션 횟수 설정 (1,000-10,000회)
3. "시뮬레이션 시작" 버튼 클릭
4. 결과 분석 및 차트 확인

### 5. 투자 분석
1. Page 5에서 현재 기업가치 입력
2. Upside/Downside 분석 결과 확인
3. 투자 지표 (기대 수익률, 손익비, 샤프 비율) 검토

## 🔌 API 통합

### Google AI Studio (Gemini)
- **용도**: 기업 정보 분석, 티커 조회, 시나리오 검토
- **설정**: API 키 입력 필요
- **엔드포인트**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`

### Alpha Vantage
- **용도**: 재무제표 데이터 (손익계산서, 재무상태표, 현금흐름표)
- **설정**: 기본 API 키 사용 (무료 티어)
- **엔드포인트**: `https://www.alphavantage.co/query`

### Financial Modeling Prep
- **용도**: 재무제표 데이터 (고급 기능)
- **설정**: 별도 API 키 필요 (유료)
- **엔드포인트**: `https://financialmodelingprep.com/api/v3/`

## 📈 성장 모델 설명

### 1. CAGR (복합연평균성장률)
- **공식**: `Revenue(t) = Revenue(0) × (1 + growth_rate)^t`
- **특징**: 일정한 성장률 유지
- **적용**: 안정적인 성장 기업

### 2. Growth (영구성장률 수렴)
- **공식**: `Effective Growth Rate = Current Growth × (1 - convergence) + Terminal Growth × convergence`
- **수렴 방식**: `convergence = 1 - e^(-0.15 × year)` (지수적 수렴)
- **특징**: 초기 고성장 유지 후 점진적으로 영구성장률로 수렴
- **적용**: 성장 단계 기업, 시장 성숙화 과정
- **장점**: 현실적인 성장 패턴, 복리 효과 정확히 반영

### 3. Logistic (로지스틱 성장)
- **공식**: `N(t) = TAM / (1 + e^(-k(t-t0)))`
- **특징**: S자 곡선 형태의 성장
- **적용**: 시장 포화가 예상되는 기업

## 🎨 UI/UX 특징

### 반응형 디자인
- 모바일, 태블릿, 데스크톱 지원
- 그리드 시스템을 활용한 유연한 레이아웃
- 터치 친화적 인터페이스

### 시각적 피드백
- 실시간 데이터 검증
- 진행률 표시
- 애니메이션 효과
- 색상 코딩 (성공/경고/오류)

### 사용자 편의성
- 자동 저장 기능
- 데이터 내보내기/가져오기
- 단계별 네비게이션
- 도움말 및 가이드

## 🔒 데이터 보안

### 로컬 저장
- 모든 데이터는 브라우저 localStorage에 저장
- 서버 전송 없음
- 개인정보 보호

### API 키 관리
- API 키는 로컬에만 저장
- 암호화된 입력 필드 사용
- 자동 삭제 기능

## 🛠️ 개발 및 확장

### 코드 구조
- 모듈화된 클래스 기반 설계
- 이벤트 기반 아키텍처
- 확장 가능한 구조

### 추가 가능한 기능
- 더 많은 성장 모델
- 추가 재무 지표
- 포트폴리오 분석
- 실시간 데이터 업데이트
- 클라우드 저장소 연동

## 📝 라이선스

이 프로젝트는 교육 및 연구 목적으로 개발되었습니다.

## 🤝 기여

버그 리포트, 기능 제안, 코드 기여를 환영합니다.

---

**개발자**: AI Assistant  
**버전**: v0.1.0  
**최종 업데이트**: 2024년 