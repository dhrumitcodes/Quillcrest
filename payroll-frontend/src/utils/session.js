// Resolve the active tenant without silently assigning Super Admin to company 1.
export function getCompanyId() {
    const role = localStorage.getItem("userRole");
    if (role === "ROLE_SUPER_ADMIN") {
        const selected = Number(localStorage.getItem("selectedCompanyId"));
        return Number.isInteger(selected) && selected > 0 ? selected : null;
    }

    const companyId = Number(localStorage.getItem("companyId"));
    return Number.isInteger(companyId) && companyId > 0 ? companyId : null;
}
