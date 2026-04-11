/**
 * Base path for admin-style portals (admin vs manager).
 * Used for React Router links; API URLs stay under /api/v1/...
 */
export function getRoleBasePath() {
  const r = String(localStorage.getItem("role") || "")
    .toUpperCase()
    .replace(/^ROLE_/, "");
  if (r === "MANAGER") return "/manager";
  return "/admin";
}

export function isManagerRole() {
  const r = String(localStorage.getItem("role") || "")
    .toUpperCase()
    .replace(/^ROLE_/, "");
  return r === "MANAGER";
}
