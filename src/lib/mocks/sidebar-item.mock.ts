import {
  Contact,
  Factory,
  FolderOpenDot,
  Home,
  LayoutDashboard,
  MessageCircle,
  UserCircle,
  UserRoundCog,
  Users,
} from "lucide-react";
import { UserTypeEnum } from "../enums/user-type.enum";
import { SidebarItem } from "../interfaces/sidebar-item";

const USER_MEMBER_SIDEBAR_ITEMS: SidebarItem[] = [
  { name: "clients", path: "/clients", icon: Contact },
  { name: "projects", path: "/projects", icon: FolderOpenDot },
  { name: "sectors", path: "/sectors", icon: Factory },
];

const PROFILE_SIDEBAR_ITEM: SidebarItem = {
  name: "profile",
  path: "/profile",
  icon: UserCircle,
};

const EXTRA_ALLOWED_PATHS = ["/notifications"];

export class SidebarItemMock {
  public ADMIN_SIDEBAR_ITEMS: SidebarItem[] = [
    { name: "dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "supports", path: "/supports", icon: UserRoundCog },
    PROFILE_SIDEBAR_ITEM,
    // { name: "settings", path: "/settings", icon: Settings },
  ];

  public SUPPORT_SIDEBAR_ITEMS: SidebarItem[] = [
    { name: "chat", path: "/chat", icon: MessageCircle },
    PROFILE_SIDEBAR_ITEM,
  ];

  public USER_SIDEBAR_ITEMS: SidebarItem[] = [
    { name: "home", path: "/home", icon: Home },
    // { name: "crm", path: "/crm", icon: LayoutList },
    // { name: "chat", path: "/chat", icon: MessageCircle },
    // { name: "arka", path: "/arka", icon: Bot }, // ARKA: AI-Ready Karma Assistant
    ...USER_MEMBER_SIDEBAR_ITEMS,
    { name: "members", path: "/members", icon: Users },
    PROFILE_SIDEBAR_ITEM,
  ];

  public MEMBER_SIDEBAR_ITEMS: SidebarItem[] = [
    ...USER_MEMBER_SIDEBAR_ITEMS,
    PROFILE_SIDEBAR_ITEM,
  ];

  public get(userType: UserTypeEnum): SidebarItem[] {
    return this[`${userType}_SIDEBAR_ITEMS`];
  }

  public getPaths(userType: UserTypeEnum): string[] {
    return [...this.get(userType).map((item) => item.path), ...EXTRA_ALLOWED_PATHS];
  }

  public isAllowed(userType: UserTypeEnum, pathname: string): boolean {
    return pathname !== "/" && this.getPaths(userType).includes(pathname);
  }
}
