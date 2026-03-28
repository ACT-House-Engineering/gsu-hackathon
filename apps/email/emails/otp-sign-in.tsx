import { OTPEmail } from "../templates/otp-email";

export default function OTPSignInPreview() {
  return (
    <OTPEmail
      otp="123456"
      type="sign-in"
      appName="GSU Build Day Techie Workshop"
      appUrl="https://example.com"
    />
  );
}
