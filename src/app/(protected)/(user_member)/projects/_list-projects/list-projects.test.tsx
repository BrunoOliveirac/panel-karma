/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { _Translator, useFormatter } from "next-intl";
import ListProjects from "./list-projects";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";

const deleteProjectMock = jest.fn();
const upsertProjectMock = jest.fn();
const toggleProjectActiveMock = jest.fn();
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

jest.mock("@/lib/services/project.service", () => {
  return {
    ProjectService: jest.fn().mockImplementation(() => ({
      upsertProject: upsertProjectMock,
      getAllProjects: getAllProjectsMock,
      toggleProjectActive: toggleProjectActiveMock,
      deleteProject: (...args: string[]) => deleteProjectMock(...args),
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

const mockProjects = (count = 15) => {
  return new Array(count).fill(null).map((_, i) => {
    const padNumber = (i + 1).toString().padStart(2, "0");

    return {
      id: padNumber,
      active: i % 2 === 0,
      userId: i.toString(),
      createdAt: new Date(),
      name: `Project ${padNumber}`,
      client: {
        id: padNumber,
        active: true,
        name: `Client ${padNumber}`,
        email: `client${padNumber}@email.com`,
        phone: "1234567890",
        notes: "",
        userId: i.toString(),
        budget: 1000,
        favorite: false,
      },
    };
  });
};

const mockProject = (active: boolean) => [
  {
    id: "01",
    active,
    userId: "0",
    createdAt: new Date(),
    name: "Project 01",
    client: {
      id: "01",
      active: true,
      name: "Client 01",
      email: "client01@email.com",
      phone: "1234567890",
      notes: "",
      userId: "0",
      budget: 1000,
      favorite: false,
    },
  },
];

describe("ListProjects", () => {
  beforeEach(() => {
    getAllClientsMock.mockResolvedValue([]);
  });

  it("Should show an empty list", async () => {
    getAllProjectsMock.mockResolvedValue([]);
    renderWithProviders(<ListProjects />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("projects_not_found")).toBeInTheDocument();
    });
  });

  it("Should load the projects", async () => {
    getAllProjectsMock.mockResolvedValue(mockProjects());
    renderWithProviders(<ListProjects />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Project 01")).toBeInTheDocument();
      expect(screen.getByText("Project 10")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
    });
  });

  it("Should navigate between pages", async () => {
    getAllProjectsMock.mockResolvedValue(mockProjects(30));
    renderWithProviders(<ListProjects />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination-link-1")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("pagination-link-2"));
    expect(screen.getByText("Project 11")).toBeInTheDocument();
    expect(screen.getByText("Project 20")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("pagination-link-3"));
    expect(screen.getByText("Project 21")).toBeInTheDocument();
    expect(screen.getByText("Project 30")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("pagination-link-1"));
    expect(screen.getByText("Project 01")).toBeInTheDocument();
    expect(screen.getByText("Project 10")).toBeInTheDocument();
  });

  it("Filter the projects by name", async () => {
    getAllProjectsMock.mockResolvedValue(mockProjects(5));
    renderWithProviders(<ListProjects />);
    const input = screen.getByPlaceholderText(/search/i);

    await userEvent.type(input, "Project 01");
    expect(screen.getByText("Project 01")).toBeInTheDocument();
    expect(screen.queryByText("Project 02")).not.toBeInTheDocument();

    await userEvent.type(input, "Project 10");
    expect(screen.getByText("projects_not_found")).toBeInTheDocument();
  });

  it("Should delete a project after confirmation", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
    getAllProjectsMock.mockResolvedValue(mockProjects(1));
    renderWithProviders(<ListProjects />);

    await waitFor(
      async () => await userEvent.click(screen.getByTestId("delete-project-01")),
    );

    expect(deleteProjectMock).toHaveBeenCalledWith("01");

    await waitFor(async () =>
      expect(screen.getByText("projects_not_found")).toBeInTheDocument(),
    );
  });

  it("Should deactivate project status", async () => {
    getAllProjectsMock.mockResolvedValue(mockProject(true));
    renderWithProviders(<ListProjects />);

    await waitFor(() => {
      expect(screen.getByTestId("project-row")).toBeInTheDocument();
    });

    const projectRow = screen.getByTestId("project-row");
    expect(
      within(projectRow).getByTestId("active-project-status"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("toggle-project-status-01"));

    expect(toggleProjectActiveMock).toHaveBeenCalledWith("01");
    expect(
      within(projectRow).getByTestId("inactive-project-status"),
    ).toBeInTheDocument();
  });

  it("Should activate project status", async () => {
    getAllProjectsMock.mockResolvedValue(mockProject(false));
    renderWithProviders(<ListProjects />);

    await waitFor(() => {
      expect(screen.getByTestId("project-row")).toBeInTheDocument();
    });

    const projectRow = screen.getByTestId("project-row");
    expect(
      within(projectRow).getByTestId("inactive-project-status"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("toggle-project-status-01"));

    expect(toggleProjectActiveMock).toHaveBeenCalledWith("01");
    expect(
      within(projectRow).getByTestId("active-project-status"),
    ).toBeInTheDocument();
  });

  it("Should cancel the deletion of a project", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: false });
    getAllProjectsMock.mockResolvedValue(mockProjects(1));
    renderWithProviders(<ListProjects />);

    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("delete-project-01"));
      expect(deleteProjectMock).not.toHaveBeenCalled();
      expect(screen.getByText("Project 01")).toBeInTheDocument();
    });
  });

  it("Should open the project's create modal", async () => {
    getAllProjectsMock.mockResolvedValue([]);
    renderWithProviders(<ListProjects />);

    await userEvent.click(screen.getByTestId("create-project"));
    expect(await screen.findByText("project_details")).toBeInTheDocument();
  });
});
