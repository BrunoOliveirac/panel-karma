import { api } from "@/lib/client/axios";
import { getLoggedUser } from "@/lib/helpers/get-logged-user";
import { Sector } from "@/lib/models/sector";
import { exportToExcel } from "./base-xlsx.service";
import {
  ExportCurrentPageParams,
  ExportSelectedParams,
  IExportParams,
} from "@/lib/interfaces/xlsx";

export class SectorsXlsxService {
  /**
   * Export all sectors to an Excel file
   * @param exportParams - locale and translation function
   */
  public async exportAll({ locale, t }: IExportParams): Promise<void> {
    const user = getLoggedUser();
    const sectors = (await api.get<Sector[]>(`/sectors/list/${user.id}`)).data;
    this.export({ locale, t, data: sectors });
  }

  /**
   * Export the current page of sectors to an Excel file
   * @param exportParams - locale, translation function and sectors
   */
  public exportCurrentPage(exportParams: ExportCurrentPageParams<Sector>) {
    this.export(exportParams);
  }

  /**
   * Export the selected sectors to an Excel file
   * @param exportParams - The parameters for the export
   */
  public async exportSelected({
    t,
    locale,
    dataIds,
  }: ExportSelectedParams): Promise<void> {
    const sectors = (
      await api.post<Sector[]>("/sectors/list-by-ids", { ids: dataIds })
    ).data;

    this.export({ locale, t, data: sectors.sort((a, b) => a.name.localeCompare(b.name)) });
  }

  /**
   * Export the sectors to an Excel file
   * @param param.sectors - The sectors to export
   * @param param.locale - The locale to use for the date formatting
   * @param param.t - The translation function to use for the column names
   */
  private export({
    t,
    locale,
    data: sectors,
  }: ExportCurrentPageParams<Sector>) {
    const data = sectors.map((sector) => ({
      [t("name")]: sector.name,
      [t("status")]: t(`${sector.active ? "active" : "inactive"}`),
      [t("created_at")]: Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(sector.createdAt)),
    }));

    exportToExcel(data, "sectors");
  }
}
