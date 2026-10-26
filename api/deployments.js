module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=120, stale-while-revalidate=300");
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed." });
  }
  const token = process.env.VERCEL_API_TOKEN;
  if (!token) return res.status(503).json({ error: "Vercel deployment feed is not configured." });
  const teamId = process.env.VERCEL_TEAM_ID || "team_aVFRDprke19KJFRbP4EUIa1r";
  try {
    const endpoint = "https://api.vercel.com/v6/deployments?limit=24&teamId=" + encodeURIComponent(teamId);
    const response = await fetch(endpoint, { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
    if (!response.ok) {
      console.error("Vercel deployment API returned", response.status);
      return res.status(502).json({ error: "Could not retrieve Vercel deployments." });
    }
    const payload = await response.json();
    const deployments = (payload.deployments || []).map(d => ({
      projectName: d.name || "Vercel project",
      state: d.readyState || d.state || "UNKNOWN",
      target: d.target || "preview",
      url: d.url || null,
      createdAt: d.createdAt || d.created || null,
      commitMessage: d.meta && d.meta.githubCommitMessage ? d.meta.githubCommitMessage : "Deployment update",
      commitRef: d.meta && d.meta.githubCommitRef ? d.meta.githubCommitRef : null,
      commitSha: d.meta && d.meta.githubCommitSha ? d.meta.githubCommitSha : null
    }));
    return res.status(200).json({ deployments });
  } catch (error) {
    console.error("Vercel deployment feed failed:", error.message);
    return res.status(502).json({ error: "Could not retrieve Vercel deployments." });
  }
};
