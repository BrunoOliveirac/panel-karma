import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PeriodPicker } from "./period-picker";
import { presetRange, toIsoDate } from "@/lib/utils/calendar-day";

jest.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
  useFormatter: () => ({
    dateTime: (value: Date, options?: Intl.DateTimeFormatOptions) => {
      if (options?.weekday === "narrow") {
        return ["S", "M", "T", "W", "T", "F", "S"][value.getDay()];
      }

      if (options?.month === "long") {
        return value.toLocaleString("en-US", {
          month: "long",
          year: "numeric",
        });
      }

      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, "0");
      const day = String(value.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    },
  }),
}));

describe("PeriodPicker", () => {
  it("shows the committed dates and applies a preset only after confirmation", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const today = toIsoDate(new Date());
    const range = presetRange("last_7_days", today);

    render(
      <PeriodPicker
        startDate="2026-09-16"
        endDate="2026-10-06"
        onChange={onChange}
      />,
    );

    expect(screen.getByTestId("period-picker-trigger")).toHaveTextContent(
      "2026-09-16",
    );
    expect(screen.getByTestId("period-picker-trigger")).toHaveTextContent(
      "2026-10-06",
    );

    await user.click(screen.getByTestId("period-picker-trigger"));
    await user.click(screen.getByTestId("period-preset-last_7_days"));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("period-range-label")).toHaveTextContent(
      range.startDate,
    );
    expect(screen.getByTestId("period-range-label")).toHaveTextContent(
      range.endDate,
    );

    await user.click(screen.getByTestId("period-apply"));

    expect(onChange).toHaveBeenCalledWith(range.startDate, range.endDate);
  });

  it("applies the days picked on the calendar, including a reversed click", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    const month = toIsoDate(new Date()).slice(0, 7);

    render(<PeriodPicker startDate="" endDate="" onChange={onChange} />);

    await user.click(screen.getByTestId("period-picker-trigger"));
    await user.click(screen.getByTestId(`period-day-left-${month}-16`));
    await user.click(screen.getByTestId(`period-day-left-${month}-10`));

    expect(screen.getByTestId("period-preset-custom")).toHaveAttribute(
      "aria-current",
      "true",
    );

    await user.click(screen.getByTestId("period-apply"));

    expect(onChange).toHaveBeenCalledWith(`${month}-10`, `${month}-16`);
  });

  it("clears the range when clear is confirmed", async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();

    render(
      <PeriodPicker
        startDate="2026-09-01"
        endDate="2026-09-15"
        onChange={onChange}
      />,
    );

    await user.click(screen.getByTestId("period-picker-trigger"));
    await user.click(screen.getByTestId("period-clear"));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("period-range-label")).toHaveTextContent("—");

    await user.click(screen.getByTestId("period-apply"));

    expect(onChange).toHaveBeenCalledWith("", "");
  });
});
