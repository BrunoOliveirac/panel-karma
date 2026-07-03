/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import ListClients from "../_list-clients/list-clients";
import { _Translator } from "next-intl";

const checkEmailMock = jest.fn();
const upsertClientMock = jest.fn();
const getAllClientsMock = jest.fn();
const getAllActiveSectorsMock = jest.fn();

jest.mock("use-intl", () => ({
  useTranslations: () => (t: _Translator<Record<string, any>>) => t,
}));

jest.mock("next-intl", () => ({
  useTranslations: () => (t: _Translator<Record<string, any>>) => t,
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
      checkEmail: checkEmailMock,
      getAllClients: getAllClientsMock,
      upsertClient: (...args: string[]) => upsertClientMock(...args),
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

const mockClients = (count = 15) => {
  return new Array(count).fill(null).map((_, i) => {
    const padNumber = (i + 1).toString().padStart(2, "0");

    return {
      active: true,
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

const mockSectors = (count = 2) => {
  return new Array(count).fill(null).map((_, i) => {
    const padNumber = (i + 1).toString().padStart(2, "0");

    return {
      active: true,
      id: padNumber,
      userId: i.toString(),
      name: `Sector ${padNumber}`,
    };
  });
};

const mockClient = {
  id: "02",
  name: "Client 02",
  email: "client02@email.com",
  phone: "12345678901",
  budget: 1000,
  notes: "",
  sectorId: "",
};

const handleCreateClientModal = async (
  checkEmailValue: boolean,
  email: string,
) => {
  checkEmailMock.mockResolvedValue(checkEmailValue);
  getAllClientsMock.mockResolvedValue(mockClients(1));
  getAllActiveSectorsMock.mockResolvedValue(mockSectors(1));
  renderWithProviders(<ListClients />);

  await waitFor(async () => {
    await userEvent.click(screen.getByTestId("create-client"));
  });

  const input = screen.getByTestId("upsert-client-email");
  await userEvent.clear(input);
  await userEvent.type(input, email);
  await userEvent.tab();
};

const handleUpsertClient = async (checkEmailValue = true) => {
  upsertClientMock.mockResolvedValue("02");
  checkEmailMock.mockResolvedValue(checkEmailValue);
  getAllClientsMock.mockResolvedValue(mockClients(1));
  getAllActiveSectorsMock.mockResolvedValue(mockSectors(1));

  renderWithProviders(<ListClients />);

  await waitFor(async () => {
    await userEvent.click(screen.getByTestId("create-client"));
  });

  await userEvent.type(
    screen.getByTestId("upsert-client-name"),
    mockClient.name,
  );

  await userEvent.type(
    screen.getByTestId("upsert-client-email"),
    mockClient.email,
  );

  await userEvent.type(
    screen.getByPlaceholderText("enter_phone"),
    mockClient.phone,
  );

  await userEvent.type(
    screen.getByTestId("upsert-client-budget"),
    mockClient.budget.toString(),
  );

  await userEvent.click(screen.getByTestId("upsert-client-save"));

  await waitFor(async () => {
    expect(checkEmailMock).toHaveBeenCalledWith(mockClient.email);
    if (!checkEmailValue) return;

    const { name, email, phone, budget } = mockClient;

    expect(upsertClientMock).toHaveBeenCalledWith(
      expect.objectContaining({ name, email, phone, budget }),
    );
  });
};

describe("UpsertClient", () => {
  it("Should show error message if email is invalid", async () => {
    await handleCreateClientModal(false, "client01");

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("format_is_not_valid");
    });
  });

  it("Should not pass e-mail validation at create a client", async () => {
    await handleCreateClientModal(false, "client01@gmail.com");

    await waitFor(async () => {
      expect(checkEmailMock).toHaveBeenCalledWith("client01@gmail.com");
      expect(toast.error).toHaveBeenCalledWith("email_in_use");
    });
  });

  it("Should not pass e-mail validation at edit a client", async () => {
    checkEmailMock.mockResolvedValue(false);
    getAllClientsMock.mockResolvedValue(mockClients(2));
    renderWithProviders(<ListClients />);

    await waitFor(async () => {
      const clientCard = await screen.findAllByTestId("client-card");
      await userEvent.click(clientCard[0]);
    });

    const input = screen.getByTestId("upsert-client-email");
    await userEvent.clear(input);
    await userEvent.type(input, "client02@email.com");
    await userEvent.tab();

    await waitFor(async () => {
      expect(checkEmailMock).toHaveBeenCalledWith("client02@email.com");
      expect(toast.error).toHaveBeenCalledWith("email_in_use");
    });
  });

  it("Should pass e-mail validation at create a client", async () => {
    await handleCreateClientModal(true, "client02@gmail.com");

    await waitFor(async () => {
      expect(checkEmailMock).toHaveBeenCalledWith("client02@gmail.com");
      expect(toast.error).not.toHaveBeenCalledWith("email_in_use");
    });
  });

  it("Should pass e-mail validation at edit a client", async () => {
    checkEmailMock.mockResolvedValue(true);
    getAllClientsMock.mockResolvedValue(mockClients(2));
    renderWithProviders(<ListClients />);

    await waitFor(async () => {
      const clientCard = await screen.findAllByTestId("client-card");
      await userEvent.click(clientCard[0]);
    });

    const input = screen.getByTestId("upsert-client-email");
    await userEvent.clear(input);
    await userEvent.type(input, "client03@email.com");
    await userEvent.tab();

    await waitFor(async () => {
      expect(checkEmailMock).toHaveBeenCalledWith("client03@email.com");
      expect(toast.error).not.toHaveBeenCalledWith("email_in_use");
    });
  });

  it("Should upsert a client successfully", async () => {
    await handleUpsertClient();
    expect(toast.success).toHaveBeenCalledWith("client_created");
  });

  it("Should upsert a client failed with invalid email", async () => {
    await handleUpsertClient(false);
    expect(toast.error).toHaveBeenCalledWith("email_in_use");
  });
});
