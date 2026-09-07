import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import Register from "./register";

const registerMock = jest.fn();
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
    register: (...args: unknown[]) => registerMock(...args),
  })),
}));

jest.mock("@/components/global/select-language", () => ({
  __esModule: true,
  default: () => <div data-slot="select-language" />,
}));

const validPassword = "Password1!";

const fillRegisterForm = async () => {
  await userEvent.type(screen.getByTestId("register-name"), "Jane Doe");
  await userEvent.type(screen.getByTestId("register-email"), "jane@email.com");
  await userEvent.type(screen.getByTestId("register-password"), validPassword);
  await userEvent.type(
    screen.getByTestId("register-confirm-password"),
    validPassword,
  );
};

describe("Register", () => {
  beforeEach(() => {
    registerMock.mockResolvedValue(undefined);
  });

  it("renders the form and a link to login", () => {
    renderWithProviders(<Register />);

    expect(screen.getByTestId("register-title")).toBeInTheDocument();
    expect(screen.getByTestId("login-link")).toHaveAttribute("href", "/login");
  });

  it("does not submit an empty form", async () => {
    renderWithProviders(<Register />);
    await userEvent.click(screen.getByTestId("register-submit"));

    await waitFor(() => {
      expect(registerMock).not.toHaveBeenCalled();
    });
  });

  it("registers and redirects home", async () => {
    renderWithProviders(<Register />);
    await fillRegisterForm();
    await userEvent.click(screen.getByTestId("register-submit"));

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        name: "Jane Doe",
        email: "jane@email.com",
        password: validPassword,
        confirmPassword: validPassword,
      });
      expect(toast.success).toHaveBeenCalledWith("success");
      expect(replaceMock).toHaveBeenCalledWith("/");
    });
  });

  it("shows an error toast when registration fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);
    registerMock.mockRejectedValue(new Error("Failed"));

    renderWithProviders(<Register />);
    await fillRegisterForm();
    await userEvent.click(screen.getByTestId("register-submit"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("error");
    });

    consoleSpy.mockRestore();
  });
});
