/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { _Translator, useFormatter } from "next-intl";
import ListSupports from "./list-supports";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";

const deleteSupportMock = jest.fn();
const toggleStatusMock = jest.fn();
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
      toggleStatus: (...args: string[]) => toggleStatusMock(...args),
      deleteSupport: (...args: string[]) => deleteSupportMock(...args),
    })),
  };
});

jest.mocked(useFormatter).mockReturnValue({
  dateTime: jest.fn().mockReturnValue("01/01/2024 10:30"),
} as any);

const mockSupports = (count = 15) => {
  return new Array(count).fill(null).map((_, i) => {
    const padNumber = (i + 1).toString().padStart(2, "0");

    return {
      id: padNumber,
      active: i % 2 === 0,
      type: UserTypeEnum.SUPPORT,
      createdAt: new Date(),
      name: `Support ${padNumber}`,
      email: `support${padNumber}@email.com`,
    };
  });
};

const mockSupport = (active: boolean) => [
  {
    id: "01",
    active,
    type: UserTypeEnum.SUPPORT,
    createdAt: new Date(),
    name: "Support 01",
    email: "support01@email.com",
  },
];

describe("ListSupports", () => {
  it("Should show an empty list", async () => {
    getAllSupportsMock.mockResolvedValue([]);
    renderWithProviders(<ListSupports />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("supports_not_found")).toBeInTheDocument();
    });
  });

  it("Should load the supports", async () => {
    getAllSupportsMock.mockResolvedValue(mockSupports());
    renderWithProviders(<ListSupports />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Support 01")).toBeInTheDocument();
      expect(screen.getByText("Support 10")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
    });
  });

  it("Should navigate between pages", async () => {
    getAllSupportsMock.mockResolvedValue(mockSupports(30));
    renderWithProviders(<ListSupports />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination-link-1")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("pagination-link-2"));
    expect(screen.getByText("Support 11")).toBeInTheDocument();
    expect(screen.getByText("Support 20")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("pagination-link-3"));
    expect(screen.getByText("Support 21")).toBeInTheDocument();
    expect(screen.getByText("Support 30")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("pagination-link-1"));
    expect(screen.getByText("Support 01")).toBeInTheDocument();
    expect(screen.getByText("Support 10")).toBeInTheDocument();
  });

  it("Filter the supports by name", async () => {
    getAllSupportsMock.mockResolvedValue(mockSupports(5));
    renderWithProviders(<ListSupports />);
    const input = screen.getByPlaceholderText(/search/i);

    await userEvent.type(input, "Support 01");
    expect(screen.getByText("Support 01")).toBeInTheDocument();
    expect(screen.queryByText("Support 02")).not.toBeInTheDocument();

    await userEvent.type(input, "Support 10");
    expect(screen.getByText("supports_not_found")).toBeInTheDocument();
  });

  it("Filter the supports by e-mail", async () => {
    getAllSupportsMock.mockResolvedValue(mockSupports(3));
    renderWithProviders(<ListSupports />);
    const input = screen.getByPlaceholderText(/search/i);

    await waitFor(() => {
      expect(screen.getByText("support02@email.com")).toBeInTheDocument();
    });

    await userEvent.type(input, "support02@email.com");
    expect(screen.getByText("Support 02")).toBeInTheDocument();
    expect(screen.queryByText("Support 01")).not.toBeInTheDocument();
  });

  it("Should delete a support after confirmation", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
    getAllSupportsMock.mockResolvedValue(mockSupports(1));
    renderWithProviders(<ListSupports />);

    await waitFor(
      async () =>
        await userEvent.click(screen.getByTestId("delete-support-01")),
    );

    expect(deleteSupportMock).toHaveBeenCalledWith("01");

    await waitFor(async () =>
      expect(screen.getByText("supports_not_found")).toBeInTheDocument(),
    );
  });

  it("Should deactivate support status", async () => {
    getAllSupportsMock.mockResolvedValue(mockSupport(true));
    renderWithProviders(<ListSupports />);

    await waitFor(() => {
      expect(screen.getByTestId("support-row")).toBeInTheDocument();
    });

    const supportRow = screen.getByTestId("support-row");
    expect(
      within(supportRow).getByTestId("active-support-status"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("toggle-support-status-01"));

    expect(toggleStatusMock).toHaveBeenCalledWith("01");

    expect(
      within(supportRow).getByTestId("inactive-support-status"),
    ).toBeInTheDocument();
  });

  it("Should activate support status", async () => {
    getAllSupportsMock.mockResolvedValue(mockSupport(false));
    renderWithProviders(<ListSupports />);

    await waitFor(() => {
      expect(screen.getByTestId("support-row")).toBeInTheDocument();
    });

    const supportRow = screen.getByTestId("support-row");

    expect(
      within(supportRow).getByTestId("inactive-support-status"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("toggle-support-status-01"));

    expect(toggleStatusMock).toHaveBeenCalledWith("01");

    expect(
      within(supportRow).getByTestId("active-support-status"),
    ).toBeInTheDocument();
  });

  it("Should cancel the deletion of a support", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: false });
    getAllSupportsMock.mockResolvedValue(mockSupports(1));
    renderWithProviders(<ListSupports />);

    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("delete-support-01"));
      expect(deleteSupportMock).not.toHaveBeenCalled();
      expect(screen.getByText("Support 01")).toBeInTheDocument();
    });
  });

  it("Should open the support's create modal", async () => {
    getAllSupportsMock.mockResolvedValue([]);
    renderWithProviders(<ListSupports />);

    await userEvent.click(screen.getByTestId("create-support"));
    expect(await screen.findByText("support_details")).toBeInTheDocument();
  });

  it("Should open the support's edit modal", async () => {
    getAllSupportsMock.mockResolvedValue(mockSupports(1));
    renderWithProviders(<ListSupports />);

    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("edit-support-01"));
    });

    expect(await screen.findByText("support_details")).toBeInTheDocument();
  });

  it("Should open the change password modal", async () => {
    getAllSupportsMock.mockResolvedValue(mockSupports(1));
    renderWithProviders(<ListSupports />);

    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("change-support-password-01"));
    });

    expect(
      await screen.findByTestId("change-support-password-modal"),
    ).toBeInTheDocument();
  });
});
