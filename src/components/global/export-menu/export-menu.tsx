"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ClientsXlsxService } from "@/lib/services/exports/clients-xlsx.service";
import { MembersXlsxService } from "@/lib/services/exports/members-xlsx.service";
import { ProjectsXlsxService } from "@/lib/services/exports/projects-xlsx.service";
import { SectorsXlsxService } from "@/lib/services/exports/sectors-xlsx.service";
import { TicketsXlsxService } from "@/lib/services/exports/tickets-xlsx.service";
import { DownloadCloud } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface ExportMenuProps {
  paginatedData: any[];
  selectedIds?: string[];
  allData?: any[];
  type: "clients" | "members" | "projects" | "sectors" | "tickets";
}

enum ExportType {
  ALL = "all",
  CURRENT_PAGE = "current_page",
  SELECTED = "selected",
}

export default function ExportMenu({
  paginatedData,
  type,
  allData,
  selectedIds = [],
}: ExportMenuProps) {
  const locale = useLocale();
  const t = useTranslations("export_menu");

  const clientsXlsxService = useMemo(() => new ClientsXlsxService(), []);
  const membersXlsxService = useMemo(() => new MembersXlsxService(), []);
  const sectorsXlsxService = useMemo(() => new SectorsXlsxService(), []);
  const projectsXlsxService = useMemo(() => new ProjectsXlsxService(), []);
  const ticketsXlsxService = useMemo(() => new TicketsXlsxService(), []);

  const services = {
    clients: clientsXlsxService,
    members: membersXlsxService,
    sectors: sectorsXlsxService,
    projects: projectsXlsxService,
    tickets: ticketsXlsxService,
  };

  const handleExport = (exportType: ExportType) => {
    const currentService = services[type as keyof typeof services];

    switch (exportType) {
      case ExportType.ALL:
        if (type === "clients" && allData !== undefined) {
          clientsXlsxService.exportAll({ locale, t, data: allData });
        } else {
          currentService.exportAll({ locale, t });
        }
        break;

      case ExportType.CURRENT_PAGE:
        currentService.exportCurrentPage({ data: paginatedData, locale, t });
        break;

      case ExportType.SELECTED:
        currentService.exportSelected({ locale, t, dataIds: selectedIds });
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="rounded"
          data-slot={`export-menu-${type}`}
        >
          {t("export")}
          <DownloadCloud />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-40 rounded" align="start">
        <DropdownMenuGroup>
          <DropdownMenuLabel>XLSX</DropdownMenuLabel>

          <DropdownMenuItem
            className="rounded cursor-pointer"
            onClick={() => handleExport(ExportType.ALL)}
          >
            {t("all")}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="rounded cursor-pointer"
            onClick={() => handleExport(ExportType.CURRENT_PAGE)}
          >
            {t("current_page")}
          </DropdownMenuItem>

          <DropdownMenuItem
            className="rounded cursor-pointer"
            onClick={() => handleExport(ExportType.SELECTED)}
          >
            {t("selected")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
