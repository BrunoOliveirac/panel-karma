/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { _Translator, useFormatter } from "next-intl";
import ListProjects from "../_list-projects/list-projects";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const upsertProjectMock = jest.fn();
const getAllProjectsMock = jest.fn();
const getAllClientsMock = jest.fn();

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

jest.mock("@/components/ui/select", () => ({
  Select: ({
    field,
    items,
    bindLabel,
    bindValue,
    triggerDataSlot,
  }: {
    field: { value: string; onChange: (value: string) => void };
    items: Record<string, string>[];
    bindLabel?: string;
    bindValue?: string;
    triggerDataSlot: string;
  }) => (
    <select
      data-slot={triggerDataSlot}
      value={field.value ?? ""}
      onChange={(event) => field.onChange(event.target.value)}
    >
      <option value="">select</option>
      {items.map((item) => (
        <option
          key={bindValue ? item[bindValue] : String(item)}
          value={bindValue ? item[bindValue] : String(item)}
        >
          {bindLabel ? item[bindLabel] : String(item)}
        </option>
      ))}
    </select>
  ),
}));

jest.mock("@/lib/services/project.service", () => {
  return {
    ProjectService: jest.fn().mockImplementation(() => ({
      upsertProject: (...args: unknown[]) => upsertProjectMock(...args),
      getAllProjects: getAllProjectsMock,
    })),
  };
});

jest.mock("@/lib/services/client.service", () => {
  return {
    ClientService: jest.fn().mockImplementation(() => ({
      getAllClients: getAllClientsMock,
    })),
  };
});

jest.mocked(useFormatter).mockReturnValue({
  dateTime: jest.fn().mockReturnValue("01/01/2024 10:30"),
} as any);

const mockClients = (count = 2) => {
  return new Array(count).fill(null).map((_, i) => {
    const padNumber = (i + 1).toString().padStart(2, "0");

    return {
      active: true,
      id: padNumber,
      budget: 175009,
      phone: "1234567890",
      userId: i.toString(),
      favorite: false,
      name: `Client ${padNumber}`,
      notes: "",
      email: `client${padNumber}@email.com`,
    };
  });
};

const mockProject = {
  name: "New Project",
  active: true,
  clientId: "01",
};

const openCreateProjectModal = async () => {
  getAllProjectsMock.mockResolvedValue([]);
  getAllClientsMock.mockResolvedValue(mockClients(1));
  renderWithProviders(<ListProjects />);

  await waitFor(async () => {
    await userEvent.click(screen.getByTestId("create-project"));
  });
};

const selectClient = async () => {
  await userEvent.selectOptions(
    screen.getByTestId("upsert-project-client-trigger"),
    "01",
  );
};

const handleUpsertProject = async (
  project?: {
    id: string;
    name: string;
    active: boolean;
    userId: string;
    createdAt: Date;
    client: ReturnType<typeof mockClients>[number];
  },
) => {
  upsertProjectMock.mockResolvedValue(project?.id ?? "03");
  getAllProjectsMock.mockResolvedValue(project ? [project] : []);
  getAllClientsMock.mockResolvedValue(mockClients(1));

  renderWithProviders(<ListProjects />);

  if (project) {
    await waitFor(async () => {
      await userEvent.click(screen.getByTestId(`edit-project-${project.id}`));
    });
  } else {
    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("create-project"));
    });
  }

  const nameInput = screen.getByTestId("upsert-project-name");
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, mockProject.name);
  await selectClient();

  await userEvent.click(screen.getByTestId("upsert-project-save"));

  await waitFor(() => {
    expect(upsertProjectMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: mockProject.name,
        active: mockProject.active,
        clientId: mockProject.clientId,
      }),
    );
  });
};

describe("UpsertProject", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Should not submit with an empty name", async () => {
    await openCreateProjectModal();

    await userEvent.click(screen.getByTestId("upsert-project-save"));

    await waitFor(() => {
      expect(upsertProjectMock).not.toHaveBeenCalled();
      expect(screen.getAllByText("validation.required").length).toBeGreaterThan(
        0,
      );
    });
  });

  it("Should not submit without a client", async () => {
    await openCreateProjectModal();

    await userEvent.type(
      screen.getByTestId("upsert-project-name"),
      mockProject.name,
    );
    await userEvent.click(screen.getByTestId("upsert-project-save"));

    await waitFor(() => {
      expect(upsertProjectMock).not.toHaveBeenCalled();
      expect(screen.getAllByText("validation.required").length).toBeGreaterThan(
        0,
      );
    });
  });

  it("Should create a project successfully", async () => {
    await handleUpsertProject();
    expect(toast.success).toHaveBeenCalledWith("project_created");
  });

  it("Should update a project successfully", async () => {
    const client = mockClients(1)[0];
    const project = {
      id: "01",
      active: true,
      userId: "0",
      createdAt: new Date(),
      name: "Project 01",
      client,
    };

    await handleUpsertProject(project);
    expect(toast.success).toHaveBeenCalledWith("project_updated");
  });

  it("Should show error when upsert fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    upsertProjectMock.mockRejectedValue(new Error("Failed"));
    getAllProjectsMock.mockResolvedValue([]);
    getAllClientsMock.mockResolvedValue(mockClients(1));
    renderWithProviders(<ListProjects />);

    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("create-project"));
    });

    await userEvent.type(
      screen.getByTestId("upsert-project-name"),
      mockProject.name,
    );
    await selectClient();
    await userEvent.click(screen.getByTestId("upsert-project-save"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("could_not_create");
    });

    consoleSpy.mockRestore();
  });

  it("Should cancel the upsert modal", async () => {
    await openCreateProjectModal();

    await userEvent.click(screen.getByTestId("upsert-project-cancel"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("upsert-project-modal"),
      ).not.toBeInTheDocument();
    });
  });
});
