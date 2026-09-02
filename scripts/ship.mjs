import { execSync } from "node:child_process";

console.log("\n========================================================");
console.log("🛡️  PRE-FLIGHT: Running Automated Pre-Push Verification Suite");
console.log("========================================================\n");

try {
  console.log(
    "▶ Running the complete lint, build, browser, visual, accessibility, and performance gate...",
  );
  execSync("npm test", { stdio: "inherit" });

  console.log("\n✅ ALL PRE-PUSH CHECKS PASSED!");
} catch {
  console.error("\n❌ Pre-push verification failed. Push aborted.");
  process.exit(1);
}

// Stage and commit if message provided
const commitMessage = process.argv.slice(2).join(" ").trim();
if (commitMessage) {
  console.log(`\n📝 Committing changes: "${commitMessage}"`);
  try {
    execSync("git add -A", { stdio: "inherit" });
    execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, {
      stdio: "inherit",
    });
  } catch {
    console.log("No new changes to commit, proceeding with current HEAD.");
  }
}

console.log("\n🚀 Pushing to GitHub (origin main)...");
try {
  execSync("git push origin main", { stdio: "inherit" });
} catch {
  console.error("❌ Git push failed.");
  process.exit(1);
}

console.log("\n🛰️  Initiating Post-Push Deployment Verification...");
try {
  execSync("node scripts/verify-deployment.mjs", { stdio: "inherit" });
} catch {
  console.error("❌ Post-push verification reported an issue.");
  process.exit(1);
}
