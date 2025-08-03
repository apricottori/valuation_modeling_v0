// 시뮬레이션 엔진
class SimulationEngine {
    constructor() {
        this.isRunning = false;
        this.shouldStop = false;
    }

    // 정규분포 난수 생성 (Box-Muller 변환)
    generateNormalRandom(mean, stdDev) {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return mean + z * stdDev;
    }

    // 로지스틱 성장률 k 계산
    calculateLogisticK(tam, inflectionPoint, initialValue) {
        if (tam <= initialValue) {
            console.warn('TAM이 초기값보다 작거나 같습니다. 기본값을 사용합니다.');
            return 0.5; // 기본 성장률
        }
        
        // k = (1/t0) * ln((L-N0)/N0)
        const k = (1 / inflectionPoint) * Math.log((tam - initialValue) / initialValue);
        return Math.max(0.01, k); // 최소값 보장
    }

    // 로지스틱 성장 N(t) 계산
    calculateLogisticN(t, tam, k, inflectionPoint) {
        // N(t) = L / (1 + e^(-k(t-t0)))
        const denominator = 1 + Math.exp(-k * (t - inflectionPoint));
        return tam / denominator;
    }

    // TAM의 영구성장률 적용
    calculateGrowingTAM(baseTAM, terminalGrowthRate, year) {
        // TAM이 영구성장률만큼 매년 성장
        return baseTAM * Math.pow(1 + terminalGrowthRate / 100, year);
    }

    // 확률 기반 시나리오 선택
    selectScenario(scenarios) {
        const random = Math.random() * 100;
        let cumulativeProbability = 0;
        
        for (const scenario of scenarios) {
            cumulativeProbability += scenario.probability;
            if (random <= cumulativeProbability) {
                return scenario;
            }
        }
        
        // 기본값 반환 (마지막 시나리오)
        return scenarios[scenarios.length - 1];
    }

    // 매출 예측
    forecastRevenue(segments, scenarios, years, terminalGrowthRate) {
        const revenueForecast = [];
        let currentRevenue = 0;

        // 기준 연도 매출 계산
        for (const segment of segments) {
            const revenue = this.parseSegmentRevenue(segment.revenue);
            currentRevenue += revenue;
        }

        // 연도별 매출 예측
        for (let year = 0; year < years; year++) {
            let yearRevenue = 0;
            
            for (const segment of segments) {
                const segmentScenarios = scenarios[segment.name] || [];
                if (segmentScenarios.length > 0) {
                    const selectedScenario = this.selectScenario(segmentScenarios);
                    const segmentRevenue = this.parseSegmentRevenue(segment.revenue);
                    
                    // 성장 모델에 따른 매출 예측
                    let predictedRevenue = 0;
                    
                    switch (selectedScenario.growthModel) {
                        case 'cagr':
                            // 기존 CAGR 모델
                            const growthRate = this.generateNormalRandom(
                                selectedScenario.meanGrowthRate,
                                selectedScenario.stdDevGrowthRate
                            );
                            predictedRevenue = segmentRevenue * Math.pow(1 + growthRate / 100, year + 1);
                            break;
                            
                        case 'growth':
                            // 단순 성장 모델 (영구성장률로 수렴)
                            const currentGrowthRate = this.generateNormalRandom(
                                selectedScenario.meanGrowthRate,
                                selectedScenario.stdDevGrowthRate
                            );
                            const targetGrowthRate = terminalGrowthRate;
                            const convergenceFactor = Math.min(1, (year + 1) / years); // 추정기간에 걸쳐 수렴
                            const effectiveGrowthRate = currentGrowthRate * (1 - convergenceFactor) + targetGrowthRate * convergenceFactor;
                            predictedRevenue = segmentRevenue * Math.pow(1 + effectiveGrowthRate / 100, year + 1);
                            break;
                            
                        case 'logistic':
                            // 로지스틱 모델
                            const tam = selectedScenario.tam;
                            const inflectionPoint = selectedScenario.inflectionPoint;
                            const k = this.calculateLogisticK(tam, inflectionPoint, segmentRevenue);
                            
                            // TAM이 영구성장률만큼 성장
                            const growingTAM = this.calculateGrowingTAM(tam, terminalGrowthRate, year);
                            
                            // 로지스틱 성장 계산
                            predictedRevenue = this.calculateLogisticN(year + 1, growingTAM, k, inflectionPoint);
                            break;
                            
                        default:
                            // 기본값: CAGR 모델
                            const defaultGrowthRate = this.generateNormalRandom(
                                selectedScenario.meanGrowthRate || 5,
                                selectedScenario.stdDevGrowthRate || 2
                            );
                            predictedRevenue = segmentRevenue * Math.pow(1 + defaultGrowthRate / 100, year + 1);
                            break;
                    }
                    
                    yearRevenue += predictedRevenue;
                } else {
                    // 시나리오가 없는 경우 기본 성장률 적용
                    const segmentRevenue = this.parseSegmentRevenue(segment.revenue);
                    yearRevenue += segmentRevenue * Math.pow(1.02, year + 1); // 2% 기본 성장률
                }
            }
            
            revenueForecast.push(yearRevenue);
        }

        return revenueForecast;
    }

    // 사업부문 revenue 파싱 헬퍼 메서드
    parseSegmentRevenue(revenue) {
        if (typeof revenue === 'number') return revenue;
        if (typeof revenue === 'string') {
            // 콤마 제거 후 파싱
            const cleaned = revenue.replace(/,/g, '').trim();
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    // 비용 예측
    forecastCosts(revenueForecast, costStructure, fixedCostGrowth, years) {
        const costForecast = [];
        const costTypes = ['cogs', 'depreciation', 'labor', 'rd', 'advertising', 'other'];

        for (let year = 0; year < years; year++) {
            const yearCosts = {};
            const currentRevenue = revenueForecast[year];
            const baseRevenue = revenueForecast[0]; // 기준 연도 매출

            for (const costType of costTypes) {
                const cost = costStructure[costType];
                const baseAmount = this.parseCostAmount(cost.amount);
                const variableRatio = parseFloat(cost.variableRatio) || 0;
                const fixedRatio = parseFloat(cost.fixedRatio) || 0;

                // 변동비 계산 (매출 대비 비례)
                const variableCost = (baseAmount * variableRatio / 100) * (currentRevenue / baseRevenue);
                
                // 고정비 계산 (성장률 적용)
                const fixedCostBase = baseAmount * fixedRatio / 100;
                const growthRate = this.generateNormalRandom(
                    fixedCostGrowth[costType].mean,
                    fixedCostGrowth[costType].stdDev
                );
                const fixedCost = fixedCostBase * Math.pow(1 + growthRate / 100, year + 1);

                yearCosts[costType] = variableCost + fixedCost;
            }

            costForecast.push(yearCosts);
        }

        return costForecast;
    }

    // 비용 금액 파싱 헬퍼 메서드
    parseCostAmount(amount) {
        if (typeof amount === 'number') return amount;
        if (typeof amount === 'string') {
            // 콤마 제거 후 파싱
            const cleaned = amount.replace(/,/g, '').trim();
            const parsed = parseFloat(cleaned);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    }

    // FCF 계산
    calculateFCF(revenueForecast, costForecast, taxRate) {
        const fcfForecast = [];

        for (let year = 0; year < revenueForecast.length; year++) {
            const revenue = revenueForecast[year];
            const totalCosts = Object.values(costForecast[year]).reduce((sum, cost) => sum + cost, 0);
            
            // EBIT = 매출 - 총비용
            const ebit = revenue - totalCosts;
            
            // FCF = EBIT * (1 - 세율)
            const fcf = ebit * (1 - taxRate / 100);
            
            fcfForecast.push(fcf);
        }

        return fcfForecast;
    }

    // 기업가치 계산 (DCF)
    calculateEnterpriseValue(fcfForecast, discountRate, terminalGrowthRate) {
        const discountRateDecimal = discountRate / 100;
        const terminalGrowthRateDecimal = terminalGrowthRate / 100;
        
        // 예측 기간 동안의 FCF 현재가치
        let presentValue = 0;
        for (let year = 0; year < fcfForecast.length; year++) {
            const fcf = fcfForecast[year];
            const discountFactor = Math.pow(1 + discountRateDecimal, year + 1);
            presentValue += fcf / discountFactor;
        }

        // 잔존가치 계산 (Gordon Growth Model)
        const lastFCF = fcfForecast[fcfForecast.length - 1];
        const terminalValue = lastFCF * (1 + terminalGrowthRateDecimal) / (discountRateDecimal - terminalGrowthRateDecimal);
        const terminalValuePV = terminalValue / Math.pow(1 + discountRateDecimal, fcfForecast.length);

        return presentValue + terminalValuePV;
    }

    // 단일 시뮬레이션 실행
    runSingleSimulation(data) {
        const { financialStructure, scenarioModel } = data;
        const { companyInfo, businessSegments, costStructure } = financialStructure;
        const { segmentScenarios, fixedCostGrowth } = scenarioModel;

        // 디버깅: 첫 번째 시뮬레이션에서만 로그 출력
        if (Math.random() < 0.001) { // 0.1% 확률로 로그 출력
            console.log('=== 단일 시뮬레이션 디버깅 ===');
            console.log('사업부문:', businessSegments);
            console.log('시나리오:', segmentScenarios);
            console.log('비용 구조:', costStructure);
        }

        // 매출 예측
        const revenueForecast = this.forecastRevenue(
            businessSegments,
            segmentScenarios,
            companyInfo.forecastPeriod,
            companyInfo.terminalGrowthRate
        );

        // 비용 예측
        const costForecast = this.forecastCosts(
            revenueForecast,
            costStructure,
            fixedCostGrowth,
            companyInfo.forecastPeriod
        );

        // FCF 계산
        const fcfForecast = this.calculateFCF(
            revenueForecast,
            costForecast,
            companyInfo.taxRate
        );

        // 기업가치 계산
        const enterpriseValue = this.calculateEnterpriseValue(
            fcfForecast,
            companyInfo.discountRate,
            companyInfo.terminalGrowthRate
        );

        // 디버깅: 첫 번째 시뮬레이션에서만 로그 출력
        if (Math.random() < 0.001) { // 0.1% 확률로 로그 출력
            console.log('매출 예측:', revenueForecast);
            console.log('비용 예측:', costForecast);
            console.log('FCF 예측:', fcfForecast);
            console.log('기업가치:', enterpriseValue);
        }

        return {
            enterpriseValue,
            revenueForecast,
            costForecast,
            fcfForecast
        };
    }

    // 통계 계산
    calculateStatistics(values) {
        // NaN 값들을 필터링
        const validValues = values.filter(v => !isNaN(v) && isFinite(v));
        
        if (validValues.length === 0) {
            return {
                mean: 0,
                median: 0,
                stdDev: 0,
                percentile25: 0,
                percentile75: 0,
                min: 0,
                max: 0
            };
        }
        
        const sorted = [...validValues].sort((a, b) => a - b);
        const n = sorted.length;
        
        const mean = sorted.reduce((sum, val) => sum + val, 0) / n;
        const median = n % 2 === 0 
            ? (sorted[n/2 - 1] + sorted[n/2]) / 2 
            : sorted[Math.floor(n/2)];
        
        const variance = sorted.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
        const stdDev = Math.sqrt(variance);
        
        const percentile25 = sorted[Math.floor(n * 0.25)];
        const percentile75 = sorted[Math.floor(n * 0.75)];

        return {
            mean: mean,
            median: median,
            stdDev: stdDev,
            percentile25: percentile25,
            percentile75: percentile75,
            min: sorted[0],
            max: sorted[n - 1]
        };
    }

    // 히스토그램 데이터 생성
    generateHistogramData(values, bins = 50) {
        // NaN 값들을 필터링
        const validValues = values.filter(v => !isNaN(v) && isFinite(v));
        
        if (validValues.length === 0) {
            return {
                labels: ['No Data'],
                data: [0]
            };
        }
        
        const min = Math.min(...validValues);
        const max = Math.max(...validValues);
        const binWidth = (max - min) / bins;
        
        const histogram = new Array(bins).fill(0);
        const binLabels = [];
        
        for (let i = 0; i < bins; i++) {
            const binStart = min + i * binWidth;
            const binEnd = min + (i + 1) * binWidth;
            binLabels.push(`${binStart.toFixed(0)}M`);
        }
        
        for (const value of validValues) {
            const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
            histogram[binIndex]++;
        }
        
        return {
            labels: binLabels,
            data: histogram
        };
    }

    // Upside/Downside 분석
    analyzeUpsideDownside(values, marketValue) {
        const upsideValues = values.filter(v => v > marketValue);
        const downsideValues = values.filter(v => v <= marketValue);
        
        const upsideProbability = (upsideValues.length / values.length) * 100;
        const downsideProbability = (downsideValues.length / values.length) * 100;
        
        const expectedReturn = upsideValues.length > 0 
            ? upsideValues.reduce((sum, val) => sum + ((val - marketValue) / marketValue * 100), 0) / upsideValues.length
            : 0;
            
        const expectedLoss = downsideValues.length > 0
            ? downsideValues.reduce((sum, val) => sum + ((marketValue - val) / marketValue * 100), 0) / downsideValues.length
            : 0;

        return {
            upsideProbability,
            downsideProbability,
            expectedReturn,
            expectedLoss
        };
    }

    // 메인 시뮬레이션 실행
    async runSimulation(iterationCount, progressCallback) {
        console.log('=== 시뮬레이션 엔진 시작 ===');
        console.log('반복 횟수:', iterationCount);
        
        if (this.isRunning) {
            throw new Error('시뮬레이션이 이미 실행 중입니다.');
        }

        this.isRunning = true;
        this.shouldStop = false;
        
        const data = dataManager.getData();
        if (!data) {
            throw new Error('데이터를 찾을 수 없습니다.');
        }

        console.log('시뮬레이션 데이터:', data);
        console.log('사업부문:', data.financialStructure.businessSegments);
        console.log('시나리오:', data.scenarioModel.segmentScenarios);

        const results = [];
        const batchSize = 100; // 배치 크기
        
        try {
            for (let i = 0; i < iterationCount; i += batchSize) {
                if (this.shouldStop) {
                    break;
                }

                // 배치 단위로 시뮬레이션 실행
                const currentBatchSize = Math.min(batchSize, iterationCount - i);
                for (let j = 0; j < currentBatchSize; j++) {
                    const result = this.runSingleSimulation(data);
                    results.push(result.enterpriseValue);
                }

                // 진행률 업데이트
                const progress = ((i + currentBatchSize) / iterationCount) * 100;
                if (progressCallback) {
                    progressCallback(progress);
                }

                // UI 업데이트를 위한 지연
                await new Promise(resolve => setTimeout(resolve, 0));
            }

            if (!this.shouldStop) {
                console.log('시뮬레이션 완료. 결과 개수:', results.length);
                console.log('결과 샘플:', results.slice(0, 5));
                
                const statistics = this.calculateStatistics(results);
                const histogramData = this.generateHistogramData(results);
                
                console.log('통계:', statistics);
                console.log('히스토그램 데이터:', histogramData);
                
                return {
                    values: results,
                    statistics: statistics,
                    histogram: histogramData
                };
            } else {
                throw new Error('시뮬레이션이 중단되었습니다.');
            }
        } finally {
            this.isRunning = false;
            this.shouldStop = false;
        }
    }

    // 시뮬레이션 중지
    stopSimulation() {
        this.shouldStop = true;
    }

    // 시뮬레이션 상태 확인
    getStatus() {
        return {
            isRunning: this.isRunning,
            shouldStop: this.shouldStop
        };
    }
}

// 전역 시뮬레이션 엔진 인스턴스
const simulationEngine = new SimulationEngine(); 