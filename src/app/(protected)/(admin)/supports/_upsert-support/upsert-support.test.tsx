/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { _Translator, useFormatter } from "next-intl";
import ListSupports from "../_list-supports/list-supports";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const upsertSupportMock = jest.fn();
const checkEmailMock = jest.fn();
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
      upsertSupport: (...args: unknown[]) => upsertSupportMock(...args),
      checkEmail: (...args: unknown[]) => checkEmailMock(...args),
      getAllSupports: getAllSupportsMock,
    })),
  };
});

jest.mocked(useFormatter).mockReturnValue({
  dateTime: jest.fn().mockReturnValue("01/01/2024 10:30"),
} as any);

const validPassword = "Password1!";

const mockSupports = (count = 2) => {
  return new Array(count).fill(null).map((_, i) => {
    const padNumber = (i + 1).toString().padStart(2, "0");

    return {
      id: padNumber,
      active: true,
      type: UserTypeEnum.SUPPORT,
      createdAt: new Date(),
      name: `Support ${padNumber}`,
      email: `support${padNumber}@email.com`,
    };
  });
};

const mockSupport = {
  name: "New Support",
  email: "newsupport@email.com",
  active: true,
};

const openCreateSupportModal = async () => {
  getAllSupportsMock.mockResolvedValue([]);
  checkEmailMock.mockResolvedValue(true);
  renderWithProviders(<ListSupports />);

  await waitFor(async () => {
    await userEvent.click(screen.getByTestId("create-support"));
  });
};

const handleUpsertSupport = async (
  support?: ReturnType<typeof mockSupports>[number],
) => {
  upsertSupportMock.mockResolvedValue(support?.id ?? "03");
  checkEmailMock.mockResolvedValue(true);
  getAllSupportsMock.mockResolvedValue(support ? [support] : []);

  renderWithProviders(<ListSupports />);

  if (support) {
    await waitFor(async () => {
      await userEvent.click(screen.getByTestId(`edit-support-${support.id}`));
    });
  } else {
    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("create-support"));
    });
  }

  const nameInput = screen.getByTestId("upsert-support-name");
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, mockSupport.name);

  const emailInput = screen.getByTestId("upsert-support-email");
  await userEvent.clear(emailInput);
  await userEvent.type(emailInput, mockSupport.email);

  if (!support) {
    await userEvent.type(
      screen.getByTestId("upsert-support-password"),
      validPassword,
    );

    await userEvent.type(
      screen.getByTestId("upsert-support-confirm-password"),
      validPassword,
    );
  }

  await userEvent.click(screen.getByTestId("upsert-support-save"));

  await waitFor(() => {
    expect(upsertSupportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: mockSupport.name,
        email: mockSupport.email,
        active: mockSupport.active,
      }),
    );
  });
};

describe("UpsertSupport", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkEmailMock.mockResolvedValue(true);
  });

  it("Should not submit with an empty name", async () => {
    await openCreateSupportModal();
    await userEvent.click(screen.getByTestId("upsert-support-save"));

    await waitFor(() => {
      expect(upsertSupportMock).not.toHaveBeenCalled();
      expect(screen.getAllByText("validation.required").length).toBeGreaterThan(
        0,
      );
    });
  });

  it("Should not submit with an empty e-mail", async () => {
    await openCreateSupportModal();

    await userEvent.type(
      screen.getByTestId("upsert-support-name"),
      mockSupport.name,
    );

    await userEvent.click(screen.getByTestId("upsert-support-save"));

    await waitFor(() => {
      expect(upsertSupportMock).not.toHaveBeenCalled();
      expect(screen.getAllByText("validation.required").length).toBeGreaterThan(
        0,
      );
    });
  });

  it("Should create a support successfully", async () => {
    await handleUpsertSupport();
    expect(toast.success).toHaveBeenCalledWith("support_created");
  });

  it("Should update a support successfully", async () => {
    const support = mockSupports(1)[0];
    await handleUpsertSupport(support);
    expect(toast.success).toHaveBeenCalledWith("support_updated");
  });

  it("Should show error when upsert fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    upsertSupportMock.mockRejectedValue(new Error("Failed"));
    getAllSupportsMock.mockResolvedValue([]);
    renderWithProviders(<ListSupports />);

    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("create-support"));
    });

    await userEvent.type(
      screen.getByTestId("upsert-support-name"),
      mockSupport.name,
    );

    await userEvent.type(
      screen.getByTestId("upsert-support-email"),
      mockSupport.email,
    );

    await userEvent.type(
      screen.getByTestId("upsert-support-password"),
      validPassword,
    );

    await userEvent.type(
      screen.getByTestId("upsert-support-confirm-password"),
      validPassword,
    );

    await userEvent.click(screen.getByTestId("upsert-support-save"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("could_not_create");
    });

    consoleSpy.mockRestore();
  });

  it("Should cancel the upsert modal", async () => {
    await openCreateSupportModal();
    await userEvent.click(screen.getByTestId("upsert-support-cancel"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("upsert-support-modal"),
      ).not.toBeInTheDocument();
    });
  });
});
