/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import PaginationControls from "@/components/global/pagination-controls";
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
import UpdateProjects from "../_update-projects/update-projects";
import { useTitle } from "@/lib/store/use-title-store";
import { useDebouncedCallback } from "use-debounce";

export default function ListMembers() {
  const router = useRouter();
  const { openModal } = useModal();
  const searchParams = useSearchParams();
  const t = useTranslations("list_members");
  const sharedT = useTranslations("shared");
  const query = searchParams.get("query") ?? "";
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(query);
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
   * Set the search input to the query
   * @returns void
   */
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  /**
   * Open the modal to create a new member
   * @returns void
   */
  const openCreateMemberModal = useCallback(async (): Promise<void> => {
    const newMember = (await openModal(CreateMember, {})) as unknown as Member;
    if (!newMember) return;

    startTransition(() => setMembersPromise(fetchMembers()));
  }, [fetchMembers, openModal, startTransition]);

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

  const fallback = (
    <TableRow>
      <TableCell colSpan={4}>
        <div className="flex justify-center">
          <Spinner />
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden gap-6 pb-6">
      <div className="shrink-0 max-h-fit grid sm:flex flex-1 justify-between items-center flex-wrap gap-4">
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

          <button
            data-slot="create-member"
            onClick={() => openCreateMemberModal()}
            className="min-w-24 bg-linear-to-br! from-primary to-(--info) text-xs! sm:text-sm! text-white h-8 px-3 rounded-full transition-all place-content-center hover:brightness-90"
          >
            {t("create_member")}
          </button>
        </div>
      </div>

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
                  fetchMembers={fetchMembers}
                  membersPromise={membersPromise}
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
  fetchMembers: () => Promise<Pagination<Member>>;
  membersPromise: Promise<Pagination<Member>>;
  startTransition: (callback: () => void) => void;
  sharedT: _Translator<Record<string, any>, "shared">;
  t: _Translator<Record<string, any>, "list_members">;
  setMembersPromise: (promise: Promise<Pagination<Member>>) => void;
}

const MemberRows = ({
  t,
  sharedT,
  fetchMembers,
  membersPromise,
  startTransition,
  setMembersPromise,
}: MemberRowsProps) => {
  const format = useFormatter();
  const { openModal } = useModal();
  const memberService = new MemberService();
  const { items: members } = use(membersPromise);

  /**
   * Open the modal to manage the projects of a member
   */
  const openManageProjectsModal = useCallback(
    async (member: Member): Promise<boolean> =>
      openModal(UpdateProjects, { member }),
    [openModal],
  );

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
      <TableCell>{member.name}</TableCell>
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
