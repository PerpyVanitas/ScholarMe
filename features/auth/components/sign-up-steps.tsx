import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { BookOpen, Users, Eye, EyeOff } from "lucide-react";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { TosLink, PrivacyLink } from "@/components/legal-modals";
import type { AUTH_VALIDATORS } from "@/features/auth/utils/validators";
import React from "react";

export interface SignUpFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  date_of_birth: string;
  password: string;
  confirmPassword: string;
  academic_year_joined: string;
  degree_program: string;
  year_level: string;
  esas_scholar: boolean;
  terms_accepted: boolean;
}

export interface SignUpFormProps {
  formData: SignUpFormData;
  setFormData: React.Dispatch<React.SetStateAction<SignUpFormData>>;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  validateField: (name: keyof typeof AUTH_VALIDATORS, value: string) => string;
  selectedRole: "learner" | "tutor";
  setSelectedRole: React.Dispatch<React.SetStateAction<"learner" | "tutor">>;
  showPassword?: boolean;
  setShowPassword?: React.Dispatch<React.SetStateAction<boolean>>;
  passwordMatch?: boolean;
  setPasswordMatch?: React.Dispatch<React.SetStateAction<boolean>>;
  passwordStrength?: number;
  strengthLabel?: string;
  strengthColor?: string;
  strengthTextColor?: string;
}

export function SignUpStep1({
  formData,
  setFormData,
  fieldErrors,
  setFieldErrors,
  validateField,
  selectedRole,
  setSelectedRole,
  showPassword,
  setShowPassword,
  passwordMatch,
  setPasswordMatch,
  passwordStrength = 0,
  strengthLabel = "",
  strengthColor = "",
  strengthTextColor = "",
}: SignUpFormProps) {
  return (
    <>
      {/* Role selector */}
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-medium">I want to join as</Label>
        <div className="grid grid-cols-2 gap-3">
          {(["learner", "tutor"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setSelectedRole(r)}
              className={cn(
                "flex items-center gap-3 rounded-lg border-2 p-3.5 text-left transition-all",
                selectedRole === r
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40 bg-card",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-md",
                  selectedRole === r
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {r === "learner" ? (
                  <BookOpen className="h-4 w-4" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
              </div>
              <div>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    selectedRole === r ? "text-primary" : "text-foreground",
                  )}
                >
                  {r === "learner" ? "Learner" : "Tutor"}
                </p>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  {r === "learner" ? "Find & book tutors" : "Teach & earn"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">
          Email Address <span className="text-destructive">*</span>
        </Label>
        <Input
          id="email"
          type="text"
          placeholder="you@example.com"
          required
          autoComplete="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          onBlur={(e) => validateField("email", e.target.value)}
          className={cn(
            fieldErrors.email &&
              "border-destructive focus-visible:ring-destructive",
          )}
        />
        {fieldErrors.email && (
          <p className="text-xs text-destructive">{fieldErrors.email}</p>
        )}
      </div>

      {/* Password */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">
          Password <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="Min. 8 characters"
            required
            minLength={8}
            autoComplete="new-password"
            value={formData.password}
            onChange={(e) =>
              setFormData({
                ...formData,
                password: e.target.value,
              })
            }
            onBlur={(e) => validateField("password", e.target.value)}
            className={cn(
              "pr-10",
              fieldErrors.password &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword && setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {fieldErrors.password && (
          <p className="text-xs text-destructive mt-1">
            {fieldErrors.password}
          </p>
        )}
        <div
          className={cn(
            "mt-1 transition-all",
            formData.password ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <div className="flex items-center gap-2">
            <div className="flex flex-1 gap-1">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-all duration-300",
                    formData.password && i <= passwordStrength
                      ? strengthColor
                      : "bg-border",
                  )}
                />
              ))}
            </div>
            <span
              className={cn(
                "text-xs font-medium w-10 text-right transition-colors",
                strengthTextColor,
              )}
            >
              {formData.password ? strengthLabel : ""}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Use 8+ characters with uppercase, numbers, and symbols for a strong
            password.
          </p>
        </div>
      </div>

      {/* Confirm Password */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="confirmPassword">
          Confirm Password <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            placeholder="Repeat your password"
            required
            minLength={8}
            autoComplete="new-password"
            value={formData.confirmPassword}
            onChange={(e) => {
              const val = e.target.value;
              setFormData({ ...formData, confirmPassword: val });
              const match = val === formData.password || val === "";
              if (setPasswordMatch) setPasswordMatch(match);
              if (!match)
                setFieldErrors((prev) => ({
                  ...prev,
                  confirmPassword: "Passwords do not match.",
                }));
              else
                setFieldErrors((prev) => ({
                  ...prev,
                  confirmPassword: "",
                }));
            }}
            className={cn(
              "pr-10",
              (formData.confirmPassword && !passwordMatch) ||
                fieldErrors.confirmPassword
                ? "border-destructive focus-visible:ring-destructive"
                : "",
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword && setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
        {(fieldErrors.confirmPassword ||
          (formData.confirmPassword && !passwordMatch)) && (
          <p className="text-xs text-destructive">
            {fieldErrors.confirmPassword || "Passwords do not match."}
          </p>
        )}
      </div>

      <OAuthButtons />
    </>
  );
}

export function SignUpStep2({
  formData,
  setFormData,
  fieldErrors,
  validateField,
  selectedRole,
}: SignUpFormProps) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="first_name">
            First Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="first_name"
            type="text"
            placeholder="Maria"
            required
            autoComplete="given-name"
            value={formData.first_name}
            onChange={(e) =>
              setFormData({
                ...formData,
                first_name: e.target.value,
              })
            }
            onBlur={(e) => validateField("first_name", e.target.value)}
            className={cn(
              fieldErrors.first_name &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {fieldErrors.first_name && (
            <p className="text-xs text-destructive">{fieldErrors.first_name}</p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="last_name">
            Last Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="last_name"
            type="text"
            placeholder="Santos"
            required
            autoComplete="family-name"
            value={formData.last_name}
            onChange={(e) =>
              setFormData({
                ...formData,
                last_name: e.target.value,
              })
            }
            onBlur={(e) => validateField("last_name", e.target.value)}
            className={cn(
              fieldErrors.last_name &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {fieldErrors.last_name && (
            <p className="text-xs text-destructive">{fieldErrors.last_name}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="phone_number">
            Mobile Number <span className="text-destructive">*</span>
          </Label>
          <Input
            id="phone_number"
            type="tel"
            placeholder="+63 917 123 4567"
            autoComplete="tel"
            value={formData.phone_number}
            onChange={(e) =>
              setFormData({
                ...formData,
                phone_number: e.target.value,
              })
            }
            onBlur={(e) => validateField("phone_number", e.target.value)}
            className={cn(
              fieldErrors.phone_number &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {fieldErrors.phone_number && (
            <p className="text-xs text-destructive">
              {fieldErrors.phone_number}
            </p>
          )}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="date_of_birth">
            Date of Birth <span className="text-destructive">*</span>
          </Label>
          <Input
            id="date_of_birth"
            type="date"
            required
            value={formData.date_of_birth}
            onChange={(e) =>
              setFormData({
                ...formData,
                date_of_birth: e.target.value,
              })
            }
            onBlur={(e) => validateField("date_of_birth", e.target.value)}
            className={cn(
              fieldErrors.date_of_birth &&
                "border-destructive focus-visible:ring-destructive",
            )}
          />
          {fieldErrors.date_of_birth && (
            <p className="text-xs text-destructive">
              {fieldErrors.date_of_birth}
            </p>
          )}
        </div>
      </div>

      {selectedRole === "learner" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="degree_program">
              Degree Program <span className="text-destructive">*</span>
            </Label>
            <Input
              id="degree_program"
              type="text"
              placeholder="e.g. BS Computer Science"
              required
              value={formData.degree_program}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  degree_program: e.target.value,
                })
              }
              onBlur={(e) => validateField("degree_program", e.target.value)}
              className={cn(
                fieldErrors.degree_program &&
                  "border-destructive focus-visible:ring-destructive",
              )}
            />
            {fieldErrors.degree_program && (
              <p className="text-xs text-destructive">
                {fieldErrors.degree_program}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="year_level">
              Year Level <span className="text-destructive">*</span>
            </Label>
            <select
              id="year_level"
              required
              value={formData.year_level}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  year_level: e.target.value,
                })
              }
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {[1, 2, 3, 4, 5, 6].map((y) => (
                <option key={y} value={y}>
                  Year {y}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="academic_year_joined">
          Academic Year Joined <span className="text-destructive">*</span>
        </Label>
        <select
          id="academic_year_joined"
          required
          value={formData.academic_year_joined}
          onChange={(e) =>
            setFormData({
              ...formData,
              academic_year_joined: e.target.value,
            })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="2022-2023">2022-2023</option>
          <option value="2023-2024">2023-2024</option>
          <option value="2024-2025">2024-2025</option>
          <option value="2025-2026">2025-2026</option>
        </select>
      </div>

      {selectedRole === "tutor" && (
        <div className="flex items-center gap-2.5 bg-muted/50 p-3 rounded-lg border border-border/50">
          <input
            type="checkbox"
            id="esas_scholar"
            checked={formData.esas_scholar}
            onChange={(e) =>
              setFormData({
                ...formData,
                esas_scholar: e.target.checked,
              })
            }
            className="h-4 w-4 rounded border-input text-primary focus:ring-primary bg-background accent-primary"
          />
          <Label
            htmlFor="esas_scholar"
            className="text-sm font-medium cursor-pointer"
          >
            I am an ESAS Scholar
          </Label>
        </div>
      )}
    </>
  );
}

export function SignUpStep3({ formData, setFormData, selectedRole }: SignUpFormProps) {
  return (
    <>
      <div className="rounded-lg border bg-muted/30 p-4 flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-foreground">
          Review your information
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Role</p>
            <p className="font-medium capitalize">{selectedRole}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Email</p>
            <p className="font-medium truncate">{formData.email}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Name</p>
            <p className="font-medium">
              {formData.first_name} {formData.last_name}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Phone</p>
            <p className="font-medium">{formData.phone_number || "—"}</p>
          </div>
          {selectedRole === "learner" && (
            <>
              <div>
                <p className="text-muted-foreground text-xs">Program</p>
                <p className="font-medium">
                  {formData.degree_program || "—"}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Year Level</p>
                <p className="font-medium">Year {formData.year_level}</p>
              </div>
            </>
          )}
          <div>
            <p className="text-muted-foreground text-xs">Academic Year</p>
            <p className="font-medium">{formData.academic_year_joined}</p>
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <input
          type="checkbox"
          id="terms"
          required
          checked={formData.terms_accepted}
          onChange={(e) =>
            setFormData({
              ...formData,
              terms_accepted: e.target.checked,
            })
          }
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-primary"
        />
        <Label
          htmlFor="terms"
          className="text-xs leading-relaxed font-normal cursor-pointer text-muted-foreground"
        >
          I agree to the{" "}
          <TosLink className="text-foreground underline hover:no-underline font-medium" />{" "}
          and{" "}
          <PrivacyLink className="text-foreground underline hover:no-underline font-medium" />
          <span className="text-destructive"> *</span>
        </Label>
      </div>
    </>
  );
}
