import { BASE_URL } from "../config/api";
import { extractResponseData } from "../utils/apiResponseHandler";
import { authenticatedFetch } from "../utils/auth";
import { adminApi } from "./adminApi";
import { productApi } from "./productApi";

/**
 * Read Spring Data-style totalElements (or array length) from list API payloads.
 */
export function readTotalElements(payload) {
  if (payload == null) return null;
  const root = payload?.data !== undefined ? payload.data : payload;
  if (typeof root?.totalElements === "number" && !Number.isNaN(root.totalElements)) {
    return root.totalElements;
  }
  if (typeof root?.totalElements === "string" && root.totalElements !== "") {
    const n = parseInt(root.totalElements, 10);
    return Number.isNaN(n) ? null : n;
  }
  if (Array.isArray(root)) return root.length;
  if (Array.isArray(root?.content)) {
    if (typeof root.totalElements === "number") return root.totalElements;
    return root.content.length;
  }
  return null;
}

function pickFirstNumber(...candidates) {
  for (const v of candidates) {
    if (v === undefined || v === null || v === "") continue;
    const n = typeof v === "number" ? v : parseInt(String(v), 10);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

/**
 * Loads dashboard stat card values: prefers consolidated `/dashboard/stats` from backend,
 * then fills gaps from list endpoints when the stats API is unavailable.
 */
export async function fetchDashboardCardMetrics() {
  const primary = await adminApi.getDashboardStats().catch(() => null);
  if (primary && typeof primary === "object") {
    const hasCounts =
      primary.totalUsers != null ||
      primary.farmers != null ||
      primary.employees != null ||
      primary.products != null ||
      primary.orders != null;
    const hasChart = Array.isArray(primary.orderTrack) && primary.orderTrack.length > 0;
    if (hasCounts || hasChart) {
      return {
        totalUsers: pickFirstNumber(primary.totalUsers, primary.farmers, primary.total_users) ?? 0,
        employees: pickFirstNumber(primary.employees, primary.totalEmployees, primary.total_employees) ?? 0,
        products: pickFirstNumber(primary.products, primary.totalProducts, primary.total_products) ?? 0,
        orders: pickFirstNumber(primary.orders, primary.totalOrders, primary.total_orders) ?? 0,
        orderTrack: hasChart ? primary.orderTrack : null,
        _rawStats: primary,
      };
    }
  }

  const settled = await Promise.allSettled([
    Promise.resolve(primary),
    adminApi.getAllEmployees(0, 1),
    adminApi.getAllFarmers(0, 1),
    productApi.getAllProducts({ page: 0, size: 1 }),
    (async () => {
      try {
        const res = await authenticatedFetch(
          `${BASE_URL}/orders?page=0&size=1`,
          {},
          { skipGetRetry: true }
        );
        if (!res.ok) return null;
        const json = await res.json().catch(() => null);
        if (!json) return null;
        return extractResponseData(json);
      } catch {
        return null;
      }
    })(),
  ]);

  const stats =
    settled[0].status === "fulfilled" && settled[0].value && typeof settled[0].value === "object"
      ? settled[0].value
      : primary && typeof primary === "object"
        ? primary
        : {};

  const empTotal =
    settled[1].status === "fulfilled" ? readTotalElements(settled[1].value) : null;
  const farmTotal =
    settled[2].status === "fulfilled" ? readTotalElements(settled[2].value) : null;
  const prodPayload = settled[3].status === "fulfilled" ? settled[3].value : null;
  const prodTotal = readTotalElements(prodPayload);
  const ordTotal =
    settled[4].status === "fulfilled" ? readTotalElements(settled[4].value) : null;

  const totalUsers = pickFirstNumber(
    stats.totalUsers,
    stats.total_users,
    stats.farmers,
    stats.farmerCount,
    stats.surveyCount,
    farmTotal
  );

  const employees = pickFirstNumber(
    stats.employees,
    stats.totalEmployees,
    stats.total_employees,
    empTotal
  );

  const products = pickFirstNumber(
    stats.products,
    stats.totalProducts,
    stats.total_products,
    prodTotal
  );

  const orders = pickFirstNumber(
    stats.orders,
    stats.totalOrders,
    stats.total_orders,
    ordTotal
  );

  return {
    totalUsers: totalUsers ?? 0,
    employees: employees ?? 0,
    products: products ?? 0,
    orders: orders ?? 0,
    orderTrack: Array.isArray(stats.orderTrack) && stats.orderTrack.length > 0 ? stats.orderTrack : null,
    _rawStats: stats,
  };
}
