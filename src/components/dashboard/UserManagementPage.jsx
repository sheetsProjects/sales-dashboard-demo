import { useEffect, useMemo, useState } from 'react';
import {
  UserPlus,
  Trash2,
  Power,
  Copy,
  Check,
  X,
  Shield,
  User as UserIcon,
  Users as UsersIcon,
  Eye,
  EyeOff,
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

const STORAGE_KEY = 'dashboard_users';

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
  let pw = '';
  for (let i = 0; i < 10; i++) pw += chars[Math.floor(Math.random() * chars.length)];
  return pw;
};

const loadUsers = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  // Seed default admin
  const seed = [
    {
      id: 'admin-1',
      name: 'Admin User',
      email: 'admin@bolofy.com',
      password: 'Admin@123',
      role: 'admin',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
  return seed;
};

const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

const formatDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [credentialModal, setCredentialModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [revealedIds, setRevealedIds] = useState(() => new Set());
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [roleMenu, setRoleMenu] = useState(null);
  const [page, setPage] = useState(0);
  const pageSize = 10;

  useEffect(() => {
    setUsers(loadUsers());
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const persist = (next) => {
    setUsers(next);
    saveUsers(next);
  };

  const toggleReveal = (id) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddUser = (name, email, role) => {
    const password = generatePassword();
    const newUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      status: 'active',
      createdAt: new Date().toISOString(),
    };
    persist([newUser, ...users]);
    setShowAddModal(false);
    setCredentialModal({ email: newUser.email, password });
    setToast({ severity: 'success', message: 'User created successfully' });
  };

  const handleDelete = (u) => {
    setDeleteTarget(u);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    persist(users.filter((u) => u.id !== deleteTarget.id));
    setToast({ severity: 'success', message: `Deleted ${deleteTarget.email}` });
    setDeleteTarget(null);
  };

  const handleChangeRole = (u, nextRole) => {
    setRoleMenu(null);
    if (u.role === nextRole) return;
    persist(users.map((x) => (x.id === u.id ? { ...x, role: nextRole } : x)));
    setToast({ severity: 'success', message: `Role updated to ${nextRole}` });
  };

  const handleToggleStatus = (u) => {
    const next = u.status === 'active' ? 'inactive' : 'active';
    persist(users.map((x) => (x.id === u.id ? { ...x, status: next } : x)));
    setToast({ severity: 'success', message: `User ${next === 'active' ? 'activated' : 'deactivated'}` });
  };

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        (u.name || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q),
    );
  }, [users, search]);

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const pagedUsers = filteredUsers.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => {
    if (page >= totalPages && totalPages > 0) setPage(totalPages - 1);
  }, [totalPages, page]);

  const activeCount = users.filter((u) => u.status === 'active').length;
  const adminCount = users.filter((u) => u.role === 'admin').length;

  return (
    <div className="flex flex-col h-full min-h-0 space-y-4">
      {/* Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 shrink-0">
        <StatTile icon={UsersIcon} label="Total Users" value={users.length} color="blue" />
        <StatTile icon={Check} label="Active" value={activeCount} color="green" />
        <StatTile icon={Shield} label="Admins" value={adminCount} color="violet" />
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 shrink-0">
        <div className="relative w-full sm:w-72">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="Search by name or email..."
            className="w-full pl-9 pr-9 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-400 placeholder:text-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded cursor-pointer"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-lg cursor-pointer transition-all shadow-md hover:shadow-lg"
          style={{ background: 'linear-gradient(to right, #2563eb, #0891b2)' }}
        >
          <UserPlus size={16} /> Add User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden flex-1 min-h-0 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Name</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">Email</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">Password</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">Role</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">Added</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pagedUsers.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-semibold text-sm text-slate-800 truncate block max-w-[160px]">{u.name || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600 truncate block max-w-[200px]">{u.email}</span>
                  </td>
                  <td className="px-4 py-3">
                    <PasswordCell
                      password={u.password}
                      revealed={revealedIds.has(u.id)}
                      onToggle={() => toggleReveal(u.id)}
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={(e) => setRoleMenu(roleMenu?.id === u.id ? null : { id: u.id, user: u, anchor: e.currentTarget })}
                        className={`inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-full text-xs font-semibold capitalize transition-all border cursor-pointer hover:shadow-sm ${
                          u.role === 'admin'
                            ? 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                      >
                        {u.role === 'admin' ? <Shield size={12} /> : <UserIcon size={12} />}
                        <span>{u.role}</span>
                        <ChevronDown size={12} className={`opacity-60 transition-transform ${roleMenu?.id === u.id ? 'rotate-180' : ''}`} />
                      </button>
                      {roleMenu?.id === u.id && (
                        <div className="absolute z-50 mt-1 left-1/2 -translate-x-1/2 w-48 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                          <div className="px-3 py-2 border-b border-slate-100 bg-slate-50/60">
                            <p className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Change role</p>
                          </div>
                          {[
                            { key: 'user', label: 'User', desc: 'Standard access', Icon: UserIcon },
                            { key: 'admin', label: 'Admin', desc: 'Full access + manage users', Icon: Shield },
                          ].map(({ key, label, desc, Icon }) => (
                            <button
                              key={key}
                              onClick={() => handleChangeRole(u, key)}
                              className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 transition-colors cursor-pointer text-left"
                            >
                              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${key === 'admin' ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                                <Icon size={14} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-semibold text-slate-800">{label}</div>
                                <div className="text-[10px] text-slate-500">{desc}</div>
                              </div>
                              {u.role === key && <Check size={12} className="text-emerald-600" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                      u.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {u.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-xs text-slate-500">{formatDate(u.createdAt)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                        title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                      >
                        <Power size={15} className={u.status === 'active' ? 'text-amber-600' : 'text-green-600'} />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                        title="Delete user"
                      >
                        <Trash2 size={15} className="text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pagedUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
            <span className="text-xs text-slate-500">
              Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, filteredUsers.length)} of {filteredUsers.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i)}
                  className={`w-7 h-7 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    i === page ? 'bg-blue-600 text-white' : 'hover:bg-slate-200 text-slate-600'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onSubmit={handleAddUser}
        />
      )}

      {/* Credential Modal */}
      {credentialModal && (
        <CredentialModal
          data={credentialModal}
          onClose={() => setCredentialModal(null)}
        />
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <DeleteConfirmModal
          target={deleteTarget}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />
      )}

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-[9999] px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white flex items-center gap-2 animate-[fadeIn_0.2s_ease] ${
          toast.severity === 'success' ? 'bg-emerald-600' : toast.severity === 'error' ? 'bg-red-600' : 'bg-amber-600'
        }`}>
          {toast.severity === 'success' && <Check size={16} />}
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 opacity-70 hover:opacity-100 cursor-pointer">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Click-away for role menu */}
      {roleMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setRoleMenu(null)} />
      )}
    </div>
  );
};

/* ─── Sub-components ─────────────────────────────────────────── */

const StatTile = ({ icon: Icon, label, value, color }) => {
  const colors = {
    blue:   { bg: 'bg-blue-50',   border: 'border-blue-100',   icon: 'text-blue-600',   iconBg: 'bg-blue-100' },
    green:  { bg: 'bg-green-50',  border: 'border-green-100',  icon: 'text-green-600',  iconBg: 'bg-green-100' },
    violet: { bg: 'bg-violet-50', border: 'border-violet-100', icon: 'text-violet-600', iconBg: 'bg-violet-100' },
  };
  const c = colors[color];
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-3 sm:p-4 flex items-center gap-3`}>
      <div className={`w-10 h-10 rounded-lg ${c.iconBg} flex items-center justify-center shrink-0`}>
        <Icon size={18} className={c.icon} />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-500">{label}</div>
        <div className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-tight">{value}</div>
      </div>
    </div>
  );
};

const PasswordCell = ({ password, revealed, onToggle }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e) => {
    e.stopPropagation();
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };

  if (!password) return <span className="text-slate-400 text-xs italic">—</span>;

  return (
    <div className="flex items-center justify-center gap-1.5">
      <span className="font-mono text-xs text-slate-800 select-all">
        {revealed ? password : '••••••••'}
      </span>
      <button onClick={(e) => { e.stopPropagation(); onToggle(); }} className="p-0.5 cursor-pointer" title={revealed ? 'Hide' : 'Show'}>
        {revealed ? <EyeOff size={13} className="text-slate-500" /> : <Eye size={13} className="text-slate-500" />}
      </button>
      {revealed && (
        <button onClick={handleCopy} className="p-0.5 cursor-pointer" title={copied ? 'Copied!' : 'Copy'}>
          {copied ? <Check size={13} className="text-green-600" /> : <Copy size={13} className="text-slate-500" />}
        </button>
      )}
    </div>
  );
};

const AddUserModal = ({ onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and email are required.');
      return;
    }
    onSubmit(name, email, role);
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Add new user</h2>
            <p className="text-sm text-slate-500 mt-1">A password will be generated automatically.</p>
          </div>
          <button onClick={onClose} className="p-1 -mt-1 -mr-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="px-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter Full Name"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter Email"
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:border-slate-900 placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-700">Role:</label>
              <RoleToggle value={role} onChange={setRole} />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded px-3 py-2">{error}</div>
            )}
          </div>

          <div className="px-6 pt-5 pb-5 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition cursor-pointer">
              Create user
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const RoleToggle = ({ value, onChange }) => {
  const isAdmin = value === 'admin';
  return (
    <div className="flex items-center gap-2.5">
      <span
        onClick={() => onChange('user')}
        className={`text-sm cursor-pointer select-none transition-colors ${!isAdmin ? 'text-slate-900 font-semibold' : 'text-slate-400 hover:text-slate-600'}`}
      >
        User
      </span>
      <button
        type="button"
        onClick={() => onChange(isAdmin ? 'user' : 'admin')}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 cursor-pointer ${isAdmin ? 'bg-slate-900' : 'bg-slate-300'}`}
      >
        <span className={`inline-block h-4 w-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${isAdmin ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
      </button>
      <span
        onClick={() => onChange('admin')}
        className={`text-sm cursor-pointer select-none transition-colors ${isAdmin ? 'text-slate-900 font-semibold' : 'text-slate-400 hover:text-slate-600'}`}
      >
        Admin
      </span>
    </div>
  );
};

const CredentialModal = ({ data, onClose }) => {
  const [copiedAll, setCopiedAll] = useState(false);
  const shareText = `Email: ${data.email}\nPassword: ${data.password}`;

  const copyAll = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch { /* ignore */ }
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-5 pb-4 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-slate-900">User created</h2>
            <p className="text-sm text-slate-500 mt-1">Share these credentials with the user.</p>
          </div>
          <button onClick={onClose} className="p-1 -mt-1 -mr-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 pb-4">
          <div className="border border-slate-200 rounded-lg px-3 divide-y divide-slate-100">
            <CopyableField label="Email" value={data.email} />
            <CopyableField label="Password" value={data.password} />
          </div>
        </div>

        <div className="px-6 pb-5 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition cursor-pointer">
            Done
          </button>
          <button
            onClick={copyAll}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-md transition cursor-pointer"
          >
            {copiedAll ? <Check size={14} /> : <Copy size={14} />}
            {copiedAll ? 'Copied' : 'Copy both'}
          </button>
        </div>
      </div>
    </div>
  );
};

const CopyableField = ({ label, value }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  };
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <div className="text-xs text-slate-500 mb-0.5">{label}</div>
        <div className="font-mono text-sm text-slate-900 truncate">{value}</div>
      </div>
      <button
        onClick={handleCopy}
        className={`shrink-0 p-1.5 rounded transition cursor-pointer ${copied ? 'text-green-600' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
      </button>
    </div>
  );
};

const DeleteConfirmModal = ({ target, onCancel, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-2 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={20} className="text-red-600" />
          </div>
          <h2 className="text-base font-semibold text-slate-900">Delete user</h2>
          <p className="text-sm text-slate-500 mt-1.5 px-2">
            This action cannot be undone. The user will lose access immediately.
          </p>
        </div>

        <div className="px-6 py-3">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5">
            <div className="text-[11px] uppercase tracking-wide font-semibold text-slate-500 mb-0.5">Account</div>
            <div className="text-sm font-semibold text-slate-900 truncate">{target?.name || '—'}</div>
            <div className="text-xs text-slate-500 truncate">{target?.email}</div>
          </div>
        </div>

        <div className="px-6 pt-2 pb-5 grid grid-cols-2 gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-md transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition cursor-pointer"
          >
            Delete user
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserManagementPage;
