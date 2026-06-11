"use client";

import PaginationControls from "@/components/global/pagination-controls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sector } from "@/lib/models/sector";
import { useModal } from "@/lib/providers/modal-provider";
import { SectorService } from "@/lib/services/sector.service";
import { useAppStore } from "@/lib/store/use-title-store";
import { Lock, Pencil, Search, Trash, Unlock } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import UpsertSector from "../_upsert-sector/upsert-sector";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ListSectors() {
  const pageSize = 10;
  const router = useRouter();
  const format = useFormatter();
  const { openModal } = useModal();
  const isFirstLoad = useRef(true);
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const t = useTranslations("list_sectors");
  const sharedT = useTranslations("shared");
  const [loading, setLoading] = useState(false);
  const setTitle = useAppStore((state) => state.setTitle);
  const [mainSectors, setMainSectors] = useState<Sector[]>([]);
  const sectorService = useMemo(() => new SectorService(), []);

  const filteredSectors = useMemo(() => {
    let filteredSectors = mainSectors;
    const term = search.trim().toLowerCase();

    if (search) {
      filteredSectors = filteredSectors.filter((sector) =>
        sector.name.toLowerCase().includes(term),
      );
    }

    return filteredSectors;
  }, [mainSectors, search]);

  const paginatedSectors = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSectors.slice(start, start + pageSize);
  }, [filteredSectors, page, pageSize]);

  /**
   * Open the upsert sector modal.
   * @param sector The sector to edit.
   * @param index The index of the sector in the list.
   */
  const openUpsertSectorModal = useCallback(
    async (sector?: Sector): Promise<void> => {
      if (sector && !isFirstLoad.current) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("sector", sector.id);
        router.push(`?${params.toString()}`);
      }

      const newSector = (await openModal(UpsertSector, {
        sector,
      })) as unknown as Sector;

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("sector");
      router.push(`?${newParams.toString()}`);

      if (!newSector) return;

      if (sector) {
        const index = mainSectors.findIndex((c) => c.id === sector.id);
        if (index < 0) return;

        setMainSectors((sectors) => {
          const newSectors = [...sectors];
          newSectors[index] = newSector;
          return newSectors;
        });
      } else {
        setMainSectors(
          [newSector, ...mainSectors].sort((prev, next) =>
            prev.name.localeCompare(next.name),
          ),
        );
      }
    },
    [mainSectors, openModal, router, searchParams],
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setTitle(t("sector_list"));
        const sectors = await sectorService.getAllSectors();
        setMainSectors(sectors);
        const sector = searchParams.get("sector");

        if (sector) {
          const sectorIndex = sectors.findIndex((c) => c.id === sector);
          openUpsertSectorModal(sectors[sectorIndex]);
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
  }, [sectorService, openUpsertSectorModal, searchParams, setTitle, t]);

  /**
   * Toggle the status of a sector.
   * @param sector The sector to toggle.
   */
  const toogleSectorStatus = async (sector: Sector) => {
    try {
      const newSector = { ...sector, active: !sector.active };
      await sectorService.upsertSector(newSector);

      setMainSectors((sectors) => {
        const newSectors = [...sectors];
        const index = newSectors.findIndex((s) => s.id === sector.id);
        newSectors[index].active = !sector.active;
        return newSectors;
      });

      toast.success(
        t(`successfully_${newSector.active ? "activated" : "deactivated"}`),
      );
    } catch (error) {
      console.error(error);
      toast.error(t(`could_not_${!sector.active ? "activate" : "deactivate"}`));
    }
  };

  /**
   * Delete a sector.
   * @param sectorId The ID of the sector to delete.
   */
  const deleteSector = async (sectorId: string) => {
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

      await sectorService.deleteSector(sectorId);
      toast.success(t("sector_deleted"));

      if (paginatedSectors.length === 1) setPage(page - 1);

      setMainSectors((sectors) => sectors.filter((s) => s.id !== sectorId));
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_delete"));
    }
  };

  const sectorStatus = (isActive: boolean) => {
    return isActive ? "active" : "inactive";
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden gap-6 pb-6">
      <div className="shrink-0 max-h-fit grid sm:flex flex-1 justify-between items-center flex-wrap gap-4">
        <p className="text-lg font-medium">{t("manage_sectors")}</p>

        <div className="flex flex-1 justify-end items-center gap-4">
          <InputGroup className="md:min-w-44 max-w-fit">
            <InputGroupInput
              placeholder={t("search")}
              dataSlot="list-sectors-search"
              onChange={(e) => setSearch(e.target.value)}
            />

            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>

          <button
            data-slot="create-sector"
            onClick={() => openUpsertSectorModal()}
            className="min-w-24 bg-linear-to-br! from-primary to-(--info) text-xs! sm:text-sm! text-white h-8 px-3 rounded-full transition-all place-content-center hover:brightness-90"
          >
            {t("create_sector")}
          </button>
        </div>
      </div>

      <>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{sharedT("name")}</TableHead>

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
                  <TableCell colSpan={4}>
                    <div className="flex justify-center">
                      <Spinner />
                    </div>
                  </TableCell>
                </TableRow>
              ) : !paginatedSectors.length ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    {t("sectors_not_found")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSectors.map((sector) => (
                  <TableRow key={sector.id} data-slot="sector-row">
                    <TableCell>{sector.name}</TableCell>

                    <TableCell className="text-center">
                      {format.dateTime(new Date(sector.createdAt), {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant={sector.active ? "success" : "danger"}
                        data-slot={`${sectorStatus(sector.active)}-sector-status`}
                      >
                        {sharedT(sectorStatus(sector.active))}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-center items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => toogleSectorStatus(sector)}
                              data-slot={`toggle-sector-status-${sector.id}`}
                            >
                              {sector.active ? <Lock /> : <Unlock />}
                            </Button>
                          </TooltipTrigger>

                          <TooltipContent>
                            <p>
                              {sharedT(
                                sector.active ? "deactivate" : "activate",
                              )}
                            </p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              data-slot={`edit-sector-${sector.id}`}
                              onClick={() => openUpsertSectorModal(sector)}
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
                              data-slot={`delete-sector-${sector.id}`}
                              onClick={() => deleteSector(sector.id)}
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

        {filteredSectors.length ? (
          <div className="shrink-0">
            <PaginationControls
              page={page}
              onPageChange={setPage}
              totalPages={Math.ceil(filteredSectors.length / pageSize)}
            />
          </div>
        ) : null}
      </>
    </div>
  );
}
