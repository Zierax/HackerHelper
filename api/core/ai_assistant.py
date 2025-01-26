import os
from typing import Dict, List, Optional, Any, Generator
from enum import Enum
import openai
import google.generativeai as genai
from groq import Groq
import anthropic
import json
from dataclasses import dataclass
from abc import ABC, abstractmethod
import logging
import time
from contextlib import contextmanager
import random
import asyncio

@dataclass
class ModuleConfig:
    enabled: bool = True
    timeout: int = 30
    max_retries: int = 3
    debug_mode: bool = False
    custom_settings: Dict[str, Any] = None

class AIModule(ABC):
    @abstractmethod
    def validate_config(self) -> bool:
        pass
    
    @abstractmethod
    def get_capabilities(self) -> Dict[str, Any]:
        pass

class AIProvider(Enum):
    OPENAI = "openai"
    GROQ = "groq" 
    GEMINI = "gemini"
    ANTHROPIC = "anthropic"

class ProviderModule(AIModule):
    def __init__(self, provider: AIProvider, config: ModuleConfig):
        self.provider = provider
        self.config = config
        self.capabilities = {
            AIProvider.OPENAI: {
                "name": "OpenAI GPT-4",
                "description": "Advanced language model with broad capabilities",
                "max_tokens": 4096,
                "streaming": True,
                "functions": True
            },
            AIProvider.GROQ: {
                "name": "Groq Mixtral",
                "description": "High-performance inference optimized model",
                "max_tokens": 32768,
                "streaming": True,
                "functions": False
            },
            AIProvider.GEMINI: {
                "name": "Google Gemini Pro",
                "description": "Google's latest multimodal AI model",
                "max_tokens": 2048,
                "streaming": True,
                "functions": False
            },
            AIProvider.ANTHROPIC: {
                "name": "Anthropic Claude",
                "description": "Advanced reasoning and analysis capabilities",
                "max_tokens": 4096,
                "streaming": True,
                "functions": True
            }
        }

    def validate_config(self) -> bool:
        if not self.config.enabled:
            return True
        return bool(os.getenv(f"{self.provider.value.upper()}_API_KEY"))

    def get_capabilities(self) -> Dict[str, Any]:
        return self.capabilities.get(self.provider, {})

class AIAssistant:
    def __init__(self):
        self.modules: Dict[AIProvider, ProviderModule] = {}
        self.clients: Dict[AIProvider, Any] = {}
        self.logger = logging.getLogger(__name__)
        self._setup_logging()
        self._load_config()
        self._init_modules()
        self._init_clients()

    def _setup_logging(self):
        """Configure logging for the AI assistant"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )

    def _load_config(self):
        """Load configuration from environment file with validation"""
        self.config = {}
        for provider in AIProvider:
            try:
                custom_settings = json.loads(os.getenv(f"{provider.value.upper()}_SETTINGS", "{}"))
                if not isinstance(custom_settings, dict):
                    self.logger.warning(f"Invalid custom settings format for {provider}")
                    custom_settings = {}
                
                self.config[provider] = ModuleConfig(
                    enabled=os.getenv(f"{provider.value.upper()}_ENABLED", "true").lower() == "true",
                    timeout=int(os.getenv(f"{provider.value.upper()}_TIMEOUT", "30")),
                    max_retries=int(os.getenv(f"{provider.value.upper()}_MAX_RETRIES", "3")),
                    debug_mode=os.getenv(f"{provider.value.upper()}_DEBUG", "false").lower() == "true",
                    custom_settings=custom_settings
                )
            except (json.JSONDecodeError, ValueError) as e:
                self.logger.error(f"Error loading config for {provider}: {str(e)}")
                self.config[provider] = ModuleConfig(enabled=False)

    def _init_modules(self):
        """Initialize provider modules with configurations"""
        for provider in AIProvider:
            self.modules[provider] = ProviderModule(provider, self.config[provider])

    def _init_clients(self):
        """Initialize API clients for enabled and validated providers"""
        for provider in AIProvider:
            if not self.modules[provider].validate_config():
                continue

            api_key = os.getenv(f"{provider.value.upper()}_API_KEY")
            try:
                if provider == AIProvider.OPENAI:
                    self.clients[provider] = openai.OpenAI(api_key=api_key)
                elif provider == AIProvider.GROQ:
                    self.clients[provider] = Groq(api_key=api_key)
                elif provider == AIProvider.GEMINI:
                    genai.configure(api_key=api_key)
                    self.clients[provider] = genai
                elif provider == AIProvider.ANTHROPIC:
                    self.clients[provider] = anthropic.Anthropic(api_key=api_key)
            except Exception as e:
                if self.config[provider].debug_mode:
                    print(f"Failed to initialize {provider}: {str(e)}")

    @contextmanager
    def _provider_client(self, provider: AIProvider) -> Generator[Any, None, None]:
        """Context manager for handling provider client sessions"""
        if provider not in self.clients:
            raise ValueError(f"Provider {provider} not initialized")
        
        try:
            yield self.clients[provider]
        except Exception as e:
            self.logger.error(f"Error with provider {provider}: {str(e)}")
            raise
        finally:
            # Cleanup if needed
            pass

    def _calculate_backoff(self, attempt: int, base_delay: float = 1.0) -> float:
        """Calculate exponential backoff delay"""
        return min(base_delay * (2 ** attempt), 30.0)  # Max 30 second delay

    async def chat(self, provider_name: str, message: str) -> str:
        """Chat method using a specific AI provider"""
        if not message or len(message.strip()) == 0:
            raise ValueError("Message cannot be empty")

        try:
            provider = AIProvider(provider_name.lower())
        except ValueError:
            raise ValueError(f"Invalid provider: {provider_name}")

        if not self.modules[provider].validate_config() or not self.config[provider].enabled:
            raise RuntimeError(f"Provider {provider_name} is not available")

        config = self.config[provider]
        max_tokens = min(
            self.modules[provider].get_capabilities().get("max_tokens", 1000), 
            1000
        )
        temperature = 0.7

        # Retry mechanism for single provider
        for attempt in range(config.max_retries):
            try:
                with self._provider_client(provider) as client:
                    if provider == AIProvider.OPENAI:
                        response = await client.chat.completions.create(
                            model="gpt-4-turbo-preview",
                            messages=[
                                {"role": "user", "content": message}
                            ],
                            max_tokens=max_tokens,
                            temperature=temperature,
                            timeout=config.timeout
                        )
                        return response.choices[0].message.content
                    elif provider == AIProvider.GROQ:
                        response = await client.chat.completions.create(
                            model="mixtral-8x7b-32768",
                            messages=[
                                {"role": "user", "content": message}
                            ],
                            max_tokens=max_tokens,
                            temperature=temperature,
                            timeout=config.timeout
                        )
                        return response.choices[0].message.content
                    elif provider == AIProvider.GEMINI:
                        model = client.GenerativeModel('gemini-pro')
                        response = await model.generate_content(message)
                        return response.text
                    elif provider == AIProvider.ANTHROPIC:
                        response = await client.messages.create(
                            model="claude-3-opus-20240229",
                            max_tokens=max_tokens,
                            messages=[
                                {"role": "user", "content": message}
                            ],
                            temperature=temperature
                        )
                        return response.content[0].text

            except Exception as e:
                self.logger.warning(
                    f"Attempt {attempt + 1} failed for {provider}: {str(e)}"
                )

                if attempt < config.max_retries - 1:
                    delay = self._calculate_backoff(attempt)
                    self.logger.info(f"Retrying in {delay:.2f} seconds...")
                    await asyncio.sleep(delay)
                    continue

        raise Exception(f"All attempts failed with provider {provider_name}")

    def get_available_providers(self) -> List[Dict[str, Any]]:
        """Get list of configured providers with their capabilities"""
        return [
            {
                "provider": provider.value,
                "enabled": self.config[provider].enabled,
                "configured": self.modules[provider].validate_config(),
                "capabilities": self.modules[provider].get_capabilities()
            }
            for provider in AIProvider
        ]

    def update_provider_config(self, provider: AIProvider, new_config: Dict[str, Any]) -> bool:
        """Update configuration for a specific provider"""
        try:
            self.config[provider] = ModuleConfig(**new_config)
            self._init_modules()
            self._init_clients()
            return True
        except Exception:
            return False
