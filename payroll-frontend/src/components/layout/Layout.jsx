import React, { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import {
    Menu,
    X,
    LayoutDashboard,
    Building2,
    Users,
    Layers,
    CreditCard,
    Settings,
    LogOut,
    Sun,
    Moon,
    ShieldCheck,
    Search,
    ChevronRight,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

const navigation = [
    {
        name: "Dashboard",
        icon: LayoutDashboard,
        href: "/dashboard",
    },
    {
        name: "Company",
        icon: Building2,
        href: "/company",
    },
    {
        name: "Employees",
        icon: Users,
        href: "/employee",
    },
    {
        name: "Payroll",
        icon: CreditCard,
        href: "/payroll",
    },
    {
        name: "AI Compliance",
        icon: ShieldCheck,
        href: "/compliance",
    },
    {
        name: "Departments",
        icon: Layers,
        href: "/department",
    },
    {
        name: "Settings",
        icon: Settings,
        href: "/settings",
    },
];

export default function Layout() {
    const [isOpen, setIsOpen] = useState(false);
    const isSuperAdmin = localStorage.getItem("userRole") === "ROLE_SUPER_ADMIN";
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState(localStorage.getItem("selectedCompanyId") || "");
    const [companyOptionsLoading, setCompanyOptionsLoading] = useState(isSuperAdmin);

    const { darkMode, toggleTheme } = useTheme();

    useEffect(() => {
        if (!isSuperAdmin) return;
        const token = localStorage.getItem("token");
        fetch(API_BASE + "/api/companies", {
            headers: { Accept: "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
        })
            .then((response) => {
                if (!response.ok) throw new Error("Could not load companies for the workspace selector");
                return response.json();
            })
            .then((payload) => {
                const list = Array.isArray(payload) ? payload : (payload.data || []);
                setCompanies(list);
                const stored = localStorage.getItem("selectedCompanyId");
                const stillExists = list.some((company) => String(company.id) === String(stored));
                const nextId = stillExists ? String(stored) : (list[0] ? String(list[0].id) : "");
                setSelectedCompanyId(nextId);
                if (nextId) localStorage.setItem("selectedCompanyId", nextId);
                else localStorage.removeItem("selectedCompanyId");
            })
            .catch((error) => console.error("Company selector:", error))
            .finally(() => setCompanyOptionsLoading(false));
    }, [isSuperAdmin]);

    const handleCompanyChange = (event) => {
        const nextId = event.target.value;
        setSelectedCompanyId(nextId);
        if (nextId) localStorage.setItem("selectedCompanyId", nextId);
        else localStorage.removeItem("selectedCompanyId");
        window.location.reload();
    };

    const navigate = useNavigate();
    const location = useLocation();

    const currentPage = navigation.find((item) =>
        location.pathname.startsWith(item.href)
    );

    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userEmail");
        localStorage.clear();

        navigate("/login", {
            replace: true,
        });
    };

    return (
        <div
            className="
                min-h-screen
                flex
                bg-canvas dark:bg-canvas-dark
                text-ink dark:text-ink-dark
                transition-colors duration-200
            "
        >
            <header
                className="
                    fixed
                    top-0
                    left-0
                    right-0
                    z-40
                    h-14
                    md:hidden
                    flex
                    items-center
                    justify-between
                    px-4
                    bg-surface dark:bg-surface-dark
                    border-b border-border dark:border-border-dark
                "
            >
                {/* Mobile brand */}
                <div className="flex items-center gap-2.5">
                    <div
                        className="
                            relative
                            w-7 h-7
                            rounded-full
                            border border-border dark:border-border-dark
                            flex items-center justify-center
                        "
                    >
                        <span
                            className="
                                text-[15px]
                                leading-none
                                text-ink dark:text-ink-dark
                            "
                            style={{
                                fontFamily:
                                    'Georgia, "Times New Roman", serif',
                            }}
                        >
                            Q
                        </span>

                        <span
                            className="
                                absolute
                                right-[-3px]
                                bottom-[2px]
                                w-[9px]
                                h-[5px]
                                border-b
                                border-r
                                border-muted/60
                                rotate-[-22deg]
                            "
                        />
                    </div>

                    <div className="flex flex-col">
                        <span
                            className="
                                text-[13px]
                                tracking-[0.15em]
                                leading-none
                                font-semibold
                            "
                            style={{
                                fontFamily:
                                    'Georgia, "Times New Roman", serif',
                            }}
                        >
                            QUILLCREST
                        </span>

                        <span
                            className="
                                text-[7px]
                                tracking-[0.18em]
                                text-muted dark:text-muted-dark
                                mt-1
                            "
                        >
                            PAYROLL
                        </span>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="
                        p-2
                        rounded-control
                        text-muted dark:text-muted-dark
                        hover:bg-canvas dark:hover:bg-canvas-dark
                        hover:text-ink dark:hover:text-ink-dark
                        transition-colors
                    "
                    aria-label={isOpen ? "Close menu" : "Open menu"}
                >
                    {isOpen ? (
                        <X className="w-5 h-5" />
                    ) : (
                        <Menu className="w-5 h-5" />
                    )}
                </button>
            </header>

            {isOpen && (
                <div
                    className="
                        fixed
                        inset-0
                        bg-black/30
                        z-40
                        md:hidden
                    "
                    onClick={() => setIsOpen(false)}
                />
            )}
            <aside
                className={`
                    fixed
                    md:sticky
                    top-0
                    left-0
                    z-50
                    h-screen
                    w-[248px]
                    shrink-0

                    bg-surface dark:bg-surface-dark
                    border-r border-border dark:border-border-dark

                    flex
                    flex-col

                    transform
                    transition-transform
                    duration-200

                    ${
                    isOpen
                        ? "translate-x-0"
                        : "-translate-x-full md:translate-x-0"
                }
                `}
            >
                <div className="h-[76px] px-6 flex items-center">
                    <div className="flex items-center gap-3">
                        {/* Q mark */}
                        <div
                            className="
                                relative
                                w-8 h-8
                                rounded-full
                                border border-border
                                dark:border-border-dark
                                flex
                                items-center
                                justify-center
                            "
                        >
                            <span
                                className="
                                    text-[17px]
                                    leading-none
                                    text-ink
                                    dark:text-ink-dark
                                "
                                style={{
                                    fontFamily:
                                        'Georgia, "Times New Roman", serif',
                                }}
                            >
                                Q
                            </span>

                            <span
                                className="
                                    absolute
                                    right-[-4px]
                                    bottom-[2px]
                                    w-[11px]
                                    h-[6px]
                                    border-b
                                    border-r
                                    border-muted
                                    dark:border-muted-dark
                                    rotate-[-22deg]
                                "
                            />
                        </div>

                        <div className="flex flex-col">
                            <span
                                className="
                                    text-[15px]
                                    leading-none
                                    tracking-[0.16em]
                                    font-semibold
                                "
                                style={{
                                    fontFamily:
                                        'Georgia, "Times New Roman", serif',
                                }}
                            >
                                QUILLCREST
                            </span>

                            <span
                                className="
                                    text-[8px]
                                    leading-none
                                    tracking-[0.21em]
                                    text-muted
                                    dark:text-muted-dark
                                    mt-1.5
                                "
                            >
                                PAYROLL • COMPLIANCE
                            </span>
                        </div>
                    </div>
                </div>
                <div className="px-6 mb-3">
                    <p
                        className="
                            text-[10px]
                            uppercase
                            tracking-[0.14em]
                            font-medium
                            text-muted
                            dark:text-muted-dark
                        "
                    >
                        Workspace
                    </p>
                    {isSuperAdmin && (
                        <select aria-label="Select company workspace" value={selectedCompanyId} onChange={handleCompanyChange}
                            disabled={companyOptionsLoading || companies.length === 0}
                            className="mt-2 w-full rounded-control border border-border dark:border-border-dark bg-canvas dark:bg-canvas-dark px-2 py-2 text-xs text-ink dark:text-ink-dark">
                            {companies.length === 0 ? <option value="">No companies available</option> : companies.map((company) => (
                                <option key={company.id} value={company.id}>{company.name}</option>
                            ))}
                        </select>
                    )}
                </div>
                <nav className="px-3 space-y-1">
                    {navigation.map((item) => {
                        const active = currentPage === item;
                        const Icon = item.icon;

                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsOpen(false)}
                                className={`
                                    group
                                    relative
                                    flex
                                    items-center
                                    gap-3
                                    px-3
                                    py-2.5
                                    rounded-control
                                    text-sm
                                    transition-colors

                                    ${
                                    active
                                        ? `
                                                bg-accent-soft
                                                dark:bg-accent-soft-dark
                                                text-accent
                                                font-medium
                                            `
                                        : `
                                                text-muted
                                                dark:text-muted-dark
                                                hover:bg-canvas
                                                dark:hover:bg-canvas-dark
                                                hover:text-ink
                                                dark:hover:text-ink-dark
                                            `
                                }
                                `}
                            >
                                {active && (
                                    <span
                                        className="
                                            absolute
                                            left-0
                                            top-1/2
                                            -translate-y-1/2
                                            w-[2px]
                                            h-5
                                            rounded-r
                                            bg-accent
                                        "
                                    />
                                )}

                                <Icon
                                    className={`
                                        w-[17px]
                                        h-[17px]
                                        shrink-0

                                        ${
                                        active
                                            ? "text-accent"
                                            : "text-muted dark:text-muted-dark"
                                    }
                                    `}
                                    strokeWidth={active ? 2 : 1.7}
                                />

                                <span>{item.name}</span>

                                {active && (
                                    <ChevronRight
                                        className="
                                            ml-auto
                                            w-3.5
                                            h-3.5
                                            text-accent/60
                                        "
                                    />
                                )}
                            </Link>
                        );
                    })}
                </nav>
                <div className="mt-auto">
                    <div
                        className="
                            mx-4
                            mb-3
                            h-px
                            bg-border
                            dark:bg-border-dark
                        "
                    />

                    <div className="px-3 pb-4 space-y-1">
                        <button
                            type="button"
                            onClick={toggleTheme}
                            className="
                                w-full
                                flex
                                items-center
                                gap-3
                                px-3
                                py-2.5
                                rounded-control
                                text-sm
                                text-muted
                                dark:text-muted-dark
                                hover:bg-canvas
                                dark:hover:bg-canvas-dark
                                hover:text-ink
                                dark:hover:text-ink-dark
                                transition-colors
                            "
                        >
                            {darkMode ? (
                                <Sun className="w-[17px] h-[17px]" />
                            ) : (
                                <Moon className="w-[17px] h-[17px]" />
                            )}

                            <span>
                                {darkMode ? "Light mode" : "Dark mode"}
                            </span>
                        </button>

                        <button
                            type="button"
                            onClick={handleSignOut}
                            className="
                                w-full
                                flex
                                items-center
                                gap-3
                                px-3
                                py-2.5
                                rounded-control
                                text-sm
                                text-danger
                                hover:bg-danger-soft
                                transition-colors
                            "
                        >
                            <LogOut className="w-[17px] h-[17px]" />

                            <span>Sign out</span>
                        </button>
                    </div>
                </div>
            </aside>
            <div className="flex-1 min-w-0 flex flex-col">
                <header
                    className="
                        hidden
                        md:flex
                        h-[64px]
                        shrink-0
                        items-center
                        justify-between
                        px-6
                        lg:px-8

                        bg-surface
                        dark:bg-surface-dark

                        border-b
                        border-border
                        dark:border-border-dark
                    "
                >
                    <div className="flex items-center gap-2">
                        <span
                            className="
                                text-sm
                                text-muted
                                dark:text-muted-dark
                            "
                        >
                            Workspace
                        </span>

                        {currentPage && (
                            <>
                                <ChevronRight
                                    className="
                                        w-3.5
                                        h-3.5
                                        text-muted/50
                                    "
                                />

                                <span className="text-sm font-medium">
                                    {currentPage.name}
                                </span>
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-5">
                        {isSuperAdmin && (
                            <label className="flex items-center gap-2 text-xs text-muted dark:text-muted-dark">
                                <span>Company</span>
                                <select aria-label="Select company workspace" value={selectedCompanyId} onChange={handleCompanyChange}
                                    disabled={companyOptionsLoading || companies.length === 0}
                                    className="h-9 max-w-[220px] rounded-control border border-border dark:border-border-dark bg-canvas dark:bg-canvas-dark px-2 text-sm text-ink dark:text-ink-dark">
                                    {companies.length === 0 ? <option value="">No companies available</option> : companies.map((company) => (
                                        <option key={company.id} value={company.id}>{company.name}</option>
                                    ))}
                                </select>
                            </label>
                        )}
                        <div className="relative w-[280px]">
                            <Search
                                className="
                                    absolute
                                    left-3
                                    top-1/2
                                    -translate-y-1/2
                                    w-4
                                    h-4
                                    text-muted
                                    dark:text-muted-dark
                                "
                            />

                            <input
                                type="text"
                                placeholder="Search"
                                className="
                                    w-full
                                    h-9
                                    pl-9
                                    pr-12

                                    bg-canvas
                                    dark:bg-canvas-dark

                                    border
                                    border-border
                                    dark:border-border-dark

                                    rounded-control

                                    text-sm
                                    text-ink
                                    dark:text-ink-dark

                                    placeholder-muted/60

                                    focus:outline-none
                                    focus:border-accent

                                    transition-colors
                                "
                            />

                            <kbd
                                className="
                                    absolute
                                    right-2.5
                                    top-1/2
                                    -translate-y-1/2

                                    text-[10px]
                                    text-muted
                                    dark:text-muted-dark

                                    border
                                    border-border
                                    dark:border-border-dark

                                    rounded
                                    px-1.5
                                    py-0.5
                                "
                            >
                                ⌘K
                            </kbd>
                        </div>

                        <div
                            className="
                                w-8
                                h-8
                                rounded-full
                                bg-accent-soft
                                dark:bg-accent-soft-dark
                                flex
                                items-center
                                justify-center
                                text-accent
                                text-xs
                                font-semibold
                                shrink-0
                            "
                        >
                            A
                        </div>
                    </div>
                </header>

                <div className="md:hidden h-14 shrink-0" />

                <main
                    className="
                        flex-1
                        overflow-x-hidden
                        p-5
                        sm:p-6
                        lg:p-8
                    "
                >
                    {isSuperAdmin && companyOptionsLoading ? (
                        <div className="py-12 text-center text-sm text-muted dark:text-muted-dark">Loading company workspaces…</div>
                    ) : isSuperAdmin && !selectedCompanyId ? (
                        <div className="py-12 text-center text-sm text-muted dark:text-muted-dark">Create a company before opening a tenant workspace.</div>
                    ) : (
                        <Outlet />
                    )}
                </main>
            </div>
        </div>
    );
}