/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import PaginationControls from "@/components/global/pagination-controls/pagination-controls";
import UserAvatar from "@/components/global/user-avatar/user-avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Pagination } from "@/lib/interfaces/pagination";
import { Member } from "@/lib/models/member";
import { useModal } from "@/lib/providers/modal-provider";
import { MemberService } from "@/lib/services/member.service";
import { FolderOpenDot, Link2Off, Search } from "lucide-react";
import { _Translator, useFormatter, useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  use,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import CreateMember from "../_create-member/create-member";
import ManagementProjects from "../_management-projects/management-projects";
import { useTitle } from "@/lib/store/use-title-store";
import { useDebouncedCallback } from "use-debounce";
import ExportMenu from "@/components/global/export-menu/export-menu";

export default function ListMembers() {
  const router = useRouter();
  const { openModal } = useModal();
  const searchParams = useSearchParams();
  const t = useTranslations("list_members");
  const sharedT = useTranslations("shared");
  const query = searchParams.get("query") ?? "";
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setSearchInput(query);
    setSelectedIds(new Set());
  }

  const setTitle = useTitle((state) => state.setTitle);
  const memberService = useMemo(() => new MemberService(), []);

  /**
   * Get the current page from the search params
   * @returns The current page
   */
  const currentPage = useMemo(() => {
    const pageParam = Number(searchParams.get("page") ?? "0");
    return Number.isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  }, [searchParams]);

  /**
   * Fetch the members
   * @returns The members
   */
  const fetchMembers = useCallback(
    () => memberService.getAllLinkedMembers(query, currentPage),
    [memberService, query, currentPage],
  );

  const fetchKey = `${query}-${currentPage}`;
  const prevFetchKey = useRef(fetchKey);

  const [membersPromise, setMembersPromise] = useState(fetchMembers);
  const [pageMembers, setPageMembers] = useState<Member[]>([]);
  const [pageMembersKey, setPageMembersKey] = useState(fetchKey);

  if (pageMembersKey !== fetchKey) {
    setPageMembersKey(fetchKey);
    setPageMembers([]);
  }

  const selectedMemberIds = useMemo(() => [...selectedIds], [selectedIds]);

  const pageSelection = useMemo(() => {
    let selectedCount = 0;

    for (const member of pageMembers) {
      if (selectedIds.has(member.id)) selectedCount += 1;
    }

    return {
      allPageSelected:
        pageMembers.length > 0 && selectedCount === pageMembers.length,
      somePageSelected: selectedCount > 0 && selectedCount < pageMembers.length,
    };
  }, [pageMembers, selectedIds]);

  /**
   * Fetch the members when the fetch key changes
   * @returns void
   */
  useEffect(() => {
    if (prevFetchKey.current === fetchKey) return;

    prevFetchKey.current = fetchKey;
    startTransition(() => setMembersPromise(fetchMembers()));
  }, [fetchKey, fetchMembers, startTransition]);

  /**
   * Set the title of the page
   * @returns void
   */
  useEffect(() => setTitle(t("member_list")), [setTitle, t]);

  /**
   * Reload the member list from the server.
   */
  const refreshMembers = useCallback(() => {
    startTransition(() => setMembersPromise(fetchMembers()));
  }, [fetchMembers, startTransition]);

  /**
   * Open the create member modal and refresh the list when a member is created or linked.
   */
  const openCreateMemberModal = useCallback(async (): Promise<void> => {
    const shouldRefresh = await openModal(CreateMember, {});
    if (!shouldRefresh) return;

    refreshMembers();
  }, [openModal, refreshMembers]);

  /**
   * Update search and pagination query params in the URL.
   * @param filterPaginationParams The page and/or query to apply.
   */
  const updateUrl = (filterPaginationParams: {
    page?: number;
    query?: string;
  }) => {
    const params = new URLSearchParams(searchParams.toString());

    if (filterPaginationParams.query !== undefined) {
      if (!filterPaginationParams.query) params.delete("query");
      else params.set("query", filterPaginationParams.query);

      params.set("page", "1"); // Reset to page 1 when filtering
    }

    if (filterPaginationParams.page !== undefined) {
      params.set("page", filterPaginationParams.page.toString());
    }

    // keep the UI responsive while the new page/filter loads on the server
    startTransition(() => router.push(`/members?${params.toString()}`));
  };

  /**
   * Debounce the update of the search input
   * to avoid making too many requests to the server
   * when the user is typing
   * @param value - The value of the search input
   * @returns void
   */
  const debouncedUpdateSearch = useDebouncedCallback((value: string) => {
    updateUrl({ query: value });
  }, 300);

  const syncPageMembers = useCallback((members: Member[]) => {
    setPageMembers(members);
  }, []);

  /**
   * Select or clear every member on the current page.
   * @param checked Whether the page should be selected.
   */
  const togglePage = (checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      for (const member of pageMembers) {
        if (checked) next.add(member.id);
        else next.delete(member.id);
      }

      return next;
    });
  };

  /**
   * Select or clear a single member.
   * @param memberId The member id.
   * @param checked Whether the member should be selected.
   */
  const toggleRow = (memberId: string, checked: boolean) => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (checked) next.add(memberId);
      else next.delete(memberId);

      return next;
    });
  };

  /**
   * Drop a member from the selection after it is unlinked.
   * @param memberId The unlinked member id.
   */
  const unselectMember = useCallback((memberId: string) => {
    setSelectedIds((current) => {
      if (!current.has(memberId)) return current;

      const next = new Set(current);
      next.delete(memberId);
      return next;
    });
  }, []);

  const fallback = (
    <TableRow>
      <TableCell colSpan={5}>
        <div className="flex justify-center">
          <Spinner />
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden gap-6 pb-6">
      <div className="shrink-0 max-h-fit grid sm:flex justify-between items-center flex-wrap gap-4">
        <p className="text-lg font-medium">{t("manage_members")}</p>

        <div className="flex flex-1 justify-end items-center gap-4">
          <InputGroup className="md:min-w-44 max-w-fit">
            <InputGroupInput
              value={searchInput}
              placeholder={t("search")}
              dataSlot="list-members-search"
              onChange={(e) => {
                setSearchInput(e.target.value);
                debouncedUpdateSearch(e.target.value);
              }}
            />

            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
          </InputGroup>

          <div className="flex items-center gap-4">
            <ExportMenu
              type="members"
              selectedIds={selectedMemberIds}
              paginatedData={pageMembers}
            />

            <button
              data-slot="create-member"
              onClick={() => openCreateMemberModal()}
              className="min-w-24 bg-linear-to-br! from-primary to-(--info) text-xs! sm:text-sm! text-white h-9 px-3 rounded transition-all place-content-center hover:brightness-75"
            >
              {t("create_member")}
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
                    disabled={!pageMembers.length || isPending}
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
              <TableHead>{t("email")}</TableHead>

              <TableHead className="text-center">
                {sharedT("created_at")}
              </TableHead>

              <TableHead className="text-center">
                {sharedT("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isPending ? (
              fallback
            ) : (
              <Suspense fallback={fallback}>
                <MemberRows
                  t={t}
                  sharedT={sharedT}
                  selectedIds={selectedIds}
                  fetchMembers={fetchMembers}
                  onToggleRow={toggleRow}
                  onUnlinked={unselectMember}
                  membersPromise={membersPromise}
                  onPageMembers={syncPageMembers}
                  startTransition={startTransition}
                  setMembersPromise={setMembersPromise}
                />
              </Suspense>
            )}
          </TableBody>
        </Table>
      </div>

      <Suspense>
        <MemberPagination
          page={currentPage}
          membersPromise={membersPromise}
          onPageChange={(page) => updateUrl({ page })}
        />
      </Suspense>
    </div>
  );
}

interface MemberRowsProps {
  selectedIds: Set<string>;
  onUnlinked: (memberId: string) => void;
  onPageMembers: (members: Member[]) => void;
  fetchMembers: () => Promise<Pagination<Member>>;
  membersPromise: Promise<Pagination<Member>>;
  startTransition: (callback: () => void) => void;
  sharedT: _Translator<Record<string, any>, "shared">;
  t: _Translator<Record<string, any>, "list_members">;
  onToggleRow: (memberId: string, checked: boolean) => void;
  setMembersPromise: (promise: Promise<Pagination<Member>>) => void;
}

/** Renders the table rows for the current page of members. */
const MemberRows = ({
  t,
  sharedT,
  selectedIds,
  onUnlinked,
  onToggleRow,
  fetchMembers,
  membersPromise,
  onPageMembers,
  startTransition,
  setMembersPromise,
}: MemberRowsProps) => {
  const format = useFormatter();
  const { openModal } = useModal();
  const memberService = new MemberService();
  const { items: members } = use(membersPromise);

  useEffect(() => {
    onPageMembers(members);
  }, [members, onPageMembers]);

  /**
   * Open the modal to manage the projects assigned to a member.
   * @param member The member whose projects will be managed.
   */
  const openManageProjectsModal = useCallback(
    async (member: Member): Promise<boolean> =>
      openModal(ManagementProjects, { member }),
    [openModal],
  );

  /**
   * Ask for confirmation and unlink a member from the current user.
   * @param memberId The ID of the member to unlink.
   */
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
      onUnlinked(memberId);

      startTransition(() => setMembersPromise(fetchMembers()));
    } catch (error) {
      console.error(error);
      toast.error(t("could_not_unlink"));
    }
  };

  if (!members.length) {
    return (
      <TableRow>
        <TableCell colSpan={5} className="text-center">
          {t("members_not_found")}
        </TableCell>
      </TableRow>
    );
  }

  return members.map((member) => (
    <TableRow id={member.id} key={member.id} data-slot="member-row">
      <TableCell>
        <div className="flex justify-center">
          <Checkbox
            checked={selectedIds.has(member.id)}
            aria-label={sharedT("select_name", { name: member.name })}
            data-slot={`select-member-${member.id}`}
            onCheckedChange={(checked) =>
              onToggleRow(member.id, checked === true)
            }
          />
        </div>
      </TableCell>

      <TableCell>
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar size={32} name={member.name} avatar={member.avatar} />
          <span className="truncate" data-slot="member-name">
            {member.name}
          </span>
        </div>
      </TableCell>

      <TableCell>{member.email}</TableCell>

      <TableCell className="text-center">
        {format.dateTime(new Date(member.createdAt), {
          dateStyle: "short",
          timeStyle: "short",
        })}
      </TableCell>

      <TableCell>
        <div className="flex justify-center items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon-sm"
                variant="outline"
                onClick={() => openManageProjectsModal(member)}
                data-slot={`manage-projects-member-${member.id}`}
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
  ));
};

interface MemberPaginationProps {
  page: number;
  onPageChange: (page: number) => void;
  membersPromise: Promise<Pagination<Member>>;
}

/** Renders pagination controls for the member list. */
const MemberPagination = ({
  page,
  onPageChange,
  membersPromise,
}: MemberPaginationProps) => {
  const { totalPages } = use(membersPromise);

  return (
    <div>
      <PaginationControls
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
};
