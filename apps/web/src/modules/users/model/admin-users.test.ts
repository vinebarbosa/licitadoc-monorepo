import { describe, expect, it } from "vitest";
import {
  getDefaultAdminUsersFilters,
  getFilterSearchParams,
  getUsersQueryParams,
  toInvitePayload,
  toUpdateUserPayload,
} from "./admin-users";

describe("admin users model", () => {
  it("normalizes URL filters into API query params", () => {
    const filters = getDefaultAdminUsersFilters(
      new URLSearchParams("page=2&search=maria&role=admin&organizationId=organization-1"),
    );

    expect(filters).toEqual({
      page: 2,
      search: "maria",
      role: "admin",
      organizationId: "organization-1",
    });
    expect(getUsersQueryParams(filters)).toEqual({
      page: 2,
      pageSize: 10,
      search: "maria",
      role: "admin",
      organizationId: "organization-1",
    });
  });

  it("omits default filters from route search params", () => {
    const searchParams = getFilterSearchParams({
      page: 1,
      search: "  ",
      role: "all",
      organizationId: "all",
    });

    expect(searchParams.toString()).toBe("");
  });

  it("maps form values into adapter payloads", () => {
    expect(
      toUpdateUserPayload({
        name: " Maria Silva ",
        role: "organization_owner",
        organizationId: "none",
      }),
    ).toEqual({
      name: "Maria Silva",
      role: "organization_owner",
      organizationId: null,
    });

    expect(
      toInvitePayload({
        email: " maria@licitadoc.test ",
        organizationId: "organization-1",
      }),
    ).toEqual({
      email: "maria@licitadoc.test",
      organizationId: "organization-1",
    });
  });
});
