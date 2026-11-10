import React, { useState, useEffect } from "react";
import { getCompanyId } from "../../utils/session";
import { Download, AlertCircle, CheckCircle2, FileText, Users } from "lucide-react";
import { generatePayslipPDF } from "../../utils/generatePayslip";
import { generateForm16PDF } from "../../utils/generateForm16";
import { generateQuarterlyReportPDF } from "../../utils/generateQuarterlyReport";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function currentPayPeriod() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function authHeaders() {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
}

function PayrollPage() {
    const userRole = localStorage.getItem("userRole");
    const canManagePayroll = userRole === "ROLE_COMPANY_ADMIN" || userRole === "ROLE_SUPER_ADMIN";

    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
    const [loadingEmployees, setLoadingEmployees] = useState(true);

    const [salary, setSalary] = useState({ baseSalary: "", allowances: "0", deductions: "0" });
    const [salaryConfigured, setSalaryConfigured] = useState(false);
    const [savingSalary, setSavingSalary] = useState(false);
    const [salaryMsg, setSalaryMsg] = useState(null);

    const [payPeriod, setPayPeriod] = useState(currentPayPeriod());
    const [processing, setProcessing] = useState(false);
    const [processMsg, setProcessMsg] = useState(null);

    const [slips, setSlips] = useState([]);
    const [loadingSlips, setLoadingSlips] = useState(false);
    const [financialYear, setFinancialYear] = useState("2025-26");

    // Bulk run
    const [bulkPayPeriod, setBulkPayPeriod] = useState(currentPayPeriod());
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const [bulkResults, setBulkResults] = useState(null);
    const [bulkMsg, setBulkMsg] = useState(null);

    const [companyName, setCompanyName] = useState("");

    useEffect(() => {
        fetch(`${API_BASE}/api/companies`, { headers: { ...authHeaders() } })
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((res) => {
                const list = res.data ? res.data : res;
                if (Array.isArray(list) && list.length > 0) setCompanyName(list[0].name);
            })
            .catch(() => setCompanyName(""));
    }, []);

    useEffect(() => {
        fetch(`${API_BASE}/api/employees/company/${getCompanyId()}`, { headers: { ...authHeaders() } })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load employees"))))
            .then((res) => {
                const list = res.data?.content ? res.data.content : res.data || [];
                setEmployees(Array.isArray(list) ? list : []);
                if (list.length > 0) setSelectedEmployeeId(String(list[0].id));
                setLoadingEmployees(false);
            })
            .catch((err) => {
                console.error("Employee fetch error:", err);
                setLoadingEmployees(false);
            });
    }, []);

    const fetchSalaryStructure = (employeeId) => {
        fetch(`${API_BASE}/api/payroll/salary-structures/employee/${employeeId}`, { headers: { ...authHeaders() } })
            .then((res) => (res.ok ? res.json() : Promise.reject()))
            .then((res) => {
                if (res.success && res.data) {
                    setSalary({
                        baseSalary: String(res.data.baseSalary),
                        allowances: String(res.data.allowances),
                        deductions: String(res.data.deductions),
                    });
                    setSalaryConfigured(true);
                }
            })
            .catch(() => {
                setSalary({ baseSalary: "", allowances: "0", deductions: "0" });
                setSalaryConfigured(false);
            });
    };

    const fetchSlips = (employeeId) => {
        setLoadingSlips(true);
        fetch(`${API_BASE}/api/payroll/slips/employee/${employeeId}`, { headers: { ...authHeaders() } })
            .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load payslips"))))
            .then((res) => {
                setSlips(res.success && res.data ? res.data : []);
                setLoadingSlips(false);
            })
            .catch((err) => {
                console.error("Slip fetch error:", err);
                setSlips([]);
                setLoadingSlips(false);
            });
    };

    useEffect(() => {
        if (!selectedEmployeeId) return;
        setSalaryMsg(null);
        setProcessMsg(null);
        fetchSalaryStructure(selectedEmployeeId);
        fetchSlips(selectedEmployeeId);
    }, [selectedEmployeeId]);

    const handleSaveSalary = (e) => {
        e.preventDefault();
        setSavingSalary(true);
        setSalaryMsg(null);

        fetch(`${API_BASE}/api/payroll/salary-structures`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({
                employeeId: Number(selectedEmployeeId),
                baseSalary: Number(salary.baseSalary),
                allowances: Number(salary.allowances || 0),
                deductions: Number(salary.deductions || 0),
            }),
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.message || "Failed to save salary structure");
                return data;
            })
            .then(() => {
                setSalaryConfigured(true);
                setSalaryMsg({ type: "success", text: "Salary structure saved." });
            })
            .catch((err) => setSalaryMsg({ type: "error", text: err.message }))
            .finally(() => setSavingSalary(false));
    };

    const handleProcessPayroll = () => {
        setProcessing(true);
        setProcessMsg(null);

        fetch(`${API_BASE}/api/payroll/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ employeeId: Number(selectedEmployeeId), payPeriod }),
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.message || "Failed to process payroll");
                return data;
            })
            .then(() => {
                setProcessMsg({ type: "success", text: `Payroll processed for ${payPeriod}.` });
                fetchSlips(selectedEmployeeId);
            })
            .catch((err) => setProcessMsg({ type: "error", text: err.message }))
            .finally(() => setProcessing(false));
    };

    const handleBulkRun = () => {
        setBulkProcessing(true);
        setBulkMsg(null);
        setBulkResults(null);

        fetch(`${API_BASE}/api/payroll/process-bulk`, {
            method: "POST",
            headers: { "Content-Type": "application/json", ...authHeaders() },
            body: JSON.stringify({ payPeriod: bulkPayPeriod, companyId: getCompanyId() }),
        })
            .then(async (res) => {
                const data = await res.json().catch(() => ({}));
                if (!res.ok) throw new Error(data.message || "Bulk payroll run failed");
                return data;
            })
            .then((data) => {
                setBulkResults(data.data || []);
                setBulkMsg({ type: "success", text: data.message });
                if (selectedEmployeeId) fetchSlips(selectedEmployeeId);
            })
            .catch((err) => setBulkMsg({ type: "error", text: err.message }))
            .finally(() => setBulkProcessing(false));
    };

    const handleDownloadQuarterlyReport = () => {
        const processedSlips = (bulkResults || [])
            .filter((r) => r.status === "PROCESSED" && r.paySlip)
            .map((r) => r.paySlip);

        if (processedSlips.length === 0) return;

        generateQuarterlyReportPDF({
            company: { name: companyName || "Your Company" },
            quarterLabel: `Run for ${bulkPayPeriod}`,
            payslips: processedSlips,
        });
    };

    const handleDownloadForm16 = () => {
        const annualGross = slips.reduce((sum, s) => sum + Number(s.grossPay || 0), 0);
        if (!selectedEmployee || annualGross === 0) return;
        generateForm16PDF({ employee: selectedEmployee, company: { name: companyName || "Your Company" }, financialYear, annualGross });
    };

    const selectedEmployee = employees.find((e) => String(e.id) === String(selectedEmployeeId));

    const statusStyles = {
        PROCESSED: "bg-success-soft text-success",
        SKIPPED_ALREADY_PROCESSED: "bg-warning-soft text-warning",
        SKIPPED_NO_SALARY: "bg-warning-soft text-warning",
        FAILED: "bg-danger-soft text-danger",
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-ink dark:text-ink-dark">Payroll management</h1>
                <p className="text-sm text-muted dark:text-muted-dark mt-1">
                    Configure salary structures and run real monthly payroll processing.
                </p>
            </div>

            {!canManagePayroll && (
                <div className="p-3 bg-warning-soft text-warning text-sm rounded-control">
                    Your role ({userRole || "unknown"}) has read-only access to payroll — configuring salary or
                    processing runs is restricted to Payroll Admins.
                </div>
            )}

            {canManagePayroll && (
                <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card p-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Users className="w-4 h-4 text-muted dark:text-muted-dark" />
                        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">Bulk payroll run</h3>
                    </div>
                    <p className="text-xs text-muted dark:text-muted-dark mb-4">
                        Processes every employee in the company for one pay period in a single click — reuses the
                        exact same validation as single-employee processing per person (no salary configured, or
                        already processed for that period, are reported as skipped, not silently ignored).
                    </p>

                    {bulkMsg && (
                        <div
                            className={`mb-4 p-2.5 rounded-control text-xs flex items-start gap-2 ${
                                bulkMsg.type === "success" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                            }`}
                        >
                            {bulkMsg.type === "success" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            ) : (
                                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                            )}
                            {bulkMsg.text}
                        </div>
                    )}

                    <div className="flex items-end gap-3 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">Pay period</label>
                            <input
                                type="month"
                                value={bulkPayPeriod}
                                onChange={(e) => setBulkPayPeriod(e.target.value)}
                                className="px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                            />
                        </div>
                        <button
                            onClick={handleBulkRun}
                            disabled={bulkProcessing}
                            className="px-5 py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-control text-sm font-medium transition-colors"
                        >
                            {bulkProcessing ? "Processing…" : "Run for entire company"}
                        </button>
                        {bulkResults && bulkResults.some((r) => r.status === "PROCESSED") && (
                            <button
                                onClick={handleDownloadQuarterlyReport}
                                className="px-4 py-2.5 border border-border dark:border-border-dark rounded-control text-sm font-medium text-ink dark:text-ink-dark hover:bg-canvas dark:hover:bg-canvas-dark flex items-center gap-1.5"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Download run summary (PDF)
                            </button>
                        )}
                    </div>

                    {bulkResults && (
                        <div className="overflow-x-auto border border-border dark:border-border-dark rounded-control">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                <tr className="border-b border-border dark:border-border-dark text-muted dark:text-muted-dark text-xs font-semibold uppercase tracking-wide">
                                    <th className="py-2.5 px-4">Employee</th>
                                    <th className="py-2.5 px-4">Status</th>
                                    <th className="py-2.5 px-4">Detail</th>
                                </tr>
                                </thead>
                                <tbody className="divide-y divide-border dark:divide-border-dark">
                                {bulkResults.map((r) => (
                                    <tr key={r.employeeId}>
                                        <td className="py-2.5 px-4 text-ink dark:text-ink-dark font-medium">{r.employeeName}</td>
                                        <td className="py-2.5 px-4">
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-control ${statusStyles[r.status] || ""}`}>
                                                    {r.status.replaceAll("_", " ")}
                                                </span>
                                        </td>
                                        <td className="py-2.5 px-4 text-xs text-muted dark:text-muted-dark">{r.message}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card p-6">
                <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">Employee (single-employee actions below)</label>
                {loadingEmployees ? (
                    <div className="text-sm text-muted dark:text-muted-dark">Loading employees…</div>
                ) : employees.length === 0 ? (
                    <div className="text-sm text-muted dark:text-muted-dark">No employees found — add one first.</div>
                ) : (
                    <select
                        value={selectedEmployeeId}
                        onChange={(e) => setSelectedEmployeeId(e.target.value)}
                        className="w-full max-w-sm px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                    >
                        {employees.map((emp) => (
                            <option key={emp.id} value={emp.id}>
                                #{emp.id} — {emp.firstName} {emp.lastName} ({emp.position})
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {selectedEmployeeId && canManagePayroll && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card p-6">
                        <div className="flex items-center justify-between mb-1">
                            <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">Salary structure</h3>
                            <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-control ${
                                    salaryConfigured ? "bg-success-soft text-success" : "bg-warning-soft text-warning"
                                }`}
                            >
                                {salaryConfigured ? "Configured" : "Not configured"}
                            </span>
                        </div>
                        <p className="text-xs text-muted dark:text-muted-dark mb-4">
                            Required before payroll can be processed for this employee.
                        </p>

                        {salaryMsg && (
                            <div
                                className={`mb-4 p-2.5 rounded-control text-xs flex items-start gap-2 ${
                                    salaryMsg.type === "success" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                                }`}
                            >
                                {salaryMsg.type === "success" ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                )}
                                {salaryMsg.text}
                            </div>
                        )}

                        <form onSubmit={handleSaveSalary} className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">
                                    Base salary (₹/month)
                                </label>
                                <input
                                    type="number" required min="0" step="0.01"
                                    value={salary.baseSalary}
                                    onChange={(e) => setSalary((s) => ({ ...s, baseSalary: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">
                                        Allowances (₹)
                                    </label>
                                    <input
                                        type="number" min="0" step="0.01"
                                        value={salary.allowances}
                                        onChange={(e) => setSalary((s) => ({ ...s, allowances: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">
                                        Deductions (₹)
                                    </label>
                                    <input
                                        type="number" min="0" step="0.01"
                                        value={salary.deductions}
                                        onChange={(e) => setSalary((s) => ({ ...s, deductions: e.target.value }))}
                                        className="w-full px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={savingSalary}
                                className="w-full py-2.5 bg-ink dark:bg-canvas-dark border border-border dark:border-border-dark hover:opacity-90 text-ink-dark dark:text-ink-dark rounded-control text-sm font-medium transition-opacity disabled:opacity-50"
                            >
                                {savingSalary ? "Saving…" : salaryConfigured ? "Update salary structure" : "Save salary structure"}
                            </button>
                        </form>
                    </div>

                    <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card p-6">
                        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark mb-1">Process payroll (single employee)</h3>
                        <p className="text-xs text-muted dark:text-muted-dark mb-4">
                            Runs against the saved salary structure — locked once processed for a given period.
                        </p>

                        {processMsg && (
                            <div
                                className={`mb-4 p-2.5 rounded-control text-xs flex items-start gap-2 ${
                                    processMsg.type === "success" ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                                }`}
                            >
                                {processMsg.type === "success" ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                ) : (
                                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                                )}
                                {processMsg.text}
                            </div>
                        )}

                        <label className="block text-xs font-medium text-muted dark:text-muted-dark mb-1.5">Pay period</label>
                        <input
                            type="month"
                            value={payPeriod}
                            onChange={(e) => setPayPeriod(e.target.value)}
                            className="w-full mb-4 px-3.5 py-2.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-sm text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                        />

                        <button
                            onClick={handleProcessPayroll}
                            disabled={processing || !salaryConfigured}
                            className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-control text-sm font-medium transition-colors"
                        >
                            {processing ? "Processing…" : "Process payroll"}
                        </button>
                        {!salaryConfigured && (
                            <p className="text-xs text-muted dark:text-muted-dark mt-2">
                                Save a salary structure first — payroll can't be processed without one.
                            </p>
                        )}
                    </div>
                </div>
            )}

            <div className="bg-surface dark:bg-surface-dark border border-border dark:border-border-dark rounded-card overflow-hidden">
                <div className="px-6 py-4 border-b border-border dark:border-border-dark flex items-center justify-between flex-wrap gap-3">
                    <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">
                        Payslip history {selectedEmployee ? `— ${selectedEmployee.firstName} ${selectedEmployee.lastName}` : ""}
                    </h3>
                    {slips.length > 0 && (
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={financialYear}
                                onChange={(e) => setFinancialYear(e.target.value)}
                                placeholder="2025-26"
                                className="w-24 px-2.5 py-1.5 bg-canvas dark:bg-canvas-dark border border-border dark:border-border-dark rounded-control text-xs text-ink dark:text-ink-dark focus:outline-none focus:border-accent"
                            />
                            <button
                                onClick={handleDownloadForm16}
                                className="inline-flex items-center gap-1.5 text-xs font-medium text-ink dark:text-ink-dark border border-border dark:border-border-dark px-3 py-1.5 rounded-control hover:bg-canvas dark:hover:bg-canvas-dark"
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Form 16 (FY summary)
                            </button>
                        </div>
                    )}
                </div>
                {loadingSlips ? (
                    <div className="text-center py-10 text-muted dark:text-muted-dark text-sm">Loading payslips…</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                            <tr className="border-b border-border dark:border-border-dark text-muted dark:text-muted-dark text-xs font-semibold uppercase tracking-wide">
                                <th className="py-3 px-5">Pay period</th>
                                <th className="py-3 px-3">Gross pay</th>
                                <th className="py-3 px-3">Deductions</th>
                                <th className="py-3 px-3">Net pay</th>
                                <th className="py-3 px-3">Processed</th>
                                <th className="py-3 px-5 text-right">Payslip</th>
                            </tr>
                            </thead>
                            <tbody className="divide-y divide-border dark:divide-border-dark text-sm">
                            {slips.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-10 text-muted dark:text-muted-dark">
                                        No payroll runs yet for this employee.
                                    </td>
                                </tr>
                            ) : (
                                slips.map((slip) => (
                                    <tr key={slip.id} className="hover:bg-canvas dark:hover:bg-canvas-dark transition-colors">
                                        <td className="py-4 px-5 font-medium text-ink dark:text-ink-dark">{slip.payPeriod}</td>
                                        <td className="px-3 text-ink dark:text-ink-dark">₹{Number(slip.grossPay).toLocaleString()}</td>
                                        <td className="px-3 text-danger">-₹{Number(slip.totalDeductions).toLocaleString()}</td>
                                        <td className="px-3 text-success font-semibold">₹{Number(slip.netPay).toLocaleString()}</td>
                                        <td className="px-3 text-xs text-muted dark:text-muted-dark">
                                            {slip.processedAt ? new Date(slip.processedAt).toLocaleDateString() : "—"}
                                        </td>
                                        <td className="px-5 text-right">
                                            <button
                                                onClick={() => generatePayslipPDF(slip)}
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-hover transition-colors"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default PayrollPage;
