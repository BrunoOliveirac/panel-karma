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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Support } from "@/lib/models/support";
import { useModal } from "@/lib/providers/modal-provider";
import { SupportService } from "@/lib/services/support.service";
import { useAppStore } from "@/lib/store/use-title-store";
import { KeyRound, Lock, Pencil, Search, Trash, Unlock } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import ChangeSupportPassword from "../_change-support-password/change-support-password";
import UpsertSupport from "../_upsert-support/upsert-support";

export default function ListSupports() {
  const pageSize = 10;
  const router = useRouter();
  const format = useFormatter();
  const { openModal } = useModal();
  const isFirstLoad = useRef(true);
  const [page, setPage] = useState(1);
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const t = useTranslations("list_supports");
  const sharedT = useTranslations("shared");
  const [loading, setLoading] = useState(false);
  const setTitle = useAppStore((state) => state.setTitle);
  const [mainSupports, setMainSupports] = useState<Support[]>([]);
  const supportService = useMemo(() => new SupportService(), []);

  const filteredSupports = useMemo(() => {
    let filtered = mainSupports;
    const term = search.trim().toLowerCase();

    if (search) {
      filtered = filtered.filter(
        (support) =>
          support.name.toLowerCase().includes(term) ||
          support.email.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [mainSupports, search]);

  const paginatedSupports = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSupports.slice(start, start + pageSize);
  }, [filteredSupports, page, pageSize]);

  const openUpsertSupportModal = useCallback(
    async (support?: Support): Promise<void> => {
      if (support && !isFirstLoad.current) {
        const params = new URLSearchParams(searchParams.toString());
        params.set("support", support.id);
        router.push(`?${params.toString()}`);
      }

      const newSupport = (await openModal(UpsertSupport, {
        support,
      })) as unknown as Support;

      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("support");
      router.push(`?${newParams.toString()}`);

      if (!newSupport) return;

      if (support) {
        const index = mainSupports.findIndex((s) => s.id === support.id);
        if (index < 0) return;

        setMainSupports((supports) => {
          const newSupports = [...supports];
          newSupports[index] = newSupport;
          return newSupports;
        });
      } else {
        setMainSupports(
          [newSupport, ...mainSupports].sort((prev, next) =>
            prev.name.localeCompare(next.name),
          ),
        );
      }
    },
    [mainSupports, openModal, router, searchParams],
  );

  const openChangePasswordModal = async (support: Support) => {
    await openModal(ChangeSupportPassword, { support });
  };

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setTitle(t("support_list"));
        const supports = await supportService.getAllSupports();
        setMainSupports(supports);
        const supportId = searchParams.get("support");

        if (supportId) {
          const supportIndex = supports.findIndex((s) => s.id === supportId);
          if (supportIndex >= 0) openUpsertSupportModal(supports[supportIndex]);
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
  }, [supportService, openUpsertSupportModal, searchParams, setTitle, t]);

  const toggleSupportStatus = async (support: Support) => {
    try {
      await supportService.toggleStatus(support.id);

      setMainSupports((supports) => {
        const newSupports = [...supports];
        const index = newSupports.findIndex((s) => s.id === support.id);
        newSupports[index].active = !support.active;
        return newSupports;
      });

      toast.success(
        t(`successfully_${!support.active ? "activated" : "deactivated"}`),
      );
    } catch (error) {
      console.error(error);
      toast.error(t(`could_not_${support.active ? "deactivate" : "activate"}`));
    }
  };

  const deleteSupport = async (supportId: string) => {
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

      await supportService.deleteSupport(supportId);
      toast.success(t("support_deleted"));

      if (paginatedSupports.length === 1) setPage(page - 1);

      setMainSupports((supports) => supports.filter((s) => s.id !== supportId));
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_delete"));
    }
  };

  const supportStatus = (isActive: boolean) => {
    return isActive ? "active" : "inactive";
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden gap-6 pb-6">
      <div className="shrink-0 max-h-fit grid sm:flex flex-1 justify-between items-center flex-wrap gap-4">
        <p className="text-lg font-medium">{t("manage_supports")}</p>

        <div className="flex flex-1 justify-end items-center gap-4">
          <InputGroup className="md:min-w-44 max-w-fit">
            <InputGroupInput
              placeholder={t("search")}
              dataSlot="list-supports-search"
              onChange={(e) => setSearch(e.target.value)}
            />

            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>

          <button
            data-slot="create-support"
            onClick={() => openUpsertSupportModal()}
            className="min-w-24 bg-linear-to-br! from-primary to-(--info) text-xs! sm:text-sm! text-white h-8 px-3 rounded-full transition-all place-content-center hover:brightness-90"
          >
            {t("create_support")}
          </button>
        </div>
      </div>

      <>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{sharedT("name")}</TableHead>
                <TableHead>{t("email")}</TableHead>

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
              ) : !paginatedSupports.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {t("supports_not_found")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSupports.map((support) => (
                  <TableRow
                    id={support.id}
                    key={support.id}
                    data-slot="support-row"
                  >
                    <TableCell>{support.name}</TableCell>
                    <TableCell>{support.email}</TableCell>

                    <TableCell className="text-center">
                      {format.dateTime(new Date(support.createdAt), {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant={support.active ? "success" : "danger"}
                        data-slot={`${supportStatus(support.active)}-support-status`}
                      >
                        {sharedT(supportStatus(support.active))}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-center items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              data-slot={`change-support-password-${support.id}`}
                              onClick={() => openChangePasswordModal(support)}
                            >
                              <KeyRound />
                            </Button>
                          </TooltipTrigger>

                          <TooltipContent>
                            <p>{t("change_password")}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              onClick={() => toggleSupportStatus(support)}
                              data-slot={`toggle-support-status-${support.id}`}
                            >
                              {support.active ? <Lock /> : <Unlock />}
                            </Button>
                          </TooltipTrigger>

                          <TooltipContent>
                            <p>
                              {sharedT(
                                support.active ? "deactivate" : "activate",
                              )}
                            </p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              data-slot={`edit-support-${support.id}`}
                              onClick={() => openUpsertSupportModal(support)}
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
                              onClick={() => deleteSupport(support.id)}
                              data-slot={`delete-support-${support.id}`}
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

        {filteredSupports.length ? (
          <div className="shrink-0">
            <PaginationControls
              page={page}
              onPageChange={setPage}
              totalPages={Math.ceil(filteredSupports.length / pageSize)}
            />
          </div>
        ) : null}
      </>
    </div>
  );
}
