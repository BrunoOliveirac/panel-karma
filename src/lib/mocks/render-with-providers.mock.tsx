import { render } from "@testing-library/react";
import { ModalProvider } from "@/lib/providers/modal-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ModalProvider>{ui}</ModalProvider>
    </QueryClientProvider>,
  );
};
