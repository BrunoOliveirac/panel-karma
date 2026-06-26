import {
  Contact,
  Factory,
  FolderOpenDot,
  Home,
  LayoutDashboard,
  MessageCircle,
  UserRoundCog,
} from "lucide-react";
import { UserTypeEnum } from "../enums/user-type.enum";
import { SidebarItem } from "../interfaces/sidebar-item";

export class SidebarItemMock {
  public ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
    { name: "dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "supports", path: "/supports", icon: UserRoundCog },
    // { name: "settings", path: "/settings", icon: Settings },
  ];

  public SUPPORT_SIDEBAR_ITEMS: SidebarItem[] = [
    { name: "chat", path: "/chat", icon: MessageCircle },
    // { name: "profile", path: "/profile", icon: UserCircle },
  ];

  public USER_SIDEBAR_ITEMS: SidebarItem[] = [
    { name: "home", path: "/home", icon: Home },
    // { name: "crm", path: "/crm", icon: LayoutList },
    // { name: "chat", path: "/chat", icon: MessageCircle },
    // { name: "arka", path: "/arka", icon: Bot }, // ARKA: AI-Ready Karma Assistant
    { name: "clients", path: "/clients", icon: Contact },
    { name: "projects", path: "/projects", icon: FolderOpenDot },
    { name: "sectors", path: "/sectors", icon: Factory },
    // { name: "profile", path: "/profile", icon: UserCircle },
  ];

  public get(userType: UserTypeEnum): SidebarItem[] {
    return this[`${userType}_SIDEBAR_ITEMS`];
  }

  public getPaths(userType: UserTypeEnum): string[] {
    return this.get(userType).map((item) => item.path);
  }
}
