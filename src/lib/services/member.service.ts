import Cookies from "js-cookie";
import { api } from "../client/axios";
import { Member } from "../models/member";
import { Pagination } from "../interfaces/pagination";

interface UpdateMemberParams {
  id: string;
  name: string;
  email: string;
}

interface CreateMemberParams extends Omit<UpdateMemberParams, "id"> {
  userId: string;
  password: string;
  projectIds: string[];
}

type EmailStatus = "available" | "to-link" | "in-use" | "already-linked";

export class MemberService {
  /**
   * Get all member users.
   * @returns An array of members.
   */
  public getAllMembers = async (): Promise<Member[]> => {
    const members = (await api.get<Member[]>("/members/list")).data;
    return members;
  };

  /**
   * Get all members linked to the current user.
   * @returns An array of members.
   */
  public getAllLinkedMembers = async (
    query: string,
    page: number,
  ): Promise<Pagination<Member>> => {
    const user = JSON.parse(Cookies.get("user")!);

    const members = (
      await api.get<Pagination<Member>>(`/members/list/${user.id}`, {
        params: { query, page },
      })
    ).data;

    return members;
  };

  /**
   * Create a member user.
   * @param createMember The member to create.
   * @returns The id of the created member.
   */
  public createMember = async (
    createMemberParams: Omit<CreateMemberParams, "userId">,
  ): Promise<string> => {
    const user = JSON.parse(Cookies.get("user")!);

    const createMember: CreateMemberParams = {
      ...createMemberParams,
      userId: user.id,
    };

    const response = await api.post<string>("/members/create", createMember);
    return response.data;
  };

  /**
   * Update a member user.
   * @param updateMemberParams The member to update.
   * @returns The id of the updated member.
   */
  public updateMember = async (
    updateMemberParams: UpdateMemberParams,
  ): Promise<string> => {
    const response = await api.patch<string>(
      `/members/update/${updateMemberParams.id}`,
      updateMemberParams,
    );

    return response.data;
  };

  /**
   * Check if an e-mail is available.
   * @param email The e-mail to check.
   * @param memberId Optional member ID to exclude when editing.
   * @returns The status of the e-mail.
   */
  public checkEmail = async (email: string): Promise<EmailStatus> => {
    const user = JSON.parse(Cookies.get("user")!);

    const response = await api.post<{ status: EmailStatus }>(
      "/members/check-email",
      {
        email,
        userId: user.id,
      },
    );

    return response.data.status;
  };

  /**
   * Update a member user's password.
   * @param memberId The ID of the member user.
   * @param password The new password.
   */
  public updatePassword = async (
    memberId: string,
    password: string,
  ): Promise<void> => {
    await api.patch(`/members/update-password/${memberId}`, { password });
  };

  /**
   * Get the project IDs linked to a member for the current user.
   * @param memberId The ID of the member user.
   */
  public getMemberProjectIds = async (memberId: string): Promise<string[]> => {
    const response = await api.get<string[]>(`/members/projects/${memberId}`);
    return response.data;
  };

  /**
   * Update the projects linked to a member for the current user.
   * @param memberId The ID of the member user.
   * @param projectIds The IDs of the selected projects.
   */
  public updateMemberProjects = async (
    memberId: string,
    projectIds: string[],
  ): Promise<void> => {
    await api.post("/members/update-projects", { memberId, projectIds });
  };

  /**
   * Link a member from the current user.
   * @param memberId The ID of the member user to link.
   */
  public linkMember = async (memberId: string): Promise<void> => {
    await api.post(`/members/link`, { memberId });
  };

  /**
   * Unlink a member from the current user.
   * @param email The email of the member user to unlink.
   */
  public unlinkMember = async (email: string): Promise<void> => {
    const user = JSON.parse(Cookies.get("user")!);
    await api.delete(`/members/unlink`, { data: { email, userId: user.id } });
  };
}
