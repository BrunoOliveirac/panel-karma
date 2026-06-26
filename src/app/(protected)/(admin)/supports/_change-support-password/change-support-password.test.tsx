/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { _Translator, useFormatter } from "next-intl";
import ListSupports from "../_list-supports/list-supports";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const updatePasswordMock = jest.fn();
const getAllSupportsMock = jest.fn();

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}));

jest.mock("use-intl", () => ({
  useTranslations: () => (t: _Translator<Record<string, any>>) => t,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (t: _Translator<Record<string, any>>) => t,
  useFormatter: jest.fn(),
}));

jest.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => children,
  Tooltip: ({ children }: { children: React.ReactNode }) => children,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => children,
  TooltipContent: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn() }),
}));

jest.mock("@/lib/services/support.service", () => {
  return {
    SupportService: jest.fn().mockImplementation(() => ({
      getAllSupports: getAllSupportsMock,
      updatePassword: (...args: unknown[]) => updatePasswordMock(...args),
    })),
  };
});

jest.mocked(useFormatter).mockReturnValue({
  dateTime: jest.fn().mockReturnValue("01/01/2024 10:30"),
} as any);

const validPassword = "Password1!";

const mockSupport = {
  id: "01",
  active: true,
  type: UserTypeEnum.SUPPORT,
  createdAt: new Date(),
  name: "Support 01",
  email: "support01@email.com",
};

const openChangePasswordModal = async () => {
  getAllSupportsMock.mockResolvedValue([mockSupport]);
  renderWithProviders(<ListSupports />);

  await waitFor(async () => {
    await userEvent.click(screen.getByTestId("change-support-password-01"));
  });
};

describe("ChangeSupportPassword", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Should not submit with an empty password", async () => {
    await openChangePasswordModal();
    await userEvent.click(screen.getByTestId("change-support-password-save"));

    await waitFor(() => {
      expect(updatePasswordMock).not.toHaveBeenCalled();
      expect(screen.getAllByText("validation.required").length).toBeGreaterThan(
        0,
      );
    });
  });

  it("Should update the password successfully", async () => {
    updatePasswordMock.mockResolvedValue(undefined);
    await openChangePasswordModal();

    await userEvent.type(
      screen.getByTestId("change-support-password"),
      validPassword,
    );

    await userEvent.type(
      screen.getByTestId("change-support-confirm-password"),
      validPassword,
    );

    await userEvent.click(screen.getByTestId("change-support-password-save"));

    await waitFor(() => {
      expect(updatePasswordMock).toHaveBeenCalledWith("01", validPassword);
      expect(toast.success).toHaveBeenCalledWith("password_updated");
    });
  });

  it("Should show error when update fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    updatePasswordMock.mockRejectedValue(new Error("Failed"));
    await openChangePasswordModal();

    await userEvent.type(
      screen.getByTestId("change-support-password"),
      validPassword,
    );

    await userEvent.type(
      screen.getByTestId("change-support-confirm-password"),
      validPassword,
    );

    await userEvent.click(screen.getByTestId("change-support-password-save"));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("could_not_update"),
    );

    consoleSpy.mockRestore();
  });

  it("Should cancel the change password modal", async () => {
    await openChangePasswordModal();
    await userEvent.click(screen.getByTestId("change-support-password-cancel"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("change-support-password-modal"),
      ).not.toBeInTheDocument();
    });
  });
});
