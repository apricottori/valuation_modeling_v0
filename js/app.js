// Firebase 인증 상태 리스너 설정 (기존 코드 - 호환성을 위해 유지)
function setupFirebaseAuthListener() {
    if (window.firebaseConfig && window.firebaseConfig.auth) {
        window.firebaseConfig.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log('로그인된 사용자 UID:', user.uid);
                
                // 사용자별 데이터 로드
                if (window.valueWebApp) {
                    window.valueWebApp.loadData();
                }
            } else {
                console.log('사용자가 로그아웃됨');
                
                // 로컬 데이터 초기화
                if (window.dataManager) {
                    window.dataManager.clearData();
                }
            }
        });
    }
}

// 메인 애플리케이션
class ValueWebApp {
    constructor() {
        this.currentPage = 1;
        this.charts = {};
        this.initializeApp();
    }

    // 숫자 포맷팅 유틸리티 메서드들
    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        
        // 숫자를 문자열로 변환
        const numStr = num.toString();
        
        // 소수점이 있는지 확인
        const parts = numStr.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1] || '';
        
        // 정수 부분에 콤마 추가
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        
        // 소수점이 있으면 소수점 부분도 포함하여 반환
        return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    }

    formatCurrency(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        
        // Million 기준으로 단위 변환 (입력값이 이미 Million 단위)
        if (num >= 1e6) {
            return (num / 1e6).toFixed(2) + 'T';  // Million 기준으로 Trillion
        } else if (num >= 1e3) {
            return (num / 1e3).toFixed(2) + 'B';  // Million 기준으로 Billion
        } else {
            return this.formatNumber(Math.round(num)) + 'M';  // Million
        }
    }

    parseFormattedNumber(str) {
        if (!str || typeof str !== 'string') return 0;
        
        // 콤마 제거
        let cleaned = str.replace(/,/g, '');
        
        // 공백 제거
        cleaned = cleaned.trim();
        
        // 숫자가 아닌 문자 제거 (소수점과 마이너스 기호는 유지)
        cleaned = cleaned.replace(/[^\d.-]/g, '');
        
        // 빈 문자열이면 0 반환
        if (cleaned === '' || cleaned === '-') return 0;
        
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
    }

    // 단위 변환 함수 (B, T, M 단위를 Million 단위로 변환)
    parseCurrencyToMillion(str) {
        if (!str || typeof str !== 'string') return 0;
        
        // 공백 제거 및 대문자 변환
        let cleaned = str.trim().toUpperCase();
        
        // 단위별 변환
        if (cleaned.includes('T')) {
            // Trillion -> Million (1T = 1,000,000M)
            const value = parseFloat(cleaned.replace('T', ''));
            return isNaN(value) ? 0 : value * 1000000;
        } else if (cleaned.includes('B')) {
            // Billion -> Million (1B = 1,000M)
            const value = parseFloat(cleaned.replace('B', ''));
            return isNaN(value) ? 0 : value * 1000;
        } else if (cleaned.includes('M')) {
            // Million (이미 Million 단위)
            const value = parseFloat(cleaned.replace('M', ''));
            return isNaN(value) ? 0 : value;
        } else {
            // 단위가 없는 경우 숫자만 파싱
            const value = parseFloat(cleaned);
            return isNaN(value) ? 0 : value;
        }
    }

    // 입력 필드에 숫자 포맷팅 적용
    setupNumberFormatting() {
        // 숫자 입력 필드들에 포맷팅 적용 (type="text"인 필드들만)
        const numberInputs = document.querySelectorAll('input[type="text"]:not([readonly])');
        numberInputs.forEach(input => {
            // 숫자 입력이 예상되는 필드들만 선택
            if (input.id.includes('revenue') || 
                input.id.includes('amount') || 
                input.id.includes('cost') || 
                input.id.includes('income') || 
                input.id.includes('profit') ||
                input.id.includes('marketValue') ||
                input.classList.contains('segment-revenue')) {
                
                input.addEventListener('blur', (e) => {
                    const value = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                    e.target.value = this.formatNumber(value);
                });
                
                input.addEventListener('focus', (e) => {
                    const value = this.parseFormattedNumber(e.target.value);
                    e.target.value = value;
                });
            }
        });

        // 동적으로 생성되는 사업부문 revenue 필드들에도 포맷팅 적용
        this.setupDynamicNumberFormatting();
    }

    // 동적으로 생성되는 필드들에 포맷팅 적용
    setupDynamicNumberFormatting() {
        // MutationObserver를 사용하여 동적으로 추가되는 요소들 감지
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 새로 추가된 사업부문 revenue 필드들에 포맷팅 적용
                        const revenueInputs = node.querySelectorAll ? 
                            node.querySelectorAll('.segment-revenue') : [];
                        
                        revenueInputs.forEach(input => {
                            if (!input.hasAttribute('data-formatted')) {
                                input.setAttribute('data-formatted', 'true');
                                
                                input.addEventListener('blur', (e) => {
                                    const value = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                                    e.target.value = this.formatNumber(value);
                                });
                                
                                input.addEventListener('focus', (e) => {
                                    const value = this.parseFormattedNumber(e.target.value);
                                    e.target.value = value;
                                });
                            }
                        });

                        // 새로 추가된 TAM 필드들에 포맷팅 적용
                        const tamInputs = node.querySelectorAll ? 
                            node.querySelectorAll('.scenario-tam') : [];
                        
                        tamInputs.forEach(input => {
                            if (!input.hasAttribute('data-formatted')) {
                                input.setAttribute('data-formatted', 'true');
                                
                                input.addEventListener('blur', (e) => {
                                    const value = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                                    e.target.value = this.formatNumber(value);
                                });
                                
                                input.addEventListener('focus', (e) => {
                                    const value = this.parseFormattedNumber(e.target.value);
                                    e.target.value = value;
                                });
                            }
                        });
                    }
                });
            });
        });

        // businessSegments 컨테이너 감시
        const businessSegmentsContainer = document.getElementById('businessSegments');
        if (businessSegmentsContainer) {
            observer.observe(businessSegmentsContainer, {
                childList: true,
                subtree: true
            });
        }

        // segmentScenarios 컨테이너도 감시
        const segmentScenariosContainer = document.getElementById('segmentScenarios');
        if (segmentScenariosContainer) {
            observer.observe(segmentScenariosContainer, {
                childList: true,
                subtree: true
            });
        }
    }

    // 애플리케이션 초기화
    async initializeApp() {
        try {
            // Firebase 초기화
            if (window.firebaseConfig) {
                window.firebaseConfig.initializeFirebase();
                
                // 인증 이벤트 리스너 설정
                window.firebaseConfig.setupAuthEventListeners();
            }
            
            // 이벤트 리스너 설정
            this.setupEventListeners();
            this.setupNumberFormatting();
            
            // 데이터 로드
            await this.loadData();
            this.updateUI();
            
            // 자동 저장 설정
            if (window.firebaseConfig) {
                window.firebaseConfig.setupAutoSave();
            }
            
            console.log('앱 초기화 완료');
        } catch (error) {
            console.error('앱 초기화 실패:', error);
        }
    }

    // 이벤트 리스너 설정
    setupEventListeners() {
        // 네비게이션
        document.querySelectorAll('.step').forEach(step => {
            step.addEventListener('click', (e) => {
                const targetPage = parseInt(e.currentTarget.dataset.step);
                this.navigateToPage(targetPage);
            });
        });

        // 헤더 데이터 관리 버튼
        document.getElementById('exportData').addEventListener('click', () => {
            this.exportData();
        });

        document.getElementById('importData').addEventListener('click', () => {
            document.getElementById('importFile').click();
        });

        document.getElementById('importFile').addEventListener('change', (e) => {
            this.importData(e.target.files[0]);
        });

        // Portfolio Manager 관련 이벤트 리스너
        this.setupPortfolioManagerEvents();

        // 설정 페이지 이벤트 리스너
        this.setupSettingsEvents();

        // Page 1 이벤트
        this.setupPage1Events();
        
        // Page 2 이벤트
        this.setupPage2Events();
        
        // Page 3 이벤트
        this.setupPage3Events();
        
        // Page 4 이벤트
        this.setupPage4Events();
        
        // Page 5 이벤트
        this.setupPage5Events();
    }

    // Page 1 이벤트 설정
    setupPage1Events() {
        // 기업 정보 입력
        document.getElementById('companyName').addEventListener('input', async (e) => {
            await this.updateCompanyInfo('name', e.target.value);
        });

        document.getElementById('discountRate').addEventListener('input', async (e) => {
            await this.updateCompanyInfo('discountRate', parseFloat(e.target.value));
        });

        document.getElementById('taxRate').addEventListener('input', async (e) => {
            await this.updateCompanyInfo('taxRate', parseFloat(e.target.value));
        });

        document.getElementById('forecastPeriod').addEventListener('input', async (e) => {
            await this.updateCompanyInfo('forecastPeriod', parseInt(e.target.value));
        });

        document.getElementById('terminalGrowthRate').addEventListener('input', async (e) => {
            await this.updateCompanyInfo('terminalGrowthRate', parseFloat(e.target.value));
        });

        document.getElementById('marketValue').addEventListener('input', async (e) => {
            const value = this.parseFormattedNumber(e.target.value);
            await this.updateCompanyInfo('marketValue', value);
        });

        // 손익계산서 입력
        document.getElementById('revenue').addEventListener('input', async (e) => {
            const value = this.parseFormattedNumber(e.target.value);
            await this.updateIncomeStatement('revenue', value);
            this.calculateGrossProfit();
            
            // 디바운싱을 위한 타이머 설정
            clearTimeout(this.revenueUpdateTimer);
            this.revenueUpdateTimer = setTimeout(() => {
                this.calculateOtherSegmentRevenue();
            }, 300);
        });

        document.getElementById('costOfGoodsSold').addEventListener('input', async (e) => {
            const value = this.parseFormattedNumber(e.target.value);
            await this.updateIncomeStatement('costOfGoodsSold', value);
            this.calculateGrossProfit();
            // 비용 구조의 매출원가도 자동 업데이트
            this.updateCostStructure('cogs', 'amount', value);
            document.getElementById('cogs-amount').value = this.formatNumber(value);
        });

        document.getElementById('operatingIncome').addEventListener('input', async (e) => {
            const value = this.parseFormattedNumber(e.target.value);
            await this.updateIncomeStatement('operatingIncome', value);
            this.calculateOtherCost();
        });

        // 재무 데이터 로딩 설정
        this.setupFinancialDataLoading();

        // 사업부문 관리
        document.getElementById('addSegment').addEventListener('click', async () => {
            await this.addBusinessSegment();
        });

        // 사업부문 revenue 입력 이벤트
        document.addEventListener('input', async (e) => {
            if (e.target.classList.contains('segment-revenue')) {
                // 디바운싱을 위한 타이머 설정
                clearTimeout(this.revenueUpdateTimer);
                this.revenueUpdateTimer = setTimeout(async () => {
                    await this.updateBusinessSegments();
                }, 300); // 300ms 지연
            }
            if (e.target.classList.contains('segment-name')) {
                // 사업부문 데이터 업데이트
                await this.updateBusinessSegments();
            }
        });

        // 사업부문 삭제 버튼 이벤트
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('btn-remove-segment')) {
                setTimeout(async () => {
                    await this.updateBusinessSegments();
                }, 0);
            }
        });

        // 비용 구조 입력
        this.setupCostStructureEvents();
        
        // 비용 항목 추가/삭제 기능
        this.setupDynamicCostItems();

        // AI 분석 버튼 (기존)
        document.getElementById('analyzeCompany').addEventListener('click', () => {
            this.analyzeCompanyWithAI();
        });

        // 인라인 AI 분석 버튼 (기업명 옆)
        document.getElementById('analyzeCompanyInline').addEventListener('click', () => {
            this.analyzeCompanyWithAI();
        });

        // Cost Model Check 버튼
        document.getElementById('costModelCheck').addEventListener('click', () => {
            this.checkCostModel();
        });

        // API 키 입력
        document.getElementById('apiKey').addEventListener('input', (e) => {
            this.updateCompanyInfo('apiKey', e.target.value);
        });

        // 다음 단계로
        document.getElementById('nextToPage2').addEventListener('click', () => {
            if (this.validatePage1()) {
                this.navigateToPage(2);
            }
        });


    }

    // 재무 데이터 로딩 설정
    setupFinancialDataLoading() {
        // 재무 데이터 로딩 버튼
        document.getElementById('loadFinancialData').addEventListener('click', () => {
            this.loadFinancialData();
        });

        // 데이터 적용 버튼
        document.getElementById('applyFinancialData').addEventListener('click', () => {
            this.applyFinancialData();
        });

        // 초기화 버튼
        document.getElementById('clearFinancialData').addEventListener('click', () => {
            this.clearFinancialData();
        });

        // 티커 입력 필드 엔터 키 이벤트
        document.getElementById('tickerSymbol').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.loadFinancialData();
            }
        });
    }

    // 재무 데이터 로딩
    async loadFinancialData() {
        // 사용자가 선택한 데이터 소스 가져오기
        const dataSource = document.getElementById('dataSource').value;
        
        // 기존에 입력된 기업명 가져오기
        const companyName = document.getElementById('companyName').value.trim();
        
        if (!companyName) {
            alert('기업명을 먼저 입력해주세요.');
            return;
        }

        // 로딩 상태 표시
        const resultBox = document.getElementById('financialDataResult');
        const loadingDiv = document.getElementById('dataLoading');
        const contentDiv = document.getElementById('dataContent');
        
        resultBox.style.display = 'block';
        loadingDiv.style.display = 'block';
        contentDiv.style.display = 'none';

        try {
            // 1단계: 기업명으로 티커 조회
            // 설정에서 저장된 API 키 가져오기
            let apiKey = '';
            try {
                const currentUser = firebase.auth().currentUser;
                if (currentUser) {
                    const userSettingsDoc = await firebase.firestore().collection('userSettings').doc(currentUser.uid).get();
                    if (userSettingsDoc.exists) {
                        const settings = userSettingsDoc.data();
                        apiKey = settings.geminiApiKey || '';
                    }
                }
            } catch (error) {
                console.error('API 키 로드 오류:', error);
            }

            if (!apiKey || !apiKey.trim()) {
                alert('설정에서 Gemini API 키를 먼저 입력해주세요.\n\n설정 방법:\n1. 우측 상단 설정 버튼(⚙️) 클릭\n2. API 설정에서 Gemini API 키 입력\n3. 저장 후 다시 시도');
                return;
            }

            const ticker = await this.callGeminiForTicker(apiKey, companyName);
            document.getElementById('tickerSymbol').value = ticker;

            // 2단계: 재무 데이터 로딩 (실제 API 호출 시도)
            let financialData;
                                    try {
                            // 실제 API 호출 시도
                            financialData = await this.fetchFinancialDataFromAPI(ticker, dataSource);
                        } catch (apiError) {
                            console.error('실제 API 호출 실패:', apiError);
                            throw new Error(`재무 데이터를 가져올 수 없습니다: ${apiError.message}`);
                        }
            
            // 데이터 표시
            this.displayFinancialData3Years(financialData);
            
            // 로딩 완료
            loadingDiv.style.display = 'none';
            contentDiv.style.display = 'block';
            
        } catch (error) {
            console.error('재무 데이터 로딩 실패:', error);
            alert('재무 데이터 로딩에 실패했습니다. 다시 시도해주세요.');
            
            loadingDiv.style.display = 'none';
            resultBox.style.display = 'none';
        }
    }

    // 실제 재무 데이터 API 호출
    async fetchFinancialDataFromAPI(ticker, dataSource) {
        switch (dataSource) {
            case 'alpha_vantage':
                return await this.fetchFromAlphaVantage(ticker, '0BU57E8UVXNS35OW');
            case 'yahoo_finance':
                return await this.fetchFromYahooFinance(ticker);
            case 'financial_modeling_prep':
                const apiKey = document.getElementById('financialApiKey').value.trim();
                if (!apiKey) {
                    throw new Error('Financial Modeling Prep는 API 키가 필요합니다.');
                }
                return await this.fetchFromFinancialModelingPrep(ticker, apiKey);
            default:
                throw new Error('지원하지 않는 데이터 소스입니다.');
        }
    }

    // Alpha Vantage API 호출
    async fetchFromAlphaVantage(ticker, apiKey) {
        try {
            // 손익계산서 데이터 가져오기
            const incomeStatementResponse = await fetch(`https://www.alphavantage.co/query?function=INCOME_STATEMENT&symbol=${ticker}&apikey=${apiKey}`);
            const incomeStatementData = await incomeStatementResponse.json();
            
            // 재무상태표 데이터 가져오기
            const balanceSheetResponse = await fetch(`https://www.alphavantage.co/query?function=BALANCE_SHEET&symbol=${ticker}&apikey=${apiKey}`);
            const balanceSheetData = await balanceSheetResponse.json();
            
            // 현금흐름표 데이터 가져오기 (감가상각 포함)
            const cashFlowResponse = await fetch(`https://www.alphavantage.co/query?function=CASH_FLOW&symbol=${ticker}&apikey=${apiKey}`);
            const cashFlowData = await cashFlowResponse.json();
            
            // 에러 체크
            if (incomeStatementData['Error Message'] || balanceSheetData['Error Message'] || cashFlowData['Error Message']) {
                throw new Error('API 호출 중 오류가 발생했습니다.');
            }
            if (incomeStatementData['Note'] || balanceSheetData['Note'] || cashFlowData['Note']) {
                throw new Error('API 호출 한도 초과: ' + (incomeStatementData['Note'] || balanceSheetData['Note'] || cashFlowData['Note']));
            }
            
            return this.transformAlphaVantageData(incomeStatementData, balanceSheetData, cashFlowData);
        } catch (error) {
            console.error('Alpha Vantage API 호출 실패:', error);
            throw new Error(`Alpha Vantage API 호출 실패: ${error.message}`);
        }
    }

    // Yahoo Finance API 호출
    async fetchFromYahooFinance(ticker) {
        try {
            // Yahoo Finance는 CORS 제한으로 인해 재무제표 데이터를 직접 가져올 수 없음
            throw new Error('Yahoo Finance는 현재 재무제표 데이터를 지원하지 않습니다. 다른 데이터 소스를 선택해주세요.');
        } catch (error) {
            console.error('Yahoo Finance API 호출 실패:', error);
            throw new Error(`Yahoo Finance API 호출 실패: ${error.message}`);
        }
    }

    // Financial Modeling Prep API 호출
    async fetchFromFinancialModelingPrep(ticker, apiKey) {
        try {
            // 손익계산서 데이터 가져오기
            const incomeStatementResponse = await fetch(`https://financialmodelingprep.com/api/v3/income-statement/${ticker}?limit=3&apikey=${apiKey}`);
            const incomeStatementData = await incomeStatementResponse.json();
            
            // 재무상태표 데이터 가져오기
            const balanceSheetResponse = await fetch(`https://financialmodelingprep.com/api/v3/balance-sheet-statement/${ticker}?limit=3&apikey=${apiKey}`);
            const balanceSheetData = await balanceSheetResponse.json();
            
            // 현금흐름표 데이터 가져오기 (감가상각 포함)
            const cashFlowResponse = await fetch(`https://financialmodelingprep.com/api/v3/cash-flow-statement/${ticker}?limit=3&apikey=${apiKey}`);
            const cashFlowData = await cashFlowResponse.json();
            
            // 에러 체크
            if (incomeStatementData['Error Message'] || balanceSheetData['Error Message'] || cashFlowData['Error Message']) {
                throw new Error('API 호출 중 오류가 발생했습니다.');
            }
            
            return this.transformFinancialModelingPrepData(incomeStatementData, balanceSheetData, cashFlowData);
        } catch (error) {
            console.error('Financial Modeling Prep API 호출 실패:', error);
            throw new Error(`Financial Modeling Prep API 호출 실패: ${error.message}`);
        }
    }

    // Alpha Vantage 데이터 변환 (달러 → Million 단위)
    transformAlphaVantageData(incomeStatementData, balanceSheetData, cashFlowData) {
        const currentYear = new Date().getFullYear();
        const years = [currentYear - 1, currentYear - 2, currentYear - 3]; // 최신 연도를 올해-1로 수정
        
        const incomeStatement = {};
        const balanceSheet = {};
        const cashFlow = {};
        
        // 달러를 Million 단위로 변환하는 헬퍼 함수
        const convertToMillion = (value) => {
            const numValue = parseFloat(value) || 0;
            return numValue / 1000000; // 1,000,000으로 나누기
        };
        
        // 손익계산서 데이터 변환
        if (incomeStatementData.annualReports) {
            years.forEach((year, index) => {
                const annualData = incomeStatementData.annualReports[index];
                if (annualData) {
                    incomeStatement[year] = {
                        revenue: convertToMillion(annualData.totalRevenue),
                        cogs: convertToMillion(annualData.costOfRevenue),
                        grossProfit: convertToMillion(annualData.grossProfit),
                        sellingGeneralAndAdmin: convertToMillion(annualData.sellingGeneralAndAdministrative),
                        researchAndDevelopment: convertToMillion(annualData.researchAndDevelopment),
                        operatingIncome: convertToMillion(annualData.operatingIncome),
                        netIncome: convertToMillion(annualData.netIncome)
                    };
                }
            });
        }
        
        // 재무상태표 데이터 변환
        if (balanceSheetData.annualReports) {
            years.forEach((year, index) => {
                const annualData = balanceSheetData.annualReports[index];
                if (annualData) {
                    balanceSheet[year] = {
                        totalAssets: convertToMillion(annualData.totalAssets),
                        currentAssets: convertToMillion(annualData.totalCurrentAssets),
                        totalLiabilities: convertToMillion(annualData.totalLiabilities),
                        currentLiabilities: convertToMillion(annualData.totalCurrentLiabilities),
                        totalEquity: convertToMillion(annualData.totalShareholderEquity)
                    };
                }
            });
        }
        
        // 현금흐름표 데이터 변환 (감가상각 포함)
        if (cashFlowData.annualReports) {
            years.forEach((year, index) => {
                const annualData = cashFlowData.annualReports[index];
                if (annualData) {
                    cashFlow[year] = {
                        depreciation: convertToMillion(annualData.depreciationDepletionAndAmortization),
                        operatingCashFlow: convertToMillion(annualData.operatingCashflow),
                        investingCashFlow: convertToMillion(annualData.cashflowFromInvestment),
                        financingCashFlow: convertToMillion(annualData.cashflowFromFinancing),
                        freeCashFlow: convertToMillion(annualData.operatingCashflow) - convertToMillion(annualData.capitalExpenditures)
                    };
                }
            });
        }
        
        return { incomeStatement, balanceSheet, cashFlow };
    }

    // Financial Modeling Prep 데이터 변환 (달러 → Million 단위)
    transformFinancialModelingPrepData(incomeStatementData, balanceSheetData, cashFlowData) {
        const currentYear = new Date().getFullYear();
        const years = [currentYear - 1, currentYear - 2, currentYear - 3]; // 최신 연도를 올해-1로 수정
        
        const incomeStatement = {};
        const balanceSheet = {};
        const cashFlow = {};
        
        // 달러를 Million 단위로 변환하는 헬퍼 함수
        const convertToMillion = (value) => {
            const numValue = parseFloat(value) || 0;
            return numValue / 1000000; // 1,000,000으로 나누기
        };
        
        // 손익계산서 데이터 변환
        if (Array.isArray(incomeStatementData)) {
            years.forEach((year, index) => {
                const annualData = incomeStatementData[index];
                if (annualData) {
                    incomeStatement[year] = {
                        revenue: convertToMillion(annualData.revenue),
                        cogs: convertToMillion(annualData.costOfRevenue),
                        grossProfit: convertToMillion(annualData.grossProfit),
                        sellingGeneralAndAdmin: convertToMillion(annualData.sellingGeneralAndAdministrative),
                        researchAndDevelopment: convertToMillion(annualData.researchAndDevelopment),
                        operatingIncome: convertToMillion(annualData.operatingIncome),
                        netIncome: convertToMillion(annualData.netIncome)
                    };
                }
            });
        }
        
        // 재무상태표 데이터 변환
        if (Array.isArray(balanceSheetData)) {
            years.forEach((year, index) => {
                const annualData = balanceSheetData[index];
                if (annualData) {
                    balanceSheet[year] = {
                        totalAssets: convertToMillion(annualData.totalAssets),
                        currentAssets: convertToMillion(annualData.totalCurrentAssets),
                        totalLiabilities: convertToMillion(annualData.totalLiabilities),
                        currentLiabilities: convertToMillion(annualData.totalCurrentLiabilities),
                        totalEquity: convertToMillion(annualData.totalStockholdersEquity)
                    };
                }
            });
        }
        
        // 현금흐름표 데이터 변환 (감가상각 포함)
        if (Array.isArray(cashFlowData)) {
            years.forEach((year, index) => {
                const annualData = cashFlowData[index];
                if (annualData) {
                    cashFlow[year] = {
                        depreciation: convertToMillion(annualData.depreciationAndAmortization),
                        operatingCashFlow: convertToMillion(annualData.operatingCashFlow),
                        investingCashFlow: convertToMillion(annualData.netCashUsedForInvestingActivities),
                        financingCashFlow: convertToMillion(annualData.netCashUsedProvidedByFinancingActivities),
                        freeCashFlow: convertToMillion(annualData.freeCashFlow)
                    };
                }
            });
        }
        
        return { incomeStatement, balanceSheet, cashFlow };
    }

    // 시뮬레이션 함수 제거됨 - 실제 API만 사용

    // 3년치 재무 데이터 표시
    displayFinancialData3Years(data) {
        const currentYear = new Date().getFullYear();
        const years = [currentYear - 1, currentYear - 2, currentYear - 3]; // 최신 연도를 올해-1로 수정
        
        // 테이블 헤더 연도 업데이트
        document.getElementById('year1').textContent = years[0];
        document.getElementById('year2').textContent = years[1];
        document.getElementById('year3').textContent = years[2];
        document.getElementById('bsYear1').textContent = years[0];
        document.getElementById('bsYear2').textContent = years[1];
        document.getElementById('bsYear3').textContent = years[2];
        document.getElementById('cfYear1').textContent = years[0];
        document.getElementById('cfYear2').textContent = years[1];
        document.getElementById('cfYear3').textContent = years[2];
        
        // 손익계산서 데이터 표시
        years.forEach((year, index) => {
            const yearIndex = index + 1;
            const incomeData = data.incomeStatement[year];
            
            document.getElementById(`revenue${yearIndex}`).textContent = this.formatCurrency(incomeData.revenue);
            document.getElementById(`cogs${yearIndex}`).textContent = this.formatCurrency(incomeData.cogs);
            document.getElementById(`grossProfit${yearIndex}`).textContent = this.formatCurrency(incomeData.grossProfit);
            document.getElementById(`sellingGeneralAndAdmin${yearIndex}`).textContent = this.formatCurrency(incomeData.sellingGeneralAndAdmin || 0);
            document.getElementById(`researchAndDevelopment${yearIndex}`).textContent = this.formatCurrency(incomeData.researchAndDevelopment || 0);
            document.getElementById(`operatingIncome${yearIndex}`).textContent = this.formatCurrency(incomeData.operatingIncome);
            document.getElementById(`netIncome${yearIndex}`).textContent = this.formatCurrency(incomeData.netIncome);
        });

        // 재무상태표 데이터 표시
        years.forEach((year, index) => {
            const yearIndex = index + 1;
            const balanceData = data.balanceSheet[year];
            
            document.getElementById(`totalAssets${yearIndex}`).textContent = this.formatCurrency(balanceData.totalAssets);
            document.getElementById(`currentAssets${yearIndex}`).textContent = this.formatCurrency(balanceData.currentAssets);
            document.getElementById(`totalLiabilities${yearIndex}`).textContent = this.formatCurrency(balanceData.totalLiabilities);
            document.getElementById(`currentLiabilities${yearIndex}`).textContent = this.formatCurrency(balanceData.currentLiabilities);
            document.getElementById(`totalEquity${yearIndex}`).textContent = this.formatCurrency(balanceData.totalEquity);
        });

        // 현금흐름표 데이터 표시
        years.forEach((year, index) => {
            const yearIndex = index + 1;
            const cashFlowData = data.cashFlow[year];
            
            if (cashFlowData) {
                document.getElementById(`depreciation${yearIndex}`).textContent = this.formatCurrency(cashFlowData.depreciation || 0);
                document.getElementById(`operatingCashFlow${yearIndex}`).textContent = this.formatCurrency(cashFlowData.operatingCashFlow || 0);
                document.getElementById(`investingCashFlow${yearIndex}`).textContent = this.formatCurrency(cashFlowData.investingCashFlow || 0);
                document.getElementById(`financingCashFlow${yearIndex}`).textContent = this.formatCurrency(cashFlowData.financingCashFlow || 0);
                document.getElementById(`freeCashFlow${yearIndex}`).textContent = this.formatCurrency(cashFlowData.freeCashFlow || 0);
            }
        });
    }

    // 재무 데이터 적용 (최신 데이터)
    applyFinancialData() {
        const revenue = document.getElementById('revenue1').textContent;
        const costOfGoodsSold = document.getElementById('cogs1').textContent;
        const operatingIncome = document.getElementById('operatingIncome1').textContent;

        // 단위 변환하여 Million 단위로 변환
        const revenueInMillion = this.parseCurrencyToMillion(revenue);
        const costOfGoodsSoldInMillion = this.parseCurrencyToMillion(costOfGoodsSold);
        const operatingIncomeInMillion = this.parseCurrencyToMillion(operatingIncome);

        // 기존 입력 필드에 적용 (Million 단위로 포맷팅)
        document.getElementById('revenue').value = this.formatNumber(revenueInMillion);
        document.getElementById('costOfGoodsSold').value = this.formatNumber(costOfGoodsSoldInMillion);
        document.getElementById('operatingIncome').value = this.formatNumber(operatingIncomeInMillion);

        // 데이터 업데이트
        this.updateIncomeStatement('revenue', revenueInMillion);
        this.updateIncomeStatement('costOfGoodsSold', costOfGoodsSoldInMillion);
        this.updateIncomeStatement('operatingIncome', operatingIncomeInMillion);
        
        // 매출총이익 계산
        this.calculateGrossProfit();
        this.calculateOtherSegmentRevenue();
        this.calculateOtherCost();

        alert('최신 재무 데이터가 성공적으로 적용되었습니다.');
    }

    // 재무 데이터 초기화
    clearFinancialData() {
        document.getElementById('financialDataResult').style.display = 'none';
        document.getElementById('tickerSymbol').value = '';
        document.getElementById('dataSource').value = 'alpha_vantage';
        // document.getElementById('financialApiKey').value = ''; // 주석 처리됨
    }



    // Gemini API로 티커 조회
    async callGeminiForTicker(apiKey, companyName) {
        const prompt = `${companyName}을 주식시장에서 조회하려고 해
${companyName}의 주식 티커를 알려줄래? 
부연설명 없이 **티커 이름만 대답해줘**`;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API 응답 오류:', response.status, errorText);
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API 응답:', data);
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                const ticker = data.candidates[0].content.parts[0].text.trim();
                
                // 티커 심볼 파싱 (숫자나 특수문자 제거, 대문자로 변환)
                const cleanTicker = ticker.replace(/[^A-Za-z]/g, '').toUpperCase();
                
                return cleanTicker;
            } else {
                throw new Error('API 응답 형식이 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('API 호출 상세 오류:', error);
            throw new Error(`API 호출 중 오류: ${error.message}`);
        }
    }

    // Page 2 이벤트 설정
    setupPage2Events() {
        // 고정비 성장률 입력 (고정 항목들)
        const fixedCostTypes = ['cogs', 'other'];
        fixedCostTypes.forEach(type => {
            const meanInput = document.getElementById(`${type}-fixed-mean`);
            const stdInput = document.getElementById(`${type}-fixed-std`);
            
            if (meanInput) {
                meanInput.addEventListener('input', (e) => {
                    this.updateFixedCostGrowth(type, 'mean', parseFloat(e.target.value));
                });
            }
            if (stdInput) {
                stdInput.addEventListener('input', (e) => {
                    this.updateFixedCostGrowth(type, 'stdDev', parseFloat(e.target.value));
                });
            }
        });

        // 동적 비용 항목들의 고정비 성장률 이벤트 리스너
        this.setupDynamicCostGrowthEvents();

        // 네비게이션
        document.getElementById('prevToPage1').addEventListener('click', () => {
            this.navigateToPage(1);
        });

        document.getElementById('nextToPage3').addEventListener('click', () => {
            if (this.validatePage2()) {
                this.navigateToPage(3);
            }
        });


    }

    // Page 3 이벤트 설정 (모델 시각화)
    setupPage3Events() {
        // 모델 시각화 업데이트 버튼
        document.getElementById('updateVisualization').addEventListener('click', () => {
            this.updateModelVisualization();
        });

        // 네비게이션
        document.getElementById('prevToPage2').addEventListener('click', () => {
            this.navigateToPage(2);
        });

        document.getElementById('nextToPage4').addEventListener('click', () => {
            this.navigateToPage(4);
        });
    }

    // Page 4 이벤트 설정 (시뮬레이션)
    setupPage4Events() {
        // 시뮬레이션 컨트롤
        document.getElementById('startSimulation').addEventListener('click', () => {
            this.startSimulation();
        });

        document.getElementById('stopSimulation').addEventListener('click', () => {
            this.stopSimulation();
        });

        // 네비게이션
        document.getElementById('prevToPage3').addEventListener('click', () => {
            this.navigateToPage(3);
        });

        document.getElementById('nextToPage5').addEventListener('click', () => {
            this.navigateToPage(5);
        });
    }

    // Page 5 이벤트 설정 (투자 분석)
    setupPage5Events() {
        // 네비게이션
        document.getElementById('prevToPage4').addEventListener('click', () => {
            this.navigateToPage(4);
        });
    }

    // 비용 구조 이벤트 설정
    setupCostStructureEvents() {
        // 고정 비용 항목들 (매출원가, 기타 비용)
        const fixedCostItems = ['cogs', 'other'];
        
        fixedCostItems.forEach(item => {
            const variableSlider = document.getElementById(`${item}-variable`);
            const variableValue = document.getElementById(`${item}-variable-value`);
            const fixedValue = document.getElementById(`${item}-fixed-value`);
            const amountInput = document.getElementById(`${item}-amount`);
            
            if (variableSlider) {
                variableSlider.addEventListener('input', (e) => {
                    const variableRatio = parseInt(e.target.value);
                    const fixedRatio = 100 - variableRatio;
                    
                    // UI 업데이트
                    variableValue.textContent = `${variableRatio}%`;
                    fixedValue.textContent = `${fixedRatio}%`;
                    
                    // 데이터 업데이트
                    this.updateCostStructure(item, 'variableRatio', variableRatio);
                    this.updateCostStructure(item, 'fixedRatio', fixedRatio);
                });
            }
            
            if (amountInput && !amountInput.readOnly) {
                amountInput.addEventListener('input', (e) => {
                    const amount = this.parseFormattedNumber(e.target.value);
                    this.updateCostStructure(item, 'amount', amount);
                    this.calculateOtherCost();
                });
            }
        });
    }

    // 동적 비용 항목 관리
    setupDynamicCostItems() {
        // 비용 항목 추가 버튼
        document.getElementById('addCostItem').addEventListener('click', () => {
            this.showAddCostItemModal();
        });

        // 기존 동적 비용 항목들에 이벤트 리스너 추가
        this.setupDynamicCostItemEvents();
    }

    // 동적 비용 항목 이벤트 설정
    setupDynamicCostItemEvents() {
        // 삭제 버튼 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-cost')) {
                const costItem = e.target.closest('.cost-item');
                const costType = costItem.dataset.costType;
                this.removeCostItem(costType, costItem);
            }
        });

        // 슬라이더 이벤트 (동적으로 생성되는 요소들)
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('slider-input') && e.target.closest('.dynamic-cost')) {
                const costItem = e.target.closest('.cost-item');
                const costType = costItem.dataset.costType;
                const variableRatio = parseInt(e.target.value);
                const fixedRatio = 100 - variableRatio;
                
                // UI 업데이트
                const variableValue = costItem.querySelector('.variable-ratio-new');
                const fixedValue = costItem.querySelector('.fixed-ratio-new');
                variableValue.textContent = `${variableRatio}%`;
                fixedValue.textContent = `${fixedRatio}%`;
                
                // 데이터 업데이트
                this.updateCostStructure(costType, 'variableRatio', variableRatio);
                this.updateCostStructure(costType, 'fixedRatio', fixedRatio);
            }
        });

        // 금액 입력 이벤트 (동적으로 생성되는 요소들)
        document.addEventListener('input', (e) => {
            if (e.target.id && e.target.id.endsWith('-amount') && e.target.closest('.dynamic-cost') && !e.target.readOnly) {
                const costType = e.target.id.replace('-amount', '');
                const amount = this.parseFormattedNumber(e.target.value);
                this.updateCostStructure(costType, 'amount', amount);
                this.calculateOtherCost();
            }
        });
    }

    // 비용 항목 추가 모달 표시
    showAddCostItemModal() {
        const modalHTML = `
            <div class="modal-overlay" id="addCostItemModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">비용 항목 추가</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="newCostName">비용 항목명</label>
                            <input type="text" id="newCostName" placeholder="예: 임대료, 보험료, 유지보수비" maxlength="20">
                        </div>
                        <div class="form-group">
                            <label for="newCostType">비용 유형</label>
                            <select id="newCostType">
                                <option value="custom">사용자 정의</option>
                                <option value="rent">임대료</option>
                                <option value="insurance">보험료</option>
                                <option value="maintenance">유지보수비</option>
                                <option value="utilities">공과금</option>
                                <option value="travel">출장비</option>
                                <option value="training">교육훈련비</option>
                                <option value="legal">법무비</option>
                                <option value="consulting">컨설팅비</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="newCostAmount">기본 금액</label>
                            <input type="text" id="newCostAmount" placeholder="금액 입력" value="0">
                        </div>
                        <div class="form-group">
                            <label for="newCostVariableRatio">변동비 비율 (%)</label>
                            <input type="range" id="newCostVariableRatio" min="0" max="100" value="30">
                            <div class="ratio-display-new">
                                <span class="variable-label-new">변동비</span>
                                <span class="variable-ratio-new" id="newCostVariableValue">30%</span>
                                <span class="ratio-separator-new">-</span>
                                <span class="fixed-ratio-new" id="newCostFixedValue">70%</span>
                                <span class="fixed-label-new">고정비</span>
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">취소</button>
                            <button type="button" class="btn-primary" id="confirmAddCostItem">추가</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // 모달 내 이벤트 설정
        const modal = document.getElementById('addCostItemModal');
        
        // 비용 유형 선택 시 자동 입력
        document.getElementById('newCostType').addEventListener('change', (e) => {
            const costType = e.target.value;
            const nameInput = document.getElementById('newCostName');
            
            if (costType !== 'custom') {
                const costNames = {
                    'rent': '임대료',
                    'insurance': '보험료',
                    'maintenance': '유지보수비',
                    'utilities': '공과금',
                    'travel': '출장비',
                    'training': '교육훈련비',
                    'legal': '법무비',
                    'consulting': '컨설팅비'
                };
                nameInput.value = costNames[costType];
            }
        });

        // 변동비 슬라이더 이벤트
        document.getElementById('newCostVariableRatio').addEventListener('input', (e) => {
            const variableRatio = parseInt(e.target.value);
            const fixedRatio = 100 - variableRatio;
            
            document.getElementById('newCostVariableValue').textContent = `${variableRatio}%`;
            document.getElementById('newCostFixedValue').textContent = `${fixedRatio}%`;
        });

        // 금액 입력 포맷팅
        document.getElementById('newCostAmount').addEventListener('blur', (e) => {
            const value = parseFloat(e.target.value.replace(/,/g, '')) || 0;
            e.target.value = this.formatNumber(value);
        });

        // 추가 버튼 이벤트
        document.getElementById('confirmAddCostItem').addEventListener('click', () => {
            this.addNewCostItem();
        });
    }

    // 새로운 비용 항목 추가
    addNewCostItem() {
        const name = document.getElementById('newCostName').value.trim();
        const amount = this.parseFormattedNumber(document.getElementById('newCostAmount').value);
        const variableRatio = parseInt(document.getElementById('newCostVariableRatio').value);
        
        if (!name) {
            alert('비용 항목명을 입력해주세요.');
            return;
        }

        // 고유한 costType 생성
        const costType = this.generateUniqueCostType(name);
        
        // 비용 항목 HTML 생성
        const costItemHTML = `
            <div class="cost-item dynamic-cost adding" data-cost-type="${costType}">
                <div class="cost-item-header">
                    <label>${name}</label>
                    <button type="button" class="btn-remove-cost" title="비용 항목 삭제">×</button>
                </div>
                <div class="cost-input-group">
                    <label>금액</label>
                    <input type="text" id="${costType}-amount" placeholder="금액" min="0" value="${this.formatNumber(amount)}">
                </div>
                <div class="slider-container">
                    <div class="slider-group">
                        <div class="ratio-display-new">
                            <span class="variable-label-new">변동비</span>
                            <span class="variable-ratio-new" id="${costType}-variable-value">${variableRatio}%</span>
                            <span class="ratio-separator-new">-</span>
                            <span class="fixed-ratio-new" id="${costType}-fixed-value">${100 - variableRatio}%</span>
                            <span class="fixed-label-new">고정비</span>
                        </div>
                        <input type="range" id="${costType}-variable" class="slider-input" value="${variableRatio}" min="0" max="100">
                    </div>
                </div>
            </div>
        `;

        // 동적 비용 항목 컨테이너에 추가
        const container = document.getElementById('dynamicCostItems');
        container.insertAdjacentHTML('beforeend', costItemHTML);

        // 데이터에 추가
        this.addCostItemToData(costType, name, amount, variableRatio);
        
        // 고정비 성장률 설정에도 추가
        this.addDynamicCostGrowthScenario(costType, { mean: 2, stdDev: 0.5 });

        // 모달 닫기
        document.getElementById('addCostItemModal').remove();

        // 애니메이션 클래스 제거
        setTimeout(() => {
            const newItem = document.querySelector(`[data-cost-type="${costType}"]`);
            if (newItem) {
                newItem.classList.remove('adding');
            }
        }, 300);
    }

    // 고유한 costType 생성
    generateUniqueCostType(name) {
        const baseType = name.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        let costType = baseType;
        let counter = 1;
        
        // 기존 costType들과 중복되지 않도록 확인
        while (document.querySelector(`[data-cost-type="${costType}"]`)) {
            costType = `${baseType}${counter}`;
            counter++;
        }
        
        return costType;
    }

    // 데이터에 비용 항목 추가
    addCostItemToData(costType, name, amount, variableRatio) {
        const currentData = dataManager.getData();
        if (currentData) {
            // 비용 구조에 추가
            currentData.financialStructure.costStructure[costType] = {
                amount: amount,
                variableRatio: variableRatio,
                fixedRatio: 100 - variableRatio
            };

            // 고정비 성장률에 추가 (기본값)
            currentData.scenarioModel.fixedCostGrowth[costType] = {
                mean: 2,
                stdDev: 0.5
            };

            dataManager.saveData(currentData);
        }
    }

    // 비용 항목 삭제
    removeCostItem(costType, costItem) {
        if (confirm('이 비용 항목을 삭제하시겠습니까?')) {
            // 애니메이션 클래스 추가
            costItem.classList.add('removing');
            
            // 애니메이션 완료 후 삭제
            setTimeout(() => {
                costItem.remove();
                
                // 데이터에서 제거
                this.removeCostItemFromData(costType);
                
                // 고정비 성장률 설정에서도 제거
                this.removeDynamicCostGrowthScenario(costType);
                
                // 기타 비용 재계산
                this.calculateOtherCost();
            }, 300);
        }
    }

    // 데이터에서 비용 항목 제거
    removeCostItemFromData(costType) {
        const currentData = dataManager.getData();
        if (currentData) {
            // 비용 구조에서 제거
            delete currentData.financialStructure.costStructure[costType];
            
            // 고정비 성장률에서 제거
            delete currentData.scenarioModel.fixedCostGrowth[costType];
            
            dataManager.saveData(currentData);
        }
    }

    // 데이터 로드
    async loadData() {
        const data = await dataManager.getData();
        if (data) {
            await this.populateFormData(data);
        }
    }

    // 폼 데이터 채우기
    async populateFormData(data) {
        // 데이터 구조 확인
        if (!data || !data.financialStructure) {
            console.warn('데이터 구조가 올바르지 않습니다:', data);
            return;
        }
        
        // 기업 정보
        const { companyInfo, incomeStatement, businessSegments, costStructure } = data.financialStructure;
        
        if (companyInfo) {
            const companyNameElement = document.getElementById('companyName');
            if (companyNameElement) companyNameElement.value = companyInfo.name || '';
            
            const discountRateElement = document.getElementById('discountRate');
            if (discountRateElement) discountRateElement.value = companyInfo.discountRate || 10;
            
            const taxRateElement = document.getElementById('taxRate');
            if (taxRateElement) taxRateElement.value = companyInfo.taxRate || 25;
            
            const forecastPeriodElement = document.getElementById('forecastPeriod');
            if (forecastPeriodElement) forecastPeriodElement.value = companyInfo.forecastPeriod || 15;
            
            const terminalGrowthRateElement = document.getElementById('terminalGrowthRate');
            if (terminalGrowthRateElement) terminalGrowthRateElement.value = companyInfo.terminalGrowthRate || 2.5;
            
            const marketValueElement = document.getElementById('marketValue');
            if (marketValueElement) marketValueElement.value = this.formatNumber(companyInfo.marketValue || 0);
        }

        // 손익계산서
        if (incomeStatement) {
            const revenueElement = document.getElementById('revenue');
            const costOfGoodsSoldElement = document.getElementById('costOfGoodsSold');
            const operatingIncomeElement = document.getElementById('operatingIncome');
            
            if (revenueElement) revenueElement.value = this.formatNumber(incomeStatement.revenue || 0);
            if (costOfGoodsSoldElement) costOfGoodsSoldElement.value = this.formatNumber(incomeStatement.costOfGoodsSold || 0);
            if (operatingIncomeElement) operatingIncomeElement.value = this.formatNumber(incomeStatement.operatingIncome || 0);
        }
        
        this.calculateGrossProfit();
        this.calculateOtherSegmentRevenue();
        this.calculateOtherCost();

        // 사업부문
        if (businessSegments) {
            await this.populateBusinessSegments(businessSegments);
        }

        // 비용 구조
        if (costStructure) {
            this.populateCostStructure(costStructure);
        }
        
        // 기타 매출액 계산 (데이터 로드 후)
        this.calculateOtherSegmentRevenue();

        // 고정비 성장률
        if (data.scenarioModel && data.scenarioModel.fixedCostGrowth) {
            const { fixedCostGrowth } = data.scenarioModel;
            this.populateFixedCostGrowth(fixedCostGrowth);
        }
        
        // 현재 페이지가 2페이지라면 시나리오 설정
        if (this.currentPage === 2) {
            console.log('populateFormData에서 setupPage2Scenarios 호출');
            await this.setupPage2Scenarios();
        }
    }

    // 사업부문 데이터 채우기
    async populateBusinessSegments(segments) {
        const container = document.getElementById('businessSegments');
        if (!container) return;
        
        container.innerHTML = '';

        if (!segments || segments.length === 0) {
            await this.addBusinessSegment();
        } else {
            for (const segment of segments) {
                await this.addBusinessSegment(segment.name, segment.revenue);
            }
        }
        
        // 기타 사업부문 매출 계산
        this.calculateOtherSegmentRevenue();
    }

    // 비용 구조 데이터 채우기
    populateCostStructure(costStructure) {
        if (!costStructure) return;
        
        // 고정 비용 항목들 (매출원가, 기타 비용)
        const fixedCostTypes = ['cogs', 'other'];
        
        fixedCostTypes.forEach(type => {
            const cost = costStructure[type];
            if (!cost) return;
            
            // 금액 설정
            const amountInput = document.getElementById(`${type}-amount`);
            if (amountInput) {
                amountInput.value = this.formatNumber(cost.amount || 0);
            }
            
            // 슬라이더 값 설정 (변동비 비율만 설정, 고정비는 자동 계산)
            const variableSlider = document.getElementById(`${type}-variable`);
            const variableValue = document.getElementById(`${type}-variable-value`);
            const fixedValue = document.getElementById(`${type}-fixed-value`);
            
            if (variableSlider && variableValue && fixedValue) {
                const variableRatio = cost.variableRatio || 0;
                const fixedRatio = 100 - variableRatio;
                
                variableSlider.value = variableRatio;
                variableValue.textContent = `${variableRatio}%`;
                fixedValue.textContent = `${fixedRatio}%`;
            }
        });

        // 동적 비용 항목들 로드
        this.loadDynamicCostItems(costStructure);
    }

    // 동적 비용 항목들 로드
    loadDynamicCostItems(costStructure) {
        const container = document.getElementById('dynamicCostItems');
        if (!container) return;

        // 기존 동적 비용 항목들 제거 (기본 항목들 제외)
        const existingItems = container.querySelectorAll('.dynamic-cost');
        existingItems.forEach(item => {
            const costType = item.dataset.costType;
            // 기본 항목들(depreciation, labor, rd, advertising)은 유지
            if (!['depreciation', 'labor', 'rd', 'advertising'].includes(costType)) {
                item.remove();
            }
        });

        // 모든 비용 항목들을 순회하면서 동적 항목들 추가
        Object.keys(costStructure).forEach(costType => {
            // 고정 항목들 제외
            if (['cogs', 'other'].includes(costType)) return;
            
            const cost = costStructure[costType];
            if (!cost) return;

            // 이미 존재하는 기본 항목들은 업데이트만
            const existingItem = container.querySelector(`[data-cost-type="${costType}"]`);
            if (existingItem) {
                this.updateExistingCostItem(existingItem, cost);
                return;
            }

            // 새로운 동적 항목 추가
            this.addDynamicCostItem(costType, cost);
        });
    }

    // 기존 비용 항목 업데이트
    updateExistingCostItem(costItem, cost) {
        // 금액 업데이트
        const amountInput = costItem.querySelector('input[id$="-amount"]');
        if (amountInput) {
            amountInput.value = this.formatNumber(cost.amount || 0);
        }

        // 슬라이더 업데이트
        const variableSlider = costItem.querySelector('.slider-input');
        const variableValue = costItem.querySelector('.variable-ratio-new');
        const fixedValue = costItem.querySelector('.fixed-ratio-new');
        
        if (variableSlider && variableValue && fixedValue) {
            const variableRatio = cost.variableRatio || 0;
            const fixedRatio = 100 - variableRatio;
            
            variableSlider.value = variableRatio;
            variableValue.textContent = `${variableRatio}%`;
            fixedValue.textContent = `${fixedRatio}%`;
        }
    }

    // 동적 비용 항목 추가 (데이터 로드용)
    addDynamicCostItem(costType, cost) {
        const container = document.getElementById('dynamicCostItems');
        if (!container) return;

        // 비용 항목명 결정
        const costNames = {
            'depreciation': '감가상각비',
            'labor': '인건비',
            'rd': '연구개발비',
            'advertising': '광고선전비'
        };
        
        const name = costNames[costType] || costType;

        // 비용 항목 HTML 생성
        const costItemHTML = `
            <div class="cost-item dynamic-cost" data-cost-type="${costType}">
                <div class="cost-item-header">
                    <label>${name}</label>
                    <button type="button" class="btn-remove-cost" title="비용 항목 삭제">×</button>
                </div>
                <div class="cost-input-group">
                    <label>금액</label>
                    <input type="text" id="${costType}-amount" placeholder="금액" min="0" value="${this.formatNumber(cost.amount || 0)}">
                </div>
                <div class="slider-container">
                    <div class="slider-group">
                        <div class="ratio-display-new">
                            <span class="variable-label-new">변동비</span>
                            <span class="variable-ratio-new" id="${costType}-variable-value">${cost.variableRatio || 0}%</span>
                            <span class="ratio-separator-new">-</span>
                            <span class="fixed-ratio-new" id="${costType}-fixed-value">${100 - (cost.variableRatio || 0)}%</span>
                            <span class="fixed-label-new">고정비</span>
                        </div>
                        <input type="range" id="${costType}-variable" class="slider-input" value="${cost.variableRatio || 0}" min="0" max="100">
                    </div>
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', costItemHTML);
    }

    // 고정비 성장률 데이터 채우기
    populateFixedCostGrowth(fixedCostGrowth) {
        if (!fixedCostGrowth) return;
        
        // 고정 비용 항목들 (매출원가, 기타 비용)
        const fixedCostTypes = ['cogs', 'other'];
        
        fixedCostTypes.forEach(type => {
            const growth = fixedCostGrowth[type];
            if (!growth) return;
            
            const meanInput = document.getElementById(`${type}-fixed-mean`);
            const stdInput = document.getElementById(`${type}-fixed-std`);
            
            if (meanInput) meanInput.value = growth.mean || 2;
            if (stdInput) stdInput.value = growth.stdDev || 0.5;
        });

        // 동적 비용 항목들의 고정비 성장률 로드
        this.loadDynamicCostGrowthScenarios(fixedCostGrowth);
    }

    // 동적 비용 항목들의 고정비 성장률 로드
    loadDynamicCostGrowthScenarios(fixedCostGrowth) {
        if (!fixedCostGrowth) return;
        
        const container = document.getElementById('dynamicCostGrowthScenarios');
        if (!container) return;

        // 기존 동적 성장률 설정들 제거
        container.innerHTML = '';

        // 모든 비용 항목들을 순회하면서 동적 항목들의 성장률 설정 추가
        Object.keys(fixedCostGrowth).forEach(costType => {
            // 고정 항목들 제외
            if (['cogs', 'other'].includes(costType)) return;
            
            const growth = fixedCostGrowth[costType];
            if (!growth) return;

            this.addDynamicCostGrowthScenario(costType, growth);
        });
    }

    // 동적 비용 항목의 고정비 성장률 설정 추가
    addDynamicCostGrowthScenario(costType, growth) {
        const container = document.getElementById('dynamicCostGrowthScenarios');
        if (!container) return;

        // 비용 항목명 결정
        const costNames = {
            'depreciation': '감가상각비',
            'labor': '인건비',
            'rd': '연구개발비',
            'advertising': '광고선전비'
        };
        
        const name = costNames[costType] || costType;

        const scenarioHTML = `
            <div class="cost-scenario" data-cost-type="${costType}">
                <label>${name} 고정비</label>
                <div class="scenario-input-group">
                    <label>평균 성장률 (%)</label>
                    <input type="number" id="${costType}-fixed-mean" placeholder="평균 성장률 (%)" step="0.1" value="${growth.mean || 2}">
                </div>
                <div class="scenario-input-group">
                    <label>표준편차 (%)</label>
                    <input type="number" id="${costType}-fixed-std" placeholder="표준편차 (%)" step="0.1" value="${growth.stdDev || 0.5}">
                </div>
            </div>
        `;

        container.insertAdjacentHTML('beforeend', scenarioHTML);
    }

    // 사업부문 추가
    async addBusinessSegment(name = '', revenue = '') {
        const container = document.getElementById('businessSegments');
        const segmentDiv = document.createElement('div');
        segmentDiv.className = 'segment-item';
        
        const formattedRevenue = revenue ? this.formatNumber(revenue) : '';
        
        segmentDiv.innerHTML = `
            <div class="segment-input-group">
                <label>사업부문</label>
                <input type="text" placeholder="사업부문명" class="segment-name" value="${name}">
            </div>
            <div class="segment-input-group">
                <label>매출액</label>
                <input type="text" placeholder="매출액" class="segment-revenue" value="${formattedRevenue}">
            </div>
            <button type="button" class="btn-remove-segment">삭제</button>
        `;

        // 이벤트 리스너 추가
        segmentDiv.querySelector('.btn-remove-segment').addEventListener('click', () => {
            container.removeChild(segmentDiv);
            this.updateBusinessSegments();
            this.calculateOtherSegmentRevenue();
        });

        // 사업부문 이름 입력 이벤트
        segmentDiv.querySelector('.segment-name').addEventListener('input', () => {
            this.updateBusinessSegments();
        });

        // 사업부문 revenue 입력 이벤트
        segmentDiv.querySelector('.segment-revenue').addEventListener('input', () => {
            this.updateBusinessSegments();
            this.calculateOtherSegmentRevenue();
        });

        // 포맷팅 이벤트 추가
        segmentDiv.querySelector('.segment-revenue').addEventListener('blur', (e) => {
            const value = parseFloat(e.target.value.replace(/,/g, '')) || 0;
            e.target.value = this.formatNumber(value);
        });
        
        segmentDiv.querySelector('.segment-revenue').addEventListener('focus', (e) => {
            const value = this.parseFormattedNumber(e.target.value);
            e.target.value = value;
        });

        container.appendChild(segmentDiv);
        
        // 새로 추가된 사업부문 데이터 업데이트
        await this.updateBusinessSegments();
    }

    // 사업부문 데이터 업데이트
    async updateBusinessSegments() {
        const segments = [];
        document.querySelectorAll('.segment-item:not(.other-segment)').forEach(item => {
            const name = item.querySelector('.segment-name').value.trim();
            const revenueInput = item.querySelector('.segment-revenue');
            const revenue = this.parseFormattedNumber(revenueInput.value);
            
            if (name) {
                segments.push({ name, revenue });
            }
        });

        const currentData = dataManager.getData();
        if (currentData && currentData.financialStructure) {
            currentData.financialStructure.businessSegments = segments;
            await dataManager.saveData(currentData);
            
            // 기타 사업부문 매출 자동 계산 및 UI 업데이트
            this.calculateOtherSegmentRevenue();
            
            // 디버깅 로그
            console.log('사업부문 업데이트:', {
                segments: segments,
                totalSegmentRevenue: segments.reduce((sum, seg) => sum + seg.revenue, 0),
                totalRevenue: currentData.financialStructure.incomeStatement?.revenue || 0,
                otherRevenue: dataManager.calculateOtherSegmentRevenue()
            });
        }
    }

    // 기업 정보 업데이트
    async updateCompanyInfo(field, value) {
        let currentData = dataManager.getData();
        
        // 데이터가 없으면 초기화
        if (!currentData) {
            currentData = {
                financialStructure: {
                    companyInfo: {},
                    incomeStatement: {},
                    businessSegments: [],
                    costStructure: {}
                },
                scenarioModel: {
                    segmentScenarios: {},
                    fixedCostGrowth: {}
                }
            };
        }
        
        // financialStructure가 없으면 초기화
        if (!currentData.financialStructure) {
            currentData.financialStructure = {
                companyInfo: {},
                incomeStatement: {},
                businessSegments: [],
                costStructure: {}
            };
        }
        
        // companyInfo가 없으면 초기화
        if (!currentData.financialStructure.companyInfo) {
            currentData.financialStructure.companyInfo = {};
        }
        
        currentData.financialStructure.companyInfo[field] = value;
        await dataManager.saveData(currentData);
        
        console.log(`기업 정보 업데이트: ${field} = ${value}`);
    }

    // 손익계산서 업데이트
    async updateIncomeStatement(field, value) {
        const currentData = dataManager.getData();
        if (currentData && currentData.financialStructure && currentData.financialStructure.incomeStatement) {
            currentData.financialStructure.incomeStatement[field] = value;
            await dataManager.saveData(currentData);
        }
    }

    // 매출총이익 계산
    calculateGrossProfit() {
        const revenue = this.parseFormattedNumber(document.getElementById('revenue').value);
        const costOfGoodsSold = this.parseFormattedNumber(document.getElementById('costOfGoodsSold').value);
        const grossProfit = revenue - costOfGoodsSold;
        document.getElementById('grossProfit').value = this.formatNumber(grossProfit);
    }

    // 기타 사업부문 매출 계산
    calculateOtherSegmentRevenue() {
        const otherRevenue = dataManager.calculateOtherSegmentRevenue();
        const formattedRevenue = this.formatNumber(otherRevenue);
        
        const otherSegmentRevenueElement = document.getElementById('other-segment-revenue');
        if (otherSegmentRevenueElement) {
            otherSegmentRevenueElement.value = formattedRevenue;
        }
        
        // 기타 매출액이 음수인 경우 경고 표시
        const otherSegmentElement = document.querySelector('.other-segment');
        if (otherSegmentElement && otherRevenue < 0) {
            if (!otherSegmentElement.querySelector('.warning-message')) {
                const warningDiv = document.createElement('div');
                warningDiv.className = 'warning-message';
                warningDiv.style.cssText = `
                    color: #e74c3c;
                    font-size: 0.9rem;
                    font-weight: 600;
                    margin-top: 0.5rem;
                    text-align: center;
                    background: rgba(231, 76, 60, 0.1);
                    padding: 0.5rem;
                    border-radius: 4px;
                    border: 1px solid rgba(231, 76, 60, 0.3);
                `;
                warningDiv.textContent = '⚠️ 사업부문 매출 합계가 총 매출을 초과했습니다.';
                otherSegmentElement.appendChild(warningDiv);
            }
        } else if (otherSegmentElement) {
            // 경고 메시지 제거
            const warningMessage = otherSegmentElement.querySelector('.warning-message');
            if (warningMessage) {
                warningMessage.remove();
            }
        }
        
        return otherRevenue;
    }

    // 기타 비용 계산
    calculateOtherCost() {
        const otherCost = dataManager.calculateOtherCost();
        const otherAmountElement = document.getElementById('other-amount');
        if (otherAmountElement) {
            otherAmountElement.value = this.formatNumber(otherCost);
        }
    }

    // 비용 구조 업데이트
    async updateCostStructure(type, field, value) {
        const currentData = dataManager.getData();
        if (currentData && currentData.financialStructure && currentData.financialStructure.costStructure && currentData.financialStructure.costStructure[type]) {
            currentData.financialStructure.costStructure[type][field] = value;
            await dataManager.saveData(currentData);
        }
    }

    // 비용 비율 동기화
    syncCostRatios(type) {
        dataManager.syncCostRatios(type);
        this.loadData(); // UI 업데이트
    }

    // 고정비 성장률 업데이트
    async updateFixedCostGrowth(type, field, value) {
        const currentData = dataManager.getData();
        if (currentData && currentData.scenarioModel && currentData.scenarioModel.fixedCostGrowth && currentData.scenarioModel.fixedCostGrowth[type]) {
            currentData.scenarioModel.fixedCostGrowth[type][field] = value;
            await dataManager.saveData(currentData);
        }
    }

    // 동적 비용 항목의 고정비 성장률 설정 제거
    removeDynamicCostGrowthScenario(costType) {
        const container = document.getElementById('dynamicCostGrowthScenarios');
        if (!container) return;

        const scenario = container.querySelector(`[data-cost-type="${costType}"]`);
        if (scenario) {
            scenario.remove();
        }
    }

    // 동적 비용 항목들의 고정비 성장률 이벤트 설정
    setupDynamicCostGrowthEvents() {
        // 동적으로 생성되는 고정비 성장률 입력 필드들에 이벤트 리스너 추가
        document.addEventListener('input', (e) => {
            if (e.target.id && e.target.id.includes('-fixed-mean') && e.target.closest('#dynamicCostGrowthScenarios')) {
                const costType = e.target.id.replace('-fixed-mean', '');
                this.updateFixedCostGrowth(costType, 'mean', parseFloat(e.target.value));
            }
            
            if (e.target.id && e.target.id.includes('-fixed-std') && e.target.closest('#dynamicCostGrowthScenarios')) {
                const costType = e.target.id.replace('-fixed-std', '');
                this.updateFixedCostGrowth(costType, 'stdDev', parseFloat(e.target.value));
            }
        });
    }

    // Portfolio Manager 이벤트 설정
    setupPortfolioManagerEvents() {
        // Portfolio Manager 버튼
        const portfolioManagerBtn = document.getElementById('portfolio-manager-btn');
        if (portfolioManagerBtn) {
            portfolioManagerBtn.addEventListener('click', () => {
                this.showPortfolioManager();
            });
        }

        // 데이터 내보내기 (Portfolio에 업로드)
        const exportDataSettingsBtn = document.getElementById('export-data-settings');
        if (exportDataSettingsBtn) {
            exportDataSettingsBtn.addEventListener('click', () => {
                this.showUploadModal();
            });
        }

        // 데이터 가져오기 (Portfolio에서 가져오기)
        const importDataSettingsBtn = document.getElementById('import-data-settings');
        if (importDataSettingsBtn) {
            importDataSettingsBtn.addEventListener('click', () => {
                this.showPortfolioManager();
            });
        }

        // Portfolio Manager에서 Valuation Assistant로 돌아가기
        const backToValuationBtn = document.getElementById('back-to-valuation');
        if (backToValuationBtn) {
            backToValuationBtn.addEventListener('click', () => {
                this.hidePortfolioManager();
            });
        }

        // Portfolio 새로고침
        const refreshPortfolioBtn = document.getElementById('refresh-portfolio');
        if (refreshPortfolioBtn) {
            refreshPortfolioBtn.addEventListener('click', () => {
                this.loadPortfolioData();
            });
        }
    }

    // Portfolio Manager 표시
    showPortfolioManager() {
        // 모든 페이지 숨기기
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Portfolio Manager 페이지 표시
        const portfolioPage = document.getElementById('page7');
        if (portfolioPage) {
            portfolioPage.classList.add('active');
        }

        // Portfolio 데이터 로드
        this.loadPortfolioData();
    }

    // Portfolio Manager 숨기기
    hidePortfolioManager() {
        // Portfolio Manager 페이지 숨기기
        const portfolioPage = document.getElementById('page7');
        if (portfolioPage) {
            portfolioPage.classList.remove('active');
        }

        // 설정 페이지로 돌아가기
        this.navigateToPage(6);
    }

    // Portfolio 데이터 로드
    async loadPortfolioData() {
        const portfolioList = document.getElementById('portfolio-list');
        if (!portfolioList) return;

        // 로딩 상태 표시
        portfolioList.innerHTML = '<div class="portfolio-loading"><p>데이터를 불러오는 중...</p></div>';

        try {
            const sharedData = await this.getSharedValuations();
            
            if (sharedData.length === 0) {
                portfolioList.innerHTML = `
                    <div class="portfolio-empty">
                        <h3>업로드된 데이터가 없습니다</h3>
                        <p>첫 번째 데이터를 업로드해보세요!</p>
                    </div>
                `;
                return;
            }

            // 데이터를 시간순으로 정렬 (최신순)
            sharedData.sort((a, b) => b.uploadTime.toDate() - a.uploadTime.toDate());

            // Portfolio 아이템들 생성
            const portfolioItems = sharedData.map(item => this.createPortfolioItem(item));
            portfolioList.innerHTML = portfolioItems.join('');

            // 각 아이템에 이벤트 리스너 추가
            this.setupPortfolioItemEvents();

        } catch (error) {
            console.error('Portfolio 데이터 로드 실패:', error);
            portfolioList.innerHTML = `
                <div class="portfolio-empty">
                    <h3>데이터 로드 실패</h3>
                    <p>잠시 후 다시 시도해주세요.</p>
                </div>
            `;
        }
    }

    // 공유된 Valuation 데이터 가져오기
    async getSharedValuations() {
        try {
            if (!window.firebaseConfig || !window.firebaseConfig.db) {
                throw new Error('Firebase가 초기화되지 않았습니다.');
            }

            const snapshot = await window.firebaseConfig.db.collection('sharedValuations')
                .orderBy('uploadTime', 'desc')
                .get();

            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('공유 데이터 가져오기 실패:', error);
            throw error;
        }
    }

    // Portfolio 아이템 생성
    createPortfolioItem(item) {
        const uploadTime = item.uploadTime.toDate();
        const formattedTime = uploadTime.toLocaleString('ko-KR');
        
        return `
            <div class="portfolio-item" data-item-id="${item.id}">
                <div class="portfolio-item-header">
                    <div>
                        <h3 class="portfolio-item-title">${item.title || '제목 없음'}</h3>
                        <p class="portfolio-item-company">${item.companyName || '기업명 없음'}</p>
                    </div>
                </div>
                <div class="portfolio-item-meta">
                    <div class="portfolio-meta-item">
                        <span class="portfolio-meta-label">업로드한 사용자:</span>
                        <span>${item.userEmail || '익명 사용자'}</span>
                    </div>
                    <div class="portfolio-meta-item">
                        <span class="portfolio-meta-label">업로드 시간:</span>
                        <span>${formattedTime}</span>
                    </div>
                </div>
                <div class="portfolio-item-actions">
                    <button class="btn-import" onclick="window.valueWebApp.importFromPortfolio('${item.id}')">가져오기</button>
                    ${item.userId === (window.firebaseConfig?.auth?.currentUser?.uid || '') ? 
                        `<button class="btn-delete" onclick="window.valueWebApp.deleteFromPortfolio('${item.id}')">삭제</button>` : 
                        ''
                    }
                </div>
            </div>
        `;
    }

    // Portfolio 아이템 이벤트 설정
    setupPortfolioItemEvents() {
        // 이벤트는 이미 HTML에 onclick으로 추가되어 있음
    }

    // Portfolio에서 데이터 가져오기
    async importFromPortfolio(itemId) {
        try {
            const doc = await window.firebaseConfig.db.collection('sharedValuations').doc(itemId).get();
            if (!doc.exists) {
                alert('데이터를 찾을 수 없습니다.');
                return;
            }

            const item = doc.data();
            
            // 현재 데이터를 덮어쓰기
            await dataManager.saveData(item.data);
            
            // Portfolio Manager 숨기고 Valuation Assistant로 돌아가기
            this.hidePortfolioManager();
            
            // 데이터 다시 로드
            await this.loadData();
            
            alert('데이터를 성공적으로 가져왔습니다!');
            
        } catch (error) {
            console.error('데이터 가져오기 실패:', error);
            alert('데이터 가져오기에 실패했습니다.');
        }
    }

    // Portfolio에서 데이터 삭제
    async deleteFromPortfolio(itemId) {
        if (!confirm('정말로 이 데이터를 삭제하시겠습니까?')) {
            return;
        }

        try {
            await window.firebaseConfig.db.collection('sharedValuations').doc(itemId).delete();
            
            // Portfolio 데이터 다시 로드
            await this.loadPortfolioData();
            
            alert('데이터가 삭제되었습니다.');
            
        } catch (error) {
            console.error('데이터 삭제 실패:', error);
            alert('데이터 삭제에 실패했습니다.');
        }
    }

    // 업로드 모달 표시
    showUploadModal() {
        const currentData = dataManager.getData();
        if (!currentData) {
            alert('업로드할 데이터가 없습니다. 먼저 기업 정보를 입력해주세요.');
            return;
        }

        const modalHTML = `
            <div class="upload-modal" id="uploadModal">
                <div class="upload-modal-content">
                    <div class="upload-modal-header">
                        <h3 class="upload-modal-title">Portfolio에 업로드</h3>
                        <button class="upload-modal-close" onclick="document.getElementById('uploadModal').remove()">&times;</button>
                    </div>
                    <form id="uploadForm">
                        <div class="upload-form-group">
                            <label for="uploadTitle">제목</label>
                            <input type="text" id="uploadTitle" placeholder="예: 삼성전자 2024년 가치평가" required>
                        </div>
                        <div class="upload-form-group">
                            <label for="uploadCompanyName">기업명</label>
                            <input type="text" id="uploadCompanyName" value="${currentData.financialStructure?.companyInfo?.name || ''}" required>
                        </div>
                        <div class="upload-form-actions">
                            <button type="button" class="btn-cancel" onclick="document.getElementById('uploadModal').remove()">취소</button>
                            <button type="button" class="btn-upload" onclick="window.valueWebApp.uploadToPortfolio()">업로드</button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Portfolio에 업로드
    async uploadToPortfolio() {
        const title = document.getElementById('uploadTitle').value.trim();
        const companyName = document.getElementById('uploadCompanyName').value.trim();

        if (!title || !companyName) {
            alert('제목과 기업명을 모두 입력해주세요.');
            return;
        }

        try {
            const currentData = dataManager.getData();
            if (!currentData) {
                alert('업로드할 데이터가 없습니다.');
                return;
            }

            const currentUser = window.firebaseConfig.auth.currentUser;
            if (!currentUser) {
                alert('로그인이 필요합니다.');
                return;
            }

            // Portfolio에 업로드
            await window.firebaseConfig.db.collection('sharedValuations').add({
                userId: currentUser.uid,
                userEmail: currentUser.email || '익명 사용자',
                title: title,
                companyName: companyName,
                uploadTime: firebase.firestore.FieldValue.serverTimestamp(),
                data: currentData
            });

            // 모달 닫기
            document.getElementById('uploadModal').remove();
            
            alert('Portfolio에 성공적으로 업로드되었습니다!');
            
        } catch (error) {
            console.error('업로드 실패:', error);
            alert('업로드에 실패했습니다.');
        }
    }

    // 설정 페이지 이벤트 설정
    setupSettingsEvents() {
        // 메인으로 돌아가기 버튼
        const backToMainBtn = document.getElementById('back-to-main');
        if (backToMainBtn) {
            backToMainBtn.addEventListener('click', () => {
                this.navigateToPage(1);
            });
        }

        // API 키 저장 버튼
        const saveApiKeyBtn = document.getElementById('save-api-key');
        if (saveApiKeyBtn) {
            saveApiKeyBtn.addEventListener('click', () => {
                this.saveApiKey();
            });
        }

        // 설정 페이지 로드 시 사용자 정보 표시
        this.loadUserSettings();
    }

    // 사용자 설정 로드
    async loadUserSettings() {
        try {
            const currentUser = window.firebaseConfig?.auth?.currentUser;
            if (!currentUser) return;

            // 사용자 정보 표시
            const settingsEmail = document.getElementById('settings-email');
            const settingsCreated = document.getElementById('settings-created');
            
            if (settingsEmail) {
                settingsEmail.textContent = currentUser.email || '익명 사용자';
            }
            
            if (settingsCreated) {
                const creationTime = new Date(currentUser.metadata.creationTime);
                settingsCreated.textContent = creationTime.toLocaleDateString('ko-KR');
            }

            // API 키 로드
            await this.loadApiKey();

        } catch (error) {
            console.error('사용자 설정 로드 실패:', error);
        }
    }

    // API 키 로드
    async loadApiKey() {
        try {
            const currentUser = window.firebaseConfig?.auth?.currentUser;
            if (!currentUser) return;

            const userSettingsDoc = await window.firebaseConfig.db.collection('userSettings').doc(currentUser.uid).get();
            if (userSettingsDoc.exists) {
                const settings = userSettingsDoc.data();
                const apiKeyInput = document.getElementById('gemini-api-key');
                const apiKeyStatus = document.getElementById('api-key-status');
                
                if (apiKeyInput && settings.geminiApiKey) {
                    apiKeyInput.value = settings.geminiApiKey;
                }
                
                if (apiKeyStatus) {
                    apiKeyStatus.textContent = settings.geminiApiKey ? '설정됨' : '미설정';
                    apiKeyStatus.style.color = settings.geminiApiKey ? '#28a745' : '#dc3545';
                }
            }
        } catch (error) {
            console.error('API 키 로드 실패:', error);
        }
    }

    // API 키 저장
    async saveApiKey() {
        try {
            const currentUser = window.firebaseConfig?.auth?.currentUser;
            if (!currentUser) {
                alert('로그인이 필요합니다.');
                return;
            }

            const apiKey = document.getElementById('gemini-api-key').value.trim();
            if (!apiKey) {
                alert('API 키를 입력해주세요.');
                return;
            }

            // Firestore에 저장
            await window.firebaseConfig.db.collection('userSettings').doc(currentUser.uid).set({
                geminiApiKey: apiKey,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            // 상태 업데이트
            const apiKeyStatus = document.getElementById('api-key-status');
            if (apiKeyStatus) {
                apiKeyStatus.textContent = '설정됨';
                apiKeyStatus.style.color = '#28a745';
            }

            alert('API 키가 저장되었습니다.');

        } catch (error) {
            console.error('API 키 저장 실패:', error);
            alert('API 키 저장에 실패했습니다.');
        }
    }

    // 페이지 네비게이션
    navigateToPage(pageNumber) {
        // 현재 페이지 숨기기
        document.querySelector(`#page${this.currentPage}`).classList.remove('active');
        document.querySelector(`[data-step="${this.currentPage}"]`).classList.remove('active');

        // 새 페이지 보이기
        document.querySelector(`#page${pageNumber}`).classList.add('active');
        document.querySelector(`[data-step="${pageNumber}"]`).classList.add('active');

        this.currentPage = pageNumber;

        // 페이지별 특별 처리
        if (pageNumber === 2) {
            this.setupPage2Scenarios();
        } else if (pageNumber === 3) {
            this.updateModelVisualization();
        } else if (pageNumber === 5) {
            this.setupPage5Analysis();
        }
    }

    // Page 2 시나리오 설정
    async setupPage2Scenarios() {
        console.log('setupPage2Scenarios 호출됨');
        const data = dataManager.getData();
        if (!data) {
            console.log('데이터가 없음');
            return;
        }

        const segments = data.financialStructure.businessSegments;
        console.log('사업부문들:', segments);
        const container = document.getElementById('segmentScenarios');
        if (!container) {
            console.error('segmentScenarios 컨테이너를 찾을 수 없음');
            return;
        }
        container.innerHTML = '';

        // 사용자 정의 사업부문들에 대한 시나리오 카드 생성
        segments.forEach(segment => {
            console.log('시나리오 카드 생성:', segment.name);
            const segmentCard = this.createSegmentScenarioCard(segment);
            container.appendChild(segmentCard);
        });

        // 기타 사업부문에 대한 시나리오 카드 생성
        const otherSegmentRevenue = parseFloat(document.getElementById('other-segment-revenue').value) || 0;
        console.log('기타 사업부문 매출:', otherSegmentRevenue);
        if (otherSegmentRevenue > 0) {
            const otherSegment = { name: '기타 (Other)', revenue: otherSegmentRevenue };
            const otherSegmentCard = this.createSegmentScenarioCard(otherSegment);
            container.appendChild(otherSegmentCard);
        }

        // 모든 카드에 대해 시나리오 로드
        for (const segment of segments) {
            await this.loadSegmentScenarios(segment.name);
            this.updateAIReviewButton(segment.name);
        }
        
        // 기타 사업부문 시나리오도 로드
        if (otherSegmentRevenue > 0) {
            await this.loadSegmentScenarios('기타 (Other)');
            this.updateAIReviewButton('기타 (Other)');
        }
    }

    // 사업부문 시나리오 카드 생성
    createSegmentScenarioCard(segment) {
        const card = document.createElement('div');
        card.className = 'segment-scenario-card';
        
        card.innerHTML = `
            <h3>${segment.name}</h3>
            <div class="scenario-list" id="scenarios-${segment.name}">
                <!-- 시나리오들이 여기에 추가됨 -->
            </div>
            <div class="segment-actions">
                <button type="button" class="btn-secondary add-scenario-btn" data-segment="${segment.name}">
                    + 시나리오 추가
                </button>
                <button type="button" class="btn-ai-review" data-segment="${segment.name}">
                    ⚡ AI Review
                </button>
            </div>
        `;

        // 시나리오 추가 버튼 이벤트
        card.querySelector('.add-scenario-btn').addEventListener('click', () => {
            this.addScenario(segment.name);
        });

        // AI Review 버튼 이벤트
        card.querySelector('.btn-ai-review').addEventListener('click', () => {
            this.analyzeScenariosWithAI(segment.name);
        });

        return card;
    }

    // 시나리오 추가
    async addScenario(segmentName) {
        const container = document.getElementById(`scenarios-${segmentName}`);
        const scenarioDiv = document.createElement('div');
        scenarioDiv.className = 'scenario-item';
        
        scenarioDiv.innerHTML = `
            <div class="scenario-item-header">
                <h4>시나리오 ${container.children.length + 1}</h4>
                <div class="scenario-header-actions">
                    <button type="button" class="btn-note-scenario">
                        📝 Note
                    </button>
                    <button type="button" class="btn-primary btn-visualize-scenario">
                        📊 시각화
                    </button>
                    <button type="button" class="btn-remove-scenario">삭제</button>
                </div>
            </div>
            
            <!-- 주요 설정 섹션 -->
            <div class="scenario-main-settings">
                <div class="form-group">
                    <label>시나리오 이름</label>
                    <input type="text" class="scenario-name" placeholder="예: 고성장">
                </div>
                <div class="form-group">
                    <label>발생 확률 (%)</label>
                    <input type="number" class="scenario-probability" value="50" min="0" max="100" step="0.1">
                </div>
                <div class="form-group">
                    <label>성장 모델</label>
                    <select class="scenario-growth-model">
                        <option value="cagr">CAGR (복합연평균성장률)</option>
                        <option value="growth">Growth (영구성장률 수렴)</option>
                        <option value="logistic">Logistic (로지스틱 성장)</option>
                    </select>
                </div>
            </div>
            
            <!-- 구분선 -->
            <div class="scenario-divider"></div>
            
            <!-- 모델별 입력 변수 섹션 -->
            <div class="scenario-model-inputs">
                <!-- CAGR 모델 입력 필드 -->
                <div class="cagr-inputs">
                    <div class="form-group">
                        <label>평균 성장률 (%)</label>
                        <input type="number" class="scenario-mean" value="5" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>성장률 표준편차 (%)</label>
                        <input type="number" class="scenario-std" value="2" step="0.1" min="0">
                    </div>
                </div>
                
                <!-- Growth 모델 입력 필드 -->
                <div class="growth-inputs" style="display: none;">
                    <div class="form-group">
                        <label>초기 성장률 (%)</label>
                        <input type="number" class="scenario-mean" value="5" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>성장률 표준편차 (%)</label>
                        <input type="number" class="scenario-std" value="2" step="0.1" min="0">
                    </div>
                </div>
                
                <!-- Logistic 모델 입력 필드 -->
                <div class="logistic-inputs" style="display: none;">
                    <div class="form-group">
                        <label>TAM (최대 시장 잠재력)</label>
                        <input type="text" class="scenario-tam" value="1000000" placeholder="TAM 입력">
                    </div>
                    <div class="form-group">
                        <label>변곡점까지 남은 연도</label>
                        <input type="number" class="scenario-inflection-point" value="3" min="1" max="20" step="0.5">
                    </div>
                </div>
            </div>
        `;

        // 삭제 버튼 이벤트
        scenarioDiv.querySelector('.btn-remove-scenario').addEventListener('click', async () => {
            container.removeChild(scenarioDiv);
            await this.updateSegmentScenarios(segmentName);
            this.updateAIReviewButton(segmentName);
        });

        // Note 버튼 이벤트
        scenarioDiv.querySelector('.btn-note-scenario').addEventListener('click', () => {
            this.showNoteModal(segmentName, scenarioDiv);
        });

        // 시각화 버튼 이벤트
        scenarioDiv.querySelector('.btn-visualize-scenario').addEventListener('click', () => {
            this.visualizeSingleScenario(segmentName, scenarioDiv);
        });

        // 성장 모델 선택 이벤트
        const growthModelSelect = scenarioDiv.querySelector('.scenario-growth-model');
        growthModelSelect.addEventListener('change', async () => {
            this.toggleGrowthModelInputs(scenarioDiv, growthModelSelect.value);
            await this.updateSegmentScenarios(segmentName);
        });

        // 입력 이벤트
        scenarioDiv.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', async () => {
                await this.updateSegmentScenarios(segmentName);
                // 입력 후 AI Review 버튼 상태 업데이트
                setTimeout(() => {
                    this.updateAIReviewButton(segmentName);
                }, 100);
            });
        });

        container.appendChild(scenarioDiv);
        await this.updateSegmentScenarios(segmentName);
        
        // 시나리오 추가 후 즉시 AI Review 버튼 상태 업데이트
        setTimeout(() => {
            this.updateAIReviewButton(segmentName);
        }, 100);
        
        // TAM 필드에 포맷팅 적용
        const tamInput = scenarioDiv.querySelector('.scenario-tam');
        if (tamInput) {
            tamInput.addEventListener('blur', (e) => {
                const value = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                e.target.value = this.formatNumber(value);
            });
            
            tamInput.addEventListener('focus', (e) => {
                const value = this.parseFormattedNumber(e.target.value);
                e.target.value = value;
            });
        }
    }

    // 사업부문 시나리오 로드
    async loadSegmentScenarios(segmentName) {
        const data = dataManager.getData();
        if (!data || !data.scenarioModel.segmentScenarios[segmentName]) return;

        const scenarios = data.scenarioModel.segmentScenarios[segmentName];
        const container = document.getElementById(`scenarios-${segmentName}`);
        
        if (!container) {
            console.warn(`scenarios-${segmentName} 컨테이너를 찾을 수 없음`);
            return;
        }

        scenarios.forEach((scenario, index) => {
            const scenarioDiv = document.createElement('div');
            scenarioDiv.className = 'scenario-item';
            
            scenarioDiv.innerHTML = `
                <div class="scenario-item-header">
                    <h4>${scenario.name || '시나리오'}</h4>
                    <div class="scenario-header-actions">
                        <button type="button" class="btn-note-scenario ${scenario.note && scenario.note.trim() ? 'has-note' : ''}">
                            ${scenario.note && scenario.note.trim() ? '📝 Note ✓' : '📝 Note'}
                        </button>
                        <button type="button" class="btn-primary btn-visualize-scenario">
                            📊 시각화
                        </button>
                        <button type="button" class="btn-remove-scenario">삭제</button>
                    </div>
                </div>
                
                <!-- 주요 설정 섹션 -->
                <div class="scenario-main-settings">
                    <div class="form-group">
                        <label>시나리오 이름</label>
                        <input type="text" class="scenario-name" value="${scenario.name || ''}" placeholder="예: 고성장">
                    </div>
                    <div class="form-group">
                        <label>발생 확률 (%)</label>
                        <input type="number" class="scenario-probability" value="${scenario.probability || 50}" min="0" max="100" step="0.1">
                    </div>
                    <div class="form-group">
                        <label>성장 모델</label>
                        <select class="scenario-growth-model">
                            <option value="cagr" ${scenario.growthModel === 'cagr' ? 'selected' : ''}>CAGR (복합연평균성장률)</option>
                            <option value="growth" ${scenario.growthModel === 'growth' ? 'selected' : ''}>Growth (영구성장률 수렴)</option>
                            <option value="logistic" ${scenario.growthModel === 'logistic' ? 'selected' : ''}>Logistic (로지스틱 성장)</option>
                        </select>
                    </div>
                </div>
                
                <!-- 구분선 -->
                <div class="scenario-divider"></div>
                
                <!-- 모델별 입력 변수 섹션 -->
                <div class="scenario-model-inputs">
                    <!-- CAGR 모델 입력 필드 -->
                    <div class="cagr-inputs" ${scenario.growthModel === 'cagr' ? '' : 'style="display: none"'}>
                        <div class="form-group">
                            <label>평균 성장률 (%)</label>
                            <input type="number" class="scenario-mean" value="${scenario.meanGrowthRate || 5}" step="0.1">
                        </div>
                        <div class="form-group">
                            <label>성장률 표준편차 (%)</label>
                            <input type="number" class="scenario-std" value="${scenario.stdDevGrowthRate || 2}" step="0.1" min="0">
                        </div>
                    </div>
                    
                    <!-- Growth 모델 입력 필드 -->
                    <div class="growth-inputs" ${scenario.growthModel === 'growth' ? '' : 'style="display: none"'}>
                        <div class="form-group">
                            <label>초기 성장률 (%)</label>
                            <input type="number" class="scenario-mean" value="${scenario.meanGrowthRate || 5}" step="0.1">
                        </div>
                        <div class="form-group">
                            <label>성장률 표준편차 (%)</label>
                            <input type="number" class="scenario-std" value="${scenario.stdDevGrowthRate || 2}" step="0.1" min="0">
                        </div>
                    </div>
                    
                    <!-- Logistic 모델 입력 필드 -->
                    <div class="logistic-inputs" ${scenario.growthModel === 'logistic' ? '' : 'style="display: none"'}>
                        <div class="form-group">
                            <label>TAM (최대 시장 잠재력)</label>
                            <input type="text" class="scenario-tam" value="${scenario.tam || '1000000'}" placeholder="TAM 입력">
                        </div>
                        <div class="form-group">
                            <label>변곡점까지 남은 연도</label>
                            <input type="number" class="scenario-inflection-point" value="${scenario.inflectionPoint || 3}" min="1" max="20" step="0.5">
                        </div>
                    </div>
                </div>
            `;

            // 이벤트 리스너 추가
            scenarioDiv.querySelector('.btn-note-scenario').addEventListener('click', () => {
                this.showNoteModal(segmentName, scenarioDiv);
            });

                    scenarioDiv.querySelector('.btn-remove-scenario').addEventListener('click', async () => {
            container.removeChild(scenarioDiv);
            await this.updateSegmentScenarios(segmentName);
            this.updateAIReviewButton(segmentName);
        });

            // 시각화 버튼 이벤트
            scenarioDiv.querySelector('.btn-visualize-scenario').addEventListener('click', () => {
                this.visualizeSingleScenario(segmentName, scenarioDiv);
            });

            // 성장 모델 선택 이벤트
            const growthModelSelect = scenarioDiv.querySelector('.scenario-growth-model');
            growthModelSelect.addEventListener('change', async () => {
                this.toggleGrowthModelInputs(scenarioDiv, growthModelSelect.value);
                await this.updateSegmentScenarios(segmentName);
            });

            scenarioDiv.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', async () => {
                    await this.updateSegmentScenarios(segmentName);
                    // 입력 후 AI Review 버튼 상태 업데이트
                    setTimeout(() => {
                        this.updateAIReviewButton(segmentName);
                    }, 100);
                });
            });

            container.appendChild(scenarioDiv);
            
            // TAM 필드에 포맷팅 적용
            const tamInput = scenarioDiv.querySelector('.scenario-tam');
            if (tamInput) {
                tamInput.addEventListener('blur', (e) => {
                    const value = parseFloat(e.target.value.replace(/,/g, '')) || 0;
                    e.target.value = this.formatNumber(value);
                });
                
                tamInput.addEventListener('focus', (e) => {
                    const value = this.parseFormattedNumber(e.target.value);
                    e.target.value = value;
                });
            }
        });
    }

    // 사업부문 시나리오 업데이트
    async updateSegmentScenarios(segmentName) {
        const container = document.getElementById(`scenarios-${segmentName}`);
        const scenarios = [];

        container.querySelectorAll('.scenario-item').forEach((item, index) => {
            const name = item.querySelector('.scenario-name').value.trim();
            const probability = parseFloat(item.querySelector('.scenario-probability').value) || 0;
            const growthModel = item.querySelector('.scenario-growth-model').value;
            
            let meanGrowthRate = 0;
            let stdDevGrowthRate = 0;
            let tam = 0;
            let inflectionPoint = 0;

            if (growthModel === 'cagr') {
                meanGrowthRate = parseFloat(item.querySelector('.scenario-mean').value) || 0;
                stdDevGrowthRate = parseFloat(item.querySelector('.scenario-std').value) || 0;
            } else if (growthModel === 'growth') {
                meanGrowthRate = parseFloat(item.querySelector('.scenario-mean').value) || 0;
                stdDevGrowthRate = parseFloat(item.querySelector('.scenario-std').value) || 0;
            } else if (growthModel === 'logistic') {
                tam = this.parseFormattedNumber(item.querySelector('.scenario-tam').value);
                inflectionPoint = parseFloat(item.querySelector('.scenario-inflection-point').value) || 0;
            }

            if (name && probability > 0) {
                // 기존 note 정보 가져오기
                const currentData = dataManager.getData();
                const existingScenarios = currentData?.scenarioModel?.segmentScenarios?.[segmentName] || [];
                const existingNote = existingScenarios[index]?.note || '';
                
                scenarios.push({
                    name,
                    probability,
                    growthModel,
                    meanGrowthRate,
                    stdDevGrowthRate,
                    tam,
                    inflectionPoint,
                    note: existingNote
                });
            }
        });

        console.log(`시나리오 업데이트 - ${segmentName}:`, scenarios);

        const currentData = dataManager.getData();
        if (currentData) {
            if (!currentData.scenarioModel.segmentScenarios) {
                currentData.scenarioModel.segmentScenarios = {};
            }
            currentData.scenarioModel.segmentScenarios[segmentName] = scenarios;
            await dataManager.saveData(currentData);
        }

        // 확률 합계 검증 및 경고 표시
        this.validateScenarioProbabilities(segmentName, scenarios);
    }

    // 시나리오 확률 합계 검증
    validateScenarioProbabilities(segmentName, scenarios) {
        const totalProbability = scenarios.reduce((sum, scenario) => sum + scenario.probability, 0);
        const card = document.querySelector(`[data-segment="${segmentName}"]`).closest('.segment-scenario-card');
        
        // 기존 경고 제거
        const existingWarning = card.querySelector('.probability-warning');
        if (existingWarning) {
            existingWarning.remove();
        }

        // 확률 합이 100%가 아니면 경고 표시
        if (scenarios.length > 0 && Math.abs(totalProbability - 100) > 0.1) {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'probability-warning';
            warningDiv.innerHTML = `
                <div style="
                    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
                    color: white;
                    padding: 0.75rem 1rem;
                    border-radius: 8px;
                    margin: 1rem 0;
                    font-size: 0.9rem;
                    font-weight: 600;
                    text-align: center;
                    box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
                ">
                    ⚠️ 시나리오 확률 합계: ${totalProbability.toFixed(1)}% (100%가 되어야 합니다)
                </div>
            `;
            
            // 시나리오 리스트 다음에 경고 삽입
            const scenarioList = card.querySelector('.scenario-list');
            scenarioList.parentNode.insertBefore(warningDiv, scenarioList.nextSibling);
        }
    }

    // 시뮬레이션 시작
    async startSimulation() {
        console.log('=== 시뮬레이션 시작 ===');
        
        const iterationCount = parseInt(document.getElementById('iterationCount').value);
        console.log('시뮬레이션 횟수:', iterationCount);
        
        if (iterationCount < 100 || iterationCount > 10000) {
            alert('시뮬레이션 횟수는 100~10,000 사이여야 합니다.');
            return;
        }

        // 데이터 확인
        const data = dataManager.getData();
        console.log('로드된 데이터:', data);
        
        if (!data) {
            alert('데이터를 찾을 수 없습니다. 재무 구조 분석을 먼저 완료해주세요.');
            return;
        }

        // 필수 데이터 검증
        if (!data.financialStructure.businessSegments || data.financialStructure.businessSegments.length === 0) {
            alert('사업부문이 없습니다. 재무 구조 분석에서 사업부문을 추가해주세요.');
            return;
        }

        if (!data.scenarioModel.segmentScenarios || Object.keys(data.scenarioModel.segmentScenarios).length === 0) {
            alert('시나리오가 없습니다. 확률론적 시나리오 모델링에서 시나리오를 추가해주세요.');
            return;
        }

        // UI 상태 변경
        document.getElementById('startSimulation').style.display = 'none';
        document.getElementById('stopSimulation').style.display = 'inline-block';
        document.querySelector('.progress-container').style.display = 'block';
        document.querySelector('.simulation-results').style.display = 'none';
        document.getElementById('nextToPage4').disabled = true;

        try {
            console.log('시뮬레이션 엔진 호출 시작');
            const results = await simulationEngine.runSimulation(iterationCount, (progress) => {
                // 진행률 업데이트
                document.querySelector('.progress-fill').style.width = `${progress}%`;
                document.querySelector('.progress-text').textContent = `${Math.round(progress)}%`;
            });

            console.log('시뮬레이션 결과:', results);
            
            // 결과 저장
            dataManager.saveSimulationResults(results);
            
            // 결과 표시
            this.displaySimulationResults(results);
            
        } catch (error) {
            console.error('시뮬레이션 오류:', error);
            alert('시뮬레이션 중 오류가 발생했습니다: ' + error.message);
        } finally {
            // UI 상태 복원
            document.getElementById('startSimulation').style.display = 'inline-block';
            document.getElementById('stopSimulation').style.display = 'none';
            document.querySelector('.progress-container').style.display = 'none';
        }
    }

    // 시뮬레이션 중지
    stopSimulation() {
        simulationEngine.stopSimulation();
    }

    // 시뮬레이션 결과 표시
    displaySimulationResults(results) {
        const { statistics, histogram } = results;
        
        // 현재 기업가치 가져오기
        const data = dataManager.getData();
        const currentMarketValue = data?.financialStructure?.companyInfo?.marketValue || 0;
        
        // 통계 업데이트 (단위 변환 적용)
        document.getElementById('meanValue').textContent = this.formatCurrency(statistics.mean);
        document.getElementById('medianValue').textContent = this.formatCurrency(statistics.median);
        document.getElementById('stdDevValue').textContent = this.formatCurrency(statistics.stdDev);
        document.getElementById('minValue').textContent = this.formatCurrency(statistics.min);
        document.getElementById('maxValue').textContent = this.formatCurrency(statistics.max);
        document.getElementById('percentile25').textContent = this.formatCurrency(statistics.percentile25);
        document.getElementById('percentile75').textContent = this.formatCurrency(statistics.percentile75);

        // 현재가치 표시
        const currentValueElement = document.getElementById('currentValue');
        if (currentValueElement) {
            if (currentMarketValue > 0) {
                currentValueElement.textContent = this.formatCurrency(currentMarketValue);
                // 현재가치 요소에 특별한 스타일 클래스 추가
                const currentValueItem = currentValueElement.closest('.current-value-item');
                if (currentValueItem) {
                    currentValueItem.style.display = 'flex';
                }
            } else {
                currentValueElement.textContent = '미입력';
                // 현재가치가 없으면 요소 숨기기
                const currentValueItem = currentValueElement.closest('.current-value-item');
                if (currentValueItem) {
                    currentValueItem.style.display = 'none';
                }
            }
        }

        // 결과 표시
        document.querySelector('.simulation-results').style.display = 'block';
        
        // 다음 단계 버튼 활성화
        document.getElementById('nextToPage4').disabled = false;
        
        // 차트 생성
        this.createValueDistributionChart(histogram);
        
        // 현재 기업가치가 있으면 투자 분석도 자동 실행
        if (currentMarketValue && currentMarketValue > 0) {
            this.updateInvestmentAnalysis(currentMarketValue);
        }
    }

    // 가치 분포 차트 생성
    createValueDistributionChart(histogramData) {
        const ctx = document.getElementById('valueDistributionChart').getContext('2d');
        
        if (this.charts.valueDistribution) {
            this.charts.valueDistribution.destroy();
        }

        // 현재 기업가치 가져오기
        const data = dataManager.getData();
        const currentMarketValue = data?.financialStructure?.companyInfo?.marketValue || 0;
        
        console.log('현재가치 확인:', currentMarketValue);

        // 히스토그램 데이터 준비
        const labels = histogramData.labels.map(label => {
            // Million 기준으로 라벨 파싱
            if (typeof label === 'string') {
                if (label.includes('T')) {
                    return parseFloat(label.replace('T', '')) * 1e6; // Trillion -> Million
                } else if (label.includes('B')) {
                    return parseFloat(label.replace('B', '')) * 1e3; // Billion -> Million
                } else if (label.includes('M')) {
                    return parseFloat(label.replace('M', '')); // Million
                }
                return parseFloat(label);
            }
            return parseFloat(label);
        });
        const dataValues = histogramData.data;
        
        // 현재가치가 히스토그램 범위에 포함되도록 데이터 확장
        let extendedLabels = [...labels];
        let extendedData = [...dataValues];
        
        if (currentMarketValue > 0) {
            const minValue = Math.min(...labels);
            const maxValue = Math.max(...labels);
            const binWidth = labels[1] - labels[0];
            
            // 현재가치가 범위 밖에 있는 경우 데이터 확장
            if (currentMarketValue < minValue) {
                // 현재가치가 최소값보다 작은 경우
                const additionalBins = Math.ceil((minValue - currentMarketValue) / binWidth) + 2;
                for (let i = additionalBins; i > 0; i--) {
                    const newValue = currentMarketValue + (additionalBins - i) * binWidth;
                    extendedLabels.unshift(newValue);
                    extendedData.unshift(0);
                }
            } else if (currentMarketValue > maxValue) {
                // 현재가치가 최대값보다 큰 경우
                const additionalBins = Math.ceil((currentMarketValue - maxValue) / binWidth) + 2;
                for (let i = 1; i <= additionalBins; i++) {
                    const newValue = maxValue + i * binWidth;
                    extendedLabels.push(newValue);
                    extendedData.push(0);
                }
            }
        }
        
        // 라벨에 단위 변환 적용
        const formattedLabels = extendedLabels.map(label => this.formatCurrency(label));

        // 데이터셋 구성
        const datasets = [
            {
                label: '기업가치 분포',
                data: extendedData,
                backgroundColor: 'rgba(102, 126, 234, 0.2)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 3,
                fill: true
            }
        ];

        // annotation 설정 (현재가치가 있는 경우에만)
        const annotations = {};
        if (currentMarketValue > 0) {
            // 현재가치가 확장된 라벨 배열에서 어느 위치에 있는지 찾기
            let currentValueIndex = -1;
            for (let i = 0; i < extendedLabels.length; i++) {
                if (extendedLabels[i] >= currentMarketValue) {
                    currentValueIndex = i;
                    break;
                }
            }
            
            // 현재가치가 범위 밖에 있는 경우 처리
            if (currentValueIndex === -1) {
                if (currentMarketValue < Math.min(...extendedLabels)) {
                    currentValueIndex = 0;
                } else {
                    currentValueIndex = extendedLabels.length - 1;
                }
            }
            
            annotations.currentValue = {
                type: 'line',
                xMin: currentValueIndex,
                xMax: currentValueIndex,
                borderColor: '#e74c3c',
                borderWidth: 3,
                borderDash: [5, 5],
                label: {
                    content: '현재가치: ' + this.formatCurrency(currentMarketValue),
                    enabled: true,
                    position: 'top',
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    font: {
                        size: 12,
                        weight: 'bold'
                    },
                    padding: 4,
                    borderRadius: 4
                }
            };
        }

        this.charts.valueDistribution = new Chart(ctx, {
            type: 'line',
            data: {
                labels: formattedLabels,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '빈도'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '기업가치'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            title: function(tooltipItems) {
                                const dataIndex = tooltipItems[0].dataIndex;
                                const value = extendedLabels[dataIndex];
                                return '기업가치: ' + this.formatCurrency(value);
                            }.bind(this),
                            label: function(context) {
                                return '빈도: ' + context.parsed.y;
                            }
                        }
                    },
                    annotation: {
                        annotations: annotations
                    }
                },
                elements: {
                    line: {
                        tension: 0.4,
                        borderWidth: 3
                    },
                    point: {
                        radius: 0,
                        hoverRadius: 6
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    // Page 4 분석 설정
    setupPage5Analysis() {
        const data = dataManager.getData();
        if (data && data.simulationResults.values) {
            // 저장된 기업가치가 있으면 자동으로 분석 실행
            const marketValue = data.financialStructure.companyInfo.marketValue;
            if (marketValue && marketValue > 0) {
                this.updateInvestmentAnalysis(marketValue);
            } else {
                // 기업가치가 없으면 안내 메시지 표시
                document.querySelector('.investment-results').style.display = 'block';
                document.querySelector('.investment-results').innerHTML = `
                    <div class="result-card">
                        <h3>투자 분석 안내</h3>
                        <p style="text-align: center; color: #666; font-size: 1.1rem;">
                            투자 분석을 위해서는 Page 1에서 현재 기업가치를 입력해주세요.
                        </p>
                    </div>
                `;
            }
        } else {
            // 시뮬레이션 결과가 없으면 안내 메시지 표시
            document.querySelector('.investment-results').style.display = 'block';
            document.querySelector('.investment-results').innerHTML = `
                <div class="result-card">
                    <h3>투자 분석 안내</h3>
                    <p style="text-align: center; color: #666; font-size: 1.1rem;">
                        투자 분석을 위해서는 먼저 시뮬레이션을 실행해주세요.
                    </p>
                </div>
            `;
        }
    }

    // 투자 분석 업데이트
    updateInvestmentAnalysis(marketValue) {
        const data = dataManager.getData();
        if (!data || !data.simulationResults.values) return;

        // 기업가치가 전달되지 않으면 저장된 값 사용
        const valueToUse = marketValue || data.financialStructure.companyInfo.marketValue || 0;
        
        if (valueToUse <= 0) {
            alert('현재 기업가치를 입력해주세요.');
            return;
        }

        // 새로운 투자 분석 지표 계산
        const analysis = this.calculateNewInvestmentMetrics(data.simulationResults.values, valueToUse, data.financialStructure.companyInfo.terminalGrowthRate);
        
        // 통계 업데이트
        document.getElementById('expectedReturn').textContent = `${analysis.expectedReturn.toFixed(2)}%`;
        document.getElementById('profitLossRatio').textContent = `${analysis.profitLossRatio.toFixed(2)}`;
        document.getElementById('sharpeRatio').textContent = `${analysis.sharpeRatio.toFixed(2)}`;

        // Upside/Downside 차트 생성
        this.createUpsideDownsideChart(data.simulationResults.values, valueToUse);

        // 결과 표시
        document.querySelector('.investment-results').style.display = 'block';
    }

    // 새로운 투자 분석 지표 계산
    calculateNewInvestmentMetrics(values, marketValue, riskFreeRate) {
        // 1. 기대 수익률 (전체 분포의 기댓값)
        const totalReturn = values.reduce((sum, value) => {
            return sum + ((value - marketValue) / marketValue) * 100;
        }, 0);
        const expectedReturn = totalReturn / values.length;

        // 2. 손익비 계산
        const upsideValues = values.filter(value => value > marketValue);
        const downsideValues = values.filter(value => value <= marketValue);
        
        let upsideExpectedReturn = 0;
        let downsideExpectedLoss = 0;
        
        if (upsideValues.length > 0) {
            const upsideReturns = upsideValues.map(value => ((value - marketValue) / marketValue) * 100);
            upsideExpectedReturn = upsideReturns.reduce((sum, ret) => sum + ret, 0) / upsideReturns.length;
        }
        
        if (downsideValues.length > 0) {
            const downsideReturns = downsideValues.map(value => ((value - marketValue) / marketValue) * 100);
            downsideExpectedLoss = Math.abs(downsideReturns.reduce((sum, ret) => sum + ret, 0) / downsideReturns.length);
        }
        
        const profitLossRatio = downsideExpectedLoss > 0 ? upsideExpectedReturn / downsideExpectedLoss : 0;

        // 3. 샤프 비율 계산
        const returns = values.map(value => ((value - marketValue) / marketValue) * 100);
        const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
        const standardDeviation = Math.sqrt(variance);
        
        const riskFreeRatePercent = riskFreeRate || 2.5; // 기본값 2.5%
        const sharpeRatio = standardDeviation > 0 ? (meanReturn - riskFreeRatePercent) / standardDeviation : 0;

        return {
            expectedReturn,
            profitLossRatio,
            sharpeRatio
        };
    }

    // Upside/Downside 차트 생성
    createUpsideDownsideChart(values, marketValue) {
        const ctx = document.getElementById('upsideDownsideChart').getContext('2d');
        
        if (this.charts.upsideDownside) {
            this.charts.upsideDownside.destroy();
        }

        // 전체 히스토그램 데이터 생성
        const histogram = simulationEngine.generateHistogramData(values, 30);
        
        // 각 구간별로 Upside/Downside 분류
        const upsideData = [];
        const downsideData = [];
        
        for (let i = 0; i < histogram.data.length; i++) {
            // Million 기준으로 라벨 파싱
            let binStart = 0;
            if (typeof histogram.labels[i] === 'string') {
                if (histogram.labels[i].includes('T')) {
                    binStart = parseFloat(histogram.labels[i].replace('T', '')) * 1e6; // Trillion -> Million
                } else if (histogram.labels[i].includes('B')) {
                    binStart = parseFloat(histogram.labels[i].replace('B', '')) * 1e3; // Billion -> Million
                } else if (histogram.labels[i].includes('M')) {
                    binStart = parseFloat(histogram.labels[i].replace('M', '')); // Million
                } else {
                    binStart = parseFloat(histogram.labels[i]);
                }
            } else {
                binStart = parseFloat(histogram.labels[i]);
            }
            
            let binEnd = 0;
            if (i < histogram.data.length - 1) {
                if (typeof histogram.labels[i + 1] === 'string') {
                    if (histogram.labels[i + 1].includes('T')) {
                        binEnd = parseFloat(histogram.labels[i + 1].replace('T', '')) * 1e6;
                    } else if (histogram.labels[i + 1].includes('B')) {
                        binEnd = parseFloat(histogram.labels[i + 1].replace('B', '')) * 1e3;
                    } else if (histogram.labels[i + 1].includes('M')) {
                        binEnd = parseFloat(histogram.labels[i + 1].replace('M', ''));
                    } else {
                        binEnd = parseFloat(histogram.labels[i + 1]);
                    }
                } else {
                    binEnd = parseFloat(histogram.labels[i + 1]);
                }
            } else {
                binEnd = binStart + (binStart - (i > 0 ? parseFloat(histogram.labels[i - 1]) : 0));
            }
            
            const binCenter = (binStart + binEnd) / 2;
            
            if (binCenter > marketValue) {
                upsideData.push(histogram.data[i]);
                downsideData.push(0);
            } else {
                upsideData.push(0);
                downsideData.push(histogram.data[i]);
            }
        }

        // 라벨에 단위 변환 적용
        const formattedLabels = histogram.labels.map(label => this.formatCurrency(parseFloat(label)));

        this.charts.upsideDownside = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: formattedLabels,
                datasets: [
                    {
                        label: 'Upside',
                        data: upsideData,
                        backgroundColor: 'rgba(46, 204, 113, 0.7)',
                        borderColor: 'rgba(46, 204, 113, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Downside',
                        data: downsideData,
                        backgroundColor: 'rgba(231, 76, 60, 0.7)',
                        borderColor: 'rgba(231, 76, 60, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '빈도'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '기업가치'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    annotation: {
                        annotations: {
                            currentValueLine: {
                                type: 'line',
                                xMin: this.findBinIndex(histogram.labels, marketValue),
                                xMax: this.findBinIndex(histogram.labels, marketValue),
                                borderColor: '#2c3e50',
                                borderWidth: 3,
                                borderDash: [8, 4],
                                label: {
                                    content: `현재가치: ${this.formatCurrency(marketValue)}`,
                                    enabled: true,
                                    position: 'top',
                                    backgroundColor: '#2c3e50',
                                    color: 'white',
                                    font: {
                                        size: 12,
                                        weight: 'bold'
                                    },
                                    padding: 6,
                                    borderRadius: 4,
                                    yAdjust: -10
                                }
                            }
                        }
                    }
                }
            }
        });
    }

    // 현재가치가 속한 구간 인덱스 찾기
    findBinIndex(labels, value) {
        for (let i = 0; i < labels.length - 1; i++) {
            // Million 기준으로 라벨 파싱
            let binStart = 0;
            if (typeof labels[i] === 'string') {
                if (labels[i].includes('T')) {
                    binStart = parseFloat(labels[i].replace('T', '')) * 1e6; // Trillion -> Million
                } else if (labels[i].includes('B')) {
                    binStart = parseFloat(labels[i].replace('B', '')) * 1e3; // Billion -> Million
                } else if (labels[i].includes('M')) {
                    binStart = parseFloat(labels[i].replace('M', '')); // Million
                } else {
                    binStart = parseFloat(labels[i]);
                }
            } else {
                binStart = parseFloat(labels[i]);
            }
            
            let binEnd = 0;
            if (typeof labels[i + 1] === 'string') {
                if (labels[i + 1].includes('T')) {
                    binEnd = parseFloat(labels[i + 1].replace('T', '')) * 1e6;
                } else if (labels[i + 1].includes('B')) {
                    binEnd = parseFloat(labels[i + 1].replace('B', '')) * 1e3;
                } else if (labels[i + 1].includes('M')) {
                    binEnd = parseFloat(labels[i + 1].replace('M', ''));
                } else {
                    binEnd = parseFloat(labels[i + 1]);
                }
            } else {
                binEnd = parseFloat(labels[i + 1]);
            }
            
            if (value >= binStart && value < binEnd) {
                return i;
            }
        }
        return labels.length - 1; // 마지막 구간
    }

    // 데이터 내보내기
    exportData() {
        // 내보내기 전에 데이터 구조 확인
        const data = dataManager.getData();
        console.log('내보내기 데이터 구조 확인:', {
            financialStructure: data?.financialStructure ? '✓' : '✗',
            scenarioModel: data?.scenarioModel ? '✓' : '✗',
            segmentScenarios: data?.scenarioModel?.segmentScenarios ? '✓' : '✗',
            scenarioFields: data?.scenarioModel?.segmentScenarios ? 
                Object.keys(data.scenarioModel.segmentScenarios).map(segment => ({
                    segment,
                    scenarios: data.scenarioModel.segmentScenarios[segment].map(s => ({
                        name: s.name,
                        probability: s.probability,
                        growthModel: s.growthModel,
                        meanGrowthRate: s.meanGrowthRate,
                        stdDevGrowthRate: s.stdDevGrowthRate,
                        tam: s.tam,
                        inflectionPoint: s.inflectionPoint,
                        note: s.note ? '✓' : '✗'
                    }))
                })) : '✗'
        });
        
        dataManager.exportData();
    }

    // 데이터 가져오기
    async importData(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    console.log('가져오기 데이터 구조 확인:', {
                        financialStructure: data?.financialStructure ? '✓' : '✗',
                        scenarioModel: data?.scenarioModel ? '✓' : '✗',
                        segmentScenarios: data?.scenarioModel?.segmentScenarios ? '✓' : '✗',
                        scenarioFields: data?.scenarioModel?.segmentScenarios ? 
                            Object.keys(data.scenarioModel.segmentScenarios).map(segment => ({
                                segment,
                                scenarios: data.scenarioModel.segmentScenarios[segment].map(s => ({
                                    name: s.name,
                                    probability: s.probability,
                                    growthModel: s.growthModel,
                                    meanGrowthRate: s.meanGrowthRate,
                                    stdDevGrowthRate: s.stdDevGrowthRate,
                                    tam: s.tam,
                                    inflectionPoint: s.inflectionPoint,
                                    note: s.note ? '✓' : '✗'
                                }))
                            })) : '✗'
                    });
                    
                    if (dataManager.validateData(data)) {
                        await dataManager.importData(data);
                        await this.loadData();
                        this.updateUI();
                        alert('데이터가 성공적으로 가져와졌습니다.');
                    } else {
                        alert('잘못된 데이터 형식입니다. 콘솔을 확인해주세요.');
                    }
                } catch (error) {
                    console.error('파일 읽기 오류:', error);
                    alert('파일을 읽는 중 오류가 발생했습니다.');
                }
            };
            reader.readAsText(file);
        }
    }

    // UI 업데이트
    updateUI() {
        // 페이지별 UI 업데이트 로직
        if (this.currentPage === 2) {
            console.log('updateUI에서 setupPage2Scenarios 호출');
            this.setupPage2Scenarios();
        }
    }

    // Page 1 유효성 검사
    validatePage1() {
        const data = dataManager.getData();
        if (!data) return false;

        const { companyInfo, businessSegments } = data.financialStructure;
        
        if (!companyInfo.name.trim()) {
            alert('기업명을 입력해주세요.');
            return false;
        }

        if (businessSegments.length === 0) {
            alert('최소 하나의 사업부문을 추가해주세요.');
            return false;
        }

        return true;
    }

    // Page 2 유효성 검사
    validatePage2() {
        const data = dataManager.getData();
        if (!data) return false;

        const { segmentScenarios } = data.scenarioModel;
        const segments = data.financialStructure.businessSegments;
        
        // 사용자 정의 사업부문들 확인
        for (const segment of segments) {
            if (!segmentScenarios[segment.name] || segmentScenarios[segment.name].length === 0) {
                alert(`${segment.name} 사업부문에 최소 하나의 시나리오를 추가해주세요.`);
                return false;
            }
        }
        
        // 기타 사업부문 확인 (매출이 있는 경우)
        const otherSegmentRevenue = parseFloat(document.getElementById('other-segment-revenue').value) || 0;
        if (otherSegmentRevenue > 0) {
            if (!segmentScenarios['기타 (Other)'] || segmentScenarios['기타 (Other)'].length === 0) {
                alert('기타 (Other) 사업부문에 최소 하나의 시나리오를 추가해주세요.');
                return false;
            }
        }

        return true;
    }

    // AI 기업 분석
    async analyzeCompanyWithAI() {
        // 기업명을 직접 입력 필드에서 가져오기
        const companyNameInput = document.getElementById('companyName');
        const companyName = companyNameInput ? companyNameInput.value.trim() : '';
        
        if (!companyName) {
            alert('기업명을 입력해주세요.');
            if (companyNameInput) {
                companyNameInput.focus();
            }
            return;
        }
        
        // 설정에서 저장된 API 키 가져오기
        let apiKey = '';
        try {
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                const userSettingsDoc = await firebase.firestore().collection('userSettings').doc(currentUser.uid).get();
                if (userSettingsDoc.exists) {
                    const settings = userSettingsDoc.data();
                    apiKey = settings.geminiApiKey || '';
                }
            }
        } catch (error) {
            console.error('API 키 로드 오류:', error);
        }

        if (!apiKey || !apiKey.trim()) {
            alert('설정에서 Gemini API 키를 먼저 입력해주세요.\n\n설정 방법:\n1. 우측 상단 설정 버튼(⚙️) 클릭\n2. API 설정에서 Gemini API 키 입력\n3. 저장 후 다시 시도');
            return;
        }

        // 분석 결과 박스 표시
        const resultBox = document.getElementById('aiAnalysisResult');
        const contentBox = document.getElementById('aiAnalysisContent');
        resultBox.style.display = 'block';
        contentBox.className = 'loading';
        contentBox.innerHTML = '<div class="loading-text">분석 중...</div>';

        try {
            const prompt = `${companyName}의 사업을 설명해줘`;
            const response = await this.callGeminiAPI(apiKey, prompt);
            contentBox.className = '';
            contentBox.textContent = response;
        } catch (error) {
            console.error('AI 분석 오류:', error);
            contentBox.className = '';
            contentBox.textContent = 'AI 분석 중 오류가 발생했습니다: ' + error.message;
        }
    }

    // Gemini API 호출
    async callGeminiAPI(apiKey, prompt) {
        
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API 응답 오류:', response.status, errorText);
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            console.log('API 응답:', data);
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content) {
                return data.candidates[0].content.parts[0].text;
            } else {
                throw new Error('API 응답 형식이 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('API 호출 상세 오류:', error);
            throw new Error(`API 호출 중 오류: ${error.message}`);
        }
    }

    // Cost Model Check
    async checkCostModel() {
        // 기업명을 직접 입력 필드에서 가져오기
        const companyNameInput = document.getElementById('companyName');
        const companyName = companyNameInput ? companyNameInput.value.trim() : '';
        
        if (!companyName) {
            alert('기업명을 입력해주세요.');
            if (companyNameInput) {
                companyNameInput.focus();
            }
            return;
        }
        
        // 설정에서 저장된 API 키 가져오기
        let apiKey = '';
        try {
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                const userSettingsDoc = await firebase.firestore().collection('userSettings').doc(currentUser.uid).get();
                if (userSettingsDoc.exists) {
                    const settings = userSettingsDoc.data();
                    apiKey = settings.geminiApiKey || '';
                }
            }
        } catch (error) {
            console.error('API 키 로드 오류:', error);
        }

        if (!apiKey || !apiKey.trim()) {
            alert('설정에서 Gemini API 키를 먼저 입력해주세요.');
            return;
        }

        // 모달 생성 및 표시
        this.showCostModelModal();

        try {
            const response = await this.callCostModelAPI(apiKey, companyName, data);
            this.updateCostModelModal(response);
        } catch (error) {
            console.error('Cost Model Check 오류:', error);
            this.updateCostModelModal('Cost Model Check 중 오류가 발생했습니다: ' + error.message);
        }
    }

    // Cost Model API 호출
    async callCostModelAPI(apiKey, companyName, data) {
        if (!data || !data.financialStructure || !data.financialStructure.costStructure) {
            throw new Error('비용 구조 데이터를 찾을 수 없습니다.');
        }
        
        const costStructure = data.financialStructure.costStructure;
        
        // 비용 항목들을 안전하게 가져오기
        const cogs = costStructure.cogs || { amount: 0, variableRatio: 0 };
        const depreciation = costStructure.depreciation || { amount: 0, variableRatio: 0 };
        const labor = costStructure.labor || { amount: 0, variableRatio: 0 };
        const rd = costStructure.rd || { amount: 0, variableRatio: 0 };
        const advertising = costStructure.advertising || { amount: 0, variableRatio: 0 };
        
        const prompt = `${companyName}의 비용 구조를 매출원가, 감가상각비, 인건비, 연구개발비, 광고선전비로 나누어 분석하고싶어
여기서 고정비는 비용 지출 중에서 고정으로 지출되는 비용 비중이고,
변동비는 매출에 연동되는 비용 비중이야. 매출원가에는 생산직 인건비가 포함되어 있어

현재
매출원가 : ${this.formatNumber(cogs.amount)} 중 변동비 비중 ${cogs.variableRatio}%
감가상각비 : ${this.formatNumber(depreciation.amount)} 중 변동비 비중 ${depreciation.variableRatio}%
인건비 : ${this.formatNumber(labor.amount)} 중 변동비 비중 ${labor.variableRatio}%
연구개발비 : ${this.formatNumber(rd.amount)} 중 변동비 비중 ${rd.variableRatio}%
광고선전비 : ${this.formatNumber(advertising.amount)} 중 변동비 비중 ${advertising.variableRatio}%

재무 전문가 입장에서, 각 비용의 특성과 ${companyName}의 성격을 고려하여 위와 같은 매출 연동 비용에 대한 가정이
타당한지 *각 항목에 대해* 비판적으로 분석해줘
그리고, 제안하는 적절한 고정비 비중을 제안해줘
`;
        
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API 응답 오류:', response.status, errorText);
                throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`);
            }

            const responseData = await response.json();
            console.log('Cost Model API 응답:', responseData);
            
            if (responseData.candidates && responseData.candidates[0] && responseData.candidates[0].content) {
                return responseData.candidates[0].content.parts[0].text;
            } else {
                throw new Error('API 응답 형식이 올바르지 않습니다.');
            }
        } catch (error) {
            console.error('Cost Model API 호출 상세 오류:', error);
            throw new Error(`API 호출 중 오류: ${error.message}`);
        }
    }

    // Cost Model 모달 표시
    showCostModelModal() {
        const modalHTML = `
            <div class="modal-overlay" id="costModelModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3 class="modal-title">Cost Model Check</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="modal-loading">비용 구조를 분석하고 있습니다...</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('costModelModal');
                if (modal) modal.remove();
            }
        });
        
        // 모달 외부 클릭으로 닫기
        document.getElementById('costModelModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.remove();
            }
        });
    }

    // Cost Model 모달 업데이트
    updateCostModelModal(content) {
        const modalBody = document.querySelector('#costModelModal .modal-body');
        if (modalBody) {
            // AI 응답을 더 읽기 쉽게 포맷팅
            const formattedContent = this.formatAIResponse(content);
            modalBody.innerHTML = formattedContent;
        }
    }

    // AI 응답 포맷팅
    formatAIResponse(text) {
        if (!text) return text;

        // **텍스트**를 <strong>텍스트</strong>로 변환
        text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        // *텍스트*를 <em>텍스트</em>로 변환
        text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // 숫자 항목들을 더 명확하게 구분
        text = text.replace(/(\d+\.\s*)([^:]+):\s*([^중]+)중\s*변동비\s*비중\s*(\d+)%/g, 
            '<h4>$2</h4><p><strong>금액:</strong> $3<br><strong>변동비 비중:</strong> $4%</p>');
        
        // 비판적 분석 부분을 강조
        text = text.replace(/(비판적 분석|결론):/g, '<h3>$1</h3>');
        
        // 줄바꿈을 <br>로 변환
        text = text.replace(/\n/g, '<br>');
        
        // 연속된 <br>를 단일 <br>로 정리
        text = text.replace(/(<br>){3,}/g, '<br><br>');
        
        // 단락 구분을 위해 <p> 태그 추가
        text = text.replace(/(<br><br>)/g, '</p><p>');
        text = '<p>' + text + '</p>';
        
        return text;
    }

    // 성장 모델 입력 필드 토글
    toggleGrowthModelInputs(scenarioDiv, growthModel) {
        const cagrInputs = scenarioDiv.querySelector('.cagr-inputs');
        const growthInputs = scenarioDiv.querySelector('.growth-inputs');
        const logisticInputs = scenarioDiv.querySelector('.logistic-inputs');

        if (growthModel === 'cagr') {
            cagrInputs.style.display = 'block';
            growthInputs.style.display = 'none';
            logisticInputs.style.display = 'none';
        } else if (growthModel === 'growth') {
            cagrInputs.style.display = 'none';
            growthInputs.style.display = 'block';
            logisticInputs.style.display = 'none';
        } else if (growthModel === 'logistic') {
            cagrInputs.style.display = 'none';
            growthInputs.style.display = 'none';
            logisticInputs.style.display = 'block';
        }
    }

    // 디버깅용 함수들 (브라우저 콘솔에서 실행 가능)
    debugClearData() {
        localStorage.removeItem('valueWebAppData');
        console.log('데이터가 초기화되었습니다. 페이지를 새로고침하세요.');
    }

    debugShowData() {
        const data = dataManager.getData();
        console.log('현재 데이터:', data);
        return data;
    }

    debugForceNewUI() {
        // 기존 시나리오 데이터를 새로운 구조로 변환
        const data = dataManager.getData();
        if (data && data.scenarioModel && data.scenarioModel.segmentScenarios) {
            for (const segmentName in data.scenarioModel.segmentScenarios) {
                const scenarios = data.scenarioModel.segmentScenarios[segmentName];
                for (const scenario of scenarios) {
                    if (!scenario.growthModel) {
                        scenario.growthModel = 'cagr';
                        scenario.tam = 1000000;
                        scenario.inflectionPoint = 3;
                    }
                }
            }
            dataManager.saveData(data);
            console.log('데이터가 새로운 구조로 변환되었습니다. 페이지를 새로고침하세요.');
        }
    }

    // 시나리오 시각화
    visualizeScenarios(segmentName) {
        const data = dataManager.getData();
        if (!data || !data.scenarioModel.segmentScenarios[segmentName]) {
            alert('시나리오가 없습니다. 먼저 시나리오를 추가해주세요.');
            return;
        }

        const scenarios = data.scenarioModel.segmentScenarios[segmentName];
        const segment = data.financialStructure.businessSegments.find(s => s.name === segmentName);
        const initialRevenue = this.parseFormattedNumber(segment.revenue);
        const forecastPeriod = data.financialStructure.companyInfo.forecastPeriod;
        const terminalGrowthRate = data.financialStructure.companyInfo.terminalGrowthRate;

        // 모달 생성
        this.showScenarioVisualizationModal(segmentName, scenarios, initialRevenue, forecastPeriod, terminalGrowthRate);
    }

    // 시나리오 시각화 모달 표시
    showScenarioVisualizationModal(segmentName, scenarios, initialRevenue, forecastPeriod, terminalGrowthRate) {
        const modalHTML = `
            <div class="modal-overlay" id="scenarioVisualizationModal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${segmentName} - 시나리오 시각화</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="scenarioChartsContainer">
                            <div class="loading-text">차트를 생성하고 있습니다...</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 차트 생성
        this.createScenarioCharts(segmentName, scenarios, initialRevenue, forecastPeriod, terminalGrowthRate);
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('scenarioVisualizationModal');
                if (modal) modal.remove();
            }
        });
        
        // 모달 외부 클릭으로 닫기
        document.getElementById('scenarioVisualizationModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.remove();
            }
        });
    }

    // 시나리오 차트 생성
    createScenarioCharts(segmentName, scenarios, initialRevenue, forecastPeriod, terminalGrowthRate) {
        const container = document.getElementById('scenarioChartsContainer');
        container.innerHTML = '';

        scenarios.forEach((scenario, index) => {
            const chartDiv = document.createElement('div');
            chartDiv.className = 'scenario-chart-container';
            
            chartDiv.innerHTML = `
                <h4>${scenario.name} (${scenario.probability}%)</h4>
                <div class="chart-wrapper">
                    <canvas id="scenarioChart${index}"></canvas>
                </div>
            `;
            
            container.appendChild(chartDiv);

            // 차트 생성
            setTimeout(() => {
                this.createSingleScenarioChart(scenario, index, initialRevenue, forecastPeriod, terminalGrowthRate);
            }, 100 * index);
        });
    }

    // 단일 시나리오 차트 생성
    createSingleScenarioChart(scenario, chartIndex, initialRevenue, forecastPeriod, terminalGrowthRate) {
        const canvasId = chartIndex === 0 ? 'singleScenarioChart' : `scenarioChart${chartIndex}`;
        const canvas = document.getElementById(canvasId);
        
        if (!canvas) {
            console.error(`Canvas with id '${canvasId}' not found`);
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        const years = Array.from({length: forecastPeriod}, (_, i) => i + 1);
        let datasets = [];

        if (scenario.growthModel === 'cagr' || scenario.growthModel === 'growth') {
            // CAGR/Growth 모델: 성장률 +/- 표준편차 그래프 2개
            const meanGrowthRate = scenario.meanGrowthRate;
            const stdDevGrowthRate = scenario.stdDevGrowthRate;
            
            // 상한선 (평균 + 표준편차)
            const upperData = years.map(year => {
                if (scenario.growthModel === 'cagr') {
                    return initialRevenue * Math.pow(1 + (meanGrowthRate + stdDevGrowthRate) / 100, year);
                } else {
                    // Growth 모델: 개선된 지수적 수렴
                    const convergenceSpeed = 0.15;
                    const convergenceFactor = 1 - Math.exp(-convergenceSpeed * year);
                    const effectiveGrowthRate = (meanGrowthRate + stdDevGrowthRate) * (1 - convergenceFactor) + terminalGrowthRate * convergenceFactor;
                    
                    // 복리 효과를 고려한 매출 계산
                    let revenue = initialRevenue;
                    for (let i = 0; i < year; i++) {
                        const yearConvergenceFactor = 1 - Math.exp(-convergenceSpeed * (i + 1));
                        const yearGrowthRate = (meanGrowthRate + stdDevGrowthRate) * (1 - yearConvergenceFactor) + terminalGrowthRate * yearConvergenceFactor;
                        revenue *= (1 + yearGrowthRate / 100);
                    }
                    return revenue;
                }
            });

            // 하한선 (평균 - 표준편차)
            const lowerData = years.map(year => {
                if (scenario.growthModel === 'cagr') {
                    return initialRevenue * Math.pow(1 + (meanGrowthRate - stdDevGrowthRate) / 100, year);
                } else {
                    // Growth 모델: 개선된 지수적 수렴
                    const convergenceSpeed = 0.15;
                    const convergenceFactor = 1 - Math.exp(-convergenceSpeed * year);
                    const effectiveGrowthRate = (meanGrowthRate - stdDevGrowthRate) * (1 - convergenceFactor) + terminalGrowthRate * convergenceFactor;
                    
                    // 복리 효과를 고려한 매출 계산
                    let revenue = initialRevenue;
                    for (let i = 0; i < year; i++) {
                        const yearConvergenceFactor = 1 - Math.exp(-convergenceSpeed * (i + 1));
                        const yearGrowthRate = (meanGrowthRate - stdDevGrowthRate) * (1 - yearConvergenceFactor) + terminalGrowthRate * yearConvergenceFactor;
                        revenue *= (1 + yearGrowthRate / 100);
                    }
                    return revenue;
                }
            });

            datasets = [
                {
                    label: `상한선 (${(meanGrowthRate + stdDevGrowthRate).toFixed(1)}%)`,
                    data: upperData,
                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                    borderColor: '#e74c3c',
                    borderWidth: 1
                },
                {
                    label: `하한선 (${(meanGrowthRate - stdDevGrowthRate).toFixed(1)}%)`,
                    data: lowerData,
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    borderColor: '#3498db',
                    borderWidth: 1
                }
            ];
        } else if (scenario.growthModel === 'logistic') {
            // 로지스틱 모델: 단일 곡선
            const tam = scenario.tam;
            const inflectionPoint = scenario.inflectionPoint;
            const k = simulationEngine.calculateLogisticK(tam, inflectionPoint, initialRevenue);
            
            const logisticData = years.map(year => {
                const growingTAM = simulationEngine.calculateGrowingTAM(tam, terminalGrowthRate, year - 1);
                return simulationEngine.calculateLogisticN(year, growingTAM, k, inflectionPoint);
            });

            datasets = [
                {
                    label: '로지스틱 성장',
                    data: logisticData,
                    backgroundColor: 'rgba(39, 174, 96, 0.8)',
                    borderColor: '#27ae60',
                    borderWidth: 1
                }
            ];
        }

        console.log('차트 데이터:', {
            years,
            datasets,
            initialRevenue,
            forecastPeriod,
            terminalGrowthRate
        });

        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years.map(year => `${year}년`),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: '매출 (원)'
                        },
                        ticks: {
                            callback: (value) => {
                                return this.formatCurrency(value);
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: '연도'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return context.dataset.label + ': ' + this.formatCurrency(context.parsed.y);
                            }
                        }
                    }
                },
                elements: {
                    bar: {
                        borderWidth: 1,
                        borderColor: 'rgba(0,0,0,0.1)'
                    }
                }
            }
        });
    }

    // 단일 시나리오 시각화
    visualizeSingleScenario(segmentName, scenarioDiv) {
        const data = dataManager.getData();
        if (!data) {
            alert('데이터를 찾을 수 없습니다.');
            return;
        }

        // 시나리오 데이터 수집
        const scenarioData = this.collectScenarioData(scenarioDiv);
        if (!scenarioData.name || scenarioData.probability <= 0) {
            alert('시나리오 이름과 확률을 입력해주세요.');
            return;
        }

        const segment = data.financialStructure.businessSegments.find(s => s.name === segmentName);
        
        // revenue 값의 타입에 따라 적절히 처리
        let initialRevenue;
        if (typeof segment.revenue === 'string') {
            initialRevenue = this.parseFormattedNumber(segment.revenue);
        } else if (typeof segment.revenue === 'number') {
            initialRevenue = segment.revenue;
        } else {
            initialRevenue = 0;
        }
        
        // 디버깅: 초기 매출 값 확인
        console.log('세그먼트 정보:', segment);
        console.log('원본 revenue 값:', segment.revenue);
        console.log('revenue 타입:', typeof segment.revenue);
        console.log('파싱된 initialRevenue:', initialRevenue);
        
        const forecastPeriod = data.financialStructure.companyInfo.forecastPeriod;
        const terminalGrowthRate = data.financialStructure.companyInfo.terminalGrowthRate;

        // 모달 생성
        this.showSingleScenarioVisualizationModal(segmentName, scenarioData, initialRevenue, forecastPeriod, terminalGrowthRate);
    }

    // 시나리오 데이터 수집
    collectScenarioData(scenarioDiv) {
        const name = scenarioDiv.querySelector('.scenario-name').value.trim();
        const probability = parseFloat(scenarioDiv.querySelector('.scenario-probability').value) || 0;
        const growthModel = scenarioDiv.querySelector('.scenario-growth-model').value;
        
        let meanGrowthRate = 0;
        let stdDevGrowthRate = 0;
        let tam = 0;
        let inflectionPoint = 0;

        // 현재 활성화된 입력 필드에서 데이터 수집
        if (growthModel === 'cagr') {
            const cagrInputs = scenarioDiv.querySelector('.cagr-inputs');
            if (cagrInputs) {
                meanGrowthRate = parseFloat(cagrInputs.querySelector('.scenario-mean').value) || 0;
                stdDevGrowthRate = parseFloat(cagrInputs.querySelector('.scenario-std').value) || 0;
            }
        } else if (growthModel === 'growth') {
            const growthInputs = scenarioDiv.querySelector('.growth-inputs');
            if (growthInputs) {
                meanGrowthRate = parseFloat(growthInputs.querySelector('.scenario-mean').value) || 0;
                stdDevGrowthRate = parseFloat(growthInputs.querySelector('.scenario-std').value) || 0;
            }
        } else if (growthModel === 'logistic') {
            const logisticInputs = scenarioDiv.querySelector('.logistic-inputs');
            if (logisticInputs) {
                tam = this.parseFormattedNumber(logisticInputs.querySelector('.scenario-tam').value);
                inflectionPoint = parseFloat(logisticInputs.querySelector('.scenario-inflection-point').value) || 0;
            }
        }

        console.log('수집된 시나리오 데이터:', {
            name,
            probability,
            growthModel,
            meanGrowthRate,
            stdDevGrowthRate,
            tam,
            inflectionPoint
        });

        return {
            name,
            probability,
            growthModel,
            meanGrowthRate,
            stdDevGrowthRate,
            tam,
            inflectionPoint
        };
    }

    // Note 모달 표시
    showNoteModal(segmentName, scenarioDiv) {
        const scenarioIndex = Array.from(scenarioDiv.parentNode.children).indexOf(scenarioDiv);
        const data = dataManager.getData();
        const scenarios = data?.scenarioModel?.segmentScenarios?.[segmentName] || [];
        const scenario = scenarios[scenarioIndex] || {};
        const currentNote = scenario.note || '';
        
        console.log('노트 모달 열기:', {
            segmentName,
            scenarioIndex,
            scenario,
            currentNote
        });

        const modalHTML = `
            <div class="modal-overlay" id="noteModal">
                <div class="modal-content" style="max-width: 600px; width: 90%;">
                    <div class="modal-header">
                        <h3 class="modal-title">시나리오 메모</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label>메모 (최대 500자)</label>
                            <textarea id="scenarioNote" maxlength="500" placeholder="시나리오에 대한 메모를 입력하세요..." rows="8" style="min-height: 200px;">${currentNote}</textarea>
                            <div class="char-count">
                                <span id="charCount">${currentNote.length}</span>/500
                            </div>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" onclick="this.closest('.modal-overlay').remove()">취소</button>
                            <button type="button" class="btn-primary" id="saveNoteBtn">저장</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 저장 버튼 이벤트 리스너 추가
        const saveBtn = document.getElementById('saveNoteBtn');
        saveBtn.addEventListener('click', async () => {
            await this.saveScenarioNote(segmentName, scenarioIndex);
        });
        
        // 글자 수 카운터
        const textarea = document.getElementById('scenarioNote');
        const charCount = document.getElementById('charCount');
        
        textarea.addEventListener('input', () => {
            charCount.textContent = textarea.value.length;
        });
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('noteModal');
                if (modal) modal.remove();
            }
        });
        
        // 모달 외부 클릭으로 닫기
        document.getElementById('noteModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.remove();
            }
        });
    }

    // 시나리오 메모 저장
    async saveScenarioNote(segmentName, scenarioIndex) {
        const noteText = document.getElementById('scenarioNote').value.trim();
        const data = dataManager.getData();
        
        console.log('노트 저장 시작:', {
            segmentName,
            scenarioIndex,
            noteText,
            dataExists: !!data
        });
        
        if (!data.scenarioModel.segmentScenarios[segmentName]) {
            data.scenarioModel.segmentScenarios[segmentName] = [];
        }
        
        // 시나리오 배열이 충분히 크지 않으면 확장
        while (data.scenarioModel.segmentScenarios[segmentName].length <= scenarioIndex) {
            data.scenarioModel.segmentScenarios[segmentName].push({});
        }
        
        // 노트 저장
        data.scenarioModel.segmentScenarios[segmentName][scenarioIndex].note = noteText;
        await dataManager.saveData(data);
        
        console.log('노트 저장 완료:', {
            segmentName,
            scenarioIndex,
            savedNote: data.scenarioModel.segmentScenarios[segmentName][scenarioIndex].note
        });
        
        // 모달 닫기
        document.getElementById('noteModal').remove();
        
        // Note 버튼 스타일 업데이트
        this.updateNoteButtonStyle(segmentName, scenarioIndex, noteText);
        
        // 저장 완료 팝업 표시
        this.showSaveSuccessPopup();
    }
    
    // 저장 완료 팝업 표시
    showSaveSuccessPopup() {
        const popupHTML = `
            <div class="save-success-popup" id="saveSuccessPopup">
                <div class="save-success-content">
                    <div class="save-success-icon">✅</div>
                    <div class="save-success-text">메모가 성공적으로 저장되었습니다!</div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', popupHTML);
        
        // 2초 후 자동으로 팝업 제거
        setTimeout(() => {
            const popup = document.getElementById('saveSuccessPopup');
            if (popup) {
                popup.remove();
            }
        }, 2000);
    }

    // Note 버튼 스타일 업데이트
    updateNoteButtonStyle(segmentName, scenarioIndex, noteText) {
        const container = document.getElementById(`scenarios-${segmentName}`);
        if (!container) {
            console.warn(`Container for segment ${segmentName} not found`);
            return;
        }
        
        const scenarioDiv = container.children[scenarioIndex];
        if (!scenarioDiv) {
            console.warn(`Scenario div at index ${scenarioIndex} not found`);
            return;
        }
        
        const noteButton = scenarioDiv.querySelector('.btn-note-scenario');
        if (!noteButton) {
            console.warn(`Note button not found in scenario div`);
            return;
        }
        
        if (noteText && noteText.trim()) {
            noteButton.classList.add('has-note');
            noteButton.innerHTML = '📝 Note ✓';
        } else {
            noteButton.classList.remove('has-note');
            noteButton.innerHTML = '📝 Note';
        }
    }

    // AI Review 버튼 활성화/비활성화 업데이트
    updateAIReviewButton(segmentName) {
        const data = dataManager.getData();
        const scenarios = data?.scenarioModel?.segmentScenarios?.[segmentName] || [];
        const aiReviewButton = document.querySelector(`.btn-ai-review[data-segment="${segmentName}"]`);
        
        console.log('AI Review 버튼 업데이트 - 세그먼트:', segmentName);
        console.log('AI Review 버튼 업데이트 - 시나리오 개수:', scenarios.length);
        console.log('AI Review 버튼 요소:', aiReviewButton);
        
        if (aiReviewButton) {
            if (scenarios.length > 0) {
                aiReviewButton.disabled = false;
                aiReviewButton.classList.remove('disabled');
                console.log('AI Review 버튼 활성화됨');
            } else {
                aiReviewButton.disabled = true;
                aiReviewButton.classList.add('disabled');
                console.log('AI Review 버튼 비활성화됨');
            }
        } else {
            console.log('AI Review 버튼을 찾을 수 없음');
        }
    }

    // AI Review 기능
    async analyzeScenariosWithAI(segmentName) {
        const data = dataManager.getData();
        const scenarios = data?.scenarioModel?.segmentScenarios?.[segmentName] || [];
        
        console.log('AI Review - 세그먼트:', segmentName);
        console.log('AI Review - 시나리오 데이터:', scenarios);
        console.log('AI Review - 시나리오 개수:', scenarios.length);
        
        if (!scenarios || scenarios.length === 0) {
            alert('분석할 시나리오가 없습니다.');
            return;
        }

        // 기업명을 직접 입력 필드에서 가져오기
        const companyNameInput = document.getElementById('companyName');
        const companyName = companyNameInput ? companyNameInput.value.trim() : '회사';
        
        // 프롬프트 구성
        let prompt = `${companyName}의 ${segmentName}에 대해서, 시나리오를 다음과 같이 나눴어\n\n`;
        
        scenarios.forEach((scenario, index) => {
            prompt += `* ${scenario.name}이 ${scenario.probability}%\n`;
            
            // Note가 있으면 추가
            if (scenario.note && scenario.note.trim()) {
                prompt += `아이디어: ${scenario.note}\n`;
            }
            
            // 성장 모델 정보 추가
            if (scenario.growthModel === 'logistic') {
                prompt += `${scenario.growthModel} 성장 모델로 ${scenario.tam}과 ${scenario.inflectionPoint}년 후 변곡점을 가정\n`;
            } else {
                prompt += `${scenario.growthModel} 성장 모델로 ${scenario.meanGrowthRate}%의 성장을 가정했고\n`;
            }
            
            if (index < scenarios.length - 1) {
                prompt += '\n';
            }
        });
        
        prompt += `\n------\n\n${companyName}의 ${segmentName} 및 연관분야 전문 애널리스트의 입장에서\n${segmentName}에 대한 SWOT 분석을 진행하고,\n이를 토대로 설정한 시나리오들을 비판적으로 검토해줘`;

        // 설정에서 저장된 API 키 가져오기
        let apiKey = '';
        try {
            const currentUser = firebase.auth().currentUser;
            if (currentUser) {
                const userSettingsDoc = await firebase.firestore().collection('userSettings').doc(currentUser.uid).get();
                if (userSettingsDoc.exists) {
                    const settings = userSettingsDoc.data();
                    apiKey = settings.geminiApiKey || '';
                }
            }
        } catch (error) {
            console.error('API 키 로드 오류:', error);
        }

        if (!apiKey || !apiKey.trim()) {
            alert('설정에서 Gemini API 키를 먼저 입력해주세요.\n\n설정 방법:\n1. 우측 상단 설정 버튼(⚙️) 클릭\n2. API 설정에서 Gemini API 키 입력\n3. 저장 후 다시 시도');
            return;
        }

        // 바로 AI Review 시작
        this.startAIReview(companyName, segmentName, apiKey);
    }



    // AI Review 시작
    async startAIReview(companyName, segmentName, apiKey) {
        // 로딩 모달 표시
        this.showAIReviewLoadingModal(companyName, segmentName);

        try {
            const data = dataManager.getData();
            const scenarios = data?.scenarioModel?.segmentScenarios?.[segmentName] || [];
            
            // 프롬프트 구성
            let prompt = `${companyName}의 ${segmentName}에 대해서, 시나리오를 다음과 같이 나눴어\n\n`;
            
            scenarios.forEach((scenario, index) => {
                prompt += `* ${scenario.name}이 ${scenario.probability}%\n`;
                
                if (scenario.note && scenario.note.trim()) {
                    prompt += `아이디어: ${scenario.note}\n`;
                }
                
                if (scenario.growthModel === 'logistic') {
                    prompt += `${scenario.growthModel} 성장 모델로 ${scenario.tam}과 ${scenario.inflectionPoint}년 후 변곡점을 가정\n`;
                } else {
                    prompt += `${scenario.growthModel} 성장 모델로 ${scenario.meanGrowthRate}%의 성장을 가정했고\n`;
                }
                
                if (index < scenarios.length - 1) {
                    prompt += '\n';
                }
            });
            
            prompt += `\n------\n\n${companyName}의 ${segmentName} 및 연관분야 전문 애널리스트의 입장에서\n${segmentName}에 대한 SWOT 분석을 진행하고,\n이를 토대로 설정한 시나리오들을 비판적으로 검토해줘`;

            // API 호출
            const response = await this.callGeminiAPI(apiKey, prompt);
            
            // 결과 모달 표시
            this.showAIReviewResultModal(companyName, segmentName, response);
            
        } catch (error) {
            console.error('AI Review 오류:', error);
            alert('AI Review 중 오류가 발생했습니다: ' + error.message);
            document.getElementById('aiReviewLoadingModal').remove();
        }
    }

    // AI Review 로딩 모달
    showAIReviewLoadingModal(companyName, segmentName) {
        const modalHTML = `
            <div class="modal-overlay" id="aiReviewLoadingModal">
                <div class="modal-content" style="text-align: center; max-width: 500px;">
                    <div class="modal-header">
                        <h3 class="modal-title">AI Review 분석 중...</h3>
                    </div>
                    <div class="modal-body">
                        <div class="loading-text">
                            ${companyName}의 ${segmentName} 시나리오를 분석하고 있습니다...
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // AI Review 결과 모달
    showAIReviewResultModal(companyName, segmentName, content) {
        // 로딩 모달 제거
        const loadingModal = document.getElementById('aiReviewLoadingModal');
        if (loadingModal) loadingModal.remove();

        const modalHTML = `
            <div class="modal-overlay" id="aiReviewResultModal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h3 class="modal-title">AI Review 결과 - ${companyName} ${segmentName}</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div id="aiReviewContent">${this.formatAIResponse(content)}</div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('aiReviewResultModal');
                if (modal) modal.remove();
            }
        });
        
        // 모달 외부 클릭으로 닫기
        document.getElementById('aiReviewResultModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.remove();
            }
        });
    }

    // 단일 시나리오 시각화 모달 표시
    showSingleScenarioVisualizationModal(segmentName, scenarioData, initialRevenue, forecastPeriod, terminalGrowthRate) {
        const modalHTML = `
            <div class="modal-overlay" id="singleScenarioVisualizationModal">
                <div class="modal-content large-modal">
                    <div class="modal-header">
                        <h3 class="modal-title">${segmentName} - ${scenarioData.name} 시나리오</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="scenario-chart-container">
                            <div class="chart-wrapper">
                                <canvas id="singleScenarioChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // 차트 생성
        setTimeout(() => {
            this.createSingleScenarioChart(scenarioData, 0, initialRevenue, forecastPeriod, terminalGrowthRate);
        }, 100);
        
        // ESC 키로 모달 닫기
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modal = document.getElementById('singleScenarioVisualizationModal');
                if (modal) modal.remove();
            }
        });
        
        // 모달 외부 클릭으로 닫기
        document.getElementById('singleScenarioVisualizationModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.remove();
            }
        });
    }

    // Page 5 이벤트 설정 (투자 분석)
    setupPage5Events() {
        // 네비게이션
        document.getElementById('prevToPage4').addEventListener('click', () => {
            this.navigateToPage(4);
        });
    }

    // 모델 시각화 업데이트
    updateModelVisualization() {
        const data = dataManager.getData();
        if (!data || !data.financialStructure) {
            console.warn('데이터가 없습니다.');
            return;
        }

        const { businessSegments, costStructure, companyInfo } = data.financialStructure;
        const forecastPeriod = companyInfo.forecastPeriod || 15;
        const discountRate = companyInfo.discountRate || 10;
        const terminalGrowthRate = companyInfo.terminalGrowthRate || 2.5;

        // 시나리오 선택기 동적 생성
        this.populateScenarioSelectors(businessSegments);

        // 선택된 시나리오 가져오기
        const selectedScenarios = this.getSelectedScenarios();
        
        // 연도별 데이터 생성
        const annualData = this.generateAnnualData(businessSegments, costStructure, selectedScenarios, forecastPeriod);
        
        // 차트 생성
        this.createAnnualCharts(annualData);
        
        // 요약 테이블 생성
        this.createFinancialSummaryTable(annualData, discountRate, terminalGrowthRate);
    }

    // 선택된 시나리오 가져오기
    getSelectedScenarios() {
        const scenarios = {};
        const data = dataManager.getData();
        if (!data || !data.financialStructure) return scenarios;
        
        const businessSegments = data.financialStructure.businessSegments;
        
        // 사업부문별 시나리오
        businessSegments.forEach((segment, index) => {
            const selectorId = `segment${index + 1}Scenario`;
            const select = document.getElementById(selectorId);
            if (select) {
                scenarios[segment.name] = select.value;
            }
        });
        
        // 기타 사업부문 시나리오 추가
        const otherSegmentRevenue = parseFloat(document.getElementById('other-segment-revenue').value) || 0;
        if (otherSegmentRevenue > 0) {
            const otherSelectorId = `segment${businessSegments.length + 1}Scenario`;
            const otherSelect = document.getElementById(otherSelectorId);
            if (otherSelect) {
                scenarios['기타 (Other)'] = otherSelect.value;
            }
        }
        
        return scenarios;
    }

    // 시나리오 선택기 동적 생성
    populateScenarioSelectors(businessSegments) {
        const container = document.querySelector('.scenario-selectors');
        if (!container) return;

        // 기존 선택기들 제거
        container.innerHTML = '';

        // 각 사업부문에 대한 선택기 생성
        businessSegments.forEach((segment, index) => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            formGroup.innerHTML = `
                <label for="segment${index + 1}Scenario">${segment.name} 시나리오</label>
                <select id="segment${index + 1}Scenario">
                    <option value="optimistic">낙관적</option>
                    <option value="base" selected>기본</option>
                    <option value="pessimistic">비관적</option>
                </select>
            `;
            
            container.appendChild(formGroup);
        });

        // 기타 사업부문 시나리오 선택기 추가
        const otherSegmentRevenue = parseFloat(document.getElementById('other-segment-revenue').value) || 0;
        if (otherSegmentRevenue > 0) {
            const otherFormGroup = document.createElement('div');
            otherFormGroup.className = 'form-group';
            
            otherFormGroup.innerHTML = `
                <label for="segment${businessSegments.length + 1}Scenario">기타 (Other) 시나리오</label>
                <select id="segment${businessSegments.length + 1}Scenario">
                    <option value="optimistic">낙관적</option>
                    <option value="base" selected>기본</option>
                    <option value="pessimistic">비관적</option>
                </select>
            `;
            
            container.appendChild(otherFormGroup);
        }
    }

    // 연도별 데이터 생성
    generateAnnualData(businessSegments, costStructure, selectedScenarios, forecastPeriod) {
        const annualData = [];
        
        // 기타 사업부문 매출 추가
        const otherSegmentRevenue = parseFloat(document.getElementById('other-segment-revenue').value) || 0;
        const allSegments = [...businessSegments];
        if (otherSegmentRevenue > 0) {
            allSegments.push({ name: '기타 (Other)', revenue: otherSegmentRevenue });
        }
        
        const baseRevenue = allSegments.reduce((total, segment) => total + (segment.revenue || 0), 0);
        
        for (let year = 1; year <= forecastPeriod; year++) {
            const yearData = {
                year: year,
                revenue: 0,
                segmentRevenues: {}, // 각 사업부문별 매출
                costs: {
                    cogs: 0,
                    depreciation: 0,
                    labor: 0,
                    rd: 0,
                    advertising: 0,
                    other: 0
                },
                operatingProfit: 0
            };

            // 매출 계산 (시나리오별 성장률 적용)
            allSegments.forEach((segment, index) => {
                const scenario = selectedScenarios[segment.name] || 'base';
                const growthRate = this.getScenarioGrowthRate(scenario, year);
                const segmentRevenue = (segment.revenue || 0) * Math.pow(1 + growthRate, year);
                yearData.revenue += segmentRevenue;
                yearData.segmentRevenues[segment.name] = segmentRevenue;
            });

            // 비용 계산
            Object.keys(costStructure).forEach(costType => {
                const cost = costStructure[costType];
                if (cost && cost.amount) {
                    const variableRatio = cost.variableRatio || 0;
                    const fixedRatio = cost.fixedRatio || 0;
                    
                    // 변동비 (매출 대비)
                    const variableCost = (cost.amount * variableRatio / 100) * (yearData.revenue / baseRevenue);
                    
                    // 고정비 (성장률 적용)
                    const fixedCost = (cost.amount * fixedRatio / 100) * Math.pow(1 + (cost.growthRate || 0) / 100, year);
                    
                    yearData.costs[costType] = variableCost + fixedCost;
                }
            });

            // 영업이익 계산
            const totalCosts = Object.values(yearData.costs).reduce((sum, cost) => sum + cost, 0);
            yearData.operatingProfit = yearData.revenue - totalCosts;

            annualData.push(yearData);
        }

        return annualData;
    }

    // 시나리오별 성장률 가져오기
    getScenarioGrowthRate(scenario, year) {
        const baseGrowthRate = 0.05; // 기본 5% 성장률
        
        switch (scenario) {
            case 'optimistic':
                return baseGrowthRate * 1.5; // 7.5%
            case 'pessimistic':
                return baseGrowthRate * 0.5; // 2.5%
            default:
                return baseGrowthRate; // 5%
        }
    }

    // 연도별 차트 생성
    createAnnualCharts(annualData) {
        const ctx = document.getElementById('annualCharts');
        if (!ctx) return;

        // 기존 차트 제거
        if (this.charts.annualCharts) {
            this.charts.annualCharts.destroy();
        }

        const years = annualData.map(data => data.year);
        const costs = annualData.map(data => Object.values(data.costs).reduce((sum, cost) => sum + cost, 0));
        const profits = annualData.map(data => data.operatingProfit);

        // 사업부문별 매출 데이터 준비
        const segmentNames = Object.keys(annualData[0].segmentRevenues);
        const segmentColors = [
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 99, 132, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
        ];

        const revenueDatasets = segmentNames.map((segmentName, index) => ({
            label: segmentName,
            data: annualData.map(data => data.segmentRevenues[segmentName] || 0),
            backgroundColor: segmentColors[index % segmentColors.length],
            borderColor: segmentColors[index % segmentColors.length].replace('0.8', '1'),
            borderWidth: 1,
            stack: 'revenue'
        }));

        this.charts.annualCharts = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: years,
                datasets: [
                    ...revenueDatasets,
                    {
                        label: '비용',
                        data: costs,
                        backgroundColor: 'rgba(169, 169, 169, 0.8)',
                        borderColor: 'rgba(169, 169, 169, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    },
                    {
                        label: '영업이익',
                        data: profits,
                        backgroundColor: 'rgba(34, 139, 34, 0.8)',
                        borderColor: 'rgba(34, 139, 34, 1)',
                        borderWidth: 1,
                        yAxisID: 'y'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: '연도'
                        },
                        ticks: {
                            maxTicksLimit: 15
                        }
                    },
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        title: {
                            display: true,
                            text: '금액 (Million)'
                        },
                        beginAtZero: true
                    }
                },
                plugins: {
                    title: {
                        display: true,
                        text: '연도별 재무 지표'
                    },
                    legend: {
                        position: 'top'
                    }
                },
                layout: {
                    padding: {
                        top: 20,
                        bottom: 20
                    }
                }
            }
        });
    }

    // 재무 요약 테이블 생성
    createFinancialSummaryTable(annualData, discountRate, terminalGrowthRate) {
        const tbody = document.getElementById('financialSummaryBody');
        const terminalValueCell = document.getElementById('terminalValue');
        const terminalValuePVCell = document.getElementById('terminalValuePV');
        
        if (!tbody) return;

        // 기존 내용 제거
        tbody.innerHTML = '';

        // 연도별 데이터 추가
        annualData.forEach((data, index) => {
            const presentValue = data.operatingProfit / Math.pow(1 + discountRate / 100, data.year);
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${data.year}년</td>
                <td>${this.formatCurrency(data.revenue)}</td>
                <td>${this.formatCurrency(Object.values(data.costs).reduce((sum, cost) => sum + cost, 0))}</td>
                <td>${this.formatCurrency(data.operatingProfit)}</td>
                <td>${this.formatCurrency(presentValue)}</td>
            `;
            tbody.appendChild(row);
        });

        // Terminal Value 계산 및 표시
        const lastYearProfit = annualData[annualData.length - 1].operatingProfit;
        const terminalValue = lastYearProfit * (1 + terminalGrowthRate / 100) / (discountRate / 100 - terminalGrowthRate / 100);
        const terminalValuePV = terminalValue / Math.pow(1 + discountRate / 100, annualData.length);
        
        if (terminalValueCell) {
            terminalValueCell.textContent = this.formatCurrency(terminalValue);
        }
        
        if (terminalValuePVCell) {
            terminalValuePVCell.textContent = this.formatCurrency(terminalValuePV);
        }
    }
}

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    new ValueWebApp();
}); 