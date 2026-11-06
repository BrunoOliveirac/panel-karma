import { api } from "@/lib/client/axios";
import { getLoggedUser } from "@/lib/helpers/get-logged-user";
import { formatTicketCode } from "@/lib/helpers/merge-ticket";
import { UserTypeEnum } from "@/lib/enums/user-type.enum";
import {
  ExportCurrentPageParams,
  ExportSelectedParams,
  IExportParams,
} from "@/lib/interfaces/xlsx";
import { Ticket } from "@/lib/models/ticket";
import { exportToExcel } from "./base-xlsx.service";

export class TicketsXlsxService {
  /**
   * Export every ticket visible to the logged user.
   * @param exportParams - locale and translation function
   */
  public async exportAll({ locale, t }: IExportParams): Promise<void> {
    const tickets = (
      await api.get<Ticket[]>("/tickets/list-all", {
        params: scopeParams(),
      })
    ).data;

    this.export({ locale, t, data: tickets });
  }

  /**
   * Export the tickets already loaded on the current page.
   * @param exportParams - locale, translation function and tickets
   */
  public exportCurrentPage(exportParams: ExportCurrentPageParams<Ticket>) {
    this.export(exportParams);
  }

  /**
   * Export the tickets selected by id.
   * @param exportParams - locale, translation function and ticket ids
   */
  public async exportSelected({
    t,
    locale,
    dataIds,
  }: ExportSelectedParams): Promise<void> {
    const tickets = (
      await api.post<Ticket[]>(
        "/tickets/list-by-ids",
        { ids: dataIds },
        { params: scopeParams() },
      )
    ).data;

    this.export({ locale, t, data: tickets });
  }

  /**
   * Build the spreadsheet rows and download the file.
   * @param param.data - Tickets to export
   * @param param.locale - Locale used to format dates
   * @param param.t - Translation function used for the column names
   */
  private export({
    t,
    locale,
    data: tickets,
  }: ExportCurrentPageParams<Ticket>) {
    const data = [...tickets]
      .sort((a, b) => {
        const byCode =
          (b.code ?? Number.NEGATIVE_INFINITY) -
          (a.code ?? Number.NEGATIVE_INFINITY);

        if (byCode !== 0) return byCode;
        return a.title.localeCompare(b.title);
      })
      .map((ticket) => ({
        [t("code")]:
          ticket.code == null ? "-" : `#${formatTicketCode(ticket.code)}`,
        [t("title")]: ticket.title,
        [t("description")]: ticket.description,
        [t("user")]: ticket.userName || "-",
        [t("status")]: t(ticket.status.toLowerCase()),
        [t("assignee")]: ticket.supportName || "-",
        [t("created_at")]: formatDate(ticket.createdAt, locale),
        [t("assignee_date")]: formatDate(ticket.acceptedAt, locale),
        [t("completion_date")]: formatDate(ticket.finishedAt, locale),
      }));

    exportToExcel(data, "tickets");
  }
}

function scopeParams() {
  const user = getLoggedUser();
  if (user.type === UserTypeEnum.SUPPORT) return { supportId: user.id };
  return { userId: user.id };
}

function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return "-";

  return Intl.DateTimeFormat(locale, {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}
