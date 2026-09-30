export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST uniquement' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(503).json({ error: 'GEMINI_API_KEY manquante' });
  try {
    const body = req.body || {};
    const action = body.action || 'structure_profile';
    const payload = JSON.stringify({ profile: body.profile || {}, documents: body.documents || {}, manual: body.manual || {} });
    let instruction = '';
    if (action === 'structure_profile') {
      instruction = 'Restructure ces informations de CV sans rien inventer. Retourne uniquement JSON avec personal, education, experience, skills, languages, projects, interests, availability, summary. Corrige les fautes evidentes et deduplique. ';
    } else if (action === 'generate_cv') {
      instruction = 'Crée un CV professionnel en français à partir de ces données. N’invente aucune expérience, date, diplôme ou compétence. Retourne uniquement JSON avec title, summary, sections, skills. ';
    } else if (action === 'generate_letter') {
      instruction = 'Crée une lettre de motivation professionnelle en français à partir de ces données. N’invente aucun fait. Retourne uniquement JSON avec subject, greeting, paragraphs, closing. ';
    } else {
      instruction = 'Retourne uniquement JSON valide et n’invente aucun fait. ';
    }
    const prompt = instruction + payload;
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + encodeURIComponent(key), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
      })
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