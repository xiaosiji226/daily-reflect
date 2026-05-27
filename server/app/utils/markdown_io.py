"""
Read and write daily markdown files with YAML frontmatter.

File format:
---
date: "2026-05-22"
created_at: "2026-05-22T09:15:00"
updated_at: "2026-05-22T21:30:00"
---

# 每日反思 — 2026年5月22日

## 原始笔记

### 09:15 — n1
笔记内容...

### 14:30 — n2 [图片]
![](../images/2026/05/n2-001.jpg)
笔记内容...

## 总结
AI 生成的综合总结...

## 讨论

**你 (20:15):** 消息...
**思语 (20:15):** 回复...
"""

import re
from datetime import datetime, timezone, timedelta

TZ = timezone(timedelta(hours=8))


def parse_frontmatter(content: str) -> dict:
    """Extract YAML frontmatter as a simple dict."""
    m = re.match(r'^---\s*\n(.*?)\n---\s*\n', content, re.DOTALL)
    if not m:
        return {}
    meta = {}
    for line in m.group(1).strip().split('\n'):
        line = line.strip()
        if ':' in line:
            key, _, val = line.partition(':')
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            meta[key] = val
    return meta


def dump_frontmatter(meta: dict) -> str:
    """Build YAML frontmatter string."""
    lines = ['---']
    for key, val in meta.items():
        lines.append(f'{key}: "{val}"')
    lines.append('---')
    lines.append('')
    return '\n'.join(lines)


def parse_body(content: str) -> dict:
    """Parse the markdown body into sections."""
    # Remove frontmatter
    body = re.sub(r'^---\s*\n.*?\n---\s*\n', '', content, flags=re.DOTALL).strip()

    result = {
        'notes': [],
        'summary': '',
        'discussion': [],
    }

    # Split into sections by ## headers
    sections = re.split(r'\n(?=## )', body)

    for section in sections:
        header_m = re.match(r'## (.*)', section)
        if not header_m:
            continue
        title = header_m.group(1).strip()
        section_body = section[header_m.end():].strip()

        if '原始笔记' in title:
            result['notes'] = _parse_notes(section_body)
        elif '总结' in title:
            result['summary'] = section_body.strip()
        elif '讨论' in title:
            result['discussion'] = _parse_discussion(section_body)

    return result


def _parse_notes(section_body: str) -> list:
    """Parse notes section into list of note dicts."""
    notes = []
    # Split by ### headers
    blocks = re.split(r'\n(?=### )', section_body)

    for block in blocks:
        header_m = re.match(r'### (\d{2}:\d{2}) — (n\d+)(?: \[图片\])?', block)
        if not header_m:
            continue
        time_str = header_m.group(1)
        note_id = header_m.group(2)
        rest = block[header_m.end():].strip()

        # Extract keywords line
        keywords = ''
        kw_m = re.match(r'> 关键词：(.+)', rest)
        if kw_m:
            keywords = kw_m.group(1).strip()
            rest = rest[kw_m.end():].strip()

        # Extract image paths
        images = []
        img_pattern = r'!\[\]\(([^)]+)\)'
        for m in re.finditer(img_pattern, rest):
            images.append(m.group(1))
        # Remove image markdown from text
        text = re.sub(img_pattern, '', rest).strip()

        notes.append({
            'note_id': note_id,
            'time': time_str,
            'text': text,
            'images': images,
            'keywords': keywords,
        })

    return notes


def _parse_discussion(section_body: str) -> list:
    """Parse discussion section into list of messages."""
    messages = []
    pattern = r'\*\*(你|思语) \((\d{2}:\d{2})\):\*\*\s*(.*?)(?=\n\*\*|$)'
    for m in re.finditer(pattern, section_body, re.DOTALL):
        role = 'user' if m.group(1) == '你' else 'ai'
        messages.append({
            'role': role,
            'time': m.group(2),
            'content': m.group(3).strip(),
        })
    return messages


def build_entry_body(notes: list, summary: str, discussion: list, date_str: str) -> str:
    """Build the full markdown body from structured data."""
    from .date_utils import format_date_cn

    lines = [f'# 每日反思 — {format_date_cn(date_str)}', '']
    lines.append('## 原始笔记')
    lines.append('')

    for note in notes:
        has_images = bool(note.get('images'))
        img_suffix = ' [图片]' if has_images else ''
        lines.append(f"### {note['time']} — {note['note_id']}{img_suffix}")
        if note.get('keywords'):
            lines.append(f"> 关键词：{note['keywords']}")
        if has_images:
            for img_path in note['images']:
                lines.append(f'![]({img_path})')
            lines.append('')
        if note.get('text'):
            lines.append(note['text'])
        lines.append('')

    lines.append('## 总结')
    lines.append('')
    if summary:
        lines.append(summary)
    lines.append('')

    lines.append('## 讨论')
    lines.append('')

    for msg in discussion:
        role_label = '你' if msg['role'] == 'user' else '思语'
        lines.append(f"**{role_label} ({msg['time']}):** {msg['content']}")
        lines.append('')

    return '\n'.join(lines)
