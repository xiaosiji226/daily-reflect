from datetime import datetime, timezone, timedelta

TZ = timezone(timedelta(hours=8))  # CST


def today_str() -> str:
    return datetime.now(TZ).strftime("%Y-%m-%d")


def now_time_str() -> str:
    return datetime.now(TZ).strftime("%H:%M")


def now_iso() -> str:
    return datetime.now(TZ).isoformat()


def is_valid_date(date_str: str) -> bool:
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
        return True
    except ValueError:
        return False


def format_date_cn(date_str: str) -> str:
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    return f"{dt.year}年{dt.month}月{dt.day}日"
