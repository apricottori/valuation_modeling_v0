// 데이터 관리 모듈
class DataManager {
    constructor() {
        this.storageKey = 'valueWebAppData';
        this.initializeData();
    }

    // 초기 데이터 구조 생성
    initializeData() {
        if (!this.getData()) {
            const initialData = {
                financialStructure: {
                    companyInfo: {
                        name: '',
                        discountRate: 10,
                        taxRate: 25,
                        forecastPeriod: 15,
                        terminalGrowthRate: 2.5,
                        marketValue: 0,
                        apiKey: ''
                    },
                    incomeStatement: {
                        revenue: 0,
                        costOfGoodsSold: 0,
                        grossProfit: 0,
                        operatingIncome: 0
                    },
                    businessSegments: [],
                    costStructure: {
                        cogs: { amount: 0, variableRatio: 80, fixedRatio: 20 },
                        depreciation: { amount: 0, variableRatio: 0, fixedRatio: 100 },
                        labor: { amount: 0, variableRatio: 30, fixedRatio: 70 },
                        rd: { amount: 0, variableRatio: 20, fixedRatio: 80 },
                        advertising: { amount: 0, variableRatio: 60, fixedRatio: 40 },
                        other: { amount: 0, variableRatio: 40, fixedRatio: 60 }
                    }
                },
                scenarioModel: {
                    segmentScenarios: {},
                    fixedCostGrowth: {
                        cogs: { mean: 2, stdDev: 0.5 },
                        depreciation: { mean: 2, stdDev: 0.5 },
                        labor: { mean: 4, stdDev: 1.0 },
                        rd: { mean: 3, stdDev: 1.0 },
                        advertising: { mean: 2, stdDev: 0.5 },
                        other: { mean: 2, stdDev: 0.5 }
                    }
                },
                simulationResults: {}
            };
            this.saveData(initialData);
        }
    }

    // 데이터 저장
    saveData(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('데이터 저장 실패:', error);
            return false;
        }
    }

    // 데이터 로드
    getData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                const parsedData = JSON.parse(data);
                // 데이터 마이그레이션
                return this.migrateData(parsedData);
            }
            return null;
        } catch (error) {
            console.error('데이터 로드 실패:', error);
            return null;
        }
    }

    // 데이터 마이그레이션
    migrateData(data) {
        let needsSave = false;

        // companyInfo에 누락된 필드 추가
        if (data.financialStructure && data.financialStructure.companyInfo) {
            const companyInfo = data.financialStructure.companyInfo;
            if (companyInfo.marketValue === undefined) {
                companyInfo.marketValue = 0;
                needsSave = true;
            }
            if (companyInfo.apiKey === undefined) {
                companyInfo.apiKey = '';
                needsSave = true;
            }
        }

        // 시나리오 모델에 새로운 성장 모델 필드 추가
        if (data.scenarioModel && data.scenarioModel.segmentScenarios) {
            for (const segmentName in data.scenarioModel.segmentScenarios) {
                const scenarios = data.scenarioModel.segmentScenarios[segmentName];
                for (const scenario of scenarios) {
                    if (scenario.growthModel === undefined) {
                        scenario.growthModel = 'cagr'; // 기본값은 CAGR
                        needsSave = true;
                    }
                    if (scenario.tam === undefined) {
                        scenario.tam = 1000000; // 기본 TAM 값
                        needsSave = true;
                    }
                    if (scenario.inflectionPoint === undefined) {
                        scenario.inflectionPoint = 3; // 기본 변곡점 (3년 후)
                        needsSave = true;
                    }
                }
            }
        }

        // 마이그레이션이 필요한 경우 저장
        if (needsSave) {
            this.saveData(data);
        }

        return data;
    }

    // 특정 섹션 데이터 업데이트
    updateSection(section, data) {
        const currentData = this.getData();
        if (currentData) {
            currentData[section] = { ...currentData[section], ...data };
            return this.saveData(currentData);
        }
        return false;
    }

    // 재무 구조 데이터 업데이트
    updateFinancialStructure(data) {
        return this.updateSection('financialStructure', data);
    }

    // 시나리오 모델 데이터 업데이트
    updateScenarioModel(data) {
        return this.updateSection('scenarioModel', data);
    }

    // 시뮬레이션 결과 저장
    saveSimulationResults(results) {
        const currentData = this.getData();
        if (currentData) {
            currentData.simulationResults = results;
            return this.saveData(currentData);
        }
        return false;
    }

    // 데이터 내보내기
    exportData() {
        const data = this.getData();
        if (data) {
            // 파일명 생성: 기업명_날짜
            const companyName = data.financialStructure.companyInfo.name || 'Unknown';
            const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식
            const fileName = `${companyName}_${currentDate}.json`;
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    }

    // 데이터 가져오기
    importData(data) {
        if (this.validateData(data)) {
            this.saveData(data);
            return true;
        } else {
            throw new Error('유효하지 않은 데이터 형식입니다.');
        }
    }

    // 데이터 유효성 검사
    validateData(data) {
        const requiredSections = ['financialStructure', 'scenarioModel'];
        const requiredFinancialStructure = ['companyInfo', 'incomeStatement', 'businessSegments', 'costStructure'];
        const requiredScenarioModel = ['segmentScenarios', 'fixedCostGrowth'];
        const requiredCompanyInfo = ['name', 'discountRate', 'taxRate', 'forecastPeriod', 'terminalGrowthRate', 'marketValue', 'apiKey'];
        const requiredIncomeStatement = ['revenue', 'costOfGoodsSold', 'grossProfit', 'operatingIncome'];
        const requiredCostStructure = ['cogs', 'depreciation', 'labor', 'rd', 'advertising', 'other'];
        const requiredScenarioFields = ['name', 'probability', 'growthModel', 'meanGrowthRate', 'stdDevGrowthRate', 'tam', 'inflectionPoint', 'note'];

        // 필수 섹션 확인
        for (const section of requiredSections) {
            if (!data[section]) return false;
        }

        // 재무 구조 필수 항목 확인
        for (const item of requiredFinancialStructure) {
            if (!data.financialStructure[item]) return false;
        }

        // 기업 정보 필수 항목 확인
        for (const item of requiredCompanyInfo) {
            if (data.financialStructure.companyInfo[item] === undefined) return false;
        }

        // 손익계산서 필수 항목 확인
        for (const item of requiredIncomeStatement) {
            if (data.financialStructure.incomeStatement[item] === undefined) return false;
        }

        // 비용 구조 필수 항목 확인
        for (const item of requiredCostStructure) {
            if (!data.financialStructure.costStructure[item]) return false;
        }

        // 시나리오 모델 필수 항목 확인
        for (const item of requiredScenarioModel) {
            if (!data.scenarioModel[item]) return false;
        }

        // 시나리오 데이터의 필수 필드 확인
        if (data.scenarioModel.segmentScenarios) {
            for (const segmentName in data.scenarioModel.segmentScenarios) {
                const scenarios = data.scenarioModel.segmentScenarios[segmentName];
                if (Array.isArray(scenarios)) {
                    for (const scenario of scenarios) {
                        // 기본 필수 필드 확인
                        if (!scenario.name || scenario.probability === undefined || !scenario.growthModel) {
                            console.warn(`시나리오 필수 필드 누락: ${segmentName} - ${scenario.name || 'unnamed'}`);
                            return false;
                        }
                        
                        // 성장 모델별 필수 필드 확인
                        if (scenario.growthModel === 'cagr' || scenario.growthModel === 'growth') {
                            if (scenario.meanGrowthRate === undefined || scenario.stdDevGrowthRate === undefined) {
                                console.warn(`CAGR/Growth 모델 필수 필드 누락: ${segmentName} - ${scenario.name}`);
                                return false;
                            }
                        } else if (scenario.growthModel === 'logistic') {
                            if (scenario.tam === undefined || scenario.inflectionPoint === undefined) {
                                console.warn(`Logistic 모델 필수 필드 누락: ${segmentName} - ${scenario.name}`);
                                return false;
                            }
                        }
                        
                        // note 필드는 선택사항이므로 undefined여도 괜찮음
                    }
                }
            }
        }

        return true;
    }

    // 데이터 초기화
    clearData() {
        try {
            localStorage.removeItem(this.storageKey);
            this.initializeData();
            return true;
        } catch (error) {
            console.error('데이터 초기화 실패:', error);
            return false;
        }
    }

    // 특정 비용 항목의 변동비/고정비 비율 동기화
    syncCostRatios(costType) {
        const currentData = this.getData();
        if (currentData && currentData.financialStructure.costStructure[costType]) {
            const cost = currentData.financialStructure.costStructure[costType];
            const total = cost.variableRatio + cost.fixedRatio;
            if (total !== 100) {
                // 비율을 100%로 정규화
                cost.variableRatio = Math.round((cost.variableRatio / total) * 100);
                cost.fixedRatio = 100 - cost.variableRatio;
                this.saveData(currentData);
            }
        }
    }

    // 사업부문 매출 합계 계산
    calculateTotalSegmentRevenue() {
        const currentData = this.getData();
        if (currentData && currentData.financialStructure.businessSegments) {
            const total = currentData.financialStructure.businessSegments.reduce((total, segment) => {
                let revenue = 0;
                
                // revenue가 숫자인 경우
                if (typeof segment.revenue === 'number') {
                    revenue = segment.revenue;
                }
                // revenue가 문자열인 경우 (콤마 포함)
                else if (typeof segment.revenue === 'string') {
                    revenue = parseFloat(segment.revenue.replace(/,/g, '')) || 0;
                }
                
                return total + revenue;
            }, 0);
            
            // 디버깅 로그
            console.log('사업부문 매출 합계 계산:', {
                segments: currentData.financialStructure.businessSegments,
                total: total
            });
            
            return total;
        }
        return 0;
    }

    // 매출총이익 자동 계산
    calculateGrossProfit() {
        const currentData = this.getData();
        if (currentData && currentData.financialStructure.incomeStatement) {
            const incomeStatement = currentData.financialStructure.incomeStatement;
            const revenue = parseFloat(incomeStatement.revenue) || 0;
            const costOfGoodsSold = parseFloat(incomeStatement.costOfGoodsSold) || 0;
            const grossProfit = revenue - costOfGoodsSold;
            
            currentData.financialStructure.incomeStatement.grossProfit = grossProfit;
            this.saveData(currentData);
            return grossProfit;
        }
        return 0;
    }

    // 기타 사업부문 매출 자동 계산
    calculateOtherSegmentRevenue() {
        const currentData = this.getData();
        if (currentData && currentData.financialStructure.incomeStatement) {
            const totalRevenue = parseFloat(currentData.financialStructure.incomeStatement.revenue) || 0;
            const userSegmentRevenue = this.calculateTotalSegmentRevenue();
            const otherRevenue = Math.max(0, totalRevenue - userSegmentRevenue);
            
            // 디버깅 로그
            console.log('기타 매출 계산:', {
                totalRevenue: totalRevenue,
                userSegmentRevenue: userSegmentRevenue,
                otherRevenue: otherRevenue,
                segments: currentData.financialStructure.businessSegments
            });
            
            return otherRevenue;
        }
        return 0;
    }

    // 기타 비용 자동 계산
    calculateOtherCost() {
        const currentData = this.getData();
        if (currentData && currentData.financialStructure.incomeStatement) {
            const revenue = parseFloat(currentData.financialStructure.incomeStatement.revenue.toString().replace(/,/g, '')) || 0;
            const operatingIncome = parseFloat(currentData.financialStructure.incomeStatement.operatingIncome.toString().replace(/,/g, '')) || 0;
            const totalCost = revenue - operatingIncome;
            
            // 사용자가 입력한 비용들의 합계 계산
            const costStructure = currentData.financialStructure.costStructure;
            const userCosts = [
                parseFloat(costStructure.cogs.amount.toString().replace(/,/g, '')) || 0,
                parseFloat(costStructure.depreciation.amount.toString().replace(/,/g, '')) || 0,
                parseFloat(costStructure.labor.amount.toString().replace(/,/g, '')) || 0,
                parseFloat(costStructure.rd.amount.toString().replace(/,/g, '')) || 0,
                parseFloat(costStructure.advertising.amount.toString().replace(/,/g, '')) || 0
            ];
            const userCostSum = userCosts.reduce((sum, cost) => sum + cost, 0);
            
            const otherCost = Math.max(0, totalCost - userCostSum);
            
            // 기타 비용 업데이트
            if (currentData.financialStructure.costStructure.other) {
                currentData.financialStructure.costStructure.other.amount = otherCost;
                this.saveData(currentData);
            }
            
            return otherCost;
        }
        return 0;
    }
}

// 전역 데이터 매니저 인스턴스
const dataManager = new DataManager(); 