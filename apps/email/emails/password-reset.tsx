import { PasswordReset } from "../templates/password-reset";

export default function PasswordResetPreview() {
  return (
    <PasswordReset
      userName="John Doe"
      resetUrl="https://example.com/reset?token=xyz789"
      appName="GSU Build Day Techie Workshop"
      appUrl="https://example.com"
    />
  );
}
