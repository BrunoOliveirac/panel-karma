/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { _Translator, useFormatter } from "next-intl";
import ListMembers from "./list-members";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Swal from "sweetalert2";

const unlinkMemberMock = jest.fn();
const getAllMembersMock = jest.fn();
const getMemberProjectIdsMock = jest.fn();
const updateMemberProjectsMock = jest.fn();
const getAllProjectsMock = jest.fn();
const getAllActiveProjectsMock = jest.fn();

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

jest.mock("@/lib/services/member.service", () => {
  return {
    MemberService: jest.fn().mockImplementation(() => ({
      getAllMembers: getAllMembersMock,
      unlinkMember: (...args: string[]) => unlinkMemberMock(...args),
      getMemberProjectIds: (...args: string[]) =>
        getMemberProjectIdsMock(...args),
      updateMemberProjects: (...args: unknown[]) =>
        updateMemberProjectsMock(...args),
    })),
  };
});

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

jest.mock("@/lib/services/project.service", () => {
  return {
    ProjectService: jest.fn().mockImplementation(() => ({
      getAllProjects: getAllProjectsMock,
      getAllActiveProjects: (...args: unknown[]) =>
        getAllActiveProjectsMock(...args),
    })),
  };
});

jest.mocked(useFormatter).mockReturnValue({
  dateTime: jest.fn().mockReturnValue("01/01/2024 10:30"),
} as any);

const mockMembers = (count = 15) => {
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

describe("ListMembers", () => {
  beforeEach(() => {
    getAllActiveProjectsMock.mockResolvedValue([]);
  });

  it("Should show an empty list", async () => {
    getAllMembersMock.mockResolvedValue([]);
    renderWithProviders(<ListMembers />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("members_not_found")).toBeInTheDocument();
    });
  });

  it("Should load the members", async () => {
    getAllMembersMock.mockResolvedValue(mockMembers());
    renderWithProviders(<ListMembers />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Member 01")).toBeInTheDocument();
      expect(screen.getByText("Member 10")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
    });
  });

  it("Should navigate between pages", async () => {
    getAllMembersMock.mockResolvedValue(mockMembers(30));
    renderWithProviders(<ListMembers />);

    await waitFor(() => {
      expect(screen.getByTestId("pagination-link-1")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-2")).toBeInTheDocument();
      expect(screen.getByTestId("pagination-link-3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("pagination-link-2"));
    expect(screen.getByText("Member 11")).toBeInTheDocument();
    expect(screen.getByText("Member 20")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("pagination-link-3"));
    expect(screen.getByText("Member 21")).toBeInTheDocument();
    expect(screen.getByText("Member 30")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("pagination-link-1"));
    expect(screen.getByText("Member 01")).toBeInTheDocument();
    expect(screen.getByText("Member 10")).toBeInTheDocument();
  });

  it("Filter the members by name", async () => {
    getAllMembersMock.mockResolvedValue(mockMembers(5));
    renderWithProviders(<ListMembers />);
    const input = screen.getByPlaceholderText(/search/i);

    await userEvent.type(input, "Member 01");
    expect(screen.getByText("Member 01")).toBeInTheDocument();
    expect(screen.queryByText("Member 02")).not.toBeInTheDocument();

    await userEvent.type(input, "Member 10");
    expect(screen.getByText("members_not_found")).toBeInTheDocument();
  });

  it("Filter the members by e-mail", async () => {
    getAllMembersMock.mockResolvedValue(mockMembers(3));
    renderWithProviders(<ListMembers />);
    const input = screen.getByPlaceholderText(/search/i);

    await waitFor(() => {
      expect(screen.getByText("member02@email.com")).toBeInTheDocument();
    });

    await userEvent.type(input, "member02@email.com");
    expect(screen.getByText("Member 02")).toBeInTheDocument();
    expect(screen.queryByText("Member 01")).not.toBeInTheDocument();
  });

  it("Should unlink a member after confirmation", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: true });
    getAllMembersMock.mockResolvedValue(mockMembers(1));
    renderWithProviders(<ListMembers />);

    await waitFor(
      async () => await userEvent.click(screen.getByTestId("unlink-member-01")),
    );

    expect(unlinkMemberMock).toHaveBeenCalledWith("01");

    await waitFor(async () =>
      expect(screen.getByText("members_not_found")).toBeInTheDocument(),
    );
  });

  it("Should cancel the unlink of a member", async () => {
    (Swal.fire as jest.Mock).mockResolvedValue({ isConfirmed: false });
    getAllMembersMock.mockResolvedValue(mockMembers(1));
    renderWithProviders(<ListMembers />);

    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("unlink-member-01"));
      expect(unlinkMemberMock).not.toHaveBeenCalled();
      expect(screen.getByText("Member 01")).toBeInTheDocument();
    });
  });

  it("Should open the member's create modal", async () => {
    getAllMembersMock.mockResolvedValue([]);
    renderWithProviders(<ListMembers />);

    await userEvent.click(screen.getByTestId("create-member"));
    expect(await screen.findByText("member_details")).toBeInTheDocument();
  });

  it("Should open the manage projects modal", async () => {
    getAllMembersMock.mockResolvedValue(mockMembers(1));
    getAllProjectsMock.mockResolvedValue([
      {
        id: "p1",
        name: "Project 1",
        active: true,
        userId: "u1",
        createdAt: new Date(),
        client: { id: "c1", name: "Client 1" },
      },
    ]);
    getMemberProjectIdsMock.mockResolvedValue(["p1"]);
    renderWithProviders(<ListMembers />);

    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("manage-projects-member-01"));
    });

    expect(await screen.findByTestId("update-projects-modal")).toBeInTheDocument();
  });
});
