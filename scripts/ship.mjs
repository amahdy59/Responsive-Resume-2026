import { execFileSync } from "node:child_process";

// Commit explicitly before shipping: never sweep unrelated files into a release.
if (process.argv.length > 2)
  throw new Error(
    "Commit intended files first, then run npm run ship without arguments.",
  );
const git = (args) => execFileSync("git", args, { encoding: "utf8" });
if (git(["status", "--porcelain"]).trim())
  throw new Error("Commit or stash pending changes before shipping.");
if (git(["branch", "--show-current"]).trim() !== "main")
  throw new Error("Ship from main.");
if (git(["config", "core.hooksPath"]).trim() !== ".githooks")
  throw new Error("Run npm run prepare to enable the mandatory pre-push gate.");
execFileSync("git", ["push", "origin", "main"], { stdio: "inherit" });
execFileSync(process.execPath, ["scripts/verify-deployment.mjs"], {
  stdio: "inherit",
});
