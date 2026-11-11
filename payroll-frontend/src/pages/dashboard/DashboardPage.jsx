import React, { useMemo, useState, useEffect } from "react";
import { getCompanyId } from "../../utils/session";
import { Link } from "react-router-dom";
import {
    Users,
    IndianRupee,
    ShieldCheck,
    AlertTriangle,
    ArrowUpRight,
    TrendingUp,
    CreditCard,
    Sparkles,
    RefreshCw,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

function useGreeting() {
    return useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good morning";
        if (hour < 18) return "Good afternoon";
        return "Good evening";
    }, []);
}

function toTitleCase(str) {
    return str
        .split(/[.\s_-]+/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
        .join(" ");
}

export default function DashboardPage() {
    const greeting = useGreeting();
    const userEmail = localStorage.getItem("userEmail") || "";
    const rawName = userEmail ? userEmail.split("@")[0] : "";
    const firstName = rawName ? toTitleCase(rawName) : "there";

    const [summary, setSummary] = useState(null);
    const [summaryLoading, setSummaryLoading] = useState(true);
    const [summaryError, setSummaryError] = useState(false);

    const [aiInsights, setAiInsights] = useState([]);
    const [aiLoading, setAiLoading] = useState(true);
    const [aiError, setAiError] = useState(null);

    const fetchSummary = () => {
        setSummaryLoading(true);
        setSummaryError(false);
        const token = localStorage.getItem("token");
        fetch(`${API_BASE}/api/dashboard/summary?companyId=${getCompanyId() || ""}`, {
            headers: {
                Accept: "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        })
            .then((res) => {
                if (!res.ok) throw new Error("Failed to load dashboard summary");
                return res.json();
            })
            .then((res) => {
                if (res.success && res.data) {
                    setSummary(res.data);
                }
                setSummaryLoading(false);
            })
            .catch((err) => {
                console.error("Dashboard summary error:", err);
                setSummaryError(true);
                setSummaryLoading(false);
            });
    };

    useEffect(() => {
        fetchSummary();
    }, []);

    const fetchAiInsights = () => {
        setAiLoading(true);
        setAiError(null);
        const token = localStorage.getItem("token");

        fetch(`${API_BASE}/api/insights/company/${getCompanyId()}`, {
            headers: {
                Accept: "application/json",
                ...(token && { Authorization: `Bearer ${token}` }),
            },
        })
            .then(async (res) => {
                const body = await res.json().catch(() => ({}));
                if (!res.ok || !body.success) {
                    throw new Error(body.message || "Failed to generate AI insights");
                }
                return body;
            })
            .then((body) => {
                setAiInsights(body.data.insights || []);
                setAiLoading(false);
            })
            .catch((err) => {
                console.error("AI insights error:", err);
                setAiError(err.message);
                setAiLoading(false);
            });
    };

    useEffect(() => {
        fetchAiInsights();
    }, []);

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return "—";
        return `₹${Number(value).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
    };

    const metrics = [
        {
            label: "Total employees",
            value: summaryError ? "—" : summary === null ? "…" : summary.totalEmployees,
            icon: Users,
            tone: "neutral",
        },
        {
            label: "Monthly payroll",
            value: summaryError ? "—" : summary === null ? "…" : formatCurrency(summary.totalMonthlyPayroll),
            icon: IndianRupee,
            tone: "neutral",
        },
        {
            label: "Compliance score",
            value: summaryError ? "—" : summary === null ? "…" : summary.complianceScore,
            icon: ShieldCheck,
            tone: "success",
        },
        {
            label: "Pending flags",
            value: summaryError ? "—" : summary === null ? "…" : `${summary.pendingActions} items`,
            icon: AlertTriangle,
            tone: "warning",
        },
    ];

    const toneClasses = {
        neutral: "bg-canvas dark:bg-canvas-dark text-ink dark:text-ink-dark",
        success: "bg-success-soft text-success",
        warning: "bg-warning-soft text-warning",
    };

    const quickLinks = [
        { label: "Employees", href: "/employee", icon: Users },
        { label: "Payroll", href: "/payroll", icon: CreditCard },
        { label: "Compliance", href: "/compliance", icon: ShieldCheck },
    ];

    const trend = summary?.payrollTrend || [];

    const chart = useMemo(() => {
        if (trend.length < 2) return null;
        const w = 560, h = 160, pad = 8;
        const amounts = trend.map((d) => Number(d.totalNetPay));
        const max = Math.max(...amounts);
        const min = Math.min(...amounts);
        const stepX = (w - pad * 2) / (trend.length - 1);
        const points = amounts.map((amount, i) => {
            const x = pad + i * stepX;
            const y = h - pad - ((amount - min) / (max - min || 1)) * (h - pad * 2);
            return [x, y];
        });
        const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`).join(" ");
        const areaPath = `${linePath} L ${points[points.length - 1][0]} ${h} L ${points[0][0]} ${h} Z`;
        return { w, h, linePath, areaPath, points };
    }, [trend]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-ink dark:text-ink-dark">
                    {greeting}{firstName !== "there" ? `, ${firstName}` : ""}
                </h1>
                <p className="text-muted dark:text-muted-dark text-sm mt-1">
                    Here's what's happening across payroll and compliance today.
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map(({ label, value, icon: Icon, tone }) => (
                    <div
                        key={label}
                        className="bg-surface dark:bg-surface-dark p-5 rounded-card border border-border dark:border-border-dark flex items-center gap-4"
                    >
                        <div className={`p-2.5 rounded-control ${toneClasses[tone]}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs font-medium text-muted dark:text-muted-dark">{label}</p>
                            <h3 className="text-xl font-semibold text-ink dark:text-ink-dark mt-0.5">{value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-surface dark:bg-surface-dark p-6 rounded-card border border-border dark:border-border-dark">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">Payroll volume</h3>
                        <p className="text-xs text-muted dark:text-muted-dark">By processed pay period</p>
                    </div>
                    {trend.length >= 2 && (
                        <span className="inline-flex items-center text-xs font-medium text-success bg-success-soft px-2 py-1 rounded-control gap-1">
                            <TrendingUp className="w-3.5 h-3.5" /> Live data
                        </span>
                    )}
                </div>

                {!chart ? (
                    <div className="py-10 text-center text-sm text-muted dark:text-muted-dark">
                        {summaryLoading
                            ? "Loading payroll history…"
                            : "Not enough processed pay periods yet to show a trend. Run payroll for at least two months to see this chart."}
                    </div>
                ) : (
                    <>
                        <svg viewBox={`0 0 ${chart.w} ${chart.h}`} className="w-full h-40" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
                                    <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path d={chart.areaPath} fill="url(#areaFill)" stroke="none" />
                            <path d={chart.linePath} fill="none" stroke="var(--color-accent)" strokeWidth="2" />
                            {chart.points.map(([x, y], i) => (
                                <circle key={i} cx={x} cy={y} r="2.5" fill="var(--color-accent)" />
                            ))}
                        </svg>
                        <div className="flex justify-between mt-1 px-1">
                            {trend.map((d) => (
                                <span key={d.payPeriod} className="text-xs text-muted dark:text-muted-dark">{d.payPeriod}</span>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="bg-surface dark:bg-surface-dark p-6 rounded-card border border-border dark:border-border-dark">
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-accent" />
                        <h3 className="text-sm font-semibold text-ink dark:text-ink-dark">AI-driven insights</h3>
                    </div>
                    <button
                        onClick={fetchAiInsights}
                        disabled={aiLoading}
                        className="text-xs font-medium text-accent hover:underline disabled:opacity-50 flex items-center gap-1"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? "animate-spin" : ""}`} />
                        Regenerate
                    </button>
                </div>

                {aiLoading ? (
                    <p className="text-sm text-muted dark:text-muted-dark">Analyzing payroll and compliance data…</p>
                ) : aiError ? (
                    <p className="text-sm text-danger">{aiError}</p>
                ) : aiInsights.length === 0 ? (
                    <p className="text-sm text-muted dark:text-muted-dark">No insights generated yet.</p>
                ) : (
                    <ul className="space-y-2">
                        {aiInsights.map((line, i) => (
                            <li key={i} className="text-sm text-ink dark:text-ink-dark flex gap-2">
                                <span className="text-accent mt-0.5">•</span>
                                <span>{line}</span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {quickLinks.map(({ label, href, icon: Icon }) => (
                    <Link
                        key={label}
                        to={href}
                        className="bg-surface dark:bg-surface-dark p-4 rounded-card border border-border dark:border-border-dark flex items-center justify-between hover:border-accent/40 transition-colors"
                    >
                        <div className="flex items-center gap-3">
                            <Icon className="w-4 h-4 text-muted dark:text-muted-dark" />
                            <span className="text-sm font-medium text-ink dark:text-ink-dark">{label}</span>
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-muted dark:text-muted-dark" />
                    </Link>
                ))}
            </div>
        </div>
    );
}