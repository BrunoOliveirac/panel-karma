/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
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
  useLocale: () => "en",
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
  useSearchParams: () => ({ get: jest.fn() }),
}));

jest.mock("@/components/global/image-crop-dialog/image-crop-dialog", () => ({
  ImageCropDialog: ({
    open,
    imageSrc,
    onConfirm,
    onOpenChange,
    dataSlot,
    confirmDataSlot,
    cancelDataSlot,
  }: {
    open: boolean;
    imageSrc: string | null;
    onConfirm: (dataUrl: string) => void | Promise<void>;
    onOpenChange: (open: boolean) => void;
    dataSlot?: string;
    confirmDataSlot?: string;
    cancelDataSlot?: string;
  }) =>
    open && imageSrc ? (
      <div data-slot={dataSlot}>
        <button
          type="button"
          data-slot={confirmDataSlot}
          onClick={() => onConfirm("data:image/jpeg;base64,cropped")}
        >
          save
        </button>
        <button
          type="button"
          data-slot={cancelDataSlot}
          onClick={() => onOpenChange(false)}
        >
          cancel
        </button>
      </div>
    ) : null,
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
      cover: "",
      avatar: "",
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
  beforeAll(() => {
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: jest.fn(() => "blob:mock-image"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: jest.fn(),
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });
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

  it("Should reject non-image file when selecting an image", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(1));
    getAllActiveSectorsMock.mockResolvedValue(mockSectors(1));
    renderWithProviders(<ListClients />);

    await userEvent.click(screen.getByTestId("create-client"));

    await userEvent.click(screen.getByTestId("change-cover"));
    const input = screen.getByTestId("profile-cover-input");
    fireEvent.change(input, {
      target: {
        files: [new File(["plain"], "doc.txt", { type: "text/plain" })],
      },
    });

    expect(toast.error).toHaveBeenCalledWith("invalid_image");
    expect(
      screen.queryByTestId("upsert-client-crop-dialog"),
    ).not.toBeInTheDocument();
  });

  it("Should crop and set cover image", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(1));
    getAllActiveSectorsMock.mockResolvedValue(mockSectors(1));
    renderWithProviders(<ListClients />);

    await userEvent.click(screen.getByTestId("create-client"));

    await userEvent.click(screen.getByTestId("change-cover"));
    const input = screen.getByTestId("profile-cover-input");
    fireEvent.change(input, {
      target: {
        files: [new File(["cover"], "cover.png", { type: "image/png" })],
      },
    });

    expect(
      await screen.findByTestId("upsert-client-crop-dialog"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("upsert-client-cover-save"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("upsert-client-crop-dialog"),
      ).not.toBeInTheDocument();
      expect(screen.getByAltText("cover")).toBeInTheDocument();
    });
  });

  it("Should crop and set avatar image", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(1));
    getAllActiveSectorsMock.mockResolvedValue(mockSectors(1));
    renderWithProviders(<ListClients />);

    await userEvent.click(screen.getByTestId("create-client"));

    await userEvent.click(screen.getByTestId("upsert-client-avatar-trigger"));
    const input = screen.getByTestId("profile-avatar-input");
    fireEvent.change(input, {
      target: {
        files: [new File(["avatar"], "avatar.png", { type: "image/png" })],
      },
    });

    expect(
      await screen.findByTestId("upsert-client-crop-dialog"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("upsert-client-avatar-save"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("upsert-client-crop-dialog"),
      ).not.toBeInTheDocument();
    });
  });

  it("Should cancel crop dialog and revoke object url", async () => {
    getAllClientsMock.mockResolvedValue(mockClients(1));
    getAllActiveSectorsMock.mockResolvedValue(mockSectors(1));
    renderWithProviders(<ListClients />);

    await userEvent.click(screen.getByTestId("create-client"));

    await userEvent.click(screen.getByTestId("change-cover"));
    const input = screen.getByTestId("profile-cover-input");
    fireEvent.change(input, {
      target: {
        files: [new File(["cover"], "cover.png", { type: "image/png" })],
      },
    });

    expect(
      await screen.findByTestId("upsert-client-crop-dialog"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("upsert-client-cover-cancel"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("upsert-client-crop-dialog"),
      ).not.toBeInTheDocument();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-image");
    });
  });

  it("Should render existing cover when editing client", async () => {
    const clients = mockClients(1);
    clients[0].cover = "https://example.com/existing-cover.png";
    getAllClientsMock.mockResolvedValue(clients);
    getAllActiveSectorsMock.mockResolvedValue(mockSectors(1));

    renderWithProviders(<ListClients />);

    await waitFor(async () => {
      const clientCard = screen.getAllByTestId("client-card")[0];
      await userEvent.click(clientCard);
    });

    const modal = await screen.findByTestId("upsert-client-modal");
    expect(within(modal).getByAltText("cover")).toBeInTheDocument();
  });
});
