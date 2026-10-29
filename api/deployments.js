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
    const deployments = (payload.workflow_runs || []).map(run => ({
      projectName: run.name || "Portfolio CI/CD",
      state: run.status === "completed" ? (run.conclusion || "completed").toUpperCase() : (run.status || "queued").toUpperCase(),
      target: "github-actions",
      url: run.html_url || null,
      createdAt: run.created_at ? Date.parse(run.created_at) : null,
      commitMessage: run.display_title || "Workflow run",
      commitRef: run.head_branch || null,
      commitSha: run.head_sha || null
    }));
    return res.status(200).json({ deployments, source: "github-actions", count: deployments.length });
  } catch (error) {
    console.error("Public delivery activity failed:", error.message);
    return res.status(502).json({ error: "Could not retrieve public delivery activity." });
  }
};
