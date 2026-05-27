import re
import shutil
from pathlib import Path

from ..config import Settings


class ObsidianExportError(Exception):
    pass


class ObsidianService:
    def __init__(self, settings: Settings):
        self.settings = settings
        self.data_dir = Path(settings.data_dir)
        self.vault_path = Path(settings.obsidian_vault_path) if settings.obsidian_vault_path else None

    def export(self, dates: list[str], target_path: str | None = None) -> dict:
        vault_path = Path(target_path) if target_path else self.vault_path
        if not vault_path:
            raise ObsidianExportError("请先在 .env 中配置 OBSIDIAN_VAULT_PATH，或在导出时指定目标路径")

        entries_dir = self.data_dir / "entries"
        images_dir = self.data_dir / "images"
        target_attachments = vault_path / "attachments"

        vault_path.mkdir(parents=True, exist_ok=True)

        exported = 0
        errors: list[str] = []

        for date_str in dates:
            # Parse year/month from date
            parts = date_str.split("-")
            if len(parts) != 3:
                errors.append(f"{date_str}: 日期格式无效")
                continue
            year, month, _ = parts

            md_path = entries_dir / year / month / f"{date_str}.md"
            if not md_path.exists():
                errors.append(f"{date_str}: 文件不存在")
                continue

            try:
                content = md_path.read_text(encoding="utf-8")

                # Rewrite image references: ![](2026/05/n2-001.jpeg) -> ![](attachments/2026-05-26/n2-001.jpeg)
                img_pattern = re.compile(r'!\[\]\((\d{4}/\d{2}/[^)]+)\)')
                for match in img_pattern.finditer(content):
                    img_rel = match.group(1)
                    img_src = images_dir / img_rel
                    img_filename = Path(img_rel).name

                    img_dst_dir = target_attachments / date_str
                    img_dst_dir.mkdir(parents=True, exist_ok=True)
                    img_dst = img_dst_dir / img_filename

                    if img_src.exists():
                        shutil.copy2(img_src, img_dst)
                        new_ref = f"attachments/{date_str}/{img_filename}"
                        content = content.replace(match.group(0), f"![]({new_ref})")
                    else:
                        errors.append(f"{date_str}: 图片不存在 {img_rel}")

                # Remove the "# 每日反思 — ..." title line (Obsidian uses filename)
                content = re.sub(r'^# 每日反思.*\n?', '', content, flags=re.MULTILINE)

                dst_path = vault_path / f"{date_str}.md"
                dst_path.write_text(content, encoding="utf-8")
                exported += 1
            except Exception as e:
                errors.append(f"{date_str}: {e}")

        return {
            "exported": exported,
            "target": str(vault_path),
            "errors": errors,
        }
