from google import genai
from google.genai import types

from ..config import Settings

SUMMARIZE_PROMPT = """你是一位善于反思的助手。以下是用户今天记录的所有笔记。

请直接写一份当天的综合总结，严格控制在2-3句话、150字以内。注意：
- 直接输出总结内容，不要打招呼、不要自我介绍、不要用任何开场白
- 以第三视角描述用户今天的主要想法、活动和情绪状态
- 提及笔记中的关键细节
- 语气温暖、共情
- 不要编造用户没有提到的内容
- 用"今天你"开头
- 只要输出总结本身，不要加任何额外说明、标题或后缀

以下是今天的笔记：
"""

DISCUSS_PROMPT = """你是一位温暖而善于思考的反思伙伴，名字叫"回响AI助手"。

以下包含：
1. 用户今天的所有笔记内容
2. 当天的总结（如有）
3. 已经发生的讨论对话

请以朋友的口吻回复用户的最新消息，进行深度反思对话。

要求：
- 始终使用中文，回复控制在200字以内
- 语气温暖、共情，像朋友聊天
- 回复结束时，必须提出一个引人思考的追问，引导用户继续探索
- 如果用户寻求建议，给出具体可操作的建议
- 不要重复用户已经说过的话
- 保持真诚，不要过度赞美
- 直接说话，不要用"回响AI助手："开头
"""

OPENER_PROMPT = """你是一位温暖而善于思考的反思伙伴，名字叫"回响AI助手"。

以下是用户今天的笔记内容和总结。请主动发起一段对话，引导用户进行自我反思。

要求：
- 用2-3句话开场，先表达对用户今天经历的共情和理解
- 然后提出一个具体的、引人思考的问题，引导用户深入探索
- 问题要基于笔记中的具体内容，不要泛泛而谈
- 语气温暖、真诚，像朋友在聊天
- 始终使用中文
- 直接说话，不要用"回响AI助手："开头
- 不要过度赞美

以下是用户今天的内容：
"""


KEYWORD_PROMPT = """从以下单条笔记中提取1-3个核心关键词，每个关键词1-4个字。
关键词应能概括这条笔记的主要内容、情绪或主题。
只输出关键词，用中文顿号（、）分隔，不要加任何额外说明、序号或标点。

笔记内容：
"""


class GeminiService:
    def __init__(self, settings: Settings):
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model = "gemini-2.5-flash"

    async def generate_summary(self, notes_context: str) -> str:
        """Generate a daily summary based on all notes."""
        if not notes_context.strip():
            return "今天还没有记录内容。"

        response = self.client.models.generate_content(
            model=self.model,
            contents=SUMMARIZE_PROMPT + "\n" + notes_context,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2048,
            ),
        )
        return response.text.strip()

    async def generate_opener(self, notes_context: str, summary: str) -> str:
        """Generate a proactive opening message for the discussion."""
        content = f"笔记内容：\n{notes_context}\n\n总结：\n{summary}"
        response = self.client.models.generate_content(
            model=self.model,
            contents=OPENER_PROMPT + "\n" + content,
            config=types.GenerateContentConfig(
                temperature=0.8,
                max_output_tokens=2048,
            ),
        )
        return response.text.strip()

    async def discuss(self, full_context: str, user_message: str) -> str:
        """Generate an AI reply in the discussion thread."""
        prompt = DISCUSS_PROMPT + "\n\n" + full_context + "\n\n用户的最新消息：\n" + user_message

        response = self.client.models.generate_content(
            model=self.model,
            contents=prompt,
            config=types.GenerateContentConfig(
                temperature=0.8,
                max_output_tokens=2048,
            ),
        )
        return response.text.strip()

    async def summarize_with_images(self, notes_context: str, image_paths: list[str]) -> str:
        """Generate summary including images (handwritten notes)."""
        parts = [SUMMARIZE_PROMPT + "\n" + notes_context]

        for img_path in image_paths:
            parts.append(types.Part.from_bytes(
                data=open(img_path, "rb").read(),
                mime_type="image/jpeg",
            ))

        response = self.client.models.generate_content(
            model=self.model,
            contents=parts,
            config=types.GenerateContentConfig(
                temperature=0.7,
                max_output_tokens=2048,
            ),
        )
        return response.text.strip()

    async def transcribe_audio(self, audio_bytes: bytes, mime_type: str) -> str:
        """Transcribe audio to text using Gemini with proper punctuation."""
        response = self.client.models.generate_content(
            model=self.model,
            contents=[
                "请将这段语音转写成中文文字。要求：添加正确的标点符号（句号、逗号、问号、感叹号等），根据语义合理断句。只输出转写后的文字，不要加任何额外说明。",
                types.Part.from_bytes(data=audio_bytes, mime_type=mime_type),
            ],
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=2048,
            ),
        )
        return response.text.strip()

    async def add_punctuation(self, text: str) -> str:
        """Add punctuation to Chinese text."""
        response = self.client.models.generate_content(
            model=self.model,
            contents=f"请为以下中文文本添加标点符号（句号、逗号、问号、感叹号等）。只输出添加标点后的文本，不要改动任何文字内容，不要加任何说明。\n\n{text}",
            config=types.GenerateContentConfig(
                temperature=0.1,
                max_output_tokens=2048,
            ),
        )
        return response.text.strip()

    async def extract_keywords(self, notes_context: str) -> str:
        """Extract 2-4 keywords from notes, returned as a 顿号-separated string."""
        if not notes_context.strip():
            return ""

        response = self.client.models.generate_content(
            model=self.model,
            contents=KEYWORD_PROMPT + "\n" + notes_context,
            config=types.GenerateContentConfig(
                temperature=0.5,
                max_output_tokens=256,
            ),
        )
        return response.text.strip()

    async def extract_keywords_with_images(self, note_text: str, image_paths: list[str]) -> str:
        """Extract keywords from note text and attached images."""
        parts = [KEYWORD_PROMPT + "\n" + note_text]

        for img_path in image_paths:
            parts.append(types.Part.from_bytes(
                data=open(img_path, "rb").read(),
                mime_type="image/jpeg",
            ))

        response = self.client.models.generate_content(
            model=self.model,
            contents=parts,
            config=types.GenerateContentConfig(
                temperature=0.5,
                max_output_tokens=256,
            ),
        )
        return response.text.strip()

    async def discuss_with_images(
        self, full_context: str, user_message: str, image_paths: list[str]
    ) -> str:
        """Generate discussion reply including images."""
        prompt = DISCUSS_PROMPT + "\n\n" + full_context + "\n\n用户的最新消息：\n" + user_message
        parts = [prompt]

        for img_path in image_paths:
            parts.append(types.Part.from_bytes(
                data=open(img_path, "rb").read(),
                mime_type="image/jpeg",
            ))

        response = self.client.models.generate_content(
            model=self.model,
            contents=parts,
            config=types.GenerateContentConfig(
                temperature=0.8,
                max_output_tokens=2048,
            ),
        )
        return response.text.strip()
