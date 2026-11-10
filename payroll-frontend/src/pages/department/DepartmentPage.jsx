import React, { useState, useEffect } from "react";
import { getCompanyId } from "../../utils/session";
import { AlertCircle, X, Trash2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function DepartmentPage() {
    const userRole = localStorage.getItem("userRole");
    const canManageDepartments = userRole === "ROLE_COMPANY_ADMIN" || userRole === "ROLE_SUPER_ADMIN";

    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        companyId: getCompanyId(),
    });

    const fetchDepartments = () => {
        setLoading(true);
        setLoadError(null);
        fetch(`${API_BASE}/api/departments/company/${getCompanyId()}?size=100`, {
            headers: { ...authHeaders() },
        })
            .then(async (res) => {
                const body = await res.json().catch(() => ({}));
                if (!res.ok || !body.success) {
                    throw new Error(body.message || "Failed to load departments");
                }
                return body;
            })
            .then((body) => {
                const list = body.data.content ? body.data.content : body.data;
                setDepartments(Array.isArray(list) ? list : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Department fetch error:", err);
                setLoadError(err.message);
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/departments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({
                    ...formData,
                    companyId: Number(formData.companyId),
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to create department.");
            }

            setShowModal(false);
            setFormData({ name: "", description: "", companyId: getCompanyId() });
            fetchDepartments();
        } catch (err) {
            console.error("Create department error:", err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = (id, name) => {
        if (!window.confirm(`Delete department "${name}"? This cannot be undone.`)) return;

        fetch(`${API_BASE}/api/departments/${id}`, {
            method: "DELETE",
            headers: { ...authHeaders() },
        })
            .then(async (res) => {
                const body = await res.json().catch(() => ({}));
                if (!res.ok || !body.success) {
                    throw new Error(body.message || "Failed to delete department");
                }
                fetchDepartments();
            })
            .catch((err) => {
                console.error("Delete department error:", err);
                setLoadError(err.message);
            });
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-ink dark:text-ink-dark">
                        Department management
                    </h1>
                    <p className="text-sm text-muted dark:text-muted-dark mt-1">
                        Organize employees into departments within your company.
                    </p>
                </div>
                {canManageDepartments && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2.5 rounded-control text-sm transition-colors"
                    >
                        + Add department
                    </button>
                )}
            </div>

            {!canManageDepartments && (
                <div className="mb-4 p-3 bg-warning-soft text-warning text-sm rounded-control">
                    Your role ({userRole || "unknown"}) has read-only access to departments.
                </div>
            )}

            <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card p-6">
                {loading ? (
                    <div className="text-center py-10 text-muted dark:text-muted-dark text-sm">
                        Loading departments…
                    </div>
                ) : loadError ? (
                    <div className="text-center py-10 text-danger text-sm">
                        {loadError} — check that the backend is running.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b border-border dark:border-border-dark text-muted dark:text-muted-dark text-xs font-semibold uppercase tracking-wide">
                                <th className="py-3 px-2">Name</th>
                                <th className="px-2">Description</th>
                                {canManageDepartments && <th className="px-2 text-right">Actions</th>}
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-border dark:divide-border-dark text-sm">
                            {departments.length === 0 ? (
                                <tr>
                                    <td colSpan={canManageDepartments ? 3 : 2} className="text-center py-10 text-muted dark:text-muted-dark">
                                        No departments yet. Click "+ Add department" to create one.
                                    </td>
                                </tr>
                            ) : (
                                departments.map((dept) => (
                                    <tr key={dept.id} className="hover:bg-canvas dark:hover:bg-canvas-dark transition-colors">
                                        <td className="py-4 px-2 font-medium text-ink dark:text-ink-dark">{dept.name}</td>
                                        <td className="px-2 text-muted dark:text-muted-dark">{dept.description || "—"}</td>
                                        {canManageDepartments && (
                                            <td className="px-2 text-right">
                                                <button
                                                    onClick={() => handleDelete(dept.id, dept.name)}
                                                    className="text-muted dark:text-muted-dark hover:text-danger transition-colors"
                                                    title="Delete department"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-ink/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-surface dark:bg-surface-dark rounded-card w-full max-w-md p-6 border border-border dark:border-border-dark">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-ink dark:text-ink-dark">Add new department</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-ink-dark"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-danger-soft text-danger rounded-control text-sm flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">
                                    Department name
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Engineering"
                                    value={formData.name}
                                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">
                                    Description
                                </label>
                                <textarea
                                    rows={3}
                                    placeholder="Optional short description"
                                    value={formData.description}
                                    onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 py-2.5 rounded-control border border-border dark:border-border-dark text-ink dark:text-ink-dark hover:bg-canvas dark:hover:bg-canvas-dark text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 py-2.5 rounded-control bg-accent hover:bg-accent-hover text-white text-sm font-medium disabled:opacity-50"
                                >
                                    {submitting ? "Saving…" : "Save department"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DepartmentPage;