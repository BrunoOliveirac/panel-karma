import "@testing-library/jest-dom";

import { configure } from "@testing-library/dom";
import {
  clearMockLoggedUser,
  setMockLoggedUser,
} from "@/lib/mocks/logged-user.mock";

configure({
  testIdAttribute: "data-slot",
});

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

global.ResizeObserver = ResizeObserverMock;

/**
 * Auth no longer reads `user` / `expiresAt` from cookies.
 * Components that call `useAuth` (e.g. InputCurrency) get a stable session mock.
 */
jest.mock("@/lib/hooks/use-auth", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockLoggedUser } = require("@/lib/mocks/logged-user.mock");

  return {
    useAuth: () => ({
      data: {
        locale: "en",
        user: mockLoggedUser,
      },
      isLoading: false,
      isError: false,
      isSuccess: true,
      sessionExpired: false,
      acknowledgeSessionExpired: jest.fn(),
      refetch: jest.fn(),
    }),
  };
});

beforeEach(() => {
  setMockLoggedUser();
});

afterEach(() => {
  clearMockLoggedUser();
});
