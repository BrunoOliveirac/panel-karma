import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import ListClients from "./list-clients";

const checkEmailMock = jest.fn();
const upsertClientMock = jest.fn();
const getAllClientsMock = jest.fn();

jest.mock("use-intl", () => ({ useTranslations: () => (key: string) => key }));
jest.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

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

const mockClient = {
  id: "02",
  name: "Client 02",
  email: "client02@email.com",
  phone: "12345678901",
  budget: 1000,
};

const handleCreateClientModal = async (
  checkEmailValue: boolean,
  email: string,
) => {
  checkEmailMock.mockResolvedValue(checkEmailValue);
  getAllClientsMock.mockResolvedValue(mockClients(1));
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
  upsertClientMock.mockResolvedValue(undefined);
  checkEmailMock.mockResolvedValue(checkEmailValue);
  getAllClientsMock.mockResolvedValue(mockClients(1));
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

    expect(upsertClientMock).toHaveBeenCalledWith({
      name: mockClient.name,
      email: mockClient.email,
      phone: mockClient.phone,
      budget: mockClient.budget,
    });
  });
};

describe("ListClients", () => {
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

  it("Should upsert a client failed because of invalid email", async () => {
    await handleUpsertClient(false);
    expect(toast.error).toHaveBeenCalledWith("email_in_use");
  });
});
