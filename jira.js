export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { summary, description, issueTypeId } = req.body;
  const CLOUD_ID = "d7c98180-105e-4757-b222-af766b22ce0e";
  const PROJECT_KEY = "MSTI";
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;

  if (!email || !token) {
    return res.status(500).json({ error: "Faltan credenciales de Jira en variables de entorno" });
  }

  try {
    const response = await fetch(
      `https://api.atlassian.com/ex/jira/${CLOUD_ID}/rest/api/3/issue`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`,
        },
        body: JSON.stringify({
          fields: {
            project: { key: PROJECT_KEY },
            summary,
            description: {
              type: "doc",
              version: 1,
              content: [{ type: "paragraph", content: [{ type: "text", text: description }] }],
            },
            issuetype: { id: issueTypeId },
          },
        }),
      }
    );
    const data = await response.json();
    if (data.key) {
      return res.status(200).json({ success: true, issueKey: data.key });
    } else {
      return res.status(400).json({ success: false, error: JSON.stringify(data.errors || data) });
    }
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
}
