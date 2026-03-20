import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import type { SuggestedUser, ApiResponse } from '@clitoris/shared';

export default function SuggestedUsers() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);

  useEffect(() => {
    api.get<ApiResponse<SuggestedUser[]>>('/users/suggested')
      .then((res) => setUsers(res.data.slice(0, 5)))
      .catch(() => { /* silent */ });
  }, []);

  if (users.length === 0) return null;

  return (
    <div className="border-t border-[var(--border)] pt-3 pb-2">
      <div className="px-4 pb-2 font-mono text-[10px] text-[var(--text-faint)] uppercase tracking-wider">
        suggested
      </div>
      {users.map((u) => (
        <Link
          key={u.username}
          to={`/@${u.username}`}
          className="flex items-center gap-2 py-1.5 px-4 hover:bg-[var(--bg-elevated)] transition-colors group"
        >
          <span className="font-mono text-[11px] text-[var(--accent-amber)] group-hover:text-amber-300 transition-colors">
            @{u.username}
          </span>
          {u.topLanguages.length > 0 && (
            <span className="font-mono text-[9px] text-[var(--text-faint)] ml-auto truncate">
              {u.topLanguages.slice(0, 2).join(', ')}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
