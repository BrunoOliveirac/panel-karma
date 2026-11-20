import {
  LucideIcon,
  TicketCheck,
  TicketIcon,
  TicketsPlane,
  TicketX,
} from "lucide-react";
import { TicketStatusEnum } from "../enums/ticket-status.enum";

export const statusCardMeta = {
  [TicketStatusEnum.OPEN]: {
    class: "bg-[#7c79d4] [--ticket-ring:color-mix(in_srgb,#7c79d4_55%,white)]",
    icon: TicketIcon,
    type: "open",
  },
  [TicketStatusEnum.IN_PROGRESS]: {
    class:
      "bg-[#2b7a9e] [--ticket-ring:color-mix(in_srgb,#2b7a9e_55%,white)] dark:bg-[#06638d] dark:[--ticket-ring:color-mix(in_srgb,#06638d_55%,white)]",
    icon: TicketsPlane,
    type: "inProgress",
  },
  [TicketStatusEnum.RESOLVED]: {
    class: "bg-[#2C695B] [--ticket-ring:color-mix(in_srgb,#2C695B_55%,white)]",
    icon: TicketCheck,
    type: "resolved",
  },
  [TicketStatusEnum.CANCELLED]: {
    class: "bg-[#C2C2C4] [--ticket-ring:color-mix(in_srgb,#C2C2C4_55%,white)]",
    icon: TicketX,
    type: "cancelled",
  },
} as const satisfies Record<
  TicketStatusEnum,
  {
    class: string;
    icon: LucideIcon;
    type: "open" | "inProgress" | "resolved" | "cancelled";
  }
>;
