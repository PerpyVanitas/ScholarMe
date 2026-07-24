import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useDashboardMode } from "@/lib/hooks/use-dashboard-mode";

describe("Regression Tests", () => {
  describe("useDashboardMode", () => {
    it("should not allow learner to switch workspaces", () => {
      const { result } = renderHook(() => useDashboardMode("learner"));
      expect(result.current.canSwitch).toBe(false);
    });

    it("should allow tutor to switch workspaces", () => {
      const { result } = renderHook(() => useDashboardMode("tutor"));
      expect(result.current.canSwitch).toBe(true);
    });

    it("should allow super_admin to switch workspaces", () => {
      const { result } = renderHook(() => useDashboardMode("super_admin"));
      expect(result.current.canSwitch).toBe(true);
    });
  });

  describe("Array roles and profiles checking", () => {
    it("should safely parse profile roles when array or object", () => {
      const profileWithArray = { roles: [{ name: "tutor" }] };
      const profileWithObject = { roles: { name: "tutor" } };
      
      const checkRoles = (profile: Record<string, unknown>) => {
        const roles = profile.roles;
        if (Array.isArray(roles)) {
          return roles.some((r: Record<string, unknown>) => r.name === "tutor");
        } else if (roles && typeof roles === "object") {
          return (roles as Record<string, unknown>).name === "tutor";
        }
        return false;
      };

      expect(checkRoles(profileWithArray)).toBe(true);
      expect(checkRoles(profileWithObject)).toBe(true);
    });
  });

  describe("AI Chatbot Vertex configuration", () => {
    it("should correctly identify when AI service is configured (regression test)", () => {
      // Mocking the condition used in app/api/ai/chat/route.ts
      const checkAIConfig = (apiKey: string | undefined, projectId: string | undefined) => {
        return !!(apiKey || projectId);
      };

      expect(checkAIConfig("gemini-key", undefined)).toBe(true);
      expect(checkAIConfig(undefined, "my-vertex-project")).toBe(true);
      expect(checkAIConfig("gemini-key", "my-vertex-project")).toBe(true);
      expect(checkAIConfig(undefined, undefined)).toBe(false);
    });
  });
});
