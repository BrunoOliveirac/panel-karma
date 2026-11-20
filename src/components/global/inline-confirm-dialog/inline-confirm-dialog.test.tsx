import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InlineConfirmDialog } from "./inline-confirm-dialog";

describe("InlineConfirmDialog", () => {
  const props = {
    title: "Delete item",
    description: "This cannot be undone",
    cancelLabel: "Cancel",
    confirmLabel: "Delete",
    onConfirm: jest.fn(),
    onOpenChange: jest.fn(),
    dataSlot: "confirm-dialog",
    cancelDataSlot: "confirm-cancel",
    confirmDataSlot: "confirm-ok",
  };

  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("does not render when closed", () => {
    render(<InlineConfirmDialog {...props} open={false} />);
    expect(screen.queryByTestId("confirm-dialog")).not.toBeInTheDocument();
  });

  it("calls onConfirm from the confirm button", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<InlineConfirmDialog {...props} open />);

    await user.click(screen.getByTestId("confirm-ok"));
    expect(props.onConfirm).toHaveBeenCalled();
  });

  it("closes after the cancel animation", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<InlineConfirmDialog {...props} open />);

    await user.click(screen.getByTestId("confirm-cancel"));

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(props.onOpenChange).toHaveBeenCalledWith(false);
  });

  it("does not cancel while confirming", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<InlineConfirmDialog {...props} open confirming />);

    expect(screen.getByTestId("confirm-cancel")).toBeDisabled();
    await user.click(screen.getByTestId("confirm-cancel"));
    expect(props.onOpenChange).not.toHaveBeenCalled();
  });
});
