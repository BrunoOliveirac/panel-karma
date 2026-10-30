import { Project } from "@/lib/models/project";
import { exportToExcel } from "./base-xlsx.service";
import { api } from "@/lib/client/axios";
import { getLoggedUser } from "@/lib/helpers/get-logged-user";
import {
  ExportCurrentPageParams,
  ExportSelectedParams,
  IExportParams,
} from "@/lib/interfaces/xlsx";

export class ProjectsXlsxService {
  /**
   * Export all projects to an Excel file
   * @param exportParams - locale and translation function
   */
  public async exportAll({ locale, t }: IExportParams): Promise<void> {
    const user = getLoggedUser();

    const projects = (await api.get<Project[]>(`/projects/list/${user.id}`))
      .data;

    this.export({ locale, t, data: projects });
  }

  /**
   * Export the current page of projects to an Excel file
   * @param exportParams - locale, translation function and projects
   */
  public exportCurrentPage(exportParams: ExportCurrentPageParams<Project>) {
    this.export(exportParams);
  }

  /**
   * Export the selected projects to an Excel file
   * @param exportParams - The parameters for the export
   */
  public async exportSelected({
    t,
    locale,
    dataIds,
  }: ExportSelectedParams): Promise<void> {
    const projects = (
      await api.post<Project[]>("/projects/list-by-ids", { ids: dataIds })
    ).data;

    this.export({ locale, t, data: projects.sort((a, b) => a.name.localeCompare(b.name)) });
  }

  /**
   * Export the projects to an Excel file
   * @param param.projects - The projects to export
   * @param param.locale - The locale to use for the date formatting
   * @param param.t - The translation function to use for the column names
   */
  private export({
    t,
    locale,
    data: projects,
  }: ExportCurrentPageParams<Project>) {
    const data = projects.map((project) => ({
      [t("name")]: project.name,
      [t("client")]: project.client.name,
      [t("status")]: t(`${project.active ? "active" : "inactive"}`),
      [t("created_at")]: Intl.DateTimeFormat(locale, {
        dateStyle: "short",
        timeStyle: "short",
      }).format(new Date(project.createdAt)),
    }));

    exportToExcel(data, "projects");
  }
}
