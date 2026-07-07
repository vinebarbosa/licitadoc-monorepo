import {
  type GetApiAdminAiUsageQueryParams,
  type GetApiAdminAiUsageQueryResponse,
  useGetApiAdminAiUsage,
} from "@licitadoc/api-client";

export type AdminAiUsageQueryParams = GetApiAdminAiUsageQueryParams;
export type AdminAiUsageDashboard = GetApiAdminAiUsageQueryResponse;
export type AdminAiUsageBreakdownItem =
  GetApiAdminAiUsageQueryResponse["breakdowns"]["models"][number];
export type AdminAiUsageRun = GetApiAdminAiUsageQueryResponse["recentRuns"]["items"][number];
export type AdminAiUsageTrendPoint = GetApiAdminAiUsageQueryResponse["trend"][number];

export function useAdminAiUsageDashboard(params: AdminAiUsageQueryParams) {
  return useGetApiAdminAiUsage({ params });
}
