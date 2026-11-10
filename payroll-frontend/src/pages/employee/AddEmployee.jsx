import React, { useState } from "react";
import { getCompanyId } from "../../utils/session";
import { AlertCircle, X } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function AddEmployee({ departments, deptError, onClose, onCreated }) {
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        position: "",
        panNumber: "",
        aadhaarNumber: "",
        hireDate: new Date().toISOString().split("T")[0],
        companyId: getCompanyId(),
        departmentId: "",
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE}/api/employees`, {
                method: "POST",
                headers: { "Content-Type": "application/json", ...authHeaders() },
                body: JSON.stringify({
                    ...formData,
                    companyId: Number(formData.companyId),
                    departmentId: Number(formData.departmentId),
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || "Failed to register employee record.");
            }

            onCreated();
        } catch (err) {
            console.error("Submission Error:", err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-ink/50 flex justify-center items-center z-50 p-4">
            <div className="bg-surface dark:bg-surface-dark rounded-card w-full max-w-lg p-6 border border-border dark:border-border-dark">
                <div className="flex justify-between items-start mb-1">
                    <h2 className="text-lg font-semibold text-ink dark:text-ink-dark">
                        New employee registration
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-muted dark:text-muted-dark hover:text-ink dark:hover:text-ink-dark"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <p className="text-sm text-muted dark:text-muted-dark mb-5">
                    PAN and Aadhaar are checked against existing records — duplicates on either are rejected.
                </p>

                {error && (
                    <div className="mb-4 p-3 bg-danger-soft text-danger rounded-control text-sm flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">First name</label>
                            <input
                                type="text" name="firstName" required
                                value={formData.firstName} onChange={handleChange}
                                placeholder="e.g. John"
                                className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">Last name</label>
                            <input
                                type="text" name="lastName" required
                                value={formData.lastName} onChange={handleChange}
                                placeholder="e.g. Doe"
                                className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">Email address</label>
                        <input
                            type="email" name="email" required
                            value={formData.email} onChange={handleChange}
                            placeholder="john.doe@techcorp.com"
                            className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">PAN number</label>
                            <input
                                type="text" name="panNumber" required
                                value={formData.panNumber}
                                onChange={(e) => setFormData((p) => ({ ...p, panNumber: e.target.value.toUpperCase() }))}
                                placeholder="ABCDE1234F"
                                maxLength={10}
                                className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">Aadhaar number</label>
                            <input
                                type="text" name="aadhaarNumber" required
                                value={formData.aadhaarNumber}
                                onChange={(e) => setFormData((p) => ({ ...p, aadhaarNumber: e.target.value.replace(/\D/g, "") }))}
                                placeholder="123456789012"
                                maxLength={12}
                                className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent font-mono"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">Position / title</label>
                        <input
                            type="text" name="position" required
                            value={formData.position} onChange={handleChange}
                            placeholder="e.g. Senior Software Engineer"
                            className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">Department</label>
                        <select
                            name="departmentId"
                            required
                            value={formData.departmentId}
                            onChange={(e) => setFormData((p) => ({ ...p, departmentId: e.target.value }))}
                            className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                        >
                            <option value="" disabled>Select a department</option>
                            {departments.map((dept) => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                        {deptError && (
                            <p className="text-[11px] text-danger mt-1">
                                Couldn't load departments: {deptError}
                            </p>
                        )}
                        {!deptError && departments.length === 0 && (
                            <p className="text-[11px] text-muted dark:text-muted-dark mt-1">
                                No departments found for this company yet — create one first.
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">Hire date</label>
                        <input
                            type="date" name="hireDate" required
                            value={formData.hireDate} onChange={handleChange}
                            className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-3 border-t border-border dark:border-border-dark">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2.5 text-ink dark:text-ink-dark hover:bg-canvas dark:hover:bg-canvas-dark rounded-control font-medium text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-control font-medium text-sm transition-colors disabled:opacity-50"
                        >
                            {submitting ? "Saving…" : "Save employee"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}