import { QueryClient } from "@tanstack/react-query";

type QueryClientConfig = object;

const defaultQueryClientConfig = {};

let queryClientConfig: QueryClientConfig,
  resolveQueryClientInitialized: (...args: any[]) => any,
  isQueryClientInitialized: boolean;

export const queryClientInitialized: Promise<QueryClient> = new Promise(
  (resolve) => {
    resolveQueryClientInitialized = resolve;
  }
);

export function configureQueryClient(config: QueryClientConfig): void {
  if (isQueryClientInitialized) {
    throw new Error(
      "Attempted to configure the QueryClient after initialization"
    );
  }

  queryClientConfig = config;
}

export function initializeQueryClient(): void {
  const queryClient = new QueryClient(
    queryClientConfig ?? defaultQueryClientConfig
  );
  isQueryClientInitialized = true;
  resolveQueryClientInitialized(queryClient);
}
