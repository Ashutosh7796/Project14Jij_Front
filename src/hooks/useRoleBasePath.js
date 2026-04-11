import { useMemo } from "react";
import { getRoleBasePath } from "../utils/rolePaths";

/** Prefix for in-app routes: `/admin` or `/manager` based on stored role. */
export function useRoleBasePath() {
  return useMemo(() => getRoleBasePath(), []);
}
