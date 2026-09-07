import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import { useAuth } from "@/lib/hooks/use-auth";
import { render, screen } from "@testing-library/react";
import ProtectedLayout from "./layout";

const acknowledgeSessionExpired = jest.fn();
let pathname = "/clients";

jest.mock("next/navigation", () => ({
  usePathname: () => pathname,
}));

jest.mock("@/lib/hooks/use-inactivity-logout", () => ({
  useInactivityLogout: jest.fn(),
}));

jest.mock("@/components/layout/sidebar", () => ({
  __esModule: true,
  default: () => <div data-slot="sidebar" />,
}));

jest.mock("@/components/layout/topbar", () => ({
  __esModule: true,
  default: () => <div data-slot="topbar" />,
}));

jest.mock("@/components/global/session-expired-dialog", () => ({
  __esModule: true,
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <button type="button" data-slot="session-expired" onClick={onClose}>
        expired
      </button>
    ) : null,
}));

const user = {
  id: "01",
  name: "Test User",
  email: "user@email.com",
  type: UserTypeEnum.USER,
};

describe("ProtectedLayout", () => {
  it("shows a loading state while auth is pending", () => {
    jest.mocked(useAuth).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      isSuccess: false,
      sessionExpired: false,
      acknowledgeSessionExpired,
      refetch: jest.fn(),
    } as ReturnType<typeof useAuth>);

    render(
      <ProtectedLayout>
        <p>secret</p>
      </ProtectedLayout>,
    );

    expect(screen.getByAltText("logo")).toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("shows the session expired dialog", () => {
    jest.mocked(useAuth).mockReturnValue({
      data: { locale: "en", user },
      isLoading: false,
      isError: false,
      isSuccess: true,
      sessionExpired: true,
      acknowledgeSessionExpired,
      refetch: jest.fn(),
    } as ReturnType<typeof useAuth>);

    render(
      <ProtectedLayout>
        <p>secret</p>
      </ProtectedLayout>,
    );

    expect(screen.getByTestId("session-expired")).toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });

  it("renders the shell when the user can access the route", () => {
    pathname = "/clients";
    jest.mocked(useAuth).mockReturnValue({
      data: { locale: "en", user },
      isLoading: false,
      isError: false,
      isSuccess: true,
      sessionExpired: false,
      acknowledgeSessionExpired,
      refetch: jest.fn(),
    } as ReturnType<typeof useAuth>);

    render(
      <ProtectedLayout>
        <p>secret</p>
      </ProtectedLayout>,
    );

    expect(screen.getByTestId("sidebar")).toBeInTheDocument();
    expect(screen.getByTestId("topbar")).toBeInTheDocument();
    expect(screen.getByText("secret")).toBeInTheDocument();
  });

  it("keeps showing the loader when the route is not allowed", () => {
    pathname = "/dashboard";
    jest.mocked(useAuth).mockReturnValue({
      data: { locale: "en", user },
      isLoading: false,
      isError: false,
      isSuccess: true,
      sessionExpired: false,
      acknowledgeSessionExpired,
      refetch: jest.fn(),
    } as ReturnType<typeof useAuth>);

    render(
      <ProtectedLayout>
        <p>secret</p>
      </ProtectedLayout>,
    );

    expect(screen.getByAltText("logo")).toBeInTheDocument();
    expect(screen.queryByText("secret")).not.toBeInTheDocument();
  });
});
