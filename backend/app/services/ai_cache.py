import json
import time
from pathlib import Path
from threading import Lock
from typing import Optional

CACHE_DIR = Path("cache/ai_responses")


class AICache:
    def __init__(self, ttl_minutes: int = 60):
        self._memory: dict[str, tuple[float, dict]] = {}
        self._lock = Lock()
        self._ttl = ttl_minutes * 60
        CACHE_DIR.mkdir(parents=True, exist_ok=True)

    def _key(self, user_id: int, module_type: str) -> str:
        return f"{user_id}:{module_type}"

    def _is_fresh(self, timestamp: float) -> bool:
        return (time.time() - timestamp) < self._ttl

    def get(self, user_id: int, module_type: str) -> Optional[dict]:
        key = self._key(user_id, module_type)
        with self._lock:
            ts, data = self._memory.get(key), None
            if ts and self._is_fresh(ts[0]):
                return ts[1]
            if key in self._memory:
                del self._memory[key]

        cached = self._read_disk(key)
        if cached and self._is_fresh(cached[0]):
            with self._lock:
                self._memory[key] = cached
            return cached[1]

        return None

    def set(self, user_id: int, module_type: str, data: dict) -> None:
        key = self._key(user_id, module_type)
        entry = (time.time(), data)
        with self._lock:
            self._memory[key] = entry
        self._write_disk(key, entry)

    def get_latest(self, user_id: int, module_type: str) -> Optional[dict]:
        return self.get(user_id, module_type)

    def clear(self, user_id: Optional[int] = None, module_type: Optional[str] = None) -> None:
        with self._lock:
            if user_id and module_type:
                self._memory.pop(self._key(user_id, module_type), None)
            elif user_id:
                self._memory = {k: v for k, v in self._memory.items() if not k.startswith(f"{user_id}:")}
            else:
                self._memory.clear()

    def _disk_path(self, key: str) -> Path:
        return CACHE_DIR / f"{key}.json"

    def _read_disk(self, key: str) -> Optional[tuple[float, dict]]:
        path = self._disk_path(key)
        if not path.exists():
            return None
        try:
            blob = json.loads(path.read_text())
            return blob["ts"], blob["data"]
        except Exception:
            path.unlink(missing_ok=True)
            return None

    def _write_disk(self, key: str, entry: tuple[float, dict]) -> None:
        path = self._disk_path(key)
        try:
            path.write_text(json.dumps({"ts": entry[0], "data": entry[1]}))
        except Exception:
            pass


_cache_instance: Optional[AICache] = None
_lock = Lock()


def get_ai_cache(ttl_minutes: int = 60) -> AICache:
    global _cache_instance
    if _cache_instance is None:
        with _lock:
            if _cache_instance is None:
                _cache_instance = AICache(ttl_minutes=ttl_minutes)
    return _cache_instance
