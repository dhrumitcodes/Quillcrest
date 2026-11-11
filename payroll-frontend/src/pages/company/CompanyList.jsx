import React from "react";
import { Trash2, Users } from "lucide-react";

export default function CompanyList({ companies, canManageCompanies, canManageUsers, onDelete, onManageUsers }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead><tr className="border-b border-border dark:border-border-dark text-muted dark:text-muted-dark text-xs font-semibold uppercase tracking-wide">
                    <th className="py-3 px-2">Name</th><th className="py-3 px-2">Registration no.</th><th className="py-3 px-2">Email</th><th className="py-3 px-2">Employees</th>
                    {(canManageCompanies || canManageUsers) && <th className="py-3 px-2 text-right">Actions</th>}
                </tr></thead>
                <tbody className="divide-y divide-border dark:divide-border-dark text-sm">
                {companies.length === 0 ? <tr><td colSpan={(canManageCompanies || canManageUsers) ? 5 : 4} className="py-8 text-center text-muted">No companies found.</td></tr> :
                    companies.map(comp => <tr key={comp.id} className="hover:bg-canvas dark:hover:bg-canvas-dark transition-colors">
                        <td className="py-4 px-2 font-medium text-ink dark:text-ink-dark">{comp.name}</td>
                        <td className="py-4 px-2 font-mono text-xs text-accent">{comp.registrationNumber || "N/A"}</td>
                        <td className="py-4 px-2 text-muted dark:text-muted-dark">{comp.email || "—"}</td>
                        <td className="py-4 px-2"><span className="px-2.5 py-1 rounded-control text-xs font-semibold bg-accent-soft dark:bg-accent-soft-dark text-accent">{comp.totalEmployees ?? 0}</span></td>
                        {(canManageCompanies || canManageUsers) && <td className="py-4 px-2 text-right whitespace-nowrap">
                            <button onClick={() => onManageUsers(comp)} className="mr-3 inline-flex items-center gap-1.5 text-accent hover:underline" title="Manage company users"><Users className="h-4 w-4" />Manage users</button>
                            {canManageUsers && <button onClick={() => onManageUsers(comp)} className="text-muted hover:text-danger" title="Delete company"><Trash2 className="h-4 w-4" /></button>
                        </td>}
                    </tr>)
                }</tbody>
            </table>
        </div>
    );
}
