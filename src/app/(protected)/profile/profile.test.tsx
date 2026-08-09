import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import {
  mockLoggedUser,
  setMockLoggedUser,
} from "@/lib/mocks/logged-user.mock";
import { useTitle } from "@/lib/store/use-title-store";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import Profile from "./profile";

const updateProfileMock = jest.fn();

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

jest.mock("next/image", () => ({
  __esModule: true,
  default: ({
    alt,
    src,
    width,
    height,
    className,
  }: {
    alt: string;
    src: string;
    width?: number;
    height?: number;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} src={src} width={width} height={height} className={className} />
  ),
}));

jest.mock("@/lib/services/profile.service", () => {
  return {
    ProfileService: jest.fn().mockImplementation(() => ({
      updateProfile: (...args: unknown[]) => updateProfileMock(...args),
    })),
  };
});

jest.mock("@/components/global/image-crop-dialog", () => ({
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

const validPassword = "Password1!";
const croppedAvatar = "data:image/jpeg;base64,cropped";

const renderProfile = async () => {
  renderWithProviders(<Profile />);
  await screen.findByTestId("profile-name");
};

const uploadAvatar = async (file: File) => {
  const input = screen.getByTestId("profile-avatar-input");
  await userEvent.upload(input, file);
};

describe("Profile", () => {
  beforeAll(() => {
    Object.defineProperty(URL, "createObjectURL", {
      writable: true,
      value: jest.fn(() => "blob:mock-avatar"),
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      writable: true,
      value: jest.fn(),
    });
  });

  beforeEach(() => {
    jest.clearAllMocks();
    updateProfileMock.mockReset();
    mockLoggedUser.avatar = null;
    setMockLoggedUser({ ...mockLoggedUser });
    useTitle.getState().setTitle("Karma");
  });

  it("Should set the page title and hydrate the form with the logged user", async () => {
    await renderProfile();

    expect(useTitle.getState().title).toBe("profile");
    expect(screen.getByTestId("profile-name")).toHaveValue(mockLoggedUser.name);
    expect(screen.getByTestId("profile-email")).toHaveValue(
      mockLoggedUser.email,
    );
    expect(screen.queryByTestId("profile-avatar-remove")).not.toBeInTheDocument();
  });

  it("Should not submit with an empty name", async () => {
    await renderProfile();

    await userEvent.clear(screen.getByTestId("profile-name"));
    await userEvent.click(screen.getByTestId("profile-save"));

    await waitFor(() => {
      expect(updateProfileMock).not.toHaveBeenCalled();
      expect(screen.getAllByText("validation.required").length).toBeGreaterThan(
        0,
      );
    });
  });

  it("Should update the profile successfully without password", async () => {
    const updatedUser = {
      ...mockLoggedUser,
      name: "Updated Name",
      email: "updated@email.com",
    };
    updateProfileMock.mockResolvedValue(updatedUser);

    await renderProfile();

    await userEvent.clear(screen.getByTestId("profile-name"));
    await userEvent.type(screen.getByTestId("profile-name"), updatedUser.name);
    await userEvent.clear(screen.getByTestId("profile-email"));
    await userEvent.type(
      screen.getByTestId("profile-email"),
      "  Updated@Email.com  ",
    );

    await userEvent.click(screen.getByTestId("profile-save"));

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: "",
      });
      expect(toast.success).toHaveBeenCalledWith("profile_updated");
      expect(screen.getByTestId("profile-name")).toHaveValue(updatedUser.name);
      expect(screen.getByTestId("profile-email")).toHaveValue(
        updatedUser.email,
      );
    });
  });

  it("Should include password when provided", async () => {
    updateProfileMock.mockResolvedValue(mockLoggedUser);

    await renderProfile();

    await userEvent.type(
      screen.getByTestId("profile-password"),
      validPassword,
    );
    await userEvent.type(
      screen.getByTestId("profile-confirm-password"),
      validPassword,
    );
    await userEvent.click(screen.getByTestId("profile-save"));

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        name: mockLoggedUser.name,
        email: mockLoggedUser.email,
        avatar: "",
        password: validPassword,
      });
      expect(toast.success).toHaveBeenCalledWith("profile_updated");
    });
  });

  it("Should show error when update fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    updateProfileMock.mockRejectedValue(new Error("Failed"));
    await renderProfile();
    await userEvent.click(screen.getByTestId("profile-save"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("could_not_update");
    });

    consoleSpy.mockRestore();
  });

  it("Should reject non-image files when selecting an avatar", async () => {
    await renderProfile();

    // Bypass the input `accept` filter so the handler's MIME check is exercised.
    fireEvent.change(screen.getByTestId("profile-avatar-input"), {
      target: {
        files: [
          new File(["not-an-image"], "notes.txt", { type: "text/plain" }),
        ],
      },
    });

    expect(toast.error).toHaveBeenCalledWith("invalid_image");
    expect(screen.queryByTestId("profile-crop-dialog")).not.toBeInTheDocument();
  });

  it("Should open the crop dialog for a valid image and cancel it", async () => {
    await renderProfile();

    await uploadAvatar(
      new File(["avatar"], "avatar.png", { type: "image/png" }),
    );

    expect(URL.createObjectURL).toHaveBeenCalled();
    expect(await screen.findByTestId("profile-crop-dialog")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("profile-crop-cancel"));

    await waitFor(() => {
      expect(screen.queryByTestId("profile-crop-dialog")).not.toBeInTheDocument();
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-avatar");
    });
  });

  it("Should update the avatar after confirming the crop", async () => {
    const updatedUser = {
      ...mockLoggedUser,
      avatar: croppedAvatar,
    };
    updateProfileMock.mockResolvedValue(updatedUser);

    await renderProfile();
    await uploadAvatar(
      new File(["avatar"], "avatar.png", { type: "image/png" }),
    );

    await userEvent.click(await screen.findByTestId("profile-crop-save"));

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        name: mockLoggedUser.name,
        email: mockLoggedUser.email,
        avatar: croppedAvatar,
      });
      expect(toast.success).toHaveBeenCalledWith("avatar_updated");
      expect(screen.queryByTestId("profile-crop-dialog")).not.toBeInTheDocument();
      expect(screen.getByTestId("profile-avatar-remove")).toBeInTheDocument();
    });
  });

  it("Should show error when avatar crop update fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    updateProfileMock.mockRejectedValue(new Error("Failed"));
    await renderProfile();
    await uploadAvatar(
      new File(["avatar"], "avatar.png", { type: "image/png" }),
    );

    await userEvent.click(await screen.findByTestId("profile-crop-save"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("could_not_update_avatar");
      expect(screen.getByTestId("profile-crop-dialog")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it("Should remove the avatar successfully", async () => {
    // useAuth reads the exported mockLoggedUser object reference.
    mockLoggedUser.avatar = "https://cdn.example.com/avatar.jpg";
    setMockLoggedUser({ ...mockLoggedUser });
    updateProfileMock.mockResolvedValue({
      ...mockLoggedUser,
      avatar: null,
    });

    await renderProfile();

    expect(screen.getByTestId("profile-avatar-remove")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("profile-avatar-remove"));

    await waitFor(() => {
      expect(updateProfileMock).toHaveBeenCalledWith({
        name: mockLoggedUser.name,
        email: mockLoggedUser.email,
        avatar: "",
      });
      expect(toast.success).toHaveBeenCalledWith("avatar_removed");
      expect(screen.queryByTestId("profile-avatar-remove")).not.toBeInTheDocument();
    });
  });

  it("Should show error when avatar removal fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    mockLoggedUser.avatar = "https://cdn.example.com/avatar.jpg";
    setMockLoggedUser({ ...mockLoggedUser });
    updateProfileMock.mockRejectedValue(new Error("Failed"));

    await renderProfile();
    await userEvent.click(screen.getByTestId("profile-avatar-remove"));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("could_not_remove_avatar");
      expect(screen.getByTestId("profile-avatar-remove")).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it("Should open the file picker from the upload button", async () => {
    await renderProfile();

    const input = screen.getByTestId("profile-avatar-input");
    const clickSpy = jest.spyOn(input, "click");

    await userEvent.click(screen.getByTestId("profile-avatar-upload"));

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("Should open the file picker from the avatar trigger", async () => {
    await renderProfile();

    const input = screen.getByTestId("profile-avatar-input");
    const clickSpy = jest.spyOn(input, "click");

    fireEvent.click(screen.getByTestId("profile-avatar-trigger"));

    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});
