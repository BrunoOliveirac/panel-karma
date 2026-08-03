/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProvidersAsync } from "@/lib/mocks/render-with-providers.mock";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { useFormatter } from "next-intl";
import ListMembers from "./list-members";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";

const unlinkMemberMock = jest.fn();
const getAllLinkedMembersMock = jest.fn();
const getLinkedProjectIdsMock = jest.fn();
const managementProjectMembersMock = jest.fn();
const getAllActiveProjectsMock = jest.fn();
const pushMock = jest.fn();
const searchParamsGetMock = jest.fn();

jest.mock("sweetalert2", () => ({
  __esModule: true,
  default: { fire: jest.fn() },
}));

jest.mock("use-intl", () => {
  const translate = (key: string) => key;
  return { useTranslations: () => translate };
});

jest.mock("next-intl", () => {
  const translate = (key: string) => key;
  return {
    useTranslations: () => translate,
    useFormatter: jest.fn(),
  };
});

jest.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => children,
  Tooltip: ({ children }: { children: React.ReactNode }) => children,
  TooltipTrigger: ({ children }: { children: React.ReactNode }) => children,
  TooltipContent: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock("@/components/ui/combobox", () => ({
  Combobox: ({
    field,
    inputDataSlot,
  }: {
    field: { value: string[]; onChange: (value: string[]) => void };
    inputDataSlot: string;
  }) => (
    <input
      data-slot={inputDataSlot}
      value={field.value?.join(",") ?? ""}
      onChange={(event) =>
        field.onChange(
          event.target.value ? event.target.value.split(",") : [],
        )
      }
    />
  ),
}));

jest.mock("sonner", () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: (...args: unknown[]) => pushMock(...args) }),
  useSearchParams: () => ({
    get: (...args: string[]) => searchParamsGetMock(...args),
    toString: () => "",
  }),
}));

jest.mock("@/lib/services/member.service", () => {
  return {
    MemberService: jest.fn().mockImplementation(() => ({
      getAllLinkedMembers: (...args: unknown[]) =>
        getAllLinkedMembersMock(...args),
      unlinkMember: (...args: string[]) => unlinkMemberMock(...args),
      getLinkedProjectIds: (...args: string[]) =>
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

jest.mocked(useFormatter).mockReturnValue({
  dateTime: jest.fn().mockReturnValue("01/01/2024 10:30"),
} as any);

const mockMembers = (count = 10) => {
  return new Array(count).fill(null).map((_, i) => {
    const padNumber = (i + 1).toString().padStart(2, "0");

    return {
      id: padNumber,
      active: i % 2 === 0,
      type: UserTypeEnum.MEMBER,
      createdAt: new Date(),
      name: `Member ${padNumber}`,
      email: `member${padNumber}@email.com`,
    };
  });
};

const mockMembersPage = (count = 10, totalPages = 1) => ({
  items: mockMembers(count),
  totalPages,
});

describe("ListMembers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    searchParamsGetMock.mockReturnValue(null);
    getAllActiveProjectsMock.mockResolvedValue([]);
    getLinkedProjectIdsMock.mockResolvedValue([]);
  });

  it("Should show an empty list", async () => {
    getAllLinkedMembersMock.mockResolvedValue(mockMembersPage(0, 0));
    await renderWithProvidersAsync(<ListMembers />);

    expect(await screen.findByText("members_not_found")).toBeInTheDocument();
  });

  it("Should load the members", async () => {
    getAllLinkedMembersMock.mockResolvedValue(mockMembersPage(10, 2));
    await renderWithProvidersAsync(<ListMembers />);

    expect(await screen.findByText("Member 01")).toBeInTheDocument();
    expect(screen.getByText("Member 10")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
    expect(getAllLinkedMembersMock).toHaveBeenCalledWith("", 1);
  });

  it("Should navigate between pages", async () => {
    getAllLinkedMembersMock.mockResolvedValue(mockMembersPage(10, 3));
    await renderWithProvidersAsync(<ListMembers />);

    expect(await screen.findByTestId("pagination-link-1")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-link-3")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("pagination-link-2"));
    expect(pushMock).toHaveBeenCalledWith("/members?page=2");

    fireEvent.click(screen.getByTestId("pagination-link-3"));
    expect(pushMock).toHaveBeenCalledWith("/members?page=3");
  });

  it("Should load members for the current page from the URL", async () => {
    searchParamsGetMock.mockImplementation((key: string) =>
      key === "page" ? "2" : null,
    );
    getAllLinkedMembersMock.mockResolvedValue(mockMembersPage(5, 3));
    await renderWithProvidersAsync(<ListMembers />);

    expect(await screen.findByText("Member 01")).toBeInTheDocument();
    expect(getAllLinkedMembersMock).toHaveBeenCalledWith("", 2);
  });

  it("Should update the URL when filtering members", async () => {
    getAllLinkedMembersMock.mockResolvedValue(mockMembersPage(5, 1));
    await renderWithProvidersAsync(<ListMembers />);

    expect(await screen.findByText("Member 01")).toBeInTheDocument();

    await userEvent.type(screen.getByPlaceholderText(/search/i), "Member 01");

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/members?query=Member+01&page=1");
    });
  });

  it("Should fetch members using the query from the URL", async () => {
    searchParamsGetMock.mockImplementation((key: string) =>
      key === "query" ? "member02" : null,
    );
    getAllLinkedMembersMock.mockResolvedValue({
      items: [mockMembers(2)[1]],
      totalPages: 1,
    });
    await renderWithProvidersAsync(<ListMembers />);

    expect(await screen.findByText("Member 02")).toBeInTheDocument();
    expect(getAllLinkedMembersMock).toHaveBeenCalledWith("member02", 1);
    expect(screen.queryByText("Member 01")).not.toBeInTheDocument();
  });

  it("Should unlink a member after confirmation", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
    getAllLinkedMembersMock
      .mockResolvedValueOnce(mockMembersPage(1, 1))
      .mockResolvedValueOnce(mockMembersPage(0, 0));
    await renderWithProvidersAsync(<ListMembers />);

    await userEvent.click(await screen.findByTestId("unlink-member-01"));

    expect(unlinkMemberMock).toHaveBeenCalledWith("01");
    expect(await screen.findByText("members_not_found")).toBeInTheDocument();
  });

  it("Should cancel the unlink of a member", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: false });
    getAllLinkedMembersMock.mockResolvedValue(mockMembersPage(1, 1));
    await renderWithProvidersAsync(<ListMembers />);

    await userEvent.click(await screen.findByTestId("unlink-member-01"));

    expect(unlinkMemberMock).not.toHaveBeenCalled();
    expect(screen.getByText("Member 01")).toBeInTheDocument();
  });

  it("Should open the member's create modal", async () => {
    getAllLinkedMembersMock.mockResolvedValue(mockMembersPage(0, 0));
    getAllActiveProjectsMock.mockResolvedValue([]);
    await renderWithProvidersAsync(<ListMembers />);

    await userEvent.click(screen.getByTestId("create-member"));
    expect(
      await screen.findByTestId("create-member-modal"),
    ).toBeInTheDocument();
  });

  it("Should open the manage projects modal", async () => {
    getAllLinkedMembersMock.mockResolvedValue(mockMembersPage(1, 1));

    getAllActiveProjectsMock.mockResolvedValue([
      {
        id: "p1",
        name: "Project 1",
        active: true,
        userId: "u1",
        createdAt: new Date(),
        client: { id: "c1", name: "Client 1" },
      },
    ]);

    getLinkedProjectIdsMock.mockResolvedValue(["p1"]);
    await renderWithProvidersAsync(<ListMembers />);

    await userEvent.click(
      await screen.findByTestId("manage-projects-member-01"),
    );

    expect(
      await screen.findByTestId("management-projects-modal"),
    ).toBeInTheDocument();
  });
});
