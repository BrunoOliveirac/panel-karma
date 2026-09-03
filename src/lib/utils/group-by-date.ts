import { format, parseISO } from "date-fns";

interface Item {
  createdAt: string;
}

export interface GroupedByDate<T extends Item> {
  date: string;
  datas: T[];
}

export function groupByDate<T extends Item>(array: T[]): GroupedByDate<T>[] {
  const grouped = Object.groupBy(array, (item: T) => {
    const date = parseISO(item.createdAt);
    return format(date, "yyyy-MM-dd");
  });

  return Object.entries(grouped)
    .sort(([left], [right]) => right.localeCompare(left))
    .map(([date, datas]) => ({
      date,
      datas: [...(datas ?? [])].sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      ),
    }));
}
