# Hacker Helper

A comprehensive security research and penetration testing toolkit built with React, TypeScript, and Python. This application combines various security tools, mind mapping capabilities, and AI assistance to streamline the workflow of security professionals and ethical hackers.

---

## 🛡️ Key Features

### Security Tools Suite
- Vulnerability scanning and assessment
- Network reconnaissance tools
- Cryptographic operations
- Security data visualization

### Mind Mapping & Organization
- Interactive mind map creation and editing
- Real-time collaboration capabilities
- Advanced node customization
- Auto-layout functionality
- History tracking with undo/redo

### Project Management
- Task tracking and organization
- Note-taking with tags
- GitHub repository integration
- Project data import/export

### AI Integration
- Multiple AI provider support (OpenAI, Anthropic, Google, etc.)
- Security analysis assistance
- Code review helper
- Threat assessment

---

## 🔧 Tech Stack

### Frontend
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS & Emotion for styling
- React Flow for mind mapping
- React Query for state management
- Framer Motion for animations

### Backend
- Flask REST API
- Multiple security-focused Python libraries
- Redis for caching
- JWT authentication
- Rate limiting and security middleware

---

## ⚙️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Zierax/HackerHelper.git
   cd HackerHelper
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```

4. Run the installation script:
   ```bash
   chmod +x install.sh
   ./install.sh
   ```
   
   **The installation script will:**
   - Check system prerequisites
   - Set up environment variables
   - Install Python dependencies
   - Install Node.js dependencies
   - Configure API keys

---

## 🚀 Development

1. Start the frontend and backend development servers:
   ```bash
   python3 api/server.py & npm run dev
   ```

---

## 🔑 API Keys

Configure API integrations in your `.env` file:

- OpenAI API Key
- Anthropic API Key
- Google Gemini API Key
- Shodan API Key
- Censys API Keys
- VirusTotal API Key
- And more...

---

## 🏗️ Project Structure

```plaintext
src/
├── components/ # React components
├── core/       # Core application logic
├── store/      # State management
├── utils/      # Utility functions
└── assets/     # Static assets
api/
├── routes/     # API endpoints
├── services/   # Business logic
├── utils/      # Helper functions
└── models/     # Data models
```

---

## 🧪 Testing

Run frontend tests:
```bash
npm run test
```

Run backend tests:
```bash
pytest
```

Generate coverage report:
```bash
npm run test:coverage
```

---

## 📄 License

This project is licensed under the MIT License. See the LICENSE file for details.

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.

---

## 🔐 Security

For security concerns, please email [zs.01117875692@gmail.com](mailto:zs.01117875692@gmail.com).

---

## 👤 Author

Created by **Ziad** - Web2/Web3 Penetration Tester & Bug Hunter

- **GitHub:** [@Zierax](https://github.com/Zierax)
- **LinkedIn:** [z14d](https://linkedin.com/in/z14d)
- **Twitter:** [@Zierax_x](https://twitter.com/Zierax_x)
