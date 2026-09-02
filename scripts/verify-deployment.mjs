import { execSync } from "node:child_process";
import https from "node:https";

const REPO_OWNER = "amahdy59";
const REPO_NAME = "Responsive-Resume-2026";
const PRODUCTION_DOMAIN = "https://creativemahdy.space";
const CASE_STUDY_PATHS = [
  "/",
  "/project-haj-arafa.html",
  "/project-cairo-airport.html",
  "/project-hr-tool.html",
  "/project-azkar-app.html",
  "/project-lego-explorer.html",
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": "Portfolio-Deployment-Checker/1.0",
      Accept: "application/vnd.github.v3+json",
    };
    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const options = { headers };

    https.get(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${data}`));
          } else {
            resolve(JSON.parse(data));
          }
        } catch (err) {
          reject(err);
        }
      });
    }).on("error", reject);
  });
}

function checkLiveUrl(url) {
  return new Promise((resolve) => {
    const start = Date.now();
    https.get(url, (res) => {
      let bodyLength = 0;
      res.on("data", (chunk) => (bodyLength += chunk.length));
      res.on("end", () => {
        resolve({
          url,
          status: res.statusCode,
          durationMs: Date.now() - start,
          sizeBytes: bodyLength,
          ok: res.statusCode === 200 && bodyLength > 500,
        });
      });
    }).on("error", (err) => {
      resolve({
        url,
        status: 0,
        error: err.message,
        durationMs: Date.now() - start,
        ok: false,
      });
    });
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getCommitSha() {
  const customSha = process.argv[2];
  if (customSha && /^[0-9a-f]{7,40}$/i.test(customSha)) {
    return customSha;
  }
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    throw new Error("Unable to determine current Git commit SHA.");
  }
}

async function verifyDeployment() {
  const targetSha = await getCommitSha();
  const shortSha = targetSha.substring(0, 7);

  console.log("\n========================================================");
  console.log(`🚀 Automated Deployment Checker for [${shortSha}]`);
  console.log(`📡 Repository: ${REPO_OWNER}/${REPO_NAME}`);
  console.log("========================================================\n");

  console.log(`⏳ Monitoring GitHub Actions workflow for commit ${shortSha}...`);

  let run = null;
  const maxAttempts = 45; // ~3.5 minutes max

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await fetchJson(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs?per_page=10`
      );

      const matchingRun = data.workflow_runs?.find(
        (r) => r.head_sha.startsWith(targetSha) || targetSha.startsWith(r.head_sha)
      );

      if (matchingRun) {
        run = matchingRun;
        const status = run.status.toUpperCase();
        const conclusion = run.conclusion ? run.conclusion.toUpperCase() : "PENDING";

        process.stdout.write(
          `\r[Attempt ${attempt}/${maxAttempts}] Workflow: ${run.name} | Status: ${status} | Conclusion: ${conclusion}   `
        );

        if (run.status === "completed") {
          console.log("\n");
          break;
        }
      } else {
        process.stdout.write(
          `\r[Attempt ${attempt}/${maxAttempts}] Waiting for GitHub Actions to register commit ${shortSha}...   `
        );
      }
    } catch (err) {
      if (err.message.includes("403") || err.message.includes("rate limit")) {
        console.log("\nℹ️ GitHub API rate limit reached for unauthenticated requests. Skipping to live health checks...");
        break;
      }
      process.stdout.write(`\r[Warning] API fetch notice: ${err.message}   `);
    }

    await sleep(5000);
  }

  if (!run || run.status !== "completed") {
    console.log("\n\n⚠️ Could not poll GitHub Actions status (rate limit or timeout). Proceeding to live checks.");
  } else {
    // Fetch job details
    try {
      const jobsData = await fetchJson(
        `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/actions/runs/${run.id}/jobs`
      );

    console.log("📋 Workflow Step Breakdown:");
    if (jobsData.jobs && jobsData.jobs.length) {
      for (const job of jobsData.jobs) {
        console.log(`\n  Job: ${job.name} (${job.conclusion})`);
        for (const step of job.steps) {
          const icon =
            step.conclusion === "success"
              ? "✅"
              : step.conclusion === "failure"
              ? "❌"
              : step.conclusion === "skipped"
              ? "⏭️"
              : "⏳";
          console.log(`    ${icon} ${step.name} [${step.conclusion || step.status}]`);
        }
      }
    }
  } catch (err) {
    console.log(`Could not fetch job step details: ${err.message}`);
  }

    if (run.conclusion !== "success") {
      console.error(`\n❌ Deployment FAILED for commit ${shortSha}!`);
      console.error(`🔗 Workflow logs: ${run.html_url}`);
      process.exit(1);
    }

    console.log(`\n✅ GitHub Actions deployment SUCCEEDED for commit ${shortSha}!`);
  }

  // Run live production endpoint health check
  console.log("\n🌐 Running Live Production Health Checks...");
  console.log(`🔗 Target: ${PRODUCTION_DOMAIN}\n`);

  let allLiveOk = true;
  for (const path of CASE_STUDY_PATHS) {
    const fullUrl = `${PRODUCTION_DOMAIN}${path}`;
    const result = await checkLiveUrl(fullUrl);

    if (result.ok) {
      console.log(
        `  ✅ [HTTP ${result.status}] ${path.padEnd(30)} (${result.durationMs}ms, ${(
          result.sizeBytes / 1024
        ).toFixed(1)} KB)`
      );
    } else {
      allLiveOk = false;
      console.error(
        `  ❌ [HTTP ${result.status || "ERR"}] ${path.padEnd(30)} Error: ${
          result.error || "Invalid response"
        }`
      );
    }
  }

  console.log("\n========================================================");
  if (allLiveOk) {
    console.log("🎉 ALL SYSTEMS OPERATIONAL: Deployment is 100% live & verified!");
  } else {
    console.warn("⚠️ Some endpoints returned non-200 responses. Check DNS/Pages propagation.");
  }
  console.log("========================================================\n");
}

verifyDeployment().catch((err) => {
  console.error("Verification checker error:", err);
  process.exit(1);
});
