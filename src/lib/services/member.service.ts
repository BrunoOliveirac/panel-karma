import { api } from "../client/axios";
import { getLoggedUser } from "../helpers/get-logged-user";
import { Member } from "../models/member";
import { Pagination } from "../interfaces/pagination";

/** Payload for creating a new member, including the owning user and initial projects. */
interface CreateMemberParams {
  name: string;
  email: string;
  userId: string;
  password: string;
  projectIds: string[];
}

/** Result of checking whether an email can be used when creating or linking a member. */
type EmailStatus = "available" | "to-link" | "in-use" | "already-linked";

/** Service layer for member CRUD, linking, and project assignment operations. */
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
   * Get members linked to the current user with optional search and pagination.
   * @param query Search term applied to member name or email.
   * @param page Page number (1-based).
   * @returns A paginated list of linked members.
   */
  public getAllLinkedMembers = async (
    query: string,
    page: number,
  ): Promise<Pagination<Member>> => {
    const user = getLoggedUser();

    const members = (
      await api.get<Pagination<Member>>(`/members/list/${user.id}`, {
        params: { query, page },
      })
    ).data;

    return members;
  };

  /**
   * Create a member user and link it to the current user.
   * @param createMemberParams Member data excluding the owning user id.
   * @returns The id of the created member.
   */
  public createMember = async (
    createMemberParams: Omit<CreateMemberParams, "userId">,
  ): Promise<string> => {
    const user = getLoggedUser();

    const createMember: CreateMemberParams = {
      ...createMemberParams,
      userId: user.id,
    };

    const response = await api.post<string>("/members/create", createMember);
    return response.data;
  };

  /**
   * Check whether an email can be used to create or link a member.
   * @param email The email to validate.
   * @returns Whether the email is available, can be linked, is already in use, or already linked.
   */
  public checkEmail = async (email: string): Promise<EmailStatus> => {
    const user = getLoggedUser();

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
  public getLinkedProjectIds = async (memberId: string): Promise<string[]> => {
    const response = await api.get<string[]>(`/members/projects/${memberId}`);
    return response.data;
  };

  /**
   * Sync project assignments for a member based on the current and initial selection.
   * @param memberId The ID of the member user.
   * @param projectIds The IDs of the currently selected projects.
   * @param initialProjectIds The IDs of the projects selected when the modal opened.
   */
  public managementProjectMembers = async (
    memberId: string,
    projectIds: string[],
    initialProjectIds: string[],
  ): Promise<void> => {
    await api.post(`/members/management-projects/${memberId}`, {
      projectIds,
      initialProjectIds,
    });
  };

  /**
   * Link an existing member account to the current user.
   * @param email The email of the member user to link.
   */
  public linkMember = async (email: string): Promise<void> => {
    const user = getLoggedUser();
    await api.post(`/members/link`, { email, userId: user.id });
  };

  /**
   * Unlink a member from the current user without deleting the member account.
   * @param memberId The ID of the member user to unlink.
   */
  public unlinkMember = async (memberId: string): Promise<void> => {
    const user = getLoggedUser();
    await api.delete(`/members/unlink`, {
      data: { memberId, userId: user.id },
    });
  };
}
