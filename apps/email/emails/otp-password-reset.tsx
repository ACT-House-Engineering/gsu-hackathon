import { OTPEmail } from "../templates/otp-email";

export default function OTPPasswordResetPreview() {
  return (
    <OTPEmail
      otp="456789"
      type="forget-password"
      appName="GSU Build Day Techie Workshop"
      appUrl="https://example.com"
    />
  );
}
