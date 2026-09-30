export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'GEMINI_API_KEY manquante' });
  try {
    const { action, profile, documents, manual } = req.body || {};
    const prompt = action === 'structure_profile'
      ? `Tu es l'assistant CV d'AutoCandidat. Restructure les informations fournies sans inventer de faits. Retourne uniquement JSON valide avec les clés personal, education, experience, skills, languages, projects, interests, availability, summary. Le document peut être mal organisé mais contient les informations utiles. Corrige uniquement les fautes évidentes et déduplique. PROFIL: ${JSON.stringify(profile || {})} DOCUMENTS: ${JSON.stringify(documents || {})} INFORMATIONS MANUELLES: ${JSON.stringify(manual || {})}`
      : `Tu es l'assistant candidature d'AutoCandidat. Retourne uniquement JSON valide. Action: ${action}. Données: ${JSON.stringify({ profile, documents, manual })}`;
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.2 } })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.error?.message || 'Gemini indisponible' });
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    let result;
    try { result = JSON.parse(text); } catch { result = { raw: text }; }
    return res.status(200).json({ result });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur IA' });
  }
}