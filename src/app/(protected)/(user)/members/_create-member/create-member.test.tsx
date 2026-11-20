import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import CreateMember from "./create-member";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

const createMemberMock = jest.fn();
const linkMemberMock = jest.fn();
const checkEmailMock = jest.fn();
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
        field.onChange(event.target.value ? event.target.value.split(",") : [])
      }
    />
  ),
}));

jest.mock("@/lib/services/member.service", () => {
  return {
    MemberService: jest.fn().mockImplementation(() => ({
      createMember: (...args: unknown[]) => createMemberMock(...args),
      linkMember: (...args: unknown[]) => linkMemberMock(...args),
      checkEmail: (...args: unknown[]) => checkEmailMock(...args),
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

const validPassword = "Password1!";

const mockMember = {
  name: "New Member",
  email: "newmember@email.com",
};

const renderCreateMember = async () => {
  renderWithProviders(
    <CreateMember
      closeModal={closeModalMock}
      dismissModal={dismissModalMock}
    />,
  );

  await screen.findByTestId("create-member-name");
};

const fillCreateMemberForm = async () => {
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
};

describe("CreateMember", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createMemberMock.mockReset();
    linkMemberMock.mockReset();
    checkEmailMock.mockReset();
    getAllActiveProjectsMock.mockReset();
    checkEmailMock.mockResolvedValue("available");
    getAllActiveProjectsMock.mockResolvedValue([]);
  });

  it("Should not submit with an empty name", async () => {
    await renderCreateMember();
    await userEvent.click(screen.getByTestId("create-member-save"));

    await waitFor(() => {
      expect(createMemberMock).not.toHaveBeenCalled();
      expect(screen.getAllByText("validation.required").length).toBeGreaterThan(
        0,
      );
    });
  });

  it("Should not submit with an empty e-mail", async () => {
    await renderCreateMember();

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
    createMemberMock.mockResolvedValue("03");
    await renderCreateMember();
    await fillCreateMemberForm();
    await userEvent.click(screen.getByTestId("create-member-save"));

    await waitFor(() => {
      expect(createMemberMock).toHaveBeenCalledWith({
        name: mockMember.name,
        email: mockMember.email,
        password: validPassword,
        projectIds: [],
      });
      expect(toast.success).toHaveBeenCalledWith("member_created");
      expect(dismissModalMock).toHaveBeenCalledWith(true);
    });
  });

  it("Should show error when create fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    createMemberMock.mockRejectedValue(new Error("Failed"));
    await renderCreateMember();
    await fillCreateMemberForm();
    await userEvent.click(screen.getByTestId("create-member-save"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("could_not_create");
    });

    consoleSpy.mockRestore();
  });

  it("Should show error when e-mail is already in use", async () => {
    await renderCreateMember();
    checkEmailMock.mockResolvedValue("in-use");

    const emailInput = screen.getByTestId("create-member-email");
    await userEvent.type(emailInput, mockMember.email);
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("email_in_use");
    });
  });

  it("Should show error when member is already linked", async () => {
    await renderCreateMember();
    checkEmailMock.mockResolvedValue("already-linked");

    const emailInput = screen.getByTestId("create-member-email");
    await userEvent.type(emailInput, mockMember.email);
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("already_linked");
    });
  });

  it("Should link an existing member after confirmation", async () => {
    await renderCreateMember();
    checkEmailMock.mockResolvedValue("to-link");
    linkMemberMock.mockResolvedValue(undefined);

    const emailInput = screen.getByTestId("create-member-email");
    await userEvent.type(emailInput, mockMember.email);
    fireEvent.blur(emailInput);

    expect(
      await screen.findByTestId("create-member-link-confirm"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("create-member-link-confirm-btn"));

    await waitFor(() => {
      expect(linkMemberMock).toHaveBeenCalledWith(mockMember.email);
      expect(toast.success).toHaveBeenCalledWith("member_linked");
      expect(dismissModalMock).toHaveBeenCalledWith(true);
    });
  });

  it("Should cancel linking an existing member", async () => {
    await renderCreateMember();
    checkEmailMock.mockResolvedValue("to-link");

    const emailInput = screen.getByTestId("create-member-email");
    await userEvent.type(emailInput, mockMember.email);
    fireEvent.blur(emailInput);

    expect(
      await screen.findByTestId("create-member-link-confirm"),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("create-member-link-cancel"));

    await waitFor(() => {
      expect(linkMemberMock).not.toHaveBeenCalled();
      expect(
        screen.queryByTestId("create-member-link-confirm"),
      ).not.toBeInTheDocument();
    });
  });

  it("Should cancel the create modal", async () => {
    await renderCreateMember();
    await userEvent.click(screen.getByTestId("create-member-cancel"));

    expect(closeModalMock).toHaveBeenCalled();
  });
});
