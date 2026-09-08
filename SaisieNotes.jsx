import { useState, useMemo } from 'react';

// ------------------------------------------------------------------
// Ecran de saisie des notes — reproduit la logique du bulletin ENIET
// Note/20 = moyenne(Eval1, Eval2)
// Total   = Note/20 x Coefficient
// Moyenne bloc = somme(Total du bloc) / somme(Coefficient du bloc)
// ------------------------------------------------------------------
// Pour l'instant les données (matières, élèves) sont simulées en dur.
// Une fois la base de données connectée, ces valeurs viendront d'un
// appel API (ex: /api/classes/:id/matieres, /api/eleves?classe=...).
// ------------------------------------------------------------------

const MATIERES_MOCK = [
  { id: 1, nom: 'Français', bloc: 'Enseignements généraux', coefficient: 1 },
  { id: 2, nom: 'Anglais', bloc: 'Enseignements généraux', coefficient: 1 },
  { id: 3, nom: 'E.C.M', bloc: 'Enseignements généraux', coefficient: 1 },
  { id: 4, nom: 'Maths Géné', bloc: 'Enseignements généraux', coefficient: 1 },
  { id: 5, nom: 'Science physique', bloc: 'Enseignements généraux', coefficient: 1 },
  { id: 6, nom: 'E.P.S', bloc: 'Enseignements généraux', coefficient: 1 },
  { id: 7, nom: 'TICE', bloc: "Sciences de l'éducation", coefficient: 3 },
  { id: 8, nom: 'Sociologie', bloc: "Sciences de l'éducation", coefficient: 2 },
  { id: 9, nom: 'Didact-Appli', bloc: "Sciences de l'éducation", coefficient: 3 },
  { id: 10, nom: 'Essais et mesures', bloc: 'Enseignements professionnels', coefficient: 3 },
  { id: 11, nom: 'Installations électriques', bloc: 'Enseignements professionnels', coefficient: 3 },
  { id: 12, nom: 'Conduite', bloc: 'Compétences diverses', coefficient: 2 },
  { id: 13, nom: 'Hygiène', bloc: 'Compétences diverses', coefficient: 1 },
];

const ELEVES_MOCK = [
  { id: 1, nom: 'GUEWA TATCHIM MARIUS JIVANO' },
  { id: 2, nom: 'KAHA TALLA PASSO BELVANIE' },
  { id: 3, nom: 'KOUNGOUE SIDIE HILAIRE SYLVAIN' },
];

function appreciation(noteSur20) {
  if (noteSur20 >= 16) return 'Expert';
  if (noteSur20 >= 12) return 'Acquise';
  if (noteSur20 >= 8) return "En cours d'acquisition";
  return 'Non acquise';
}

export default function SaisieNotes() {
  const [matiereId, setMatiereId] = useState(MATIERES_MOCK[0].id);
  const [numeroEval, setNumeroEval] = useState(1);
  // notes[eleveId] = { 1: valeurEval1, 2: valeurEval2 }
  const [notes, setNotes] = useState({});

  const matiere = MATIERES_MOCK.find((m) => m.id === matiereId);

  const handleChange = (eleveId, valeur) => {
    const num = valeur === '' ? '' : Math.max(0, Math.min(20, Number(valeur)));
    setNotes((prev) => ({
      ...prev,
      [eleveId]: { ...prev[eleveId], [numeroEval]: num },
    }));
  };

  const lignes = useMemo(() => {
    return ELEVES_MOCK.map((eleve) => {
      const paire = notes[eleve.id] || {};
      const eval1 = paire[1];
      const eval2 = paire[2];
      const hasBoth = eval1 !== undefined && eval1 !== '' && eval2 !== undefined && eval2 !== '';
      const noteSur20 = hasBoth ? (Number(eval1) + Number(eval2)) / 2 : null;
      const total = noteSur20 !== null ? noteSur20 * matiere.coefficient : null;
      return { eleve, eval1, eval2, noteSur20, total };
    });
  }, [notes, matiere]);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Matière</label>
          <select
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
            value={matiereId}
            onChange={(e) => setMatiereId(Number(e.target.value))}
          >
            {MATIERES_MOCK.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom} — coef. {m.coefficient}
              </option>
            ))}
          </select>
          <p className="text-xs text-neutral-500 mt-1">{matiere.bloc}</p>
        </div>
        <div>
          <label className="block text-sm text-neutral-600 mb-1">Évaluation en cours</label>
          <div className="flex gap-2">
            {[1, 2].map((n) => (
              <button
                key={n}
                onClick={() => setNumeroEval(n)}
                className={`flex-1 rounded-md border px-3 py-2 text-sm ${
                  numeroEval === n
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-300 text-neutral-700'
                }`}
              >
                Éval {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto border border-neutral-200 rounded-lg">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-neutral-50 text-left text-neutral-600">
              <th className="px-3 py-2 font-medium">Élève</th>
              <th className="px-3 py-2 font-medium text-right">Note (0–20)</th>
              <th className="px-3 py-2 font-medium text-right">Note/20</th>
              <th className="px-3 py-2 font-medium text-right">Total</th>
              <th className="px-3 py-2 font-medium">Appréciation</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map(({ eleve, noteSur20, total }) => (
              <tr key={eleve.id} className="border-t border-neutral-200">
                <td className="px-3 py-2">{eleve.nom}</td>
                <td className="px-3 py-2 text-right">
                  <input
                    type="number"
                    min={0}
                    max={20}
                    step={0.25}
                    value={(notes[eleve.id] || {})[numeroEval] ?? ''}
                    onChange={(e) => handleChange(eleve.id, e.target.value)}
                    className="w-20 border border-neutral-300 rounded-md px-2 py-1 text-right"
                    placeholder="—"
                  />
                </td>
                <td className="px-3 py-2 text-right tabular-nums">
                  {noteSur20 !== null ? noteSur20.toFixed(2) : '—'}
                </td>
                <td className="px-3 py-2 text-right tabular-nums font-medium">
                  {total !== null ? total.toFixed(2) : '—'}
                </td>
                <td className="px-3 py-2 text-neutral-600">
                  {noteSur20 !== null ? appreciation(noteSur20) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-neutral-500 mt-3">
        La colonne "Note/20" et "Total" ne se remplissent qu'une fois les deux évaluations
        saisies pour la matière — exactement la logique du bulletin papier.
      </p>
    </div>
  );
}
