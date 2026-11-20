import { mockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { apiMock } from "@/lib/mocks/api.mock";
import { Project } from "@/lib/models/project";
import { ProjectService } from "./project.service";

jest.mock("@/lib/client/axios", () => ({
  api: require("@/lib/mocks/api.mock").apiMock,
}));

describe("ProjectService", () => {
  const service = new ProjectService();

  it("lists projects for the logged user", async () => {
    apiMock.get.mockResolvedValue({ data: [{ id: "p1" }] });
    await expect(service.getAllProjects()).resolves.toEqual([{ id: "p1" }]);
    expect(apiMock.get).toHaveBeenCalledWith(
      `/projects/list/${mockLoggedUser.id}`,
    );
  });

  it("lists active projects for the logged user", async () => {
    apiMock.get.mockResolvedValue({ data: [{ id: "p1" }] });
    await expect(service.getAllActiveProjects()).resolves.toEqual([{ id: "p1" }]);
    expect(apiMock.get).toHaveBeenCalledWith(
      `/projects/list-actives/${mockLoggedUser.id}`,
    );
  });

  it("upserts a project with the logged user id", async () => {
    apiMock.post.mockResolvedValue({ data: "p1" });
    const project = { id: "p1", name: "Project" } as Project;

    await expect(service.upsertProject(project)).resolves.toBe("p1");
    expect(apiMock.post).toHaveBeenCalledWith("/projects/upsert", {
      ...project,
      userId: mockLoggedUser.id,
    });
  });

  it("toggles a project active flag", async () => {
    apiMock.patch.mockResolvedValue({});
    await service.toggleProjectActive("p1");
    expect(apiMock.patch).toHaveBeenCalledWith("/projects/toggle-active/p1");
  });

  it("deletes a project", async () => {
    apiMock.delete.mockResolvedValue({});
    await service.deleteProject("p1");
    expect(apiMock.delete).toHaveBeenCalledWith("/projects/delete/p1");
  });
});
