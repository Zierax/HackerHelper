# HackerHelper

HackerHelper is a powerful development assistant that combines multiple AI providers to help you with your coding tasks. It features a modern, responsive UI and supports multiple AI providers including OpenAI GPT-4, Anthropic Claude, Google Gemini, and Groq.

## Features

- 🤖 Multiple AI Provider Support
  - OpenAI GPT-4
  - Anthropic Claude
  - Google Gemini
  - Groq
- 💬 Real-time Chat Interface
- 🌓 Dark Mode Support
- ⚡ Fast Response Times
- 🎨 Modern, Responsive UI

## Prerequisites

Before installing HackerHelper, make sure you have the following installed:

- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn
- pip (Python package manager)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Zierax/HackerHelper.git
cd HackerHelper
```

2. Run the installation script:
```bash
# On Unix-like systems (Linux/macOS)
chmod +x install.sh
./install.sh

# On Windows
# Run the commands manually as described below
```

3. If on Windows or if you prefer manual installation:
```bash
# Install Python dependencies
pip install -r requirements.txt

# Install Node.js dependencies
npm install
```

4. Configure your environment:
- Copy `.env.example` to `.env` (or let the install script create it)
- Add your API keys for the AI providers you want to use:
  ```
  OPENAI_API_KEY=your_key_here
  ANTHROPIC_API_KEY=your_key_here
  GEMINI_API_KEY=your_key_here
  GROQ_API_KEY=your_key_here
  ```

## Running the Application

1. Start the backend server:
```bash
python api/server.py
```

2. In a new terminal, start the frontend development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173` (or the URL shown in your terminal)

## Development

The project structure is organized as follows:

```
HackerHelper/
├── api/                    # Backend Python API
│   ├── core/              # Core functionality
│   │   └── ai_assistant.py # AI provider implementations
│   └── server.py          # Flask server
├── src/                   # Frontend React application
│   ├── components/        # React components
│   │   ├── ui/           # Reusable UI components
│   │   └── AIAssistant.tsx # Main AI chat component
│   ├── lib/              # Utility functions
│   └── App.tsx           # Root component
├── install.sh            # Installation script
├── requirements.txt      # Python dependencies
└── package.json         # Node.js dependencies
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and Vite
- Styled with Tailwind CSS
- Backend powered by Flask
- AI capabilities provided by various AI providers
