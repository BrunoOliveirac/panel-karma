import { Member } from "../models/member";
import { api } from "../client/axios";

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
   * Create a member user.
   * @param member The member to create.
   * @returns The id of the created member.
   */
  public createMember = async (
    member: Partial<Member> & { password?: string },
  ): Promise<string> => {
    const response = await api.post<string>("/members/upsert", member);
    return response.data;
  };

  /**
   * Check if an e-mail is available.
   * @param email The e-mail to check.
   * @param memberId Optional member ID to exclude when editing.
   * @returns True if the e-mail is available.
   */
  public checkEmail = async (
    email: string,
    memberId?: string,
  ): Promise<boolean> => {
    const response = await api.post<boolean>("/members/check-email", {
      email,
      memberId,
    });

    return response.data;
  };

  /**
   * Toggle the active status of a member user.
   * @param memberId The ID of the member user.
   */
  public toggleStatus = async (memberId: string): Promise<void> => {
    await api.patch(`/members/toggle-status/${memberId}`);
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
   * Unlink a member from the current user.
   * @param memberId The ID of the member user to unlink.
   */
  public unlinkMember = async (memberId: string): Promise<void> => {
    await api.delete(`/members/unlink/${memberId}`);
  };
}
