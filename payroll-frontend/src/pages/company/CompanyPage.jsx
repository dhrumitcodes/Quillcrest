import React, { useState, useEffect } from "react";
import CompanyList from "./CompanyList";
import AddCompany from "./AddCompany";
import ManageCompanyUsers from "./ManageCompanyUsers";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function CompanyPage() {
    const userRole = localStorage.getItem("userRole");
    const canManageCompanies = userRole === "ROLE_SUPER_ADMIN";
    const canManageUsers = canManageCompanies || userRole === "ROLE_COMPANY_ADMIN";

    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedCompany, setSelectedCompany] = useState(null);

    const fetchCompanies = () => {
        setLoading(true);
        setLoadError(null);
        const token = localStorage.getItem("token");

        fetch(`${API_BASE}/api/companies`, {
            headers: {
                Accept: "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load companies from the server");
                return res.json();
            })
            .then((res) => {
                const list = res.data ? res.data : res;
                setCompanies(Array.isArray(list) ? list : []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Fetch Error:", err);
                setLoadError(err.message || "Could not reach the backend.");
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchCompanies();
    }, []);

    const handleDelete = (id, name) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        const token = localStorage.getItem("token");

        fetch(`${API_BASE}/api/companies/${id}`, {
            method: "DELETE",
            headers: {
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to delete company");
                fetchCompanies();
            })
            .catch((err) => {
                console.error("Delete Error:", err);
                setLoadError(err.message);
            });
    };

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-semibold text-ink dark:text-ink-dark">
                        Company management
                    </h1>
                    <p className="text-sm text-muted dark:text-muted-dark mt-1">
                        Register and oversee corporate entities in your payroll directory.
                    </p>
                </div>

                {canManageCompanies && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-accent hover:bg-accent-hover text-white font-medium px-4 py-2.5 rounded-control text-sm transition-colors"
                    >
                        + Add company
                    </button>
                )}
            </div>

            {!canManageCompanies && (
                <div className="mb-4 p-3 bg-warning-soft text-warning text-sm rounded-control">
                    Your role ({userRole || "unknown"}) has read-only access to company records.
                </div>
            )}

            <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card p-6">
                <h2 className="text-sm font-semibold text-ink dark:text-ink-dark mb-4">
                    Registered companies
                </h2>

                {loading ? (
                    <div className="py-8 text-center text-muted dark:text-muted-dark text-sm">
                        Loading companies…
                    </div>
                ) : loadError ? (
                    <div className="py-8 text-center text-danger text-sm">
                        {loadError} — check that the backend is running.
                    </div>
                ) : (
                    <CompanyList
                        companies={companies}
                        canManageCompanies={canManageCompanies}
                        onDelete={handleDelete}
                        canManageUsers={canManageUsers}
                        onManageUsers={setSelectedCompany}
                    />
                )}
            </div>

            {selectedCompany && (
                <ManageCompanyUsers
                    company={selectedCompany}
                    isSuperAdmin={canManageCompanies}
                    onClose={() => setSelectedCompany(null)}
                />
            )}

            {isModalOpen && (
                <AddCompany
                    onClose={() => setIsModalOpen(false)}
                    onCreated={() => {
                        setIsModalOpen(false);
                        fetchCompanies();
                    }}
                />
            )}
        </div>
    );
}

export default CompanyPage;