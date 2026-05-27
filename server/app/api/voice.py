from fastapi import APIRouter, File, UploadFile, Depends, HTTPException

from ..services.gemini_service import GeminiService

router = APIRouter(prefix="/api/voice", tags=["voice"])

_gemini_service: GeminiService | None = None


def get_gemini_service() -> GeminiService:
    from ..config import Settings

    global _gemini_service
    if _gemini_service is None:
        _gemini_service = GeminiService(Settings())
    return _gemini_service


@router.post("/transcribe")
async def transcribe_voice(
    audio: UploadFile = File(...),
    gemini: GeminiService = Depends(get_gemini_service),
):
    if not audio.filename:
        raise HTTPException(status_code=400, detail={"error": "请提供音频文件", "detail": ""})

    allowed = {"audio/webm", "audio/mp4", "audio/mpeg", "audio/wav", "audio/ogg", "audio/x-m4a"}
    if audio.content_type and audio.content_type not in allowed:
        raise HTTPException(
            status_code=400,
            detail={"error": "不支持的音频格式", "detail": f"收到: {audio.content_type}"},
        )

    audio_bytes = await audio.read()
    if len(audio_bytes) == 0:
        raise HTTPException(status_code=400, detail={"error": "音频文件为空", "detail": ""})

    if len(audio_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail={"error": "音频文件不能超过 10MB", "detail": ""})

    try:
        text = await gemini.transcribe_audio(audio_bytes, audio.content_type or "audio/webm")
        return {"text": text}
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail={"error": "语音识别服务暂时不可用", "detail": str(e)},
        )


@router.post("/punctuate")
async def punctuate_text(
    body: dict,
    gemini: GeminiService = Depends(get_gemini_service),
):
    text = body.get("text", "").strip()
    if not text:
        raise HTTPException(status_code=400, detail={"error": "文本不能为空", "detail": ""})
    if len(text) > 5000:
        raise HTTPException(status_code=400, detail={"error": "文本过长", "detail": ""})
    try:
        result = await gemini.add_punctuation(text)
        return {"text": result}
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail={"error": "标点服务暂时不可用", "detail": str(e)},
        )
