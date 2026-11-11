import React, { useEffect, useState } from "react";
import { X, UserPlus, ShieldCheck } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function authHeaders(json = false) {
    const token = localStorage.getItem("token");
    return {
        ...(json ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
}

export default function ManageCompanyUsers({ company, isSuperAdmin, onClose }) {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [form, setForm] = useState({ email: "", password: "", role: isSuperAdmin ? "ROLE_COMPANY_ADMIN" : "ROLE_AUDITOR" });

    const endpoint = `${API_BASE}/api/companies/${company.id}/users`;

    const loadUsers = async () => {
        setLoading(true);
        setError("");
        try {
            const res = await fetch(endpoint, { headers: authHeaders() });
            const data = await res.json().catch(() => []);
            if (!res.ok) throw new Error(data.message || "Could not load company users");
            setUsers(Array.isArray(data) ? data : data.data || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadUsers(); }, [company.id]);

    const createUser = async (event) => {
        event.preventDefault();
        setSubmitting(true);
        setError("");
        setSuccess("");
        try {
            const url = isSuperAdmin ? `${endpoint}/company-admin` : endpoint;
            const res = await fetch(url, {
                method: "POST",
                headers: authHeaders(true),
                body: JSON.stringify(form),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.message || "Could not create account");
            setSuccess(`Created ${form.role.replace("ROLE_", "").replace("_", " ").toLowerCase()} account for ${form.email}`);
            setForm({ email: "", password: "", role: isSuperAdmin ? "ROLE_COMPANY_ADMIN" : "ROLE_AUDITOR" });
            await loadUsers();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4">
            <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-card border border-border dark:border-border-dark bg-surface dark:bg-surface-dark p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-semibold text-ink dark:text-ink-dark">Manage users</h2>
                        <p className="mt-1 text-sm text-muted dark:text-muted-dark">{company.name}</p>
                    </div>
                    <button onClick={onClose} className="text-muted hover:text-ink" aria-label="Close"><X className="h-5 w-5" /></button>
                </div>

                {error && <div className="mb-4 rounded-control bg-danger-soft p-3 text-sm text-danger">{error}</div>}
                {success && <div className="mb-4 rounded-control bg-success-soft p-3 text-sm text-success">{success}</div>}

                <div className="mb-6 rounded-card border border-border dark:border-border-dark p-4">
                    <h3 className="mb-3 flex items-center gap-2 font-medium text-ink dark:text-ink-dark"><UserPlus className="h-4 w-4" /> {isSuperAdmin ? "Create Company Admin" : "Create Auditor or Employee login"}</h3>
                    <form onSubmit={createUser} className="grid gap-3 sm:grid-cols-2">
                        <label className="text-xs text-muted dark:text-muted-dark">Email
                            <input type="email" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 text-sm text-ink dark:bg-canvas-dark dark:text-ink-dark" placeholder="name@company.com" />
                        </label>
                        <label className="text-xs text-muted dark:text-muted-dark">Temporary password
                            <input type="password" required minLength={10} maxLength={72} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 text-sm text-ink dark:bg-canvas-dark dark:text-ink-dark" placeholder="At least 10 characters" />
                        </label>
                        {!isSuperAdmin && (
                            <label className="text-xs text-muted dark:text-muted-dark sm:col-span-2">Role
                                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))} className="mt-1 w-full rounded-control border border-border bg-canvas px-3 py-2 text-sm text-ink dark:bg-canvas-dark dark:text-ink-dark">
                                    <option value="ROLE_AUDITOR">Auditor</option>
                                    <option value="ROLE_EMPLOYEE">Employee (create employee profile first)</option>
                                </select>
                            </label>
                        )}
                        <div className="sm:col-span-2">
                            <button disabled={submitting} className="rounded-control bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{submitting ? "Creating…" : "Create account"}</button>
                        </div>
                    </form>
                    <p className="mt-3 text-xs text-muted dark:text-muted-dark">Passwords are stored as hashes. Share temporary credentials securely and ask users to change them after their first login.</p>
                </div>

                <div>
                    <h3 className="mb-3 flex items-center gap-2 font-medium text-ink dark:text-ink-dark"><ShieldCheck className="h-4 w-4" /> Existing accounts</h3>
                    {loading ? <p className="text-sm text-muted">Loading users…</p> : users.length === 0 ? <p className="text-sm text-muted">No users are assigned to this company yet.</p> : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead><tr className="border-b border-border text-xs uppercase text-muted"><th className="py-2">Email</th><th>Role</th></tr></thead>
                                <tbody>{users.map(user => <tr key={user.id} className="border-b border-border last:border-0"><td className="py-3 text-ink dark:text-ink-dark">{user.email}</td><td className="text-muted">{user.role?.replace("ROLE_", "").replaceAll("_", " ")}</td></tr>)}</tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
