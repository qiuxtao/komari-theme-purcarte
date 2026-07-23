import { useCallback } from "react";
import { apiService } from "@/services/api";

export const useRPC2Call = () => {
  const call = useCallback(
    async <T, R>(method: string, params?: T, _options?: { signal?: AbortSignal, timeout?: number }): Promise<R> => {
      // options.signal is ignored for now as apiService doesn't support aborting
      const response = await apiService.rpcCall<R>(method, params);
      if (response.status === "error") {
        throw new Error(response.message);
      }
      return response.data;
    },
    []
  );

  return { call };
};
