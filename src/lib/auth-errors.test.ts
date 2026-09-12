import { describe, expect, it } from "vitest";
import { authErrorKey } from "@/lib/auth-errors";

describe("authErrorKey", () => {
  it("a wrong password is bad credentials, not a bad code", () => {
    expect(authErrorKey({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe("badCredentials");
    expect(authErrorKey({ message: "Invalid login credentials" })).toBe("badCredentials");
  });

  it("a code sign-in for an unknown address says there is no account", () => {
    expect(authErrorKey({ code: "otp_disabled", message: "Signups not allowed for otp" })).toBe("noAccount");
    expect(authErrorKey({ message: "User not found" })).toBe("noAccount");
  });

  it("wrong or expired codes stay badCode", () => {
    expect(authErrorKey({ code: "otp_expired", message: "Token has expired or is invalid" })).toBe("badCode");
    expect(authErrorKey({ message: "Token has expired or is invalid" })).toBe("badCode");
  });

  it("a request that never reached the server is a network error", () => {
    expect(authErrorKey({ name: "AuthRetryableFetchError", message: "Failed to fetch" })).toBe("network");
    expect(authErrorKey({ message: "TypeError: Failed to fetch" })).toBe("network");
    expect(authErrorKey({ message: "Load failed" })).toBe("network");
  });
});
