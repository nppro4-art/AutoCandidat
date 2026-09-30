export default async function handler(req, res) {
  const q = String(req.query?.q || '').trim();
  if (!q) return res.status(400).json({ error: 'Recherche vide' });
  try {
    const url = 'https://recherche-entreprises.api.gouv.fr/search?q=' + encodeURIComponent(q) + '&per_page=20&page=1';
    const r = await fetch(url);
    if (!r.ok) return res.status(r.status).json({ error: 'API entreprises indisponible' });
    const data = await r.json();
    const results = (data.results || []).map((x) => {
      const siege = x.siege || {};
      return {
        id: x.siren || x.siret || crypto.randomUUID(),
        siren: x.siren || '',
        siret: x.siret || siege.siret || '',
        name: x.nom_complet || x.nom_raison_sociale || 'Entreprise',
        city: siege.libelle_commune || x.siege?.libelle_commune || '',
        postalCode: siege.code_postal || '',
        activity: x.activite_principale || siege.activite_principale || '',
        legalForm: x.nature_juridique || '',
        address: [siege.numero_voie, siege.type_voie, siege.libelle_voie].filter(Boolean).join(' '),
        source: 'annuaire-entreprises.data.gouv.fr'
      };
    });
    return res.status(200).json({ results });
  } catch (e) {
    return res.status(500).json({ error: 'Erreur serveur' });
  }
}