"use client";

import PaginationControls from "@/components/global/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Project } from "@/lib/models/project";
import { Client } from "@/lib/models/client";
import { useModal } from "@/lib/providers/modal-provider";
import { ClientService } from "@/lib/services/client.service";
import { ProjectService } from "@/lib/services/project.service";
import { useAppStore } from "@/lib/store/use-title-store";
import { Lock, Pencil, Search, Trash, Unlock } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import UpsertProject from "../_upsert-project/upsert-project";

export default function ListProjects() {
  const pageSize = 10;
  const router = useRouter();
  const format = useFormatter();
  const { openModal } = useModal();
  const isFirstLoad = useRef(true);
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const t = useTranslations("list_projects");
  const sharedT = useTranslations("shared");
  const [loading, setLoading] = useState(false);
  const setTitle = useAppStore((state) => state.setTitle);
  const [mainProjects, setMainProjects] = useState<Project[]>([]);
  const projectService = useMemo(() => new ProjectService(), []);
  const clientService = useMemo(() => new ClientService(), []);

  const clientFilterField = useMemo(
    () => ({
      name: "clientFilter",
      value: selectedClientId,
      onChange: (value: string | null) => setSelectedClientId(value ?? ""),
      onBlur: () => undefined,
      ref: () => undefined,
    }),
    [selectedClientId],
  );

  const filteredProjects = useMemo(() => {
    let filteredProjects = mainProjects;
    const term = search.trim().toLowerCase();

    if (selectedClientId) {
      filteredProjects = filteredProjects.filter(
        (project) => project.client?.id === selectedClientId,
      );
    }

    if (search) {
      filteredProjects = filteredProjects.filter((project) =>
        project.name.toLowerCase().includes(term),
      );
    }

    return filteredProjects;
  }, [mainProjects, search, selectedClientId]);

  const paginatedProjects = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProjects.slice(start, start + pageSize);
  }, [filteredProjects, page, pageSize]);

  /**
   * Open the upsert project modal.
   * @param project The project to edit.
   */
  const openUpsertProjectModal = useCallback(
    async (project?: Project): Promise<void> => {
      if (project && !isFirstLoad.current) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("project", project.id);
        router.push(`?${params.toString()}`);
      }

      const newProject = (await openModal(UpsertProject, {
        project,
      })) as unknown as Project;

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("project");
      router.push(`?${newParams.toString()}`);

      if (!newProject) return;

      if (project) {
        const index = mainProjects.findIndex((p) => p.id === project.id);
        if (index < 0) return;

        setMainProjects((projects) => {
          const newProjects = [...projects];
          newProjects[index] = newProject;
          return newProjects;
        });
      } else {
        setMainProjects(
          [newProject, ...mainProjects].sort((prev, next) =>
            prev.name.localeCompare(next.name),
          ),
        );
      }
    },
    [mainProjects, openModal, router, searchParams],
  );

  useEffect(() => {
    setPage(1);
  }, [search, selectedClientId]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setTitle(t("project_list"));
        const [projects, loadedClients] = await Promise.all([
          projectService.getAllProjects(),
          clientService.getAllClients(),
        ]);
        setMainProjects(projects);
        setClients(loadedClients);
        const project = searchParams.get("project");

        if (project) {
          const projectIndex = projects.findIndex((p) => p.id === project);
          openUpsertProjectModal(projects[projectIndex]);
        }

        isFirstLoad.current = false;
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (!isFirstLoad.current) return;
    loadData();
  }, [
    projectService,
    clientService,
    openUpsertProjectModal,
    searchParams,
    setTitle,
    t,
  ]);

  /**
   * Toggle the status of a project.
   * @param project The project to toggle.
   */
  const toogleProjectStatus = async (project: Project) => {
    try {
      await projectService.toggleProjectActive(project.id);

      setMainProjects((projects) => {
        const newProjects = [...projects];
        const index = newProjects.findIndex((p) => p.id === project.id);
        newProjects[index].active = !project.active;
        return newProjects;
      });

      toast.success(
        t(`successfully_${project.active ? "activated" : "deactivated"}`),
      );
    } catch (error) {
      console.error(error);
      toast.error(
        t(`could_not_${!project.active ? "activate" : "deactivate"}`),
      );
    }
  };

  /**
   * Delete a project.
   * @param projectId The ID of the project to delete.
   */
  const deleteProject = async (projectId: string) => {
    try {
      const response = await Swal.fire({
        theme: "auto",
        icon: "warning",
        showCancelButton: true,
        cancelButtonColor: "#d33",
        text: sharedT("you_wont_be"),
        confirmButtonColor: "#3085d6",
        title: sharedT("are_you_sure"),
        cancelButtonText: sharedT("cancel"),
        confirmButtonText: sharedT("confirm"),
      });

      if (!response?.isConfirmed) return;

      await projectService.deleteProject(projectId);
      toast.success(t("project_deleted"));

      if (paginatedProjects.length === 1) setPage(page - 1);

      setMainProjects((projects) => projects.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_delete"));
    }
  };

  const projectStatus = (isActive: boolean) => {
    return isActive ? "active" : "inactive";
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden gap-6 pb-6">
      <div className="shrink-0 max-h-fit grid sm:flex flex-1 justify-between items-center flex-wrap gap-4">
        <p className="text-lg font-medium">{t("manage_projects")}</p>

        <div className="flex flex-1 justify-end items-center gap-4 flex-wrap">
          <InputGroup className="md:min-w-44 max-w-fit">
            <InputGroupInput
              placeholder={t("search")}
              dataSlot="list-projects-search"
              onChange={(e) => setSearch(e.target.value)}
            />

            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>

          <Select
            bindValue="id"
            items={clients}
            bindLabel="name"
            field={clientFilterField}
            placeholder={t("all_clients")}
            classTrigger="md:min-w-44 max-w-fit"
            triggerDataSlot="list-projects-client-filter"
          />

          <button
            data-slot="create-project"
            onClick={() => openUpsertProjectModal()}
            className="min-w-24 bg-linear-to-br! from-primary to-(--info) text-xs! sm:text-sm! text-white h-8 px-3 rounded-full transition-all place-content-center hover:brightness-90"
          >
            {t("create_project")}
          </button>
        </div>
      </div>

      <>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{sharedT("name")}</TableHead>

                <TableHead>{t("client")}</TableHead>

                <TableHead className="text-center">
                  {sharedT("created_at")}
                </TableHead>

                <TableHead className="text-center">
                  {sharedT("status")}
                </TableHead>

                <TableHead className="text-center">
                  {sharedT("actions")}
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5}>
                    <div className="flex justify-center">
                      <Spinner />
                    </div>
                  </TableCell>
                </TableRow>
              ) : !paginatedProjects.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {t("projects_not_found")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedProjects.map((project) => (
                  <TableRow
                    id={project.id}
                    key={project.id}
                    data-slot="project-row"
                  >
                    <TableCell>{project.name}</TableCell>
                    <TableCell>{project.client?.name}</TableCell>

                    <TableCell className="text-center">
                      {format.dateTime(new Date(project.createdAt), {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant={project.active ? "success" : "danger"}
                        data-slot={`${projectStatus(project.active)}-project-status`}
                      >
                        {sharedT(projectStatus(project.active))}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-center items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => toogleProjectStatus(project)}
                              data-slot={`toggle-project-status-${project.id}`}
                            >
                              {project.active ? <Lock /> : <Unlock />}
                            </Button>
                          </TooltipTrigger>

                          <TooltipContent>
                            <p>
                              {sharedT(
                                project.active ? "deactivate" : "activate",
                              )}
                            </p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              data-slot={`edit-project-${project.id}`}
                              onClick={() => openUpsertProjectModal(project)}
                            >
                              <Pencil />
                            </Button>
                          </TooltipTrigger>

                          <TooltipContent>
                            <p>{sharedT("edit")}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              color="error"
                              size="icon-sm"
                              variant="destructive"
                              onClick={() => deleteProject(project.id)}
                              data-slot={`delete-project-${project.id}`}
                            >
                              <Trash />
                            </Button>
                          </TooltipTrigger>

                          <TooltipContent>
                            <p>{sharedT("delete")}</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {filteredProjects.length ? (
          <div className="shrink-0">
            <PaginationControls
              page={page}
              onPageChange={setPage}
              totalPages={Math.ceil(filteredProjects.length / pageSize)}
            />
          </div>
        ) : null}
      </>
    </div>
  );
}
