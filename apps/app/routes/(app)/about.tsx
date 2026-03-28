import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@repo/ui";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/(app)/about")({
  component: About,
});

const workshopMaterialsUrl = "https://link.act.house/bdx";
const eventHubUrl =
  "https://acthouse.notion.site/Build-Day-X-Innovation-Bootcamp-Georgia-State-University-3254a99790e080bd8281f7b14619a8eb";
const announcementUrl = "https://www.instagram.com/p/DVcWCH9FGyn/";
const launchUrl = "https://eni.gsu.edu/launchgsu/";

const cards = [
  {
    title: "24-hour prototype sprint",
    description:
      "The public event framing is centered on getting from idea to working prototype quickly.",
  },
  {
    title: "Agentic Engineering workshop",
    description:
      "The workshop materials move from prompts to datasets to code prototypes.",
  },
  {
    title: "Mentors, judges, workshops",
    description:
      "The event hub and promo materials position support and feedback as part of the experience.",
  },
  {
    title: "Interdisciplinary collaboration",
    description:
      "The public promo explicitly mentions architecture, design, technology, and creative disciplines.",
  },
];

function About() {
  return (
    <div className="container mx-auto px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-16 text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight">
          About the GSU Build Day Techie Workshop
        </h1>
        <p className="mx-auto max-w-3xl text-xl text-muted-foreground">
          This app is the workshop companion for the public Agentic Engineering
          materials used alongside Build Day X Innovation Bootcamp at Georgia
          State University.
        </p>
      </div>

      <section className="mb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">What this workshop is</CardTitle>
            <CardDescription>
              Verified from the public materials we could access
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              The ENIGSU announcement describes Build Day X as a fast-moving
              innovation environment where students build at a professional
              level and turn ideas into working prototypes in just 24 hours.
            </p>
            <p className="text-muted-foreground">
              The workshop materials focus on agentic engineering and use a
              simple progression: prompts first, structured data next, then code
              prototyping. The app and overview site in this repo now reflect
              that framing directly.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mb-20">
        <h2 className="mb-8 text-center text-3xl font-bold tracking-tight">
          Public event highlights
        </h2>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {cards.map((card) => (
            <Card key={card.title}>
              <CardHeader>
                <CardTitle>{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Useful public links</CardTitle>
            <CardDescription>
              The same sources used to update this repo
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Button asChild>
              <a
                href={workshopMaterialsUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Workshop Materials
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={eventHubUrl} target="_blank" rel="noopener noreferrer">
                Open Event Hub
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a
                href={announcementUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View ENIGSU Announcement
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href={launchUrl} target="_blank" rel="noopener noreferrer">
                Visit LaunchGSU
              </a>
            </Button>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-12" />

      <section className="text-center">
        <h2 className="mb-4 text-3xl font-bold tracking-tight">
          Continue through the workshop
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
          Use the overview site for the workshop flow and resource links, then
          adapt the app itself for demos and hands-on exercises.
        </p>
      </section>
    </div>
  );
}
