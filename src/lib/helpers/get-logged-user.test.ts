import { clearMockLoggedUser, mockLoggedUser } from "@/lib/mocks/logged-user.mock";
import { getLoggedUser } from "./get-logged-user";

describe("getLoggedUser", () => {
  it("returns the user from the store", () => {
    expect(getLoggedUser()).toEqual(mockLoggedUser);
  });

  it("throws when there is no authenticated user", () => {
    clearMockLoggedUser();
    expect(() => getLoggedUser()).toThrow("Unauthenticated");
  });
});
