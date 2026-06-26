import { Support } from "../models/support";
import { api } from "../client/axios";

export class SupportService {
  /**
   * Get all support users.
   * @returns An array of supports.
   */
  public getAllSupports = async (): Promise<Support[]> => {
    const supports = (await api.get<Support[]>("/supports/list")).data;
    return supports;
  };

  /**
   * Create or update a support user.
   * @param support The support to create or update.
   * @returns The id of the created or updated support.
   */
  public upsertSupport = async (
    support: Partial<Support> & { password?: string },
  ): Promise<string> => {
    const response = await api.post<string>("/supports/upsert", support);
    return response.data;
  };

  /**
   * Check if an e-mail is available.
   * @param email The e-mail to check.
   * @param supportId Optional support ID to exclude when editing.
   * @returns True if the e-mail is available.
   */
  public checkEmail = async (
    email: string,
    supportId?: string,
  ): Promise<boolean> => {
    const response = await api.post<boolean>("/supports/check-email", {
      email,
      supportId,
    });

    return response.data;
  };

  /**
   * Toggle the active status of a support user.
   * @param supportId The ID of the support user.
   */
  public toggleStatus = async (supportId: string): Promise<void> => {
    await api.patch(`/supports/toggle-status/${supportId}`);
  };

  /**
   * Update a support user's password.
   * @param supportId The ID of the support user.
   * @param password The new password.
   */
  public updatePassword = async (
    supportId: string,
    password: string,
  ): Promise<void> => {
    await api.patch(`/supports/update-password/${supportId}`, { password });
  };

  /**
   * Soft delete a support user.
   * @param supportId The ID of the support user to delete.
   */
  public deleteSupport = async (supportId: string): Promise<void> => {
    await api.delete(`/supports/delete/${supportId}`);
  };
}
