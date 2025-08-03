# Enterprise Value Web Application

A comprehensive web application for enterprise valuation using Monte Carlo simulation with probabilistic scenario modeling.

## Features

### 📊 Financial Structure Analysis
- Company information management
- Business segment configuration
- Cost structure analysis with variable/fixed cost ratios
- AI-powered cost model validation

### 🎯 Probabilistic Scenario Modeling
- Multiple growth models: CAGR, Growth (convergence), Logistic regression
- Scenario probability management
- Individual scenario visualization
- AI-powered scenario review and SWOT analysis
- Note-taking functionality for scenarios

### 🔄 Monte Carlo Simulation
- Advanced revenue forecasting
- Cost structure simulation
- Free Cash Flow calculation
- Enterprise value distribution analysis

### 📈 Investment Analysis
- Value distribution charts
- Upside/downside analysis
- Investment decision support

## Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js with Annotation Plugin
- **AI Integration**: Google AI Studio API (Gemini)
- **Data Storage**: LocalStorage
- **Deployment**: Render (Static Site)

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Google AI Studio API key (for AI features)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/value-web-app.git
   cd value-web-app
   ```

2. Open `index.html` in your web browser

3. For AI features, add your Google AI Studio API key in the financial structure section

## Usage

### 1. Financial Structure Setup
- Enter company information
- Configure business segments
- Set up cost structure with variable/fixed ratios
- Use AI to validate cost models

### 2. Scenario Modeling
- Create scenarios for each business segment
- Choose growth models (CAGR, Growth, Logistic)
- Set probabilities and model-specific parameters
- Add notes and get AI review

### 3. Simulation
- Run Monte Carlo simulation
- Analyze results and distributions
- Export data for further analysis

### 4. Investment Analysis
- Review value distributions
- Analyze upside/downside scenarios
- Make informed investment decisions

## Data Management

- **Export**: Save all data as JSON file
- **Import**: Load previously saved data
- **Local Storage**: Automatic data persistence

## Growth Models

### CAGR (Compound Annual Growth Rate)
- Simple compound growth model
- Requires mean growth rate and standard deviation

### Growth (Convergence)
- Growth rate converges to terminal growth rate over forecast period
- Requires initial growth rate, standard deviation, and convergence period

### Logistic Regression
- S-curve growth model
- Parameters: TAM (Total Addressable Market), inflection point, initial value
- TAM grows annually by terminal growth rate

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions, please open an issue on GitHub.

## Acknowledgments

- Chart.js for data visualization
- Google AI Studio for AI integration
- Render for hosting services 