import { useEffect, useState } from 'react';
import { Users, Trash2, ShieldCheck, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminApi } from '../api/endpoints';
import Card from '../components/ui/Card';
import StatCard from '../components/ui/StatCard';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const { user: me } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configDraft, setConfigDraft] = useState({});

  const load = async () => {
    setLoading(true);
    try {
      const [s, u, c] = await Promise.all([adminApi.stats(), adminApi.users(), adminApi.config()]);
      setStats(s.data.data);
      setUsers(u.data.data);
      setConfigs(c.data.data);
      setConfigDraft(Object.fromEntries(c.data.data.map((cfg) => [cfg.key, cfg.value])));
    } catch (err) {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveConfig = async (key, label) => {
    try {
      await adminApi.upsertConfig({ key, value: configDraft[key], label });
      toast.success(`${label} updated`);
    } catch (err) {
      toast.error('Failed to update config');
    }
  };

  const changeRole = async (id, role) => {
    try {
      await adminApi.updateUserRole(id, role);
      toast.success('Role updated');
      load();
    } catch (err) {
      toast.error('Failed to update role');
    }
  };

  const removeUser = async (id) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
      await adminApi.deleteUser(id);
      toast.success('User removed');
      load();
    } catch (err) {
      toast.error('Failed to delete user');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Users" value={stats?.userCount ?? '-'} accent="blue" loading={loading} />
        <StatCard icon={ShieldCheck} label="Active Alerts" value={stats?.activeAlerts ?? '-'} accent="amber" loading={loading} />
        <StatCard label="Energy Records" value={stats?.energyRecords ?? '-'} accent="brand" loading={loading} />
        <StatCard label="Hydrogen Records" value={stats?.hydrogenRecords ?? '-'} accent="violet" loading={loading} />
      </div>

      <Card title="System Configuration" subtitle="Plant capacities used by the optimization engine">
        <div className="grid sm:grid-cols-2 gap-4">
          {configs.map((c) => (
            <div key={c.key} className="flex items-end gap-2">
              <div className="flex-1">
                <label className="label-text">{c.label || c.key}</label>
                <input
                  className="input-field"
                  value={configDraft[c.key] ?? ''}
                  onChange={(e) => setConfigDraft((d) => ({ ...d, [c.key]: e.target.value }))}
                />
              </div>
              <button onClick={() => saveConfig(c.key, c.label)} className="btn-secondary !px-3 !py-2.5" title="Save">
                <Save size={15} />
              </button>
            </div>
          ))}
        </div>
      </Card>

      <Card title="User Management">
        <div className="overflow-x-auto -mx-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink-400 border-b border-ink-100 dark:border-ink-800">
                <th className="px-5 py-2 font-medium">Name</th>
                <th className="px-5 py-2 font-medium">Email</th>
                <th className="px-5 py-2 font-medium">Role</th>
                <th className="px-5 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-ink-50 dark:border-ink-800/50 last:border-0">
                  <td className="px-5 py-3 font-medium text-ink-800 dark:text-ink-100">{u.name}</td>
                  <td className="px-5 py-3 text-ink-500 dark:text-ink-400">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value)}
                      disabled={u.id === me?.id}
                      className="input-field !py-1.5 !w-32 text-xs"
                    >
                      <option value="USER">USER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => removeUser(u.id)}
                      disabled={u.id === me?.id}
                      className="text-rose-500 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
