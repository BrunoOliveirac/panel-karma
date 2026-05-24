import { api } from "../client/axios";
import Cookies from "js-cookie";
import { Client } from "../models/client";

export class ClientService {
  /**
   * Get all clients for the current user.
   * @returns An array of clients.
   */
  public getAllClients = async (): Promise<Client[]> => {
    const user = JSON.parse(Cookies.get("user")!);
    const clients = (await api.get<Client[]>(`/clients/list/${user.id}`)).data;
    return clients;
  };

  /**
   * Check if the email is already in use.
   * @param email The email to check.
   * @returns True if the email is valid, false otherwise.
   */
  public checkEmail = async (email: string): Promise<boolean> => {
    const user = JSON.parse(Cookies.get("user")!);

    const response = await api.post<boolean>(`/clients/check-email`, {
      email,
      userId: user.id,
    });

    return response.data;
  };

  /**
   * Create or update a client.
   * @param client The client to create or update.
   * @returns The id of the created or updated client.
   */
  public upsertClient = async (client: Client): Promise<string> => {
    const user = JSON.parse(Cookies.get("user")!);
    client.favorite = client.favorite ?? false;
    client.userId = user.id;
    const response = await api.post<string>(`/clients/upsert`, client);
    return response.data;
  };

  /**
   * Toggle the favorite status of a client.
   * @param clientId Client ID to toggle the favorite status.
   * @param favorite The new favorite status.
   */
  public toggleFavorite = async (
    clientId: string,
    favorite: boolean,
  ): Promise<void> => {
    await api.patch(`/clients/favorite/${clientId}`, favorite);
  };

  /**
   * Delete a client.
   * @param client Client to delete.
   */
  public deleteClient = async (client: Client): Promise<void> => {
    await api.delete(`/clients/delete/`, { data: client });
  };
}
