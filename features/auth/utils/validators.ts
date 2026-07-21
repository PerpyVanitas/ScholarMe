export const AUTH_VALIDATORS = {
  first_name: (v: string) => {
    if (!v.trim()) return "First name is required.";
    if (/\d/.test(v)) return "First name must not contain numbers.";
    if (v.trim().length < 2) return "First name must be at least 2 characters.";
    return "";
  },
  last_name: (v: string) => {
    if (!v.trim()) return "Last name is required.";
    if (/\d/.test(v)) return "Last name must not contain numbers.";
    if (v.trim().length < 2) return "Last name must be at least 2 characters.";
    return "";
  },
  email: (v: string) => {
    if (!v.trim()) return "Email address is required.";
    // Reject emails missing TLD or with illegal characters (Phase 3 spec)
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(v))
      return "Please enter a valid email address (e.g. you@example.com).";
    return "";
  },
  phone_number: (v: string) => {
    if (!v.trim()) return "Mobile number is required.";
    const digits = v.replace(/[\s\-().+]/g, "");
    // Philippine mobile: starts with 09 (11 digits) or +639 (12 digits with country code)
    const isLocal = /^09\d{9}$/.test(digits);
    const isIntl = /^639\d{9}$/.test(digits);
    if (!isLocal && !isIntl)
      return "Enter a valid Philippine mobile number (e.g. +63 917 123 4567 or 0917 123 4567).";
    return "";
  },
  confirmPassword: (v: string) => {
    if (!v.trim()) return "Please confirm your password.";
    return "";
  },
  date_of_birth: (v: string) => {
    if (!v) return "Date of birth is required.";
    const dob = new Date(v);
    if (isNaN(dob.getTime())) return "Please enter a valid date.";
    if (dob > new Date()) return "Date of birth cannot be in the future.";
    const now = new Date();
    let age = now.getFullYear() - dob.getFullYear();
    if (
      now.getMonth() < dob.getMonth() ||
      (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())
    )
      age--;
    if (age < 13) return "You must be at least 13 years old to register.";
    if (age > 120) return "Please enter a valid date of birth.";
    return "";
  },
  password: (v: string) => {
    if (!v) return "Password is required.";
    if (v.length < 8) return "Password must be at least 8 characters.";
    if (!/[a-z]/.test(v))
      return "Password must contain at least one lowercase letter.";
    if (!/[A-Z]/.test(v))
      return "Password must contain at least one uppercase letter.";
    if (!/\d/.test(v)) return "Password must contain at least one number.";
    if (!/[^a-zA-Z0-9]/.test(v))
      return "Password must contain at least one symbol (e.g. !@#$%^&*).";
    return "";
  },
  degree_program: (v: string) => {
    if (!v.trim()) return "Degree program is required.";
    return "";
  },
  year_level: (v: string) => {
    if (!v) return "Year level is required.";
    const year = Number(v);
    if (isNaN(year) || year < 1 || year > 6)
      return "Please enter a valid year level (1-6).";
    return "";
  },
};
