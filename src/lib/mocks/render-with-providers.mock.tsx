import { act, render } from "@testing-library/react";
import { ModalProvider } from "@/lib/providers/modal-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const providers = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ModalProvider>{ui}</ModalProvider>
    </QueryClientProvider>
  );
};

export const renderWithProviders = (ui: React.ReactElement) => {
  return render(providers(ui));
};

/**
 * Async render for components that suspend via React `use()` / Suspense.
 * Required under React 19 so the suspended tree can resolve inside `act`.
 */
export const renderWithProvidersAsync = async (ui: React.ReactElement) => {
  let result!: ReturnType<typeof render>;

  await act(async () => {
    result = render(providers(ui));
  });

  return result;
};
