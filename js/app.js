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
        
        if (num >= 1e12) {
            return (num / 1e12).toFixed(2) + 'T';
        } else if (num >= 1e9) {
            return (num / 1e9).toFixed(2) + 'B';
        } else if (num >= 1e6) {
            return (num / 1e6).toFixed(2) + 'M';
        } else {
            return this.formatNumber(Math.round(num));
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
    initializeApp() {
        this.setupEventListeners();
        this.setupNumberFormatting();
        this.loadData();
        this.updateUI();
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

        // Page 1 이벤트
        this.setupPage1Events();
        
        // Page 2 이벤트
        this.setupPage2Events();
        
        // Page 3 이벤트
        this.setupPage3Events();
        
        // Page 4 이벤트
        this.setupPage4Events();
    }

    // Page 1 이벤트 설정
    setupPage1Events() {
        // 기업 정보 입력
        document.getElementById('companyName').addEventListener('input', (e) => {
            this.updateCompanyInfo('name', e.target.value);
        });

        document.getElementById('discountRate').addEventListener('input', (e) => {
            this.updateCompanyInfo('discountRate', parseFloat(e.target.value));
        });

        document.getElementById('taxRate').addEventListener('input', (e) => {
            this.updateCompanyInfo('taxRate', parseFloat(e.target.value));
        });

        document.getElementById('forecastPeriod').addEventListener('input', (e) => {
            this.updateCompanyInfo('forecastPeriod', parseInt(e.target.value));
        });

        document.getElementById('terminalGrowthRate').addEventListener('input', (e) => {
            this.updateCompanyInfo('terminalGrowthRate', parseFloat(e.target.value));
        });

        document.getElementById('marketValue').addEventListener('input', (e) => {
            const value = this.parseFormattedNumber(e.target.value);
            this.updateCompanyInfo('marketValue', value);
        });

        // 손익계산서 입력
        document.getElementById('revenue').addEventListener('input', (e) => {
            const value = this.parseFormattedNumber(e.target.value);
            this.updateIncomeStatement('revenue', value);
            this.calculateGrossProfit();
            this.calculateOtherSegmentRevenue();
        });

        document.getElementById('costOfGoodsSold').addEventListener('input', (e) => {
            const value = this.parseFormattedNumber(e.target.value);
            this.updateIncomeStatement('costOfGoodsSold', value);
            this.calculateGrossProfit();
            // 비용 구조의 매출원가도 자동 업데이트
            this.updateCostStructure('cogs', 'amount', value);
            document.getElementById('cogs-amount').value = this.formatNumber(value);
        });

        document.getElementById('operatingIncome').addEventListener('input', (e) => {
            const value = this.parseFormattedNumber(e.target.value);
            this.updateIncomeStatement('operatingIncome', value);
            this.calculateOtherCost();
        });

        // 사업부문 관리
        document.getElementById('addSegment').addEventListener('click', () => {
            this.addBusinessSegment();
        });

        // 사업부문 revenue 입력 이벤트
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('segment-revenue')) {
                const value = this.parseFormattedNumber(e.target.value);
                this.calculateOtherSegmentRevenue();
                // 사업부문 데이터 업데이트
                this.updateBusinessSegments();
            }
            if (e.target.classList.contains('segment-name')) {
                // 사업부문 데이터 업데이트
                this.updateBusinessSegments();
            }
        });

        // 사업부문 삭제 버튼 이벤트
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-remove-segment')) {
                setTimeout(() => {
                    this.updateBusinessSegments();
                    this.calculateOtherSegmentRevenue();
                }, 0);
            }
        });

        // 비용 구조 입력
        this.setupCostStructureEvents();

        // AI 분석 버튼
        document.getElementById('analyzeCompany').addEventListener('click', () => {
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

    // Page 2 이벤트 설정
    setupPage2Events() {
        // 고정비 성장률 입력
        const costTypes = ['cogs', 'depreciation', 'labor', 'rd', 'advertising', 'other'];
        costTypes.forEach(type => {
            document.getElementById(`${type}-fixed-mean`).addEventListener('input', (e) => {
                this.updateFixedCostGrowth(type, 'mean', parseFloat(e.target.value));
            });
            document.getElementById(`${type}-fixed-std`).addEventListener('input', (e) => {
                this.updateFixedCostGrowth(type, 'stdDev', parseFloat(e.target.value));
            });
        });

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

    // Page 3 이벤트 설정
    setupPage3Events() {
        // 시뮬레이션 컨트롤
        document.getElementById('startSimulation').addEventListener('click', () => {
            this.startSimulation();
        });

        document.getElementById('stopSimulation').addEventListener('click', () => {
            this.stopSimulation();
        });

        // 네비게이션
        document.getElementById('prevToPage2').addEventListener('click', () => {
            this.navigateToPage(2);
        });

        document.getElementById('nextToPage4').addEventListener('click', () => {
            this.navigateToPage(4);
        });


    }

    // Page 4 이벤트 설정
    setupPage4Events() {
        // 네비게이션
        document.getElementById('prevToPage3').addEventListener('click', () => {
            this.navigateToPage(3);
        });
    }

    // 비용 구조 이벤트 설정
    setupCostStructureEvents() {
        const costItems = ['cogs', 'depreciation', 'labor', 'rd', 'advertising', 'other'];
        
        costItems.forEach(item => {
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

    // 데이터 로드
    loadData() {
        const data = dataManager.getData();
        if (data) {
            this.populateFormData(data);
        }
    }

    // 폼 데이터 채우기
    populateFormData(data) {
        // 기업 정보
        const { companyInfo, incomeStatement, businessSegments, costStructure } = data.financialStructure;
        
        document.getElementById('companyName').value = companyInfo.name || '';
        document.getElementById('discountRate').value = companyInfo.discountRate || 10;
        document.getElementById('taxRate').value = companyInfo.taxRate || 25;
        document.getElementById('forecastPeriod').value = companyInfo.forecastPeriod || 15;
        document.getElementById('terminalGrowthRate').value = companyInfo.terminalGrowthRate || 2.5;
        document.getElementById('marketValue').value = this.formatNumber(companyInfo.marketValue || 0);
        document.getElementById('apiKey').value = companyInfo.apiKey || '';

        // 손익계산서
        document.getElementById('revenue').value = this.formatNumber(incomeStatement.revenue || 0);
        document.getElementById('costOfGoodsSold').value = this.formatNumber(incomeStatement.costOfGoodsSold || 0);
        document.getElementById('operatingIncome').value = this.formatNumber(incomeStatement.operatingIncome || 0);
        this.calculateGrossProfit();
        this.calculateOtherSegmentRevenue();
        this.calculateOtherCost();

        // 사업부문
        this.populateBusinessSegments(businessSegments);

        // 비용 구조
        this.populateCostStructure(costStructure);

        // 고정비 성장률
        const { fixedCostGrowth } = data.scenarioModel;
        this.populateFixedCostGrowth(fixedCostGrowth);
        
        // 현재 페이지가 2페이지라면 시나리오 설정
        if (this.currentPage === 2) {
            console.log('populateFormData에서 setupPage2Scenarios 호출');
            this.setupPage2Scenarios();
        }
    }

    // 사업부문 데이터 채우기
    populateBusinessSegments(segments) {
        const container = document.getElementById('businessSegments');
        container.innerHTML = '';

        if (segments.length === 0) {
            this.addBusinessSegment();
        } else {
            segments.forEach(segment => {
                this.addBusinessSegment(segment.name, segment.revenue);
            });
        }
        
        // 기타 사업부문 매출 계산
        this.calculateOtherSegmentRevenue();
    }

    // 비용 구조 데이터 채우기
    populateCostStructure(costStructure) {
        const costTypes = ['cogs', 'depreciation', 'labor', 'rd', 'advertising', 'other'];
        
        costTypes.forEach(type => {
            const cost = costStructure[type];
            
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
    }

    // 고정비 성장률 데이터 채우기
    populateFixedCostGrowth(fixedCostGrowth) {
        const costTypes = ['cogs', 'depreciation', 'labor', 'rd', 'advertising', 'other'];
        
        costTypes.forEach(type => {
            const growth = fixedCostGrowth[type];
            document.getElementById(`${type}-fixed-mean`).value = growth.mean || 2;
            document.getElementById(`${type}-fixed-std`).value = growth.stdDev || 0.5;
        });
    }

    // 사업부문 추가
    addBusinessSegment(name = '', revenue = '') {
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
        this.updateBusinessSegments();
        this.calculateOtherSegmentRevenue();
    }

    // 사업부문 데이터 업데이트
    updateBusinessSegments() {
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
        if (currentData) {
            currentData.financialStructure.businessSegments = segments;
            dataManager.saveData(currentData);
            
            // 기타 사업부문 매출 자동 계산
            this.calculateOtherSegmentRevenue();
        }
    }

    // 기업 정보 업데이트
    updateCompanyInfo(field, value) {
        const currentData = dataManager.getData();
        if (currentData) {
            currentData.financialStructure.companyInfo[field] = value;
            dataManager.saveData(currentData);
        }
    }

    // 손익계산서 업데이트
    updateIncomeStatement(field, value) {
        const currentData = dataManager.getData();
        if (currentData) {
            currentData.financialStructure.incomeStatement[field] = value;
            dataManager.saveData(currentData);
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
        document.getElementById('other-segment-revenue').value = this.formatNumber(otherRevenue);
    }

    // 기타 비용 계산
    calculateOtherCost() {
        const otherCost = dataManager.calculateOtherCost();
        document.getElementById('other-amount').value = this.formatNumber(otherCost);
    }

    // 비용 구조 업데이트
    updateCostStructure(type, field, value) {
        const currentData = dataManager.getData();
        if (currentData) {
            currentData.financialStructure.costStructure[type][field] = value;
            dataManager.saveData(currentData);
        }
    }

    // 비용 비율 동기화
    syncCostRatios(type) {
        dataManager.syncCostRatios(type);
        this.loadData(); // UI 업데이트
    }

    // 고정비 성장률 업데이트
    updateFixedCostGrowth(type, field, value) {
        const currentData = dataManager.getData();
        if (currentData) {
            currentData.scenarioModel.fixedCostGrowth[type][field] = value;
            dataManager.saveData(currentData);
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
        } else if (pageNumber === 4) {
            this.setupPage4Analysis();
        }
    }

    // Page 2 시나리오 설정
    setupPage2Scenarios() {
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
        segments.forEach(segment => {
            this.loadSegmentScenarios(segment.name);
            this.updateAIReviewButton(segment.name);
        });
        
        // 기타 사업부문 시나리오도 로드
        if (otherSegmentRevenue > 0) {
            this.loadSegmentScenarios('기타 (Other)');
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
    addScenario(segmentName) {
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
        scenarioDiv.querySelector('.btn-remove-scenario').addEventListener('click', () => {
            container.removeChild(scenarioDiv);
            this.updateSegmentScenarios(segmentName);
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
        growthModelSelect.addEventListener('change', () => {
            this.toggleGrowthModelInputs(scenarioDiv, growthModelSelect.value);
            this.updateSegmentScenarios(segmentName);
        });

        // 입력 이벤트
        scenarioDiv.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', () => {
                this.updateSegmentScenarios(segmentName);
                // 입력 후 AI Review 버튼 상태 업데이트
                setTimeout(() => {
                    this.updateAIReviewButton(segmentName);
                }, 100);
            });
        });

        container.appendChild(scenarioDiv);
        this.updateSegmentScenarios(segmentName);
        
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
    loadSegmentScenarios(segmentName) {
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
                        <button type="button" class="btn-note-scenario ${scenario.note ? 'has-note' : ''}">
                            ${scenario.note ? '📝 Note ✓' : '📝 Note'}
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

                    scenarioDiv.querySelector('.btn-remove-scenario').addEventListener('click', () => {
            container.removeChild(scenarioDiv);
            this.updateSegmentScenarios(segmentName);
            this.updateAIReviewButton(segmentName);
        });

            // 시각화 버튼 이벤트
            scenarioDiv.querySelector('.btn-visualize-scenario').addEventListener('click', () => {
                this.visualizeSingleScenario(segmentName, scenarioDiv);
            });

            // 성장 모델 선택 이벤트
            const growthModelSelect = scenarioDiv.querySelector('.scenario-growth-model');
            growthModelSelect.addEventListener('change', () => {
                this.toggleGrowthModelInputs(scenarioDiv, growthModelSelect.value);
                this.updateSegmentScenarios(segmentName);
            });

            scenarioDiv.querySelectorAll('input').forEach(input => {
                input.addEventListener('input', () => {
                    this.updateSegmentScenarios(segmentName);
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
    updateSegmentScenarios(segmentName) {
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
            dataManager.saveData(currentData);
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
        
        // 통계 업데이트 (단위 변환 적용)
        document.getElementById('meanValue').textContent = this.formatCurrency(statistics.mean);
        document.getElementById('medianValue').textContent = this.formatCurrency(statistics.median);
        document.getElementById('stdDevValue').textContent = this.formatCurrency(statistics.stdDev);
        document.getElementById('minValue').textContent = this.formatCurrency(statistics.min);
        document.getElementById('maxValue').textContent = this.formatCurrency(statistics.max);
        document.getElementById('percentile25').textContent = this.formatCurrency(statistics.percentile25);
        document.getElementById('percentile75').textContent = this.formatCurrency(statistics.percentile75);

        // 결과 표시
        document.querySelector('.simulation-results').style.display = 'block';
        
        // 다음 단계 버튼 활성화
        document.getElementById('nextToPage4').disabled = false;
        
        // 차트 생성
        this.createValueDistributionChart(histogram);
        
        // 현재 기업가치가 있으면 투자 분석도 자동 실행
        const marketValue = dataManager.getData().financialStructure.companyInfo.marketValue;
        if (marketValue && marketValue > 0) {
            this.updateInvestmentAnalysis(marketValue);
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

        // 라벨에 단위 변환 적용
        const formattedLabels = histogramData.labels.map(label => {
            const value = parseFloat(label);
            return this.formatCurrency(value);
        });

        // 현재가치가 히스토그램 범위 내에 있는지 확인하고 해당 위치 찾기
        let currentValueIndex = -1;
        if (currentMarketValue > 0) {
            const binWidth = parseFloat(histogramData.labels[1]) - parseFloat(histogramData.labels[0]);
            const minValue = parseFloat(histogramData.labels[0]);
            currentValueIndex = Math.floor((currentMarketValue - minValue) / binWidth);
            
            // 범위 내에 있는지 확인
            if (currentValueIndex >= 0 && currentValueIndex < histogramData.data.length) {
                // 현재가치가 정확히 해당 구간에 있는지 확인
                const binStart = minValue + (currentValueIndex * binWidth);
                const binEnd = binStart + binWidth;
                if (currentMarketValue >= binStart && currentMarketValue < binEnd) {
                    // 정확한 위치에 있음
                } else {
                    currentValueIndex = -1; // 범위 밖
                }
            } else {
                currentValueIndex = -1; // 범위 밖
            }
        }

        // 기업가치 분포 데이터셋
        const datasets = [{
            label: '기업가치 분포',
            data: histogramData.data,
            backgroundColor: 'rgba(102, 126, 234, 0.2)',
            borderColor: 'rgba(102, 126, 234, 1)',
            borderWidth: 3,
            fill: true
        }];



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
                            label: function(context) {
                                return context.dataset.label + ': ' + context.parsed.y;
                            }
                        }
                    },
                    annotation: {
                        annotations: currentMarketValue > 0 ? {
                            currentValueLine: {
                                type: 'line',
                                xMin: currentValueIndex >= 0 ? currentValueIndex : null,
                                xMax: currentValueIndex >= 0 ? currentValueIndex : null,
                                borderColor: '#e74c3c',
                                borderWidth: 3,
                                borderDash: [6, 6],
                                label: {
                                    content: `현재가치: ${this.formatCurrency(currentMarketValue)}`,
                                    enabled: true,
                                    position: 'top',
                                    backgroundColor: '#e74c3c',
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
                        } : {}
                    }
                },
                elements: {
                    line: {
                        tension: 0.4, // 곡선 부드러움
                        borderWidth: 3
                    },
                    point: {
                        radius: 0, // 포인트 숨김
                        hoverRadius: 6 // 호버 시에만 포인트 표시
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
    setupPage4Analysis() {
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

        const analysis = simulationEngine.analyzeUpsideDownside(data.simulationResults.values, valueToUse);
        
        // 통계 업데이트
        document.getElementById('upsideProbability').textContent = `${analysis.upsideProbability.toFixed(1)}%`;
        document.getElementById('downsideProbability').textContent = `${analysis.downsideProbability.toFixed(1)}%`;
        document.getElementById('expectedReturn').textContent = `${analysis.expectedReturn.toFixed(1)}%`;
        document.getElementById('expectedLoss').textContent = `${analysis.expectedLoss.toFixed(1)}%`;

        // Upside/Downside 차트 생성
        this.createUpsideDownsideChart(data.simulationResults.values, valueToUse);

        // 결과 표시
        document.querySelector('.investment-results').style.display = 'block';
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
            const binStart = parseFloat(histogram.labels[i]);
            const binEnd = i < histogram.data.length - 1 ? parseFloat(histogram.labels[i + 1]) : binStart + (binStart - parseFloat(histogram.labels[i - 1]));
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
            const binStart = parseFloat(labels[i]);
            const binEnd = parseFloat(labels[i + 1]);
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
    importData(file) {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
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
                        dataManager.importData(data);
                        this.loadData();
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
        const data = dataManager.getData();
        if (!data) {
            alert('데이터를 찾을 수 없습니다. 기업 정보를 먼저 입력해주세요.');
            return;
        }

        const companyName = data.financialStructure.companyInfo.name;
        const apiKey = data.financialStructure.companyInfo.apiKey;

        if (!companyName.trim()) {
            alert('기업명을 입력해주세요.');
            return;
        }

        if (!apiKey.trim()) {
            alert('Google AI Studio API 키를 입력해주세요.\n\nAPI 키 발급 방법:\n1. https://aistudio.google.com/ 접속\n2. API 키 생성\n3. 생성된 키를 여기에 입력');
            return;
        }

        // 분석 결과 박스 표시
        const resultBox = document.getElementById('aiAnalysisResult');
        const contentBox = document.getElementById('aiAnalysisContent');
        resultBox.style.display = 'block';
        contentBox.className = 'loading';
        contentBox.innerHTML = '<div class="loading-text">분석 중...</div>';

        try {
            const response = await this.callGeminiAPI(apiKey, companyName);
            contentBox.className = '';
            contentBox.textContent = response;
        } catch (error) {
            console.error('AI 분석 오류:', error);
            contentBox.className = '';
            contentBox.textContent = 'AI 분석 중 오류가 발생했습니다: ' + error.message;
        }
    }

    // Gemini API 호출
    async callGeminiAPI(apiKey, companyName) {
        const prompt = `${companyName}의 사업을 설명해줘`;
        
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
        const data = dataManager.getData();
        if (!data) {
            alert('데이터를 찾을 수 없습니다. 기업 정보를 먼저 입력해주세요.');
            return;
        }

        const companyName = data.financialStructure.companyInfo.name;
        const apiKey = data.financialStructure.companyInfo.apiKey;

        if (!companyName.trim()) {
            alert('기업명을 입력해주세요.');
            return;
        }

        if (!apiKey.trim()) {
            alert('Google AI Studio API 키를 입력해주세요.');
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
        const costStructure = data.financialStructure.costStructure;
        
        const prompt = `${companyName}의 비용 구조를 매출원가, 감가상각비, 인건비, 연구개발비, 광고선전비로 나누어 분석하고싶어
여기서 고정비는 비용 지출 중에서 고정으로 지출되는 비용 비중이고,
변동비는 매출에 연동되는 비용 비중이야. 매출원가에는 생산직 인건비가 포함되어 있어

현재
매출원가 : ${this.formatNumber(costStructure.cogs.amount)} 중 변동비 비중 ${costStructure.cogs.variableRatio}%
감가상각비 : ${this.formatNumber(costStructure.depreciation.amount)} 중 변동비 비중 ${costStructure.depreciation.variableRatio}%
인건비 : ${this.formatNumber(costStructure.labor.amount)} 중 변동비 비중 ${costStructure.labor.variableRatio}%
연구개발비 : ${this.formatNumber(costStructure.rd.amount)} 중 변동비 비중 ${costStructure.rd.variableRatio}%
광고선전비 : ${this.formatNumber(costStructure.advertising.amount)} 중 변동비 비중 ${costStructure.advertising.variableRatio}%

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
                    // Growth 모델: 영구성장률로 수렴
                    const convergenceFactor = Math.min(1, year / forecastPeriod);
                    const effectiveGrowthRate = (meanGrowthRate + stdDevGrowthRate) * (1 - convergenceFactor) + terminalGrowthRate * convergenceFactor;
                    return initialRevenue * Math.pow(1 + effectiveGrowthRate / 100, year);
                }
            });

            // 하한선 (평균 - 표준편차)
            const lowerData = years.map(year => {
                if (scenario.growthModel === 'cagr') {
                    return initialRevenue * Math.pow(1 + (meanGrowthRate - stdDevGrowthRate) / 100, year);
                } else {
                    // Growth 모델: 영구성장률로 수렴
                    const convergenceFactor = Math.min(1, year / forecastPeriod);
                    const effectiveGrowthRate = (meanGrowthRate - stdDevGrowthRate) * (1 - convergenceFactor) + terminalGrowthRate * convergenceFactor;
                    return initialRevenue * Math.pow(1 + effectiveGrowthRate / 100, year);
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
        const scenarios = data.scenarioModel.segmentScenarios[segmentName] || [];
        const scenario = scenarios[scenarioIndex] || {};
        const currentNote = scenario.note || '';

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
                            <button type="button" class="btn-primary" onclick="app.saveScenarioNote('${segmentName}', ${scenarioIndex})">저장</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
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
    saveScenarioNote(segmentName, scenarioIndex) {
        const noteText = document.getElementById('scenarioNote').value.trim();
        const data = dataManager.getData();
        
        if (!data.scenarioModel.segmentScenarios[segmentName]) {
            data.scenarioModel.segmentScenarios[segmentName] = [];
        }
        
        if (!data.scenarioModel.segmentScenarios[segmentName][scenarioIndex]) {
            data.scenarioModel.segmentScenarios[segmentName][scenarioIndex] = {};
        }
        
        data.scenarioModel.segmentScenarios[segmentName][scenarioIndex].note = noteText;
        dataManager.saveData(data);
        
        // 모달 닫기
        document.getElementById('noteModal').remove();
        
        // Note 버튼 스타일 업데이트
        this.updateNoteButtonStyle(segmentName, scenarioIndex, noteText);
    }

    // Note 버튼 스타일 업데이트
    updateNoteButtonStyle(segmentName, scenarioIndex, noteText) {
        const container = document.getElementById(`scenarios-${segmentName}`);
        const scenarioDiv = container.children[scenarioIndex];
        const noteButton = scenarioDiv.querySelector('.btn-note-scenario');
        
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

        const companyName = data.financialStructure.companyInfo.companyName || '회사';
        
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

        // 저장된 API 키 확인
        const apiKey = data.financialStructure.companyInfo.apiKey;
        if (!apiKey || !apiKey.trim()) {
            alert('재무구조 분석에서 먼저 API 키를 설정해주세요.');
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
}

// 애플리케이션 초기화
document.addEventListener('DOMContentLoaded', () => {
    new ValueWebApp();
}); 