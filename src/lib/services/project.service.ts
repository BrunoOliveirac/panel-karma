import Cookies from "js-cookie";
import { Project } from "../models/project";
import { api } from "../client/axios";

export class ProjectService {
  /**
   * Get all projects for the current user.
   * @returns An array of projects.
   */
  public getAllProjects = async (): Promise<Project[]> => {
    const user = JSON.parse(Cookies.get("user")!);
    const projects = (await api.get<Project[]>(`/projects/list/${user.id}`))
      .data;
    return projects;
  };

  /**
   * Create or update a project.
   * @param project The project to create or update.
   * @returns The id of the created or updated project.
   */
  public upsertProject = async (project: Project): Promise<string> => {
    const user = JSON.parse(Cookies.get("user")!);
    project.userId = user.id;
    const response = await api.post<string>(`/projects/upsert`, project);
    return response.data;
  };

  /**
   * Toggle the active status of a project.
   * @param projectId The ID of the project to toggle.
   */
  public toggleProjectActive = async (projectId: string): Promise<void> => {
    await api.patch(`/projects/toggle-active/${projectId}`);
  };

  /**
   * Delete a project.
   * @param projectId The ID of the project to delete.
   */
  public deleteProject = async (projectId: string): Promise<void> => {
    await api.delete(`/projects/delete/${projectId}`);
  };
}
