import { describe, it, expect } from "vitest";
import {
  isEsasScholar,
  isRegularMember,
  isKnownRole,
  isAdminRole,
  hasAnyRole,
  canAccessAdminRoute,
  canAccessFinance,
  canSubmitFinance,
  canReviewFinance,
  canApproveFinance,
  canAuditFinance,
  normalizeRole,
  getRoleName,
} from "@/lib/utils/roles";

describe("Roles Utils", () => {
  it("isEsasScholar identifies scholar", () => {
    expect(isEsasScholar({ membership_classification: "esas_scholar" })).toBe(true);
    expect(isEsasScholar({ membership_classification: "regular_member" })).toBe(false);
    expect(isEsasScholar(null)).toBe(false);
  });

  it("isRegularMember identifies regular member", () => {
    expect(isRegularMember({ membership_classification: "regular_member" })).toBe(true);
    expect(isRegularMember({ membership_classification: "esas_scholar" })).toBe(false);
    expect(isRegularMember(null)).toBe(false);
  });

  describe("isKnownRole, isAdminRole, hasAnyRole", () => {
    it("isKnownRole identifies valid roles", () => {
      expect(isKnownRole("tutor")).toBe(true);
      expect(isKnownRole("super_admin")).toBe(true);
      expect(isKnownRole("invalid")).toBe(false);
      expect(isKnownRole(null)).toBe(false);
      expect(isKnownRole(undefined)).toBe(false);
    });

    it("isAdminRole identifies admin roles", () => {
      expect(isAdminRole("administrator")).toBe(true);
      expect(isAdminRole("super_admin")).toBe(true);
      expect(isAdminRole("president")).toBe(false);
      expect(isAdminRole(null)).toBe(false);
    });

    it("hasAnyRole checks membership in allowed list", () => {
      expect(hasAnyRole("treasurer", ["treasurer", "president"])).toBe(true);
      expect(hasAnyRole("learner", ["treasurer", "president"])).toBe(false);
      expect(hasAnyRole("unknown", ["treasurer"])).toBe(false);
    });
  });

  describe("normalizeRole and getRoleName", () => {
    it("normalizeRole handles undefined, objects, and arrays", () => {
      expect(normalizeRole(undefined)).toBeUndefined();
      expect(normalizeRole(null)).toBeUndefined();
      expect(normalizeRole({ name: "tutor" })).toEqual({ name: "tutor" });
      expect(normalizeRole([{ name: "tutor" }, { name: "learner" }])).toEqual({ name: "tutor" });
      expect(normalizeRole([])).toBeUndefined();
    });

    it("getRoleName returns known role or falls back to learner", () => {
      expect(getRoleName({ roles: { name: "president" } })).toBe("president");
      expect(getRoleName({ roles: [{ name: "tutor" }] })).toBe("tutor");
      expect(getRoleName({ roles: { name: "invalid_role" } })).toBe("learner");
      expect(getRoleName({ roles: null })).toBe("learner");
    });
  });

  describe("canAccessAdminRoute", () => {
    it("allows super_admin and administrator on all paths", () => {
      expect(canAccessAdminRoute("super_admin", "/dashboard/admin/sessions")).toBe(true);
      expect(canAccessAdminRoute("administrator", "/dashboard/admin/users")).toBe(true);
    });

    it("checks specific paths for governance roles", () => {
      expect(canAccessAdminRoute("president", "/dashboard/admin/sessions")).toBe(true);
      expect(canAccessAdminRoute("tutor", "/dashboard/admin/sessions")).toBe(false);
    });

    it("restricts super_admin-only routes", () => {
      expect(canAccessAdminRoute("super_admin", "/dashboard/admin/messages")).toBe(
        true,
      );
      expect(canAccessAdminRoute("president", "/dashboard/admin/messages")).toBe(
        false,
      );
    });

    it("allows finance roles on reports route", () => {
      expect(canAccessAdminRoute("treasurer", "/dashboard/admin/reports")).toBe(
        true,
      );
      expect(canAccessAdminRoute("auditor", "/dashboard/admin/reports")).toBe(
        true,
      );
      expect(canAccessAdminRoute("tutor", "/dashboard/admin/reports")).toBe(false);
    });

    it("returns false for unknown paths", () => {
      expect(canAccessAdminRoute("president", "/dashboard/unknown/path")).toBe(false);
    });
  });

  describe("finance permissions", () => {
    it("checks canAccessFinance", () => {
      expect(canAccessFinance("treasurer")).toBe(true);
      expect(canAccessFinance("learner")).toBe(false);
    });

    it("checks canSubmitFinance", () => {
      expect(canSubmitFinance("treasurer")).toBe(true);
      expect(canSubmitFinance("auditor")).toBe(false);
    });

    it("checks canReviewFinance", () => {
      expect(canReviewFinance("treasurer")).toBe(true);
      expect(canReviewFinance("president")).toBe(false);
    });

    it("checks canApproveFinance", () => {
      expect(canApproveFinance("president")).toBe(true);
      expect(canApproveFinance("treasurer")).toBe(false);
    });

    it("checks canAuditFinance", () => {
      expect(canAuditFinance("auditor")).toBe(true);
      expect(canAuditFinance("treasurer")).toBe(false);
    });
  });
});
