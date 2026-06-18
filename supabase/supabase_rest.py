"""
Minimal HTTP helpers for Supabase REST (PostgREST) using the SECRET key.
Used by migrate.py and backup scripts so we don't depend on supabase-py.
"""
import json, urllib.request, urllib.parse, urllib.error
from typing import Any, Dict, List, Optional

SUPABASE_URL = 'https://iythgizaqjivxtgwyexj.supabase.co'

# Server-side secret key — never commit. Read from the gitignored env file
# at supabase/secrets/credentials.env, or from $SUPABASE_SECRET_KEY.
def _load_secret():
    import os
    env = os.environ.get('SUPABASE_SECRET_KEY')
    if env:
        return env.strip()
    here = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(here, 'secrets', 'credentials.env')
    try:
        with open(env_path, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('SUPABASE_SECRET_KEY='):
                    return line.split('=', 1)[1].strip()
    except FileNotFoundError:
        pass
    raise RuntimeError(
        'No Supabase secret key — set $SUPABASE_SECRET_KEY or write to '
        'supabase/secrets/credentials.env')

SECRET_KEY = _load_secret()

_BASE = f'{SUPABASE_URL}/rest/v1'


class SupabaseError(Exception):
    def __init__(self, code: int, body: str):
        super().__init__(f'HTTP {code}: {body[:300]}')
        self.code = code
        self.body = body


def _headers(prefer: Optional[str] = None) -> Dict[str, str]:
    h = {
        'apikey': SECRET_KEY,
        'Authorization': f'Bearer {SECRET_KEY}',
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    }
    if prefer:
        h['Prefer'] = prefer
    return h


def _request(method: str, path: str, body: Any = None, prefer: Optional[str] = None,
             query: Optional[Dict[str, str]] = None) -> Any:
    url = f'{_BASE}/{path.lstrip("/")}'
    if query:
        url += '?' + urllib.parse.urlencode(query, safe=',():*=.<>&|')
    data = json.dumps(body).encode('utf-8') if body is not None else None
    req = urllib.request.Request(url, data=data, method=method, headers=_headers(prefer))
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            raw = r.read()
            if not raw:
                return None
            try:
                return json.loads(raw)
            except Exception:
                return raw.decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', 'replace')
        raise SupabaseError(e.code, body) from None


def select(table: str, *, columns: str = '*', filters: Optional[Dict[str, str]] = None,
           limit: Optional[int] = None) -> List[Dict[str, Any]]:
    q = {'select': columns}
    if filters:
        q.update(filters)
    if limit:
        q['limit'] = str(limit)
    return _request('GET', table, query=q) or []


def insert(table: str, rows: List[Dict[str, Any]], *, on_conflict: Optional[str] = None,
           returning: bool = False) -> Any:
    """Insert rows. With on_conflict=col → upsert on that unique column."""
    prefer = 'return=representation' if returning else 'return=minimal'
    q = {}
    if on_conflict:
        prefer = (prefer + ',' if prefer else '') + 'resolution=merge-duplicates'
        q['on_conflict'] = on_conflict
    return _request('POST', table, body=rows, prefer=prefer, query=q or None)


def upsert(table: str, rows: List[Dict[str, Any]], *, on_conflict: str = 'id',
           returning: bool = True) -> Any:
    return insert(table, rows, on_conflict=on_conflict, returning=returning)


def update(table: str, patch: Dict[str, Any], filters: Dict[str, str]) -> Any:
    return _request('PATCH', table, body=patch, query=filters, prefer='return=representation')


def delete(table: str, filters: Dict[str, str]) -> Any:
    return _request('DELETE', table, query=filters)


def count(table: str) -> int:
    q = {'select': 'id'}
    rows = _request('GET', table, query=q)
    return len(rows) if rows else 0


def health() -> Dict[str, Any]:
    """Quick connectivity check — selects 1 row from users."""
    try:
        rows = select('users', columns='email,role,active', limit=1)
        return {'ok': True, 'sample': rows}
    except SupabaseError as e:
        return {'ok': False, 'error': str(e)}


if __name__ == '__main__':
    import sys
    print(json.dumps(health(), ensure_ascii=False, indent=2))
