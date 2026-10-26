const PROJECTS = [
  { id: "prj_j05JpjLPyEaLepJkIr666gkKU2Rx", name: "JOHN.DEV Portfolio" },
  { id: "prj_2xWV7AjXJiLyJWS890ZbmENocHVI", name: "CV Builder Development" },
  { id: "prj_jhYhLuqzePEVNcNLeGImDubf4Q3O", name: "John Online Services" },
  { id: "prj_sNJMGw7napxgE0OEAkOqeoTL9VcL", name: "BizFlow AI" },
  { id: "prj_953ehy1wAbJAbkXGIgG5VSCYyyj6", name: "Campus Connect" },
  { id: "prj_jebpASg4qNXrQQ3nvZHXx8Y5ZE4h", name: "WPMS Pharmacy ERP" },
  { id: "prj_0Y3NMeQtGUbEcIrS5qS4eh41Wxt9", name: "WPMS Preview" },
  { id: "prj_pyzG3enfASwk5dy2SWwkoTqtP8xw", name: "WPMS Preview 2" },
  { id: "prj_ySZbqn7w6HgtK7chxVvCX3J4qA0Z", name: "WPMS Preview 3" },
  { id: "prj_DCuC95OTGshu79NTaUU3ADO4PA7T", name: "WPMS Preview 4" },
  { id: "prj_Gd8P4ITxymezY94Wy5WeObAISTn4", name: "FIMA Microfinance" },
  { id: "prj_JsWHloTgB0bbSmEWuawUFJOhB01R", name: "John JobCraft AI" },
  { id: "prj_gYwoIrpX6tYXlsUgUoSQYqjRy9ri", name: "Online Services" },
  { id: "prj_9i2UYBZ5hgn6H5WSrViErXNzbDt3", name: "John Online Services v0" },
  { id: "prj_mcGbHjMc3FCcqZq1bJk0J1gU4wE4", name: "Computer Analytics App" }
];
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
    const responses = await Promise.allSettled(PROJECTS.map(async project => {
      const endpoint = "https://api.vercel.com/v6/deployments?limit=6&projectId=" + encodeURIComponent(project.id) + "&teamId=" + encodeURIComponent(teamId);
      const response = await fetch(endpoint, { headers: { Authorization: "Bearer " + token, Accept: "application/json" } });
      if (!response.ok) throw new Error("Vercel returned " + response.status + " for " + project.name);
      const payload = await response.json();
      return (payload.deployments || []).map(d => ({
        projectName: project.name,
        state: d.readyState || d.state || "UNKNOWN",
        target: d.target || "preview",
        url: d.url || null,
        createdAt: d.createdAt || d.created || null,
        commitMessage: d.meta && d.meta.githubCommitMessage ? d.meta.githubCommitMessage : "Deployment update",
        commitRef: d.meta && d.meta.githubCommitRef ? d.meta.githubCommitRef : null,
        commitSha: d.meta && d.meta.githubCommitSha ? d.meta.githubCommitSha : null
      }));
    }));
    const deployments = responses.filter(x => x.status === "fulfilled").flatMap(x => x.value)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 30);
    if (!deployments.length) return res.status(502).json({ error: "No deployment records could be retrieved. Check token permissions." });
    return res.status(200).json({ deployments, projectsChecked: PROJECTS.length });
  } catch (error) {
    console.error("Vercel deployment feed failed:", error.message);
    return res.status(502).json({ error: "Could not retrieve Vercel deployments." });
  }
};
