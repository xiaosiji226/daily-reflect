from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str
    data_dir: str = "./data"
    max_image_count: int = 5
    max_image_size_mb: int = 10
    allowed_image_types: list[str] = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]
    log_level: str = "INFO"
    obsidian_vault_path: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}
