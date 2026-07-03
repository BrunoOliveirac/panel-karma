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
import { Member } from "@/lib/models/member";
import { useModal } from "@/lib/providers/modal-provider";
import { MemberService } from "@/lib/services/member.service";
import { useTitle } from "@/lib/store/use-title-store";
import { FolderOpenDot, Link2Off, Search } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import CreateMember from "../_create-member/create-member";
import UpdateProjects from "../_update-projects/update-projects";

export default function ListMembers() {
  const pageSize = 10;
  const format = useFormatter();
  const { openModal } = useModal();
  const isFirstLoad = useRef(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const t = useTranslations("list_members");
  const sharedT = useTranslations("shared");
  const [loading, setLoading] = useState(false);
  const setTitle = useTitle((state) => state.setTitle);
  const [mainMembers, setMainMembers] = useState<Member[]>([]);
  const memberService = useMemo(() => new MemberService(), []);

  const filteredMembers = useMemo(() => {
    let filtered = mainMembers;
    const term = search.trim().toLowerCase();

    if (search) {
      filtered = filtered.filter(
        (member) =>
          member.name.toLowerCase().includes(term) ||
          member.email.toLowerCase().includes(term),
      );
    }

    return filtered;
  }, [mainMembers, search]);

  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredMembers.slice(start, start + pageSize);
  }, [filteredMembers, page, pageSize]);

  const openCreateMemberModal = useCallback(async (): Promise<void> => {
    const newMember = (await openModal(CreateMember, {})) as unknown as Member;

    if (!newMember) return;

    setMainMembers(
      [newMember, ...mainMembers].sort((prev, next) =>
        prev.name.localeCompare(next.name),
      ),
    );
  }, [mainMembers, openModal]);

  const openManageProjectsModal = useCallback(
    async (member: Member): Promise<void> => {
      await openModal(UpdateProjects, { member });
    },
    [openModal],
  );

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setTitle(t("member_list"));
        const members = await memberService.getAllMembers();
        setMainMembers(members);

        isFirstLoad.current = false;
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    if (!isFirstLoad.current) return;
    loadData();
  }, [memberService, setTitle, t]);

  const unlinkMember = async (memberId: string) => {
    try {
      const response = await Swal.fire({
        theme: "auto",
        icon: "warning",
        showCancelButton: true,
        cancelButtonColor: "#d33",
        text: t("unlink_warning"),
        confirmButtonColor: "#3085d6",
        title: sharedT("are_you_sure"),
        cancelButtonText: sharedT("cancel"),
        confirmButtonText: sharedT("confirm"),
      });

      if (!response?.isConfirmed) return;

      await memberService.unlinkMember(memberId);
      toast.success(t("member_unlinked"));

      if (paginatedMembers.length === 1) setPage(page - 1);

      setMainMembers((members) => members.filter((m) => m.id !== memberId));
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_unlink"));
    }
  };

  const memberStatus = (isActive: boolean) => {
    return isActive ? "active" : "inactive";
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden gap-6 pb-6">
      <div className="shrink-0 max-h-fit grid sm:flex flex-1 justify-between items-center flex-wrap gap-4">
        <p className="text-lg font-medium">{t("manage_members")}</p>

        <div className="flex flex-1 justify-end items-center gap-4">
          <InputGroup className="md:min-w-44 max-w-fit">
            <InputGroupInput
              placeholder={t("search")}
              dataSlot="list-members-search"
              onChange={(e) => setSearch(e.target.value)}
            />

            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>

          <button
            data-slot="create-member"
            onClick={() => openCreateMemberModal()}
            className="min-w-24 bg-linear-to-br! from-primary to-(--info) text-xs! sm:text-sm! text-white h-8 px-3 rounded-full transition-all place-content-center hover:brightness-90"
          >
            {t("create_member")}
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
              ) : !paginatedMembers.length ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    {t("members_not_found")}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMembers.map((member) => (
                  <TableRow
                    id={member.id}
                    key={member.id}
                    data-slot="member-row"
                  >
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>

                    <TableCell className="text-center">
                      {format.dateTime(new Date(member.createdAt), {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </TableCell>

                    <TableCell className="text-center">
                      <Badge
                        variant={member.active ? "success" : "danger"}
                        data-slot={`${memberStatus(member.active)}-member-status`}
                      >
                        {sharedT(memberStatus(member.active))}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-center items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon-sm"
                              variant="outline"
                              data-slot={`manage-projects-member-${member.id}`}
                              onClick={() => openManageProjectsModal(member)}
                            >
                              <FolderOpenDot />
                            </Button>
                          </TooltipTrigger>

                          <TooltipContent>
                            <p>{t("manage_projects")}</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              color="error"
                              size="icon-sm"
                              variant="destructive"
                              onClick={() => unlinkMember(member.id)}
                              data-slot={`unlink-member-${member.id}`}
                            >
                              <Link2Off />
                            </Button>
                          </TooltipTrigger>

                          <TooltipContent>
                            <p>{t("unlink")}</p>
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

        {filteredMembers.length ? (
          <div className="shrink-0">
            <PaginationControls
              page={page}
              onPageChange={setPage}
              totalPages={Math.ceil(filteredMembers.length / pageSize)}
            />
          </div>
        ) : null}
      </>
    </div>
  );
}
