import { LucideProps } from "lucide-react";
import { ForwardRefExoticComponent, RefAttributes } from "react";

export interface SidebarItem {
  name: string;
  path: string;
  icon: ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & RefAttributes<SVGSVGElement>
  >;
}
