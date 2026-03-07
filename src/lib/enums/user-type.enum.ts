export enum UserTypeEnum {
  ADMIN = "ADMIN",
  USER = "USER",
  SUPPORT = "SUPPORT",
}

export const UserRouteMap = new Map<UserTypeEnum, string>([
  [UserTypeEnum.ADMIN, "/dashboard"],
  [UserTypeEnum.USER, "/home"],
  [UserTypeEnum.SUPPORT, "/chat"],
]);
