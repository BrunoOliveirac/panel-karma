"use client";

import PaginationControls from "@/components/global/pagination-controls/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Client } from "@/lib/models/client";
import { Project } from "@/lib/models/project";
import { useModal } from "@/lib/providers/modal-provider";
import { ClientService } from "@/lib/services/client.service";
import { ProjectService } from "@/lib/services/project.service";
import { useTitle } from "@/lib/store/use-title-store";
import { Lock, Pencil, Search, Trash, Unlock } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import UpsertProject from "../_upsert-project/upsert-project";
import ExportMenu from "@/components/global/export-menu/export-menu";

/**
 * Drop selected ids that are no longer in the visible project list.
 * @param current Currently selected project ids.
 * @param projects Projects that remain visible.
 */
function retainVisibleSelection(current: Set<string>, projects: Project[]) {
  if (!current.size) return current;

  const visibleIds = new Set(projects.map((project) => project.id));
  let changed = false;
  const next = new Set<string>();

  for (const id of current) {
    if (visibleIds.has(id)) next.add(id);
    else changed = true;
  }

  return changed ? next : current;
}

export default function ListProjects() {
  const pageSize = 10;
  const router = useRouter();
  const format = useFormatter();
  const { openModal } = useModal();
  const isFirstLoad = useRef(true);
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const sharedT = useTranslations("shared");
  const t = useTranslations("list_projects");
  const [loading, setLoading] = useState(false);
  const setTitle = useTitle((state) => state.setTitle);
  const [clients, setClients] = useState<Client[]>([]);
  const [mainProjects, setMainProjects] = useState<Project[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const clientService = useMemo(() => new ClientService(), []);
  const projectService = useMemo(() => new ProjectService(), []);

  const clientFilterField = useMemo(
    () => ({
      name: "clientFilter",
      value: selectedClientId,
      onChange: (value: string | null) => {
        setSelectedClientId(value ?? "");
        setPage(1);
      },
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

  const pageSelection = useMemo(() => {
    let selectedCount = 0;

    for (const project of paginatedProjects) {
      if (selectedIds.has(project.id)) selectedCount += 1;
    }

    return {
      allPageSelected:
        paginatedProjects.length > 0 &&
        selectedCount === paginatedProjects.length,
      somePageSelected:
        selectedCount > 0 && selectedCount < paginatedProjects.length,
    };
  }, [paginatedProjects, selectedIds]);

  const selectedProjectIds = useMemo(() => [...selectedIds], [selectedIds]);
  const visibleProjectIds = filteredProjects
    .map((project) => project.id)
    .join("\0");
  const [trackedVisibleProjectIds, setTrackedVisibleProjectIds] =
    useState(visibleProjectIds);

  if (visibleProjectIds !== trackedVisibleProjectIds) {
    setTrackedVisibleProjectIds(visibleProjectIds);
    setSelectedIds((current) =>
      retainVisibleSelection(current, filteredProjects),
    );
  }

  /**
   * Select or clear every project on the current page.
   * @param checked Whether the page should be selected.
   */
  const togglePage = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      for (const project of paginatedProjects) {
        if (checked) next.add(project.id);
        else next.delete(project.id);
      }

      return next;
    });
  };

  /**
   * Select or clear a single project.
   * @param projectId The project id.
   * @param checked Whether the project should be selected.
   */
  const toggleRow = (projectId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (checked) next.add(projectId);
      else next.delete(projectId);

      return next;
    });
  };

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
    const active = !project.active;

    try {
      await projectService.toggleProjectActive(project.id);

      setMainProjects((projects) => {
        const newProjects = [...projects];
        const index = newProjects.findIndex((p) => p.id === project.id);
        newProjects[index] = { ...newProjects[index], active };
        return newProjects;
      });

      toast.success(t(`successfully_${active ? "activated" : "deactivated"}`));
    } catch (error) {
      console.error(error);
      toast.error(t(`could_not_${active ? "activate" : "deactivate"}`));
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

      setSelectedIds((current) => {
        if (!current.has(projectId)) return current;

        const next = new Set(current);
        next.delete(projectId);
        return next;
      });
      setMainProjects((projects) => projects.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_delete"));
    }
  };

  /**
   * Get the status of a project.
   * @param isActive - The status of the project.
   * @returns The status of the project.
   */
  const projectStatus = (isActive: boolean) => {
    return isActive ? "active" : "inactive";
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden gap-6 pb-6">
      <div className="shrink-0 max-h-fit grid sm:flex justify-between items-center flex-wrap gap-4">
        <p className="text-lg font-medium">{t("manage_projects")}</p>

        <div className="flex flex-1 justify-end items-center gap-4 flex-wrap">
          <InputGroup className="md:min-w-44 max-w-fit">
            <InputGroupInput
              placeholder={t("search")}
              dataSlot="list-projects-search"
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
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

          <div className="flex items-center gap-4">
            <ExportMenu
              paginatedData={paginatedProjects}
              selectedIds={selectedProjectIds}
              type="projects"
            />

            <button
              data-slot="create-project"
              onClick={() => openUpsertProjectModal()}
              className="min-w-24 bg-linear-to-br! from-primary to-(--info) text-xs! sm:text-sm! text-white h-9 px-3 rounded transition-all place-content-center hover:brightness-75"
            >
              {t("create_project")}
            </button>
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <div className="flex justify-center">
                  <Checkbox
                    aria-label={sharedT("select_page")}
                    data-slot="select-page"
                    disabled={!paginatedProjects.length}
                    checked={
                      pageSelection.somePageSelected
                        ? "indeterminate"
                        : pageSelection.allPageSelected
                    }
                    onCheckedChange={(checked) => togglePage(checked === true)}
                  />
                </div>
              </TableHead>

              <TableHead>{sharedT("name")}</TableHead>
              <TableHead>{t("client")}</TableHead>

              <TableHead className="text-center">
                {sharedT("created_at")}
              </TableHead>

              <TableHead className="text-center">{sharedT("status")}</TableHead>

              <TableHead className="text-center">
                {sharedT("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6}>
                  <div className="flex justify-center">
                    <Spinner />
                  </div>
                </TableCell>
              </TableRow>
            ) : !paginatedProjects.length ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
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
                  <TableCell>
                    <div className="flex justify-center">
                      <Checkbox
                        checked={selectedIds.has(project.id)}
                        aria-label={sharedT("select_name", {
                          name: project.name,
                        })}
                        data-slot={`select-project-${project.id}`}
                        onCheckedChange={(checked) =>
                          toggleRow(project.id, checked === true)
                        }
                      />
                    </div>
                  </TableCell>

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
    </div>
  );
}
