import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { EOL } from "node:os";
import { execa } from "execa";

// Create Git-ignored files for environment variable overrides
if (!existsSync("./.env.local")) {
  await writeFile(
    "./.env.local",
    [
      "# Overrides for the `.env` file in the root folder.",
      "#",
      "# CLOUDFLARE_API_TOKEN=xxxxx",
      "#",
      "",
      "API_URL=http://localhost:8080",
      "",
    ].join(EOL),
    "utf-8",
  );
}

try {
  await execa("bun", ["run", "tsc", "--build"], { stdin: "inherit" });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
} catch (err) {
  // console.error(err);
}
