import { api } from "@/lib/client/axios";
import { getLoggedUser } from "@/lib/helpers/get-logged-user";
import {
  ExportCurrentPageParams,
  ExportSelectedParams,
  IExportParams,
} from "@/lib/interfaces/xlsx";
import { Client } from "@/lib/models/client";
import { FormatCurrency } from "@/lib/utils/set-currency";
import { exportToExcel } from "./base-xlsx.service";

export class ClientsXlsxService {
  /**
   * Export every client of the logged user.
   * When `data` is set, export that already loaded scope instead of refetching.
   * @param exportParams - locale, translation function and optional loaded clients
   */
  public async exportAll({
    locale,
    t,
    data,
  }: IExportParams & { data?: Client[] }): Promise<void> {
    const clients =
      data ??
      (await api.get<Client[]>(`/clients/list/${getLoggedUser().id}`)).data;
    this.export({ locale, t, data: clients });
  }

  /**
   * Export the clients already loaded on the current page.
   * @param exportParams - locale, translation function and clients
   */
  public exportCurrentPage(exportParams: ExportCurrentPageParams<Client>) {
    this.export(exportParams);
  }

  /**
   * Export the clients selected by id, sorted by name.
   * @param exportParams - locale, translation function and client ids
   */
  public async exportSelected({
    t,
    locale,
    dataIds,
  }: ExportSelectedParams): Promise<void> {
    const clients = (
      await api.post<Client[]>("/clients/list-by-ids", { ids: dataIds })
    ).data;

    this.export({
      locale,
      t,
      data: clients.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  /**
   * Build the spreadsheet rows and download the file.
   * @param param.data - Clients to export
   * @param param.locale - Locale used to format dates
   * @param param.t - Translation function used for the column names
   */
  private export({
    t,
    locale,
    data: clients,
  }: ExportCurrentPageParams<Client>) {
    const data = clients.map((client) => ({
      [t("name")]: client.name,
      [t("email")]: client.email,
      [t("phone")]: client.phone,
      [t("sector")]: client.sector?.name ?? "",
      [t("budget")]: FormatCurrency(client.budget),
      [t("favorite")]: t(client.favorite ? "yes" : "no"),
      [t("notes")]: client.notes ?? "",
      [t("created_at")]: Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(client.createdAt)),
    }));

    exportToExcel(data, "clients");
  }
}
