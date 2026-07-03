/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { _Translator, useFormatter } from "next-intl";
import ListMembers from "../_list-members/list-members";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const createMemberMock = jest.fn();
const updateMemberProjectsMock = jest.fn();
const checkEmailMock = jest.fn();
const getAllMembersMock = jest.fn();
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

jest.mock("@/lib/services/member.service", () => {
  return {
    MemberService: jest.fn().mockImplementation(() => ({
      createMember: (...args: unknown[]) => createMemberMock(...args),
      updateMemberProjects: (...args: unknown[]) =>
        updateMemberProjectsMock(...args),
      checkEmail: (...args: unknown[]) => checkEmailMock(...args),
      getAllMembers: getAllMembersMock,
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

const validPassword = "Password1!";

const mockMember = {
  name: "New Member",
  email: "newmember@email.com",
  active: true,
};

const waitForCreateMemberForm = async () => {
  await waitFor(() => {
    expect(screen.getByTestId("create-member-name")).toBeInTheDocument();
  });
};

const openCreateMemberModal = async () => {
  getAllMembersMock.mockResolvedValue([]);
  getAllActiveProjectsMock.mockResolvedValue([]);
  checkEmailMock.mockResolvedValue(true);
  renderWithProviders(<ListMembers />);

  await waitFor(async () => {
    await userEvent.click(screen.getByTestId("create-member"));
  });

  await waitForCreateMemberForm();
};

const handleCreateMember = async () => {
  createMemberMock.mockResolvedValue("03");
  checkEmailMock.mockResolvedValue(true);
  getAllMembersMock.mockResolvedValue([]);
  getAllActiveProjectsMock.mockResolvedValue([]);

  renderWithProviders(<ListMembers />);

  await waitFor(async () => {
    await userEvent.click(screen.getByTestId("create-member"));
  });

  await waitForCreateMemberForm();

  const nameInput = screen.getByTestId("create-member-name");
  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, mockMember.name);

  const emailInput = screen.getByTestId("create-member-email");
  await userEvent.clear(emailInput);
  await userEvent.type(emailInput, mockMember.email);

  await userEvent.type(
    screen.getByTestId("create-member-password"),
    validPassword,
  );

  await userEvent.type(
    screen.getByTestId("create-member-confirm-password"),
    validPassword,
  );

  await userEvent.click(screen.getByTestId("create-member-save"));

  await waitFor(() => {
    expect(createMemberMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: mockMember.name,
        email: mockMember.email,
        active: mockMember.active,
      }),
    );
  });
};

describe("CreateMember", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    checkEmailMock.mockResolvedValue(true);
    getAllActiveProjectsMock.mockResolvedValue([]);
  });

  it("Should not submit with an empty name", async () => {
    await openCreateMemberModal();
    await userEvent.click(screen.getByTestId("create-member-save"));

    await waitFor(() => {
      expect(createMemberMock).not.toHaveBeenCalled();
      expect(screen.getAllByText("validation.required").length).toBeGreaterThan(
        0,
      );
    });
  });

  it("Should not submit with an empty e-mail", async () => {
    await openCreateMemberModal();

    await userEvent.type(
      screen.getByTestId("create-member-name"),
      mockMember.name,
    );

    await userEvent.click(screen.getByTestId("create-member-save"));

    await waitFor(() => {
      expect(createMemberMock).not.toHaveBeenCalled();
      expect(screen.getAllByText("validation.required").length).toBeGreaterThan(
        0,
      );
    });
  });

  it("Should create a member successfully", async () => {
    await handleCreateMember();
    expect(toast.success).toHaveBeenCalledWith("member_created");
  });

  it("Should show error when create fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    createMemberMock.mockRejectedValue(new Error("Failed"));
    getAllMembersMock.mockResolvedValue([]);
    getAllActiveProjectsMock.mockResolvedValue([]);
    renderWithProviders(<ListMembers />);

    await waitFor(async () => {
      await userEvent.click(screen.getByTestId("create-member"));
    });

    await waitForCreateMemberForm();

    await userEvent.type(
      screen.getByTestId("create-member-name"),
      mockMember.name,
    );

    await userEvent.type(
      screen.getByTestId("create-member-email"),
      mockMember.email,
    );

    await userEvent.type(
      screen.getByTestId("create-member-password"),
      validPassword,
    );

    await userEvent.type(
      screen.getByTestId("create-member-confirm-password"),
      validPassword,
    );

    await userEvent.click(screen.getByTestId("create-member-save"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("could_not_create");
    });

    consoleSpy.mockRestore();
  });

  it("Should cancel the create modal", async () => {
    await openCreateMemberModal();
    await userEvent.click(screen.getByTestId("create-member-cancel"));

    await waitFor(() => {
      expect(
        screen.queryByTestId("create-member-modal"),
      ).not.toBeInTheDocument();
    });
  });
});
