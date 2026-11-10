import React, { useState, useEffect } from "react";
import { getCompanyId } from "../../utils/session";
import { CheckCircle2 } from "lucide-react";
import EmployeeList from "./EmployeeList";
import AddEmployee from "./AddEmployee";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function EmployeePage() {
    const userRole = localStorage.getItem("userRole");
    const canManageEmployees = userRole === "ROLE_COMPANY_ADMIN" || userRole === "ROLE_SUPER_ADMIN";

    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    const [departments, setDepartments] = useState([]);
    const [deptError, setDeptError] = useState(null);

    const fetchEmployees = () => {
        setLoading(true);
        setLoadError(null);
        fetch(`${API_BASE}/api/employees/company/${getCompanyId()}`, { headers: { ...authHeaders() } })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load employee directory");
                return res.json();
            })
            .then((res) => {
                if (res.success && res.data) {
                    const list = res.data.content ? res.data.content : res.data;
                    setEmployees(Array.isArray(list) ? list : []);
                }
                setLoading(false);
            })
            .catch((err) => {
                console.error("Fetch Error:", err);
                setLoadError(err.message);
                setLoading(false);
            });
    };

    const fetchDepartments = () => {
        fetch(`${API_BASE}/api/departments/company/${getCompanyId()}?size=100`, { headers: { ...authHeaders() } })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load departments");
                return res.json();
            })
            .then((res) => {
                if (res.success && res.data) {
                    const list = res.data.content ? res.data.content : res.data;
                    setDepartments(Array.isArray(list) ? list : []);
                }
            })
            .catch((err) => {
                console.error("Department fetch error:", err);
                setDeptError(err.message);
            });
    };

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, []);

    const handleDelete = (id, fullName) => {
        if (!window.confirm(`Delete "${fullName}"? This cannot be undone.`)) return;

        fetch(`${API_BASE}/api/employees/${id}`, {
            method: "DELETE",
            headers: { ...authHeaders() },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to delete employee");
                fetchEmployees();
            })
            .catch((err) => {
                console.error("Delete Error:", err);
                setLoadError(err.message);
            });
    };

    const handleCreated = () => {
        setSuccessMsg("Employee registered successfully.");
        setShowModal(false);
        fetchEmployees();
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-semibold text-ink dark:text-ink-dark">
                        Employee directory
                    </h1>
                    <p className="text-sm text-muted dark:text-muted-dark mt-1">
                        Manage workplace personnel and onboarding profiles.
                    </p>
                </div>
                {canManageEmployees && (
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2.5 rounded-control text-sm transition-colors"
                    >
                        + Add employee
                    </button>
                )}
            </div>

            {!canManageEmployees && (
                <div className="mb-4 p-3 bg-warning-soft text-warning text-sm rounded-control">
                    Your role ({userRole || "unknown"}) has read-only access to the employee directory.
                </div>
            )}

            {successMsg && (
                <div className="mb-4 p-3 bg-success-soft text-success rounded-control text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {successMsg}
                </div>
            )}

            <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card p-6">
                {loading ? (
                    <div className="text-center py-10 text-muted dark:text-muted-dark text-sm">
                        Loading directory…
                    </div>
                ) : loadError ? (
                    <div className="text-center py-10 text-danger text-sm">
                        {loadError} — check that the backend is running.
                    </div>
                ) : (
                    <EmployeeList
                        employees={employees}
                        canManageEmployees={canManageEmployees}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {showModal && (
                <AddEmployee
                    departments={departments}
                    deptError={deptError}
                    onClose={() => setShowModal(false)}
                    onCreated={handleCreated}
                />
            )}
        </div>
    );
}