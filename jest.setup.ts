import "@testing-library/jest-dom";

import { configure } from "@testing-library/dom";
import {
  clearMockLoggedUser,
  mockLoggedUser,
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

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    alt,
    src,
    onClick,
  }: {
    alt: string;
    src: string;
    onClick?: () => void;
  }) => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const React = require("react");
    return React.createElement("img", { alt, src, onClick });
  },
}));

/**
 * Auth no longer reads `user` / `expiresAt` from cookies.
 * Components that call `useAuth` (e.g. InputCurrency) get a stable session mock.
 */
jest.mock("@/lib/hooks/use-auth", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { mockLoggedUser: user } = require("@/lib/mocks/logged-user.mock");

  return {
    useAuth: jest.fn(() => ({
      data: {
        locale: "en",
        user,
      },
      isLoading: false,
      isError: false,
      isSuccess: true,
      sessionExpired: false,
      acknowledgeSessionExpired: jest.fn(),
      refetch: jest.fn(),
    })),
  };
});

function defaultUseAuth() {
  return {
    data: {
      locale: "en" as const,
      user: mockLoggedUser,
    },
    isLoading: false,
    isError: false,
    isSuccess: true,
    sessionExpired: false,
    acknowledgeSessionExpired: jest.fn(),
    refetch: jest.fn(),
  };
}

beforeEach(() => {
  setMockLoggedUser();
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useAuth } = require("@/lib/hooks/use-auth");

  if (typeof useAuth.mockReset === "function") {
    useAuth.mockReset();
    useAuth.mockImplementation(() => defaultUseAuth());
  }
});

afterEach(() => {
  clearMockLoggedUser();
});
