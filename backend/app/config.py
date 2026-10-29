import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load .env from backend folder or current directory
load_dotenv()
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


class Settings(BaseSettings):
    # Nebius Token Factory Configuration
    nebius_api_key: str = os.getenv("NEBIUS_API_KEY", "")
    nebius_base_url: str = os.getenv(
        "NEBIUS_BASE_URL", "https://api.tokenfactory.nebius.com/v1/"
    )
    nebius_model_id: str = os.getenv(
        "NEBIUS_MODEL_ID", "nvidia/nemotron-3-super-120b-a12b"
    )

    # Server Configuration
    host: str = os.getenv("BACKEND_HOST", "0.0.0.0")
    port: int = int(os.getenv("BACKEND_PORT", "8000"))
    environment: str = os.getenv("ENVIRONMENT", "development")
    database_path: str = os.getenv("DATABASE_PATH", "ghosttrace.db")

    # Allowed CORS Origins
    allowed_origins_raw: str = os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000,https://ghosttrace.vercel.app",
    )

    @property
    def allowed_origins(self) -> List[str]:
        return [origin.strip() for origin in self.allowed_origins_raw.split(",") if origin.strip()]

    @property
    def has_nebius_key(self) -> bool:
        raw = (self.nebius_api_key or "").strip()
        dummy_placeholders = {
            "",
            "your_actual_api_key",
            "your_nebius_api_key_here",
            "your_api_key_here",
        }
        return bool(raw and len(raw) > 10 and raw.lower() not in dummy_placeholders)


settings = Settings()

