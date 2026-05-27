from abc import ABC, abstractmethod
from typing import Optional


class StorageBackend(ABC):
    """Abstract storage interface. Implementations can be Markdown files, SQLite, etc."""

    @abstractmethod
    async def day_exists(self, date_str: str) -> bool:
        """Check if a day entry already exists."""
        ...

    @abstractmethod
    async def get_entry(self, date_str: str) -> Optional[dict]:
        """Get full entry data for a day. Returns None if not found."""
        ...

    @abstractmethod
    async def list_entries(self) -> list[dict]:
        """List all day entries with light metadata, newest first."""
        ...

    @abstractmethod
    async def create_entry(self, date_str: str, meta: dict, body: str) -> None:
        """Create a new day entry file. Raises if exists."""
        ...

    @abstractmethod
    async def update_entry(self, date_str: str, meta: dict, body: str) -> None:
        """Update an existing day entry file."""
        ...

    @abstractmethod
    async def delete_note(self, date_str: str, note_id: str) -> bool:
        """Delete a specific note from a day entry. Returns False if not found."""
        ...

    @abstractmethod
    async def delete_day(self, date_str: str) -> bool:
        """Delete an entire day entry and its images. Returns False if not found."""
        ...
