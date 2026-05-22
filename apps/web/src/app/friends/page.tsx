'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { api } from '@/lib/api';
import { Users, UserPlus, Check, X, Search } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [f, r] = await Promise.all([
        api.getFriends(),
        api.getFriendRequests(),
      ]);
      setFriends(f.data || []);
      setRequests(r.data || []);
    } catch {
      toast.error('Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    try {
      const res = await api.searchUsers(q);
      setSearchResults(res.data || []);
    } catch {
      setSearchResults([]);
    }
  };

  const handleSendRequest = async (userId: string) => {
    try {
      await api.sendFriendRequest(userId);
      toast.success('Friend request sent!');
      setSearchResults([]);
      setSearch('');
    } catch {
      toast.error('Failed to send request');
    }
  };

  const handleAccept = async (userId: string) => {
    try {
      await api.acceptFriendRequest(userId as any);
      toast.success('Friend request accepted!');
      loadData();
    } catch {
      toast.error('Failed to accept');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h1 className="text-h4 font-medium text-text-primary mb-6">Friends</h1>

      {/* Search */}
      <div className="relative mb-8 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-dark-700 border border-dark-300 rounded-lg pl-10 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        {searchResults.length > 0 && (
          <Card className="absolute top-full mt-2 w-full z-10 p-2 max-h-48 overflow-y-auto">
            {searchResults.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between p-2 hover:bg-dark-700 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-xs text-accent">
                    {u.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-text-primary">{u.name}</p>
                    <p className="text-xs text-text-muted">{u.email}</p>
                  </div>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleSendRequest(u.id)}
                >
                  <UserPlus size={14} />
                  Add
                </Button>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Pending Requests */}
      {requests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-h6 font-medium text-text-primary mb-3">
            Pending Requests ({requests.length})
          </h2>
          <div className="space-y-2">
            {requests.map((r: any) => (
              <Card key={r.user_id_1} variant="bordered" className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm text-accent">
                    {r.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-sm text-text-primary font-medium">{r.name}</p>
                    <p className="text-xs text-text-muted">{r.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="primary" size="sm" onClick={() => handleAccept(r.action_user_id)}>
                    <Check size={14} />
                    Accept
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Friends List */}
      <h2 className="text-h6 font-medium text-text-primary mb-3">
        All Friends ({friends.length})
      </h2>
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-dark-700 rounded-xl animate-pulse" />)}
        </div>
      ) : friends.length === 0 ? (
        <div className="text-center py-16 text-text-muted">
          <Users size={48} className="mx-auto mb-4" />
          <p className="text-sm">No friends yet. Search for users to add them!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2">
          {friends.map((f: any) => (
            <Card key={f.friend_id} variant="bordered" className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-sm text-accent">
                {f.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div>
                <p className="text-sm text-text-primary font-medium">{f.name}</p>
                <p className="text-xs text-text-muted">{f.email}</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
}
