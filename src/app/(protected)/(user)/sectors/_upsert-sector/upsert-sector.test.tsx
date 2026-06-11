/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { _Translator, useFormatter } from "next-intl";
import ListSectors from "../_list-sectors/list-sectors";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const upsertSectorMock = jest.fn();
const getAllSectorsMock = jest.fn();

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

jest.mock("@/lib/services/sector.service", () => {
  return {
    SectorService: jest.fn().mockImplementation(() => ({
      upsertSector: (...args: unknown[]) => upsertSectorMock(...args),
      getAllSectors: getAllSectorsMock,
    })),
  };
});

jest.mocked(useFormatter).mockReturnValue({
  dateTime: jest.fn().mockReturnValue("01/01/2024 10:30"),
} as any);

const mockSectors = (count = 2) => {
  return new Array(count).fill(null).map((_, i) => {
    const padNumber = (i + 1).toString().padStart(2, "0");

    return {
      id: padNumber,
      active: true,
      userId: i.toString(),
      createdAt: new Date(),
      name: `Sector ${padNumber}`,
    };
  });
};

const mockSector = {
  name: "New Sector",
  active: true,
};

const openCreateSectorModal = async () => {
  getAllSectorsMock.mockResolvedValue([]);
  renderWithProviders(<ListSectors />);

  await waitFor(async () => {
    await userEvent.click(screen.getByTestId("create-sector"));
  });
};

const handleUpsertSector = async (
  sector?: ReturnType<typeof mockSectors>[number],
) => {
  upsertSectorMock.mockResolvedValue(sector?.id ?? "03");
  getAllSectorsMock.mockResolvedValue(sector ? [sector] : []);

  renderWithProviders(<ListSectors />);

  if (sector) {
    await waitFor(async () => {
      await userEvent.click(screen.getByTestId(`edit-sector-${sector.id}`));
    });
  } else {
    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("create-sector"));
    });
  }

  const nameInput = screen.getByTestId("upsert-sector-name");
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, mockSector.name);

  await userEvent.click(screen.getByTestId("upsert-sector-save"));

  await waitFor(() => {
    expect(upsertSectorMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: mockSector.name,
        active: mockSector.active,
      }),
    );
  });
};

describe("UpsertSector", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should not submit with an empty name", async () => {
    await openCreateSectorModal();

    await userEvent.click(screen.getByTestId("upsert-sector-save"));

    await waitFor(() => {
      expect(upsertSectorMock).not.toHaveBeenCalled();
      expect(screen.getByText("validation.required")).toBeInTheDocument();
    });
  });

  it("Should create a sector successfully", async () => {
    await handleUpsertSector();
    expect(toast.success).toHaveBeenCalledWith("sector_created");
  });

  it("Should update a sector successfully", async () => {
    const sector = mockSectors(1)[0];
    await handleUpsertSector(sector);
    expect(toast.success).toHaveBeenCalledWith("sector_updated");
  });

  it("Should show error when upsert fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    upsertSectorMock.mockRejectedValue(new Error("Failed"));
    getAllSectorsMock.mockResolvedValue([]);
    renderWithProviders(<ListSectors />);

    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("create-sector"));
    });

    await userEvent.type(
      screen.getByTestId("upsert-sector-name"),
      mockSector.name,
    );
    await userEvent.click(screen.getByTestId("upsert-sector-save"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("could_not_create");
    });

    consoleSpy.mockRestore();
  });

  it("Should cancel the upsert modal", async () => {
    await openCreateSectorModal();

    await userEvent.click(screen.getByTestId("upsert-sector-cancel"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("upsert-sector-modal"),
      ).not.toBeInTheDocument();
    });
  });
});
