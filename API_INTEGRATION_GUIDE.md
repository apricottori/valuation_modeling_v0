# 재무 데이터 API 통합 가이드

## 개요
이 문서는 DCF 가치평가 애플리케이션의 재무 데이터 API 통합 시스템에 대한 인수인계 문서입니다.

## 시스템 구조

### 1. 주요 컴포넌트

#### 1.1 UI 구성요소
- **티커 심볼 입력**: `id="tickerSymbol"` (readonly, 자동 입력)
- **데이터 소스 선택**: `id="dataSource"` (dropdown)
- **재무 데이터 로딩 버튼**: `id="loadFinancialData"`
- **결과 표시 영역**: `id="financialDataResult"`

#### 1.2 핵심 메서드
```javascript
// 메인 호출 체인
loadFinancialData() → callGeminiForTicker() → fetchFinancialDataFromAPI() → displayFinancialData3Years()
```

### 2. API 호출 프로세스

#### 2.1 1단계: 티커 조회 (Gemini API)
```javascript
async callGeminiForTicker(apiKey, companyName) {
    const prompt = `${companyName}을 주식시장에서 조회하려고 해
${companyName}의 주식 티커를 알려줄래? 
부연설명 없이 **티커 이름만 대답해줘**`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }]
        })
    });
}
```

**주요 특징:**
- **모델**: `gemini-1.5-flash` (다른 AI 기능과 동일)
- **프롬프트**: 간결하고 명확한 티커 요청
- **파싱**: 정규식으로 알파벳만 추출하여 대문자 변환
- **에러 처리**: 상세한 로깅 및 try-catch 블록

#### 2.2 2단계: 재무 데이터 API 호출
```javascript
async fetchFinancialDataFromAPI(ticker, dataSource) {
    switch (dataSource) {
        case 'alpha_vantage':
            return await this.fetchFromAlphaVantage(ticker, apiKey);
        case 'yahoo_finance':
            return await this.fetchFromYahooFinance(ticker);
        case 'financial_modeling_prep':
            return await this.fetchFromFinancialModelingPrep(ticker, apiKey);
    }
}
```

### 3. 지원하는 API 서비스

#### 3.1 Alpha Vantage API
```javascript
async fetchFromAlphaVantage(ticker, apiKey) {
    const response = await fetch(`https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`);
    const data = await response.json();
    
    // 에러 체크
    if (data['Error Message']) throw new Error(data['Error Message']);
    if (data['Note']) throw new Error('API 호출 한도 초과: ' + data['Note']);
    
    return this.transformAlphaVantageData(data);
}
```

**특징:**
- **무료 제한**: 분당 5회 호출 제한
- **데이터 구조**: `annualReports` 배열
- **필드 매핑**: `totalRevenue`, `costOfRevenue`, `grossProfit`, `operatingIncome`, `netIncome`

#### 3.2 Financial Modeling Prep API
```javascript
async fetchFromFinancialModelingPrep(ticker, apiKey) {
    const response = await fetch(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}?limit=3&apikey=${apiKey}`);
    const data = await response.json();
    
    return this.transformFinancialModelingPrepData(data);
}
```

**특징:**
- **데이터 구조**: 배열 형태의 연도별 데이터
- **필드 매핑**: `revenue`, `costOfRevenue`, `grossProfit`, `operatingIncome`, `netIncome`

#### 3.3 Yahoo Finance API (현재 미지원)
```javascript
async fetchFromYahooFinance(ticker) {
    // CORS 제한으로 인해 현재 재무제표 데이터 미지원
    throw new Error('Yahoo Finance는 현재 재무제표 데이터를 지원하지 않습니다.');
}
```

### 4. 데이터 변환 및 처리

#### 4.1 동적 연도 처리
```javascript
const currentYear = new Date().getFullYear();
const years = [currentYear, currentYear - 1, currentYear - 2];
```

**장점:**
- 자동으로 현재 연도 기준으로 데이터 표시
- 매년 자동 업데이트
- 하드코딩된 연도 제거

#### 4.2 데이터 구조 변환
```javascript
transformAlphaVantageData(data) {
    const incomeStatement = {};
    const balanceSheet = {};
    
    years.forEach((year, index) => {
        const annualData = data.annualReports?.[index];
        if (annualData) {
            incomeStatement[year] = {
                revenue: parseFloat(annualData.totalRevenue) || 0,
                cogs: parseFloat(annualData.costOfRevenue) || 0,
                grossProfit: parseFloat(annualData.grossProfit) || 0,
                operatingIncome: parseFloat(annualData.operatingIncome) || 0,
                netIncome: parseFloat(annualData.netIncome) || 0
            };
        }
    });
    
    return { incomeStatement, balanceSheet };
}
```

#### 4.3 단위 변환 시스템
```javascript
parseCurrencyToMillion(str) {
    let cleaned = str.trim().toUpperCase();
    
    if (cleaned.includes('T')) {
        // Trillion -> Million (1T = 1,000,000M)
        const value = parseFloat(cleaned.replace('T', ''));
        return value * 1000000;
    } else if (cleaned.includes('B')) {
        // Billion -> Million (1B = 1,000M)
        const value = parseFloat(cleaned.replace('B', ''));
        return value * 1000;
    } else if (cleaned.includes('M')) {
        // Million (이미 Million 단위)
        const value = parseFloat(cleaned.replace('M', ''));
        return value;
    }
}
```

### 5. 시뮬레이션 데이터 (Fallback)

#### 5.1 지원 티커
- **AAPL**: Apple Inc.
- **MSFT**: Microsoft Corporation
- **GOOGL**: Alphabet Inc.
- **TSLA**: Tesla, Inc.
- **AMZN**: Amazon.com, Inc.
- **NVDA**: NVIDIA Corporation

#### 5.2 데이터 구조
```javascript
const mockData = {
    'AAPL': {
        incomeStatement: {
            [year1]: { revenue: 394328, cogs: 223546, grossProfit: 170782, operatingIncome: 114301, netIncome: 96995 },
            [year2]: { revenue: 394328, cogs: 223546, grossProfit: 170782, operatingIncome: 114301, netIncome: 96995 },
            [year3]: { revenue: 365817, cogs: 212981, grossProfit: 152836, operatingIncome: 108949, netIncome: 94680 }
        },
        balanceSheet: {
            [year1]: { totalAssets: 352755, currentAssets: 143713, totalLiabilities: 287912, currentLiabilities: 133513, totalEquity: 64843 },
            // ... 추가 데이터
        }
    }
};
```

### 6. 에러 처리 및 로깅

#### 6.1 API 호출 에러
```javascript
try {
    const response = await fetch(url);
    if (!response.ok) {
        const errorText = await response.text();
        console.error('API 응답 오류:', response.status, errorText);
        throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
    }
} catch (error) {
    console.error('API 호출 상세 오류:', error);
    throw new Error(`API 호출 중 오류: ${error.message}`);
}
```

#### 6.2 사용자 피드백
- **로딩 상태**: 스피너 애니메이션
- **에러 메시지**: 명확한 에러 설명
- **성공 상태**: 데이터 테이블 표시

### 7. UI/UX 개선사항

#### 7.1 자동화된 워크플로우
1. 사용자가 "재무 데이터 로딩" 버튼 클릭
2. 자동으로 기업명에서 티커 조회
3. 선택된 데이터 소스로 재무 데이터 로딩
4. 결과를 테이블로 표시

#### 7.2 데이터 적용 기능
```javascript
applyFinancialData() {
    // 최신 연도 데이터를 메인 입력 필드에 적용
    const revenue = document.getElementById('revenue1').textContent;
    const costOfGoodsSold = document.getElementById('cogs1').textContent;
    const operatingIncome = document.getElementById('operatingIncome1').textContent;
    
    // 단위 변환 후 적용
    document.getElementById('revenue').value = this.formatNumber(this.parseCurrencyToMillion(revenue));
    document.getElementById('costOfGoodsSold').value = this.formatNumber(this.parseCurrencyToMillion(costOfGoodsSold));
    document.getElementById('operatingIncome').value = this.formatNumber(this.parseCurrencyToMillion(operatingIncome));
}
```

### 8. 향후 개선 방향

#### 8.1 API 확장
- **Yahoo Finance**: CORS 이슈 해결 후 재무제표 데이터 추가
- **Bloomberg API**: 고급 데이터 소스 추가
- **국내 API**: 한국 기업 데이터 지원

#### 8.2 데이터 품질 개선
- **실시간 데이터**: 실시간 가격 정보 추가
- **재무상태표**: 자산/부채 데이터 완전 지원
- **현금흐름표**: 현금흐름 분석 추가

#### 8.3 성능 최적화
- **캐싱**: API 응답 캐싱 시스템
- **배치 처리**: 여러 티커 동시 처리
- **로딩 최적화**: 점진적 데이터 로딩

### 9. 트러블슈팅 가이드

#### 9.1 일반적인 문제
1. **API 키 오류**: Google AI Studio에서 올바른 API 키 발급 확인
2. **CORS 에러**: 프록시 서버 또는 서버사이드 호출 필요
3. **데이터 형식 불일치**: API 응답 구조 변경 시 변환 로직 업데이트

#### 9.2 디버깅 방법
```javascript
// 콘솔에서 API 응답 확인
console.log('API 응답:', data);

// 네트워크 탭에서 실제 요청/응답 확인
// 브라우저 개발자 도구 → Network 탭
```

### 10. 보안 고려사항

#### 10.1 API 키 관리
- **클라이언트 사이드**: API 키가 노출될 수 있음
- **권장사항**: 서버사이드 프록시 구현
- **제한사항**: API 호출 한도 모니터링

#### 10.2 데이터 검증
- **입력 검증**: 티커 심볼 형식 검증
- **출력 검증**: API 응답 데이터 유효성 검사
- **에러 처리**: 적절한 에러 메시지 표시

---

**작성일**: 2025년 1월  
**작성자**: AI Assistant  
**버전**: 1.0 