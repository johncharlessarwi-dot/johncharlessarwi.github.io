module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  // Read public GitHub Actions metadata; no Vercel API token is required.
  try {
    const response = await fetch("https://api.github.com/repos/johncharlessarwi-dot/johncharlessarwi.github.io/actions/runs?per_page=12", {
      headers: { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" }
    });
    if (!response.ok) {
      // GitHub may deny unauthenticated Actions-run access (HTTP 403).
      // Treat this optional feed as unavailable rather than failing the page request.
      return res.status(200).json({
        deployments: [],
        source: "github-actions",
        count: 0,
        unavailable: true
      });
    }
    const payload = await response.json();
    const deployments = (Array.isArray(payload.workflow_runs) ? payload.workflow_runs.slice(0, 12) : []).filter(run => run && typeof run === "object").map(run => ({
      projectName: typeof run.name === "string" ? run.name.slice(0, 100) : "Portfolio CI/CD",
      state: run.status === "completed" ? (run.conclusion || "completed").toUpperCase() : (run.status || "queued").toUpperCase(),
      target: "github-actions",
      url: typeof run.html_url === "string" && /^https:\/\/github\.com\/johncharlessarwi-dot\/johncharlessarwi\.github\.io\/actions\/runs\/\d+$/.test(run.html_url) ? run.html_url : null,
      createdAt: run.created_at ? Date.parse(run.created_at) : null,
      commitMessage: typeof run.display_title === "string" ? run.display_title.slice(0, 200) : "Workflow run",
      commitRef: typeof run.head_branch === "string" ? run.head_branch.slice(0, 100) : null,
      commitSha: typeof run.head_sha === "string" && /^[a-f0-9]{7,64}$/i.test(run.head_sha) ? run.head_sha : null
    }));
    return res.status(200).json({ deployments, source: "github-actions", count: deployments.length });
  } catch (error) {
    console.error("Public delivery activity failed:", error.message);
    return res.status(502).json({ error: "Could not retrieve public delivery activity." });
  }
};
