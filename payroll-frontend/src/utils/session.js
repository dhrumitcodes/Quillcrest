// Company of the logged-in user (saved at login). Super admins have companyId 0
// (not tied to a company), so they fall back to company 1 until a company picker exists.
export function getCompanyId() {
    const id = Number(localStorage.getItem("companyId"));
    return id > 0 ? id : 1;
}
