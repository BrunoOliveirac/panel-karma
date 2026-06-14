/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { _Translator, useFormatter } from "next-intl";
import ListSectors from "./list-sectors";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";

const deleteSectorMock = jest.fn();
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
      upsertSector: upsertSectorMock,
      getAllSectors: getAllSectorsMock,
      deleteSector: (...args: string[]) => deleteSectorMock(...args),
    })),
  };
});

jest.mocked(useFormatter).mockReturnValue({
  dateTime: jest.fn().mockReturnValue("01/01/2024 10:30"),
} as any);

const mockSectors = (count = 15) => {
  return new Array(count).fill(null).map((_, i) => {
    const padNumber = (i + 1).toString().padStart(2, "0");

    return {
      id: padNumber,
      active: i % 2 === 0,
      userId: i.toString(),
      createdAt: new Date(),
      name: `Sector ${padNumber}`,
    };
  });
};

describe("ListSectors", () => {
  it("Should show an empty list", async () => {
    getAllSectorsMock.mockResolvedValue([]);
    renderWithProviders(<ListSectors />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("sectors_not_found")).toBeInTheDocument();
    });
  });

  it("Should load the sectors", async () => {
    getAllSectorsMock.mockResolvedValue(mockSectors());
    renderWithProviders(<ListSectors />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Sector 01")).toBeInTheDocument();
      expect(screen.getByText("Sector 10")).toBeInTheDocument();

      expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
    });
  });

  it("Should navigate between pages", async () => {
    getAllSectorsMock.mockResolvedValue(mockSectors(30));
    renderWithProviders(<ListSectors />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination-link-1")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-3")).toBeInTheDocument();
    });

    // Go to the second page
    fireEvent.click(screen.getByTestId("pagination-link-2"));
    expect(screen.getByText("Sector 11")).toBeInTheDocument();
    expect(screen.getByText("Sector 20")).toBeInTheDocument();

    // Go to the third page
    fireEvent.click(screen.getByTestId("pagination-link-3"));
    expect(screen.getByText("Sector 21")).toBeInTheDocument();
    expect(screen.getByText("Sector 30")).toBeInTheDocument();

    // Go to the first page
    fireEvent.click(screen.getByTestId("pagination-link-1"));
    expect(screen.getByText("Sector 01")).toBeInTheDocument();
    expect(screen.getByText("Sector 10")).toBeInTheDocument();
  });

  it("Filter the sectors by name", async () => {
    getAllSectorsMock.mockResolvedValue(mockSectors(5));
    renderWithProviders(<ListSectors />);
    const input = screen.getByPlaceholderText(/search/i);

    // Filter by Sector 01
    await userEvent.type(input, "Sector 01");
    expect(screen.getByText("Sector 01")).toBeInTheDocument();
    expect(screen.queryByText("Sector 02")).not.toBeInTheDocument();

    // Search by Sector 10 and show an empty state
    await userEvent.type(input, "Sector 10");
    expect(screen.getByText("sectors_not_found")).toBeInTheDocument();
  });

  it("Should delete a sector after confirmation", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
    getAllSectorsMock.mockResolvedValue(mockSectors(1));
    renderWithProviders(<ListSectors />);

    await waitFor(
      async () => await userEvent.click(screen.getByTestId("delete-sector-01")),
    );

    expect(deleteSectorMock).toHaveBeenCalledWith("01");

    await waitFor(async () =>
      expect(screen.getByText("sectors_not_found")).toBeInTheDocument(),
    );
  });

  it("Should deactivate a sector", async () => {
    getAllSectorsMock.mockResolvedValue(mockSectors(1));
    renderWithProviders(<ListSectors />);

    await waitFor(async () => {
      const sectorCard = screen.getAllByTestId("sector-row")[0];
      await userEvent.click(sectorCard);
    });

    await waitFor(async () => {
      const toggleButton = screen.getByTestId("toggle-sector-status-01");
      await userEvent.click(toggleButton);
    });

    expect(upsertSectorMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "01" }),
    );

    expect(
      screen.getAllByTestId("inactive-sector-status")[0],
    ).toBeInTheDocument();
    // expect(screen.getByText("successfully_deactivated")).toBeInTheDocument();
  });

  it("Should activate a sector", async () => {
    getAllSectorsMock.mockResolvedValue(mockSectors(2));
    renderWithProviders(<ListSectors />);

    await waitFor(async () => {
      const toggleButton = screen.getByTestId("toggle-sector-status-02");
      await userEvent.click(toggleButton);
    });

    expect(upsertSectorMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "02" }),
    );

    expect(
      screen.getAllByTestId("active-sector-status")[1],
    ).toBeInTheDocument();
    // expect(screen.getByText("successfully_activated")).toBeInTheDocument();
  });

  it("Should open the sector's edit modal", async () => {
    getAllSectorsMock.mockResolvedValue(mockSectors(1));
    renderWithProviders(<ListSectors />);

    await waitFor(async () => {
      const sectorCard = screen.getAllByTestId("sector-row")[0];
      await userEvent.click(sectorCard);
    });
  });

  it("Should cancel the deletion of a sector", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: false });
    getAllSectorsMock.mockResolvedValue(mockSectors(1));
    renderWithProviders(<ListSectors />);

    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("delete-sector-01"));
      expect(deleteSectorMock).not.toHaveBeenCalled();
      expect(screen.getByText("Sector 01")).toBeInTheDocument();
    });
  });

  it("Should open the sector's create modal", async () => {
    getAllSectorsMock.mockResolvedValue([]);
    renderWithProviders(<ListSectors />);

    await userEvent.click(screen.getByTestId("create-sector"));
    expect(await screen.findByText("sector_details")).toBeInTheDocument();
  });
});
