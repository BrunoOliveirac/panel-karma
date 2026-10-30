import { apiMock } from "@/lib/mocks/api.mock";
import { mockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { Project } from "@/lib/models/project";
import { exportToExcel } from "./base-xlsx.service";
import { ProjectsXlsxService } from "./projects-xlsx.service";

jest.mock("@/lib/client/axios", () => ({
  api: apiMock,
}));

jest.mock("./base-xlsx.service", () => ({
  exportToExcel: jest.fn(),
}));

const t = (key: string) => key;

function project(overrides: Partial<Project> = {}): Project {
  return {
    id: "01",
    active: true,
    createdAt: "2024-06-15T15:04:00.000Z",
    name: "Project 01",
    userId: "01",
    client: { name: "Client 01" } as Project["client"],
    ...overrides,
  };
}

function expectedRow(item: Project, locale: string) {
  return {
    name: item.name,
    client: item.client.name,
    status: item.active ? "active" : "inactive",
    created_at: new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(item.createdAt)),
  };
}

describe("ProjectsXlsxService", () => {
  const service = new ProjectsXlsxService();
  const locale = "en";

  it("exports every project of the logged user", async () => {
    const projects = [
      project(),
      project({ id: "02", active: false, name: "Project 02" }),
    ];
    apiMock.get.mockResolvedValue({ data: projects });

    await service.exportAll({ locale, t });

    expect(apiMock.get).toHaveBeenCalledWith(
      `/projects/list/${mockLoggedUser.id}`,
    );
    expect(exportToExcel).toHaveBeenCalledWith(
      projects.map((item) => expectedRow(item, locale)),
      "projects",
    );
  });

  it("exports the projects already loaded on the current page", () => {
    const projects = [project({ active: false })];

    service.exportCurrentPage({ locale, t, data: projects });

    expect(apiMock.get).not.toHaveBeenCalled();
    expect(apiMock.post).not.toHaveBeenCalled();
    expect(exportToExcel).toHaveBeenCalledWith(
      [expectedRow(projects[0], locale)],
      "projects",
    );
  });

  it("exports the projects selected by id", async () => {
    const projects = [project({ id: "09", name: "Project 09" })];
    apiMock.post.mockResolvedValue({ data: projects });

    await service.exportSelected({ locale, t, projectIds: ["09"] });

    expect(apiMock.post).toHaveBeenCalledWith("/projects/list-by-ids", {
      ids: ["09"],
    });
    expect(exportToExcel).toHaveBeenCalledWith(
      [expectedRow(projects[0], locale)],
      "projects",
    );
  });
});
