export enum UserTypeEnum {
  ADMIN = "ADMIN",
  USER = "USER",
  SUPPORT = "SUPPORT",
  MEMBER = "MEMBER",
}

export const UserRouteMap = new Map<UserTypeEnum, string>([
  [UserTypeEnum.ADMIN, "/dashboard"],
  [UserTypeEnum.USER, "/home"],
  [UserTypeEnum.SUPPORT, "/chat"],
  [UserTypeEnum.MEMBER, "/clients"],
]);
