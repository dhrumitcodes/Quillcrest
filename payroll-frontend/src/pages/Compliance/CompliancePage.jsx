import React, { useState, useEffect } from "react";
import { getCompanyId } from "../../utils/session";
import { CheckCircle2, XCircle, AlertTriangle, ShieldCheck } from "lucide-react";
import { runComplianceEvaluation } from "../../utils/complianceRules";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export default function CompliancePage() {
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [fetchingEmployees, setFetchingEmployees] = useState(true);

    // Salary + document inputs — editable so the engine is testable even
    // while employee records aren't loading from the backend yet.
    const [basicSalary, setBasicSalary] = useState(15000);
    const [grossSalary, setGrossSalary] = useState(18000);
    const [docs, setDocs] = useState({
        pan: true,
        aadhaar: true,
        bankDetails: true,
        taxDeclaration: false,
    });

    const [report, setReport] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem("token");
        fetch(`${API_BASE}/api/employees/company/${getCompanyId()}`, {
            headers: {
                Accept: "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load employee roster");
                return res.json();
            })
            .then((res) => {
                if (res.success && res.data) {
                    const list = res.data.content ? res.data.content : res.data;
                    setEmployees(Array.isArray(list) ? list : []);
                    if (list.length > 0) setSelectedEmployeeId(list[0].id);
                }
                setFetchingEmployees(false);
            })
            .catch((err) => {
                console.error("Error fetching employees:", err);
                setFetchingEmployees(false);
            });
    }, []);

    const handleRunEvaluation = () => {
        setReport(runComplianceEvaluation({ basicSalary, grossSalary, docs }));
    };

    const isCompliant = report?.complianceStatus === "COMPLIANT";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-ink dark:text-ink-dark">
                    Statutory compliance engine
                </h1>
                <p className="text-sm text-muted dark:text-muted-dark mt-1">
                    Computes EPF, ESI, Professional Tax, and TDS applicability directly from salary
                    inputs — evaluated locally, not a canned response.
                </p>
            </div>

            <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card p-6">
                <h2 className="text-sm font-semibold text-ink dark:text-ink-dark mb-4">
                    Run compliance evaluation
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <div>
                        <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">
                            Employee profile
                        </label>
                        {fetchingEmployees ? (
                            <div className="text-sm text-muted dark:text-muted-dark py-2.5">Loading directory…</div>
                        ) : (
                            <select
                                value={selectedEmployeeId}
                                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                            >
                                {employees.length === 0 ? (
                                    <option value="">No employees available — using manual inputs below</option>
                                ) : (
                                    employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            #{emp.id} — {emp.firstName} {emp.lastName} ({emp.position})
                                        </option>
                                    ))
                                )}
                            </select>
                        )}
                    </div>
                    <div />

                    <div>
                        <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">
                            Basic salary (₹/month)
                        </label>
                        <input
                            type="number"
                            value={basicSalary}
                            onChange={(e) => setBasicSalary(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">
                            Gross salary (₹/month)
                        </label>
                        <input
                            type="number"
                            value={grossSalary}
                            onChange={(e) => setGrossSalary(Number(e.target.value))}
                            className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                        />
                    </div>
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-2">
                        Documents on file
                    </label>
                    <div className="flex flex-wrap gap-4">
                        {Object.entries({
                            pan: "PAN card",
                            aadhaar: "Aadhaar",
                            bankDetails: "Bank details",
                            taxDeclaration: "Tax exemption declaration",
                        }).map(([key, label]) => (
                            <label key={key} className="flex items-center gap-2 text-sm text-ink dark:text-ink-dark cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={docs[key]}
                                    onChange={(e) => setDocs((d) => ({ ...d, [key]: e.target.checked }))}
                                    className="accent-[var(--color-accent)]"
                                />
                                {label}
                            </label>
                        ))}
                    </div>
                </div>

                <button
                    onClick={handleRunEvaluation}
                    className="bg-accent hover:bg-accent-hover text-white font-medium px-5 py-2.5 rounded-control text-sm transition-colors"
                >
                    Evaluate compliance
                </button>
            </div>

            {report && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card p-5">
                            <span className="text-xs font-medium text-muted dark:text-muted-dark uppercase tracking-wide">
                                Compliance status
                            </span>
                            <div className="mt-2">
                                <span
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-control text-sm font-semibold ${
                                        isCompliant ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                                    }`}
                                >
                                    {isCompliant ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                    {isCompliant ? "Compliant" : "Action required"}
                                </span>
                            </div>
                        </div>

                        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card p-5">
                            <span className="text-xs font-medium text-muted dark:text-muted-dark uppercase tracking-wide">
                                Risk score
                            </span>
                            <div className="mt-2 text-2xl font-semibold text-ink dark:text-ink-dark">
                                {report.riskScore.toFixed(1)}
                                <span className="text-xs font-normal text-muted dark:text-muted-dark ml-1.5">/ 10</span>
                            </div>
                        </div>

                        <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card p-5">
                            <span className="text-xs font-medium text-muted dark:text-muted-dark uppercase tracking-wide">
                                Total monthly deductions
                            </span>
                            <div className="mt-2 text-2xl font-semibold text-ink dark:text-ink-dark">
                                ₹{report.totalMonthlyDeductions.toLocaleString()}
                            </div>
                        </div>
                    </div>

                    <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-border dark:border-border-dark flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-muted dark:text-muted-dark" />
                            <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">
                                Statutory check breakdown
                            </h3>
                        </div>
                        <div className="divide-y divide-border dark:divide-border-dark">
                            {report.checks.map((check) => (
                                <div key={check.id} className="px-6 py-4 flex items-start gap-3">
                                    {check.pass ? (
                                        <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                                    ) : (
                                        <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-medium text-ink dark:text-ink-dark">{check.label}</h4>
                                            {typeof check.employeeContribution === "number" && check.employeeContribution > 0 && (
                                                <span className="text-sm font-semibold text-ink dark:text-ink-dark">
                                                    ₹{check.employeeContribution.toLocaleString()}/mo
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted dark:text-muted-dark mt-0.5">{check.detail}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
