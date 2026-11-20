import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import PaginationControls from "./pagination-controls";

jest.mock("use-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

describe("PaginationControls", () => {
  it("renders every page when there are seven or fewer", () => {
    render(
      <PaginationControls page={2} totalPages={5} onPageChange={jest.fn()} />,
    );

    expect(screen.getByTestId("pagination-link-1")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-link-5")).toBeInTheDocument();
    expect(screen.queryByTestId("pagination-ellipsis")).not.toBeInTheDocument();
  });

  it("inserts ellipsis for a large page range", () => {
    render(
      <PaginationControls page={5} totalPages={20} onPageChange={jest.fn()} />,
    );

    expect(screen.getByTestId("pagination-link-1")).toBeInTheDocument();
    expect(screen.getByTestId("pagination-link-20")).toBeInTheDocument();
    expect(screen.getAllByTestId("pagination-ellipsis").length).toBeGreaterThan(
      0,
    );
  });

  it("notifies the parent when a page is clicked", async () => {
    const onPageChange = jest.fn();
    render(
      <PaginationControls page={1} totalPages={4} onPageChange={onPageChange} />,
    );

    await userEvent.click(screen.getByTestId("pagination-link-3"));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});
