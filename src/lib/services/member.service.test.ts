import { mockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { apiMock } from "@/lib/mocks/api.mock";
import { MemberService } from "./member.service";

jest.mock("@/lib/client/axios", () => ({
  api: require("@/lib/mocks/api.mock").apiMock,
}));

describe("MemberService", () => {
  const service = new MemberService();

  it("lists all members", async () => {
    apiMock.get.mockResolvedValue({ data: [{ id: "m1" }] });
    await expect(service.getAllMembers()).resolves.toEqual([{ id: "m1" }]);
    expect(apiMock.get).toHaveBeenCalledWith("/members/list");
  });

  it("lists linked members with search and pagination", async () => {
    apiMock.get.mockResolvedValue({ data: { data: [], total: 0 } });

    await service.getAllLinkedMembers("jane", 2);

    expect(apiMock.get).toHaveBeenCalledWith(
      `/members/list/${mockLoggedUser.id}`,
      { params: { query: "jane", page: 2 } },
    );
  });

  it("creates a member linked to the logged user", async () => {
    apiMock.post.mockResolvedValue({ data: "m1" });

    await expect(
      service.createMember({
        name: "Jane",
        email: "jane@email.com",
        password: "Password1!",
        projectIds: ["p1"],
      }),
    ).resolves.toBe("m1");

    expect(apiMock.post).toHaveBeenCalledWith("/members/create", {
      name: "Jane",
      email: "jane@email.com",
      password: "Password1!",
      projectIds: ["p1"],
      userId: mockLoggedUser.id,
    });
  });

  it("returns the email check status", async () => {
    apiMock.post.mockResolvedValue({ data: { status: "available" } });

    await expect(service.checkEmail("jane@email.com")).resolves.toBe(
      "available",
    );
    expect(apiMock.post).toHaveBeenCalledWith("/members/check-email", {
      email: "jane@email.com",
      userId: mockLoggedUser.id,
    });
  });

  it("updates a member password", async () => {
    apiMock.patch.mockResolvedValue({});
    await service.updatePassword("m1", "Password1!");
    expect(apiMock.patch).toHaveBeenCalledWith("/members/update-password/m1", {
      password: "Password1!",
    });
  });

  it("loads linked project ids", async () => {
    apiMock.get.mockResolvedValue({ data: ["p1", "p2"] });
    await expect(service.getLinkedProjectIds("m1")).resolves.toEqual([
      "p1",
      "p2",
    ]);
    expect(apiMock.get).toHaveBeenCalledWith("/members/projects/m1");
  });

  it("syncs member project assignments", async () => {
    apiMock.post.mockResolvedValue({});
    await service.managementProjectMembers("m1", ["p1"], ["p2"]);
    expect(apiMock.post).toHaveBeenCalledWith(
      "/members/management-projects/m1",
      { projectIds: ["p1"], initialProjectIds: ["p2"] },
    );
  });

  it("links a member to the logged user", async () => {
    apiMock.post.mockResolvedValue({});
    await service.linkMember("jane@email.com");
    expect(apiMock.post).toHaveBeenCalledWith("/members/link", {
      email: "jane@email.com",
      userId: mockLoggedUser.id,
    });
  });

  it("unlinks a member from the logged user", async () => {
    apiMock.delete.mockResolvedValue({});
    await service.unlinkMember("m1");
    expect(apiMock.delete).toHaveBeenCalledWith("/members/unlink", {
      data: { memberId: "m1", userId: mockLoggedUser.id },
    });
  });
});
