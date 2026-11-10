/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";
import ListClients from "./list-clients";
import { _Translator } from "next-intl";

const deleteClientMock = jest.fn();
const getAllClientsMock = jest.fn();
const toggleFavoriteMock = jest.fn();
const getAllActiveSectorsMock = jest.fn();
const exportAllMock = jest.fn();
const exportCurrentPageMock = jest.fn();
const exportSelectedMock = jest.fn();

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}));

jest.mock("use-intl", () => ({
  useTranslations: () => (t: _Translator<Record<string, any>>) => t,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (t: _Translator<Record<string, any>>) => t,
  useLocale: () => "en",
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn() }),
}));

jest.mock("@/lib/services/client.service", () => {
  return {
    ClientService: jest.fn().mockImplementation(() => ({
      getAllClients: getAllClientsMock,
      toggleFavorite: toggleFavoriteMock,
      deleteClient: (...args: string[]) => deleteClientMock(...args),
    })),
  };
});

jest.mock("@/lib/services/sector.service", () => {
  return {
    SectorService: jest.fn().mockImplementation(() => ({
      getAllActiveSectors: getAllActiveSectorsMock,
    })),
  };
});

jest.mock("@/lib/services/exports/clients-xlsx.service", () => ({
  ClientsXlsxService: jest.fn().mockImplementation(() => ({
    exportAll: (...args: unknown[]) => exportAllMock(...args),
    exportCurrentPage: (...args: unknown[]) => exportCurrentPageMock(...args),
    exportSelected: (...args: unknown[]) => exportSelectedMock(...args),
  })),
}));

const mockClients = (count = 15) => {
  return new Array(count).fill(null).map((_, i) => {
    const padNumber = (i + 1).toString().padStart(2, "0");

    return {
      active: true,
      sectorId: "",
      id: padNumber,
      budget: 175009,
      phone: "1234567890",
      userId: i.toString(),
      favorite: i % 2 === 0,
      name: `Client ${padNumber}`,
      notes: `Client notes ${padNumber}`,
      email: `client${padNumber}@email.com`,
    };
  });
};

describe("ListClients", () => {
  it("Should show an empty list", async () => {
    getAllClientsMock.mockResolvedValue([]);
    getAllActiveSectorsMock.mockResolvedValue([]);
    renderWithProviders(<ListClients />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("clients_not_found")).toBeInTheDocument();
    });
  });

  it("Should load the clients", async () => {
    getAllClientsMock.mockResolvedValue(mockClients());
    renderWithProviders(<ListClients />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Client 01")).toBeInTheDocument();
      expect(screen.getByText("Client 10")).toBeInTheDocument();

      expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
    });
  });

  it("Should navigate between pages", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(30));
    renderWithProviders(<ListClients />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination-link-1")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-3")).toBeInTheDocument();
    });

    // Go to the second page
    fireEvent.click(screen.getByTestId("pagination-link-2"));
    expect(screen.getByText("Client 11")).toBeInTheDocument();
    expect(screen.getByText("Client 20")).toBeInTheDocument();

    // Go to the third page
    fireEvent.click(screen.getByTestId("pagination-link-3"));
    expect(screen.getByText("Client 21")).toBeInTheDocument();
    expect(screen.getByText("Client 30")).toBeInTheDocument();

    // Go to the first page
    fireEvent.click(screen.getByTestId("pagination-link-1"));
    expect(screen.getByText("Client 01")).toBeInTheDocument();
    expect(screen.getByText("Client 10")).toBeInTheDocument();
  });

  it("Filter the clients by name", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(5));
    renderWithProviders(<ListClients />);
    const input = screen.getByPlaceholderText(/search/i);

    // Filter by Client 01
    await userEvent.type(input, "Client 01");
    expect(screen.getByText("Client 01")).toBeInTheDocument();
    expect(screen.queryByText("Client 02")).not.toBeInTheDocument();

    // Search by Client 10 and show an empty state
    await userEvent.type(input, "Client 10");
    expect(screen.getByText("clients_not_found")).toBeInTheDocument();
  });

  it("Filter the clients by e-mail", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(5));
    renderWithProviders(<ListClients />);
    const input = screen.getByPlaceholderText(/search/i);

    // Filter by Client 03
    await userEvent.type(input, "client03@email.com");
    expect(screen.getByText("Client 03")).toBeInTheDocument();
    expect(screen.queryByText("Client 01")).not.toBeInTheDocument();

    // Search by an invalid e-mail and show an empty state
    await userEvent.type(input, "07client@email.com");
    expect(screen.getByText("clients_not_found")).toBeInTheDocument();
  });

  it("Filter the clients by notes", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(5));
    renderWithProviders(<ListClients />);
    const input = screen.getByPlaceholderText(/search/i);

    // Filter by Client 03
    await userEvent.type(input, "Client notes 05");
    expect(screen.getByText("Client 05")).toBeInTheDocument();
    expect(screen.queryByText("Client 04")).not.toBeInTheDocument();

    // Show an empty state
    await userEvent.type(input, "Empty state");
    expect(screen.getByText("clients_not_found")).toBeInTheDocument();
  });

  it("Filters the favorites tab by name", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(5));
    renderWithProviders(<ListClients />);

    await waitFor(() => {
      expect(screen.getAllByTestId("client-card")).toHaveLength(5);
    });

    await userEvent.click(screen.getByTestId("tab-favorite"));
    await userEvent.type(screen.getByPlaceholderText(/search/i), "Client 03");

    expect(screen.getByText("Client 03")).toBeInTheDocument();
    expect(screen.queryByText("Client 01")).not.toBeInTheDocument();
    expect(screen.queryByText("Client 02")).not.toBeInTheDocument();
  });

  it("Returns to the first page when the search changes", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(30));
    renderWithProviders(<ListClients />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("pagination-link-2"));
    expect(screen.queryByText("Client 01")).not.toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/search/i), "Client 01");

    expect(screen.getByText("Client 01")).toBeInTheDocument();
    expect(screen.queryByText("clients_not_found")).not.toBeInTheDocument();
  });

  it("Returns to the first page when opening favorites", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(30));
    renderWithProviders(<ListClients />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination-link-3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("pagination-link-2"));
    expect(screen.queryByText("Client 01")).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("tab-favorite"));

    expect(screen.getByText("Client 01")).toBeInTheDocument();
    expect(screen.queryByText("Client 21")).not.toBeInTheDocument();
    expect(screen.queryByTestId("pagination-link-3")).not.toBeInTheDocument();
    expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
  });

  it("Toggle the selected category", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(5));
    renderWithProviders(<ListClients />);

    await waitFor(() => {
      expect(screen.getAllByTestId("client-card")).toHaveLength(5);
    });

    // Toggle to favorites
    await userEvent.click(screen.getByTestId("tab-favorite"));
    expect(screen.getAllByTestId("client-card")).toHaveLength(3);

    // Toggle to all clients
    await userEvent.click(screen.getByTestId("tab-all"));
    expect(screen.getAllByTestId("client-card")).toHaveLength(5);
  });

  it("Should toggle the favorite status of a client", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(1));
    renderWithProviders(<ListClients />);

    await waitFor(async () => {
      // Expect Client 01 to be favorited
      toggleFavoriteMock.mockResolvedValue("01");
      expect(screen.getByAltText("favorited")).toBeInTheDocument();

      // Toggle the Client 01 to unfavorite
      toggleFavoriteMock.mockResolvedValue("01");
      await userEvent.click(screen.getByTestId("favorite-client-01"));
      expect(screen.getByAltText("unfavorited")).toBeInTheDocument();
    });
  });

  it("Should delete a client after confirmation", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
    getAllClientsMock.mockResolvedValue(mockClients(1));
    renderWithProviders(<ListClients />);

    await waitFor(
      async () => await userEvent.click(screen.getByTestId("delete-client-01")),
    );

    expect(deleteClientMock).toHaveBeenCalledWith("01");

    await waitFor(async () =>
      expect(screen.getByText("clients_not_found")).toBeInTheDocument(),
    );
  });

  it("Should cancel the deletion of a client", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: false });
    getAllClientsMock.mockResolvedValue(mockClients(1));
    renderWithProviders(<ListClients />);

    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("delete-client-01"));
      expect(deleteClientMock).not.toHaveBeenCalled();
      expect(screen.getByText("Client 01")).toBeInTheDocument();
    });
  });

  it("Should export every client, the current page, and the selection", async () => {
    getAllClientsMock.mockResolvedValue(mockClients());
    renderWithProviders(<ListClients />);

    await waitFor(() => {
      expect(screen.getByText("Client 01")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("select-client-01"));

    await userEvent.click(screen.getByTestId("export-menu-clients"));
    await userEvent.click(screen.getByRole("menuitem", { name: "all" }));

    await userEvent.click(screen.getByTestId("export-menu-clients"));
    await userEvent.click(
      screen.getByRole("menuitem", { name: "current_page" }),
    );

    await userEvent.click(screen.getByTestId("export-menu-clients"));
    await userEvent.click(screen.getByRole("menuitem", { name: "selected" }));

    expect(exportAllMock).toHaveBeenCalledWith(
      expect.objectContaining({ locale: "en" }),
    );

    const exportedPage = exportCurrentPageMock.mock.calls[0][0].data;
    expect(exportedPage).toHaveLength(10);
    expect(exportedPage.map((item: { id: string }) => item.id)).toEqual(
      expect.arrayContaining(["01", "10"]),
    );
    expect(exportedPage.map((item: { id: string }) => item.id)).not.toContain(
      "11",
    );

    expect(exportSelectedMock).toHaveBeenCalledWith(
      expect.objectContaining({ dataIds: ["01"] }),
    );
  });

  it("Should export only favorites from the favorites tab", async () => {
    getAllClientsMock.mockResolvedValue(mockClients());
    renderWithProviders(<ListClients />);

    await waitFor(() => {
      expect(screen.getByText("Client 01")).toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("select-client-01"));
    await userEvent.click(screen.getByTestId("select-client-02"));
    await userEvent.click(screen.getByTestId("tab-favorite"));

    await waitFor(() => {
      expect(screen.queryByText("Client 02")).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByTestId("export-menu-clients"));
    await userEvent.click(screen.getByRole("menuitem", { name: "all" }));

    await userEvent.click(screen.getByTestId("export-menu-clients"));
    await userEvent.click(
      screen.getByRole("menuitem", { name: "current_page" }),
    );

    await userEvent.click(screen.getByTestId("export-menu-clients"));
    await userEvent.click(screen.getByRole("menuitem", { name: "selected" }));

    const exportedAll = exportAllMock.mock.calls[0][0].data;
    expect(exportedAll).toHaveLength(8);
    expect(
      exportedAll.every((item: { favorite: boolean }) => item.favorite),
    ).toBe(true);
    expect(exportedAll.map((item: { id: string }) => item.id)).not.toContain(
      "02",
    );

    const exportedPage = exportCurrentPageMock.mock.calls[0][0].data;
    expect(exportedPage).toHaveLength(8);
    expect(
      exportedPage.every((item: { favorite: boolean }) => item.favorite),
    ).toBe(true);

    expect(exportSelectedMock).toHaveBeenCalledWith(
      expect.objectContaining({ dataIds: ["01"] }),
    );
  });

  it("Should open the client's create modal", async () => {
    getAllClientsMock.mockResolvedValue([]);
    getAllActiveSectorsMock.mockResolvedValue([]);
    renderWithProviders(<ListClients />);

    await userEvent.click(screen.getByTestId("create-client"));
    expect(await screen.findByText("client_details")).toBeInTheDocument();
  });

  it("Should open the client's edit modal", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(1));
    getAllActiveSectorsMock.mockResolvedValue([]);
    renderWithProviders(<ListClients />);

    await waitFor(async () => {
      const clientCard = screen.getAllByTestId("client-card")[0];
      await userEvent.click(clientCard);
    });

    expect(await screen.findByTestId("copy-link")).toBeInTheDocument();
  });
});
