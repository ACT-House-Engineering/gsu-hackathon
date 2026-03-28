import { createFileRoute } from "@tanstack/react-router";
import { BlackHoleExperience } from "@/components/black-hole/black-hole-experience";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return <BlackHoleExperience />;
}
