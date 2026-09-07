import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AxiosError } from "axios";
import { toast } from "sonner";
import Login from "./login";

const loginMock = jest.fn();
const replaceMock = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

jest.mock("next-intl", () => {
  const translate = (key: string) => key;
  return { useTranslations: () => translate };
});

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/services/auth.service", () => ({
  AuthService: jest.fn().mockImplementation(() => ({
    login: (...args: unknown[]) => loginMock(...args),
  })),
}));

jest.mock("@/components/global/select-language", () => ({
  __esModule: true,
  default: () => <div data-slot="select-language" />,
}));

const fillLoginForm = async () => {
  await userEvent.type(screen.getByTestId("login-email"), "user@email.com");
  await userEvent.type(screen.getByTestId("login-password"), "password1");
};

describe("Login", () => {
  beforeEach(() => {
    loginMock.mockResolvedValue(undefined);
  });

  it("renders the form and a link to register", () => {
    renderWithProviders(<Login />);

    expect(screen.getByTestId("login-title")).toBeInTheDocument();
    expect(screen.getByTestId("register-link")).toHaveAttribute(
      "href",
      "/register",
    );
  });

  it("does not submit an empty form", async () => {
    renderWithProviders(<Login />);
    await userEvent.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(loginMock).not.toHaveBeenCalled();
    });
  });

  it("logs in and redirects home", async () => {
    renderWithProviders(<Login />);
    await fillLoginForm();
    await userEvent.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: "user@email.com",
        password: "password1",
      });
      expect(replaceMock).toHaveBeenCalledWith("/");
    });
  });

  it("shows invalid credentials on 401", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const error = new AxiosError("Unauthorized");
    error.response = {
      status: 401,
      data: {},
      statusText: "Unauthorized",
      headers: {},
      config: { headers: {} } as never,
    };
    loginMock.mockRejectedValue(error);

    renderWithProviders(<Login />);
    await fillLoginForm();
    await userEvent.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("invalid_credentials");
    });

    consoleSpy.mockRestore();
  });

  it("shows a rate-limit message on 429", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const error = new AxiosError("Too Many Requests");
    error.status = 429;
    loginMock.mockRejectedValue(error);

    renderWithProviders(<Login />);
    await fillLoginForm();
    await userEvent.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("too_many_attempts");
    });

    consoleSpy.mockRestore();
  });

  it("shows a generic error for other API failures", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    const error = new AxiosError("Server error");
    error.status = 500;
    loginMock.mockRejectedValue(error);

    renderWithProviders(<Login />);
    await fillLoginForm();
    await userEvent.click(screen.getByTestId("login-submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("error");
    });

    consoleSpy.mockRestore();
  });
});
