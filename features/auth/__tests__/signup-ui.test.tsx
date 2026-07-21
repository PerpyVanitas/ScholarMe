import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SignUpPage from "@/app/auth/sign-up/page";
import * as authActions from "@/app/auth/actions";
import { toast } from "sonner";

vi.mock("@/app/auth/actions", () => ({
  signUp: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

// Provide minimal matchMedia mock for Radix UI/other libs if needed
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("SignUp Page UI", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should prevent double-click signup by disabling the button", async () => {
    let resolveSignUp!: (value: unknown) => void;
    const signUpPromise = new Promise((resolve) => {
      resolveSignUp = resolve;
    });

    vi.spyOn(authActions, "signUp").mockReturnValue(signUpPromise as never);

    render(<SignUpPage />);

    // Step 1: Account
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // Step 2: Profile
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Mobile Number/i), {
      target: { value: "09171234567" },
    });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), {
      target: { value: "2000-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/Degree Program/i), {
      target: { value: "BS CS" },
    });
    fireEvent.change(screen.getByLabelText(/Year Level/i), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // Accept terms
    const termsCheckbox = document.getElementById("terms");
    if (termsCheckbox) {
      fireEvent.click(termsCheckbox);
    }

    const submitButton = screen.getByRole("button", {
      name: /Create Account/i,
    });
    expect(submitButton).not.toBeDisabled();

    // Click submit
    fireEvent.click(submitButton);

    // Wait for the button to become disabled and show loading state
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /Creating account/i }),
      ).toBeDisabled();
    });

    // Try clicking again
    fireEvent.click(screen.getByRole("button", { name: /Creating account/i }));

    // Should only be called once because it was disabled
    expect(authActions.signUp).toHaveBeenCalledTimes(1);

    // Resolve the promise to clean up
    resolveSignUp({ success: true, emailConfirmRequired: false });
  });

  it("should show appropriate error toast when login/signup fails", async () => {
    vi.spyOn(authActions, "signUp").mockResolvedValue({
      error: "Invalid email",
    });

    render(<SignUpPage />);

    // Step 1: Account
    fireEvent.change(screen.getByLabelText(/Email/i), {
      target: { value: "john@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText(/Confirm Password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    // Step 2: Profile
    fireEvent.change(screen.getByLabelText(/First Name/i), {
      target: { value: "John" },
    });
    fireEvent.change(screen.getByLabelText(/Last Name/i), {
      target: { value: "Doe" },
    });
    fireEvent.change(screen.getByLabelText(/Mobile Number/i), {
      target: { value: "09171234567" },
    });
    fireEvent.change(screen.getByLabelText(/Date of Birth/i), {
      target: { value: "2000-01-01" },
    });
    fireEvent.change(screen.getByLabelText(/Degree Program/i), {
      target: { value: "BS CS" },
    });
    fireEvent.change(screen.getByLabelText(/Year Level/i), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Continue/i }));

    const termsCheckbox = document.getElementById("terms");
    if (termsCheckbox) {
      fireEvent.click(termsCheckbox);
    }

    fireEvent.click(screen.getByRole("button", { name: /Create Account/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        "Please enter a valid email address.",
      );
    });
  });
});
