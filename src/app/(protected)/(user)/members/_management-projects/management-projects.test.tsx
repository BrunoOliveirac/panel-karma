import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { Member } from "@/lib/models/member";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import ManagementProjects from "./management-projects";

const getLinkedProjectIdsMock = jest.fn();
const managementProjectMembersMock = jest.fn();
const getAllActiveProjectsMock = jest.fn();
const closeModalMock = jest.fn();
const dismissModalMock = jest.fn();

jest.mock("use-intl", () => {
  const translate = (key: string) => key;
  return { useTranslations: () => translate };
});

jest.mock("next-intl", () => {
  const translate = (key: string) => key;
  return { useTranslations: () => translate };
});

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("@/lib/services/member.service", () => {
  return {
    MemberService: jest.fn().mockImplementation(() => ({
      getLinkedProjectIds: (...args: unknown[]) =>
        getLinkedProjectIdsMock(...args),
      managementProjectMembers: (...args: unknown[]) =>
        managementProjectMembersMock(...args),
    })),
  };
});

jest.mock("@/lib/services/project.service", () => {
  return {
    ProjectService: jest.fn().mockImplementation(() => ({
      getAllActiveProjects: (...args: unknown[]) =>
        getAllActiveProjectsMock(...args),
    })),
  };
});

const createdAt = "2026-01-01T00:00:00.000Z";

const member: Member = {
  id: "01",
  active: true,
  type: UserTypeEnum.MEMBER,
  createdAt,
  name: "Member 01",
  email: "member01@email.com",
};

const mockProjects = [
  {
    id: "p1",
    name: "Project Alpha",
    active: true,
    userId: "u1",
    createdAt,
    client: {
      id: "c1",
      name: "Acme Corp",
      active: true,
      createdAt,
    },
  },
  {
    id: "p2",
    name: "Project Beta",
    active: true,
    userId: "u1",
    createdAt,
    client: {
      id: "c2",
      name: "Globex Inc",
      active: true,
      createdAt,
    },
  },
];

const renderManagementProjects = () =>
  renderWithProviders(
    <ManagementProjects
      member={member}
      closeModal={closeModalMock}
      dismissModal={dismissModalMock}
    />,
  );

describe("ManagementProjects", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getAllActiveProjectsMock.mockReset();
    getLinkedProjectIdsMock.mockReset();
    managementProjectMembersMock.mockReset();
    getAllActiveProjectsMock.mockResolvedValue(mockProjects);
    getLinkedProjectIdsMock.mockResolvedValue(["p1"]);
  });

  it("Should show a spinner while loading", () => {
    getAllActiveProjectsMock.mockReturnValue(new Promise(() => undefined));
    renderManagementProjects();
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("Should load projects and preselect linked ones", async () => {
    renderManagementProjects();

    expect(
      await screen.findByTestId("management-projects-modal"),
    ).toBeInTheDocument();
    expect(screen.getByText("Member 01")).toBeInTheDocument();
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
    expect(screen.getByTestId("management-projects-card-p1")).toHaveAttribute(
      "data-selected",
      "true",
    );
    expect(screen.getByTestId("management-projects-card-p2")).toHaveAttribute(
      "data-selected",
      "false",
    );
  });

  it("Should show empty state when there are no projects", async () => {
    getAllActiveProjectsMock.mockResolvedValue([]);
    getLinkedProjectIdsMock.mockResolvedValue([]);
    renderManagementProjects();

    expect(await screen.findByText("projects_not_found")).toBeInTheDocument();
  });

  it("Should filter projects by name and client", async () => {
    renderManagementProjects();
    await screen.findByTestId("management-projects-modal");

    fireEvent.change(screen.getByTestId("management-projects-filter"), {
      target: { value: "Beta" },
    });
    expect(screen.getByText("Project Beta")).toBeInTheDocument();
    expect(screen.queryByText("Project Alpha")).not.toBeInTheDocument();

    fireEvent.change(screen.getByTestId("management-projects-filter"), {
      target: { value: "Acme" },
    });
    expect(screen.getByText("Project Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Project Beta")).not.toBeInTheDocument();
  });

  it("Should toggle project selection", async () => {
    renderManagementProjects();
    await screen.findByTestId("management-projects-modal");

    fireEvent.click(screen.getByTestId("management-projects-card-p1"));
    expect(screen.getByTestId("management-projects-card-p1")).toHaveAttribute(
      "data-selected",
      "false",
    );

    fireEvent.click(screen.getByTestId("management-projects-card-p2"));
    expect(screen.getByTestId("management-projects-card-p2")).toHaveAttribute(
      "data-selected",
      "true",
    );
  });

  it("Should save the selected projects", async () => {
    managementProjectMembersMock.mockResolvedValue(undefined);
    renderManagementProjects();
    await screen.findByTestId("management-projects-modal");

    fireEvent.click(screen.getByTestId("management-projects-card-p2"));
    await userEvent.click(screen.getByTestId("management-projects-save"));

    await waitFor(() => {
      expect(managementProjectMembersMock).toHaveBeenCalledWith(
        "01",
        ["p1", "p2"],
        ["p1"],
      );
      expect(toast.success).toHaveBeenCalledWith("projects_updated");
      expect(dismissModalMock).toHaveBeenCalledWith(true);
    });
  });

  it("Should show error when save fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    managementProjectMembersMock.mockRejectedValue(new Error("Failed"));
    renderManagementProjects();
    await screen.findByTestId("management-projects-modal");

    await userEvent.click(screen.getByTestId("management-projects-save"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("could_not_update");
      expect(dismissModalMock).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it("Should show error when load fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    getAllActiveProjectsMock.mockRejectedValue(new Error("Failed"));
    renderManagementProjects();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("could_not_load");
    });

    consoleSpy.mockRestore();
  });

  it("Should cancel the modal", async () => {
    renderManagementProjects();
    await screen.findByTestId("management-projects-modal");

    await userEvent.click(screen.getByTestId("management-projects-cancel"));
    expect(closeModalMock).toHaveBeenCalled();
  });
});
