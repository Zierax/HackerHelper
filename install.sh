#!/bin/bash

# HackerHelper Project Installation Script

# Exit on any error
set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color
RED='\033[0;31m'

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking system prerequisites...${NC}"
    
    # Check for Python
    if ! command_exists python3; then
        echo "Python 3 is required. Please install Python 3.8 or higher."
        exit 1
    fi
    
    # Check for pip
    if ! command_exists pip3; then
        echo "pip is required. Please install pip for Python 3."
        exit 1
    fi
    
    # Check for Node.js and npm
    if ! command_exists node; then
        echo "Node.js is required. Please install Node.js 14 or higher."
        exit 1
    fi
    
    # Check for npm
    if ! command_exists npm; then
        echo "npm is required. Please install npm."
        exit 1
    fi
}

# Create and configure .env file
configure_env() {
    echo -e "${YELLOW}Configuring environment variables...${NC}"
    
    # Create .env file if it doesn't exist
    ENV_FILE=".env"
    
    # Prompt for API keys and other sensitive configurations
    read -p "Enter OpenAI API Key (optional): " OPENAI_API_KEY
    read -p "Enter Shodan API Key (optional): " SHODAN_API_KEY
    read -p "Enter Censys API ID (optional): " CENSYS_API_ID
    read -p "Enter Censys API Secret (optional): " CENSYS_API_SECRET
    read -p "Enter Hunter API Key (optional): " HUNTER_API_KEY
    read -p "Enter VirusTotal API Key (optional): " VIRUSTOTAL_API_KEY
    read -p "Enter GitHub API Key (optional): " GITHUB_API_KEY
    read -p "Enter BinaryEdge API Key (optional): " BINARYEDGE_API_KEY
    read -p "Enter GreyNoise API Key (optional): " GREYNOISE_API_KEY
    read -p "Enter OTX API Key (optional): " OTX_API_KEY
    read -p "Enter Hugging Face API Token (optional): " HUGGINGFACE_API_TOKEN
    read -p "Enter Gemini API Key (optional): " GEMINI_API_KEY
    read -p "Enter Anthropic API Key (optional): " ANTHROPIC_API_KEY
    read -p "Enter Cohere API Key (optional): " COHERE_API_KEY
    
    # Write to .env file
    cat > "$ENV_FILE" << EOL
# AI API Keys
OPENAI_API_KEY=${OPENAI_API_KEY}
GEMINI_API_KEY=${GEMINI_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
COHERE_API_KEY=${COHERE_API_KEY}
HUGGINGFACE_API_TOKEN=${HUGGINGFACE_API_TOKEN}

# Security and Reconnaissance API Keys
SHODAN_API_KEY=${SHODAN_API_KEY}
CENSYS_API_ID=${CENSYS_API_ID}
CENSYS_API_SECRET=${CENSYS_API_SECRET}
HUNTER_API_KEY=${HUNTER_API_KEY}
VIRUSTOTAL_API_KEY=${VIRUSTOTAL_API_KEY}
GITHUB_API_KEY=${GITHUB_API_KEY}
BINARYEDGE_API_KEY=${BINARYEDGE_API_KEY}
GREYNOISE_API_KEY=${GREYNOISE_API_KEY}
OTX_API_KEY=${OTX_API_KEY}

# Server Configuration
VITE_API_URL=http://localhost:5000
EOL

    echo -e "${GREEN}✓ .env file created successfully${NC}"
    
    # Set appropriate permissions to protect sensitive information
    chmod 600 "$ENV_FILE"
}

# Install Python dependencies
install_python_deps() {
    echo -e "${YELLOW}Installing Python dependencies...${NC}"
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate || source venv/Scripts/activate
    
    # Install requirements
    pip install --upgrade pip
    if [ -f requirements.txt ]; then
        pip install -r requirements.txt
    else
        echo -e "${YELLOW}Warning: requirements.txt not found${NC}"
    fi
    
    echo -e "${GREEN}✓ Python dependencies installed successfully${NC}"
}

# Install Node.js dependencies
install_node_deps() {
    echo -e "${YELLOW}Installing Node.js dependencies...${NC}"
    
    # Install npm packages
    npm install
    
    echo -e "${GREEN}✓ Node.js dependencies installed successfully${NC}"
}

# Main installation process
main() {
    echo -e "${GREEN}Starting HackerHelper Project Installation${NC}"
    
    # Check prerequisites
    check_prerequisites
    
    # Configure environment
    configure_env
    
    # Install dependencies
    install_python_deps
    install_node_deps
    
    echo -e "${GREEN}✓ HackerHelper Project Setup Complete!${NC}"
    echo -e "\nTo start the application:"
    echo -e "1. Activate the virtual environment:"
    echo -e "   - On Linux/Mac: ${YELLOW}source venv/bin/activate${NC}"
    echo -e "   - On Windows: ${YELLOW}venv\\Scripts\\activate${NC}"
    echo -e "2. Start the development server:"
    echo -e "   ${YELLOW}npm run dev${NC}"
    
    echo -e "${GREEN}Installing HackerHelper dependencies...${NC}"
    
    # Check if python3 is installed
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Python3 is not installed. Please install Python3 first.${NC}"
        exit 1
    fi
    
    # Check if pip is installed
    if ! command -v pip3 &> /dev/null; then
        echo -e "${RED}pip3 is not installed. Please install pip3 first.${NC}"
        exit 1
    fi
    
    # Check if node is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}Node.js is not installed. Please install Node.js first.${NC}"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}npm is not installed. Please install npm first.${NC}"
        exit 1
    fi
    
    # Install Python dependencies
    echo -e "${GREEN}Installing Python dependencies...${NC}"
    pip3 install -r requirements.txt
    
    # Install Node.js dependencies
    echo -e "${GREEN}Installing Node.js dependencies...${NC}"
    npm install
    
    # Create .env file if it doesn't exist
    if [ ! -f .env ]; then
        echo -e "${GREEN}Creating .env file...${NC}"
        cat > .env << EOL
# API Keys for AI Providers
OPENAI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
GROQ_API_KEY=your_key_here

# Server Configuration
PORT=3001
HOST=localhost
EOL
        echo -e "${GREEN}Created .env file. Please update it with your API keys.${NC}"
    fi
    
    echo -e "${GREEN}Installation complete!${NC}"
    echo -e "To start the application:"
    echo -e "1. Update the .env file with your API keys"
    echo -e "2. Run 'npm run dev' to start the development server"
    echo -e "3. Run 'python3 api/server.py' to start the backend server"
}

# Run the main installation function
main