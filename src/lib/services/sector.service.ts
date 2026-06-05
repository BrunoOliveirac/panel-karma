import Cookies from "js-cookie";
import { Sector } from "../models/sector";
import { api } from "../client/axios";

export class SectorService {
  /**
   * Get all sectors for the current user.
   * @returns An array of sectors.
   */
  public getAllSectors = async (): Promise<Sector[]> => {
    const user = JSON.parse(Cookies.get("user")!);
    const sectors = (await api.get<Sector[]>(`/sectors/list/${user.id}`)).data;
    return sectors;
  };

  /**
   * Get all active sectors for the current user.
   * @returns An array of active sectors.
   */
  public getAllActiveSectors = async (): Promise<Sector[]> => {
    const user = JSON.parse(Cookies.get("user")!);

    const sectors = (
      await api.get<Sector[]>(`/sectors/list-actives/${user.id}`)
    ).data;

    return sectors;
  };

  /**
   * Create or update a sector.
   * @param sector The sector to create or update.
   * @returns The id of the created or updated sector.
   */
  public upsertSector = async (sector: Sector): Promise<string> => {
    const user = JSON.parse(Cookies.get("user")!);
    sector.userId = user.id;
    const response = await api.post<string>(`/sectors/upsert`, sector);
    return response.data;
  };

  /**
   * Delete a sector.
   * @param sectorId The ID of the sector to delete.
   */
  public deleteSector = async (sectorId: string): Promise<void> => {
    await api.delete(`/sectors/delete/${sectorId}`);
  };
}
