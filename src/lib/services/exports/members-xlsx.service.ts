import { api } from "@/lib/client/axios";
import { getLoggedUser } from "@/lib/helpers/get-logged-user";
import {
  ExportCurrentPageParams,
  ExportSelectedParams,
  IExportParams,
} from "@/lib/interfaces/xlsx";
import { Member } from "@/lib/models/member";
import { exportToExcel } from "./base-xlsx.service";

export class MembersXlsxService {
  /**
   * Export every member linked to the logged user.
   * @param exportParams - locale and translation function
   */
  public async exportAll({ locale, t }: IExportParams): Promise<void> {
    const user = getLoggedUser();
    const members = (await api.get<Member[]>(`/members/list-all/${user.id}`))
      .data;

    this.export({ locale, t, data: members });
  }

  /**
   * Export the members already loaded on the current page.
   * @param exportParams - locale, translation function and members
   */
  public exportCurrentPage(exportParams: ExportCurrentPageParams<Member>) {
    this.export(exportParams);
  }

  /**
   * Export the members selected by id.
   * @param exportParams - locale, translation function and member ids
   */
  public async exportSelected({
    t,
    locale,
    dataIds,
  }: ExportSelectedParams): Promise<void> {
    const user = getLoggedUser();
    const members = (
      await api.post<Member[]>(`/members/list-by-ids/${user.id}`, {
        ids: dataIds,
      })
    ).data;

    this.export({
      locale,
      t,
      data: members.sort((a, b) => a.name.localeCompare(b.name)),
    });
  }

  /**
   * Build the spreadsheet rows and download the file.
   * @param param.data - Members to export
   * @param param.locale - Locale used to format dates
   * @param param.t - Translation function used for the column names
   */
  private export({
    t,
    locale,
    data: members,
  }: ExportCurrentPageParams<Member>) {
    const data = members.map((member) => ({
      [t("name")]: member.name,
      [t("email")]: member.email,
      [t("created_at")]: Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(member.createdAt)),
    }));

    exportToExcel(data, "members");
  }
}
