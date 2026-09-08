import { useMemo } from 'react';
import {
  calculerLignesMatieres,
  grouperParBloc,
  calculerMoyenneGenerale,
  calculerRangs,
  appreciation,
} from '../lib/bulletin.js';

// ------------------------------------------------------------------
// Affiche le bulletin complet d'un élève pour un trimestre donné.
// Données simulées ici — viendront de l'API une fois la BDD branchée :
//   GET /api/classes/:id/trimestres/:t/bulletins/:eleveId
// ------------------------------------------------------------------

const MATIERES_MOCK = [
  { id: 1, nom: 'Français', bloc: 'Enseignements généraux', coefficient: 1 },
  { id: 2, nom: 'Anglais', bloc: 'Enseignements généraux', coefficient: 1 },
  { id: 3, nom: 'Maths Géné', bloc: 'Enseignements généraux', coefficient: 1 },
  { id: 4, nom: 'TICE', bloc: "Sciences de l'éducation", coefficient: 3 },
  { id: 5, nom: 'Sociologie', bloc: "Sciences de l'éducation", coefficient: 2 },
  { id: 6, nom: 'Essais et mesures', bloc: 'Enseignements professionnels', coefficient: 3 },
  { id: 7, nom: 'Installations électriques', bloc: 'Enseignements professionnels', coefficient: 3 },
  { id: 8, nom: 'Conduite', bloc: 'Compétences diverses', coefficient: 2 },
  { id: 9, nom: 'Hygiène', bloc: 'Compétences diverses', coefficient: 1 },
];

// Notes de 3 élèves, pour pouvoir calculer un rang réaliste
const NOTES_CLASSE_MOCK = {
  1: { 1: { 1: 14, 2: 11 }, 2: { 1: 12, 2: 9 }, 3: { 1: 11, 2: 11 }, 4: { 1: 10, 2: 12 }, 5: { 1: 11, 2: 8 }, 6: { 1: 16, 2: 14 }, 7: { 1: 18, 2: 18 }, 8: { 1: 18, 2: 16 }, 9: { 1: 18, 2: 18 } },
  2: { 1: { 1: 12, 2: 9 }, 2: { 1: 10, 2: 7 }, 3: { 1: 9, 2: 9.5 }, 4: { 1: 11.5, 2: 10 }, 5: { 1: 8, 2: 5 }, 6: { 1: 14, 2: 14 }, 7: { 1: 9.5, 2: 18 }, 8: { 1: 10, 2: 12 }, 9: { 1: 18, 2: 18.5 } },
  3: { 1: { 1: 12.5, 2: 12 }, 2: { 1: 10, 2: 7 }, 3: { 1: 15, 2: 14.75 }, 4: { 1: 12.5, 2: 13 }, 5: { 1: 11, 2: 13 }, 6: { 1: 16, 2: 14 }, 7: { 1: 18, 2: 18 }, 8: { 1: 30 / 2, 2: 18 }, 9: { 1: 18, 2: 18 } },
};

const ELEVES_MOCK = [
  { id: 1, nom: 'GUEWA TATCHIM MARIUS JIVANO' },
  { id: 2, nom: 'KAHA TALLA PASSO BELVANIE' },
  { id: 3, nom: 'KOUNGOUE SIDIE HILAIRE SYLVAIN' },
];

export default function Bulletin({ eleveId = 1 }) {
  const eleve = ELEVES_MOCK.find((e) => e.id === eleveId);

  // Bulletin de l'élève affiché
  const { lignes, blocs, moyenneGenerale } = useMemo(() => {
    const lignesM = calculerLignesMatieres(MATIERES_MOCK, NOTES_CLASSE_MOCK[eleveId]);
    const blocsM = grouperParBloc(lignesM);
    return { lignes: lignesM, blocs: blocsM, moyenneGenerale: calculerMoyenneGenerale(blocsM) };
  }, [eleveId]);

  // Rang dans la classe : on calcule la moyenne de tout le monde pour comparer
  const rang = useMemo(() => {
    const resultats = ELEVES_MOCK.map((e) => {
      const l = calculerLignesMatieres(MATIERES_MOCK, NOTES_CLASSE_MOCK[e.id]);
      const b = grouperParBloc(l);
      return { eleveId: e.id, moyenneGenerale: calculerMoyenneGenerale(b) };
    });
    const avecRangs = calculerRangs(resultats);
    return avecRangs.find((r) => r.eleveId === eleveId)?.rang;
  }, [eleveId]);

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 bg-white text-neutral-900">
      <header className="text-center border-b border-neutral-300 pb-3 mb-4">
        <p className="text-xs">République du Cameroun — Paix-Travail-Patrie</p>
        <p className="text-xs">Ministère des Enseignements secondaires</p>
        <p className="text-sm font-medium mt-1">ENIET de Douala</p>
        <p className="text-sm font-medium">Bulletin des notes — Trimestre 1</p>
      </header>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm mb-4">
        <p><span className="text-neutral-500">Élève : </span>{eleve.nom}</p>
        <p><span className="text-neutral-500">Rang : </span>{rang ?? '—'} / {ELEVES_MOCK.length}</p>
      </div>

      {blocs.map((bloc) => (
        <div key={bloc.nom} className="mb-4">
          <p className="text-xs font-medium uppercase text-neutral-500 mb-1">{bloc.nom}</p>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {bloc.lignes.map((ligne) => (
                <tr key={ligne.matiere.id} className="border-t border-neutral-100">
                  <td className="py-1">{ligne.matiere.nom}</td>
                  <td className="py-1 text-right w-16">{ligne.noteSur20?.toFixed(2) ?? '—'}</td>
                  <td className="py-1 text-right w-10 text-neutral-500">c.{ligne.matiere.coefficient}</td>
                  <td className="py-1 text-right w-16 font-medium">{ligne.total?.toFixed(2) ?? '—'}</td>
                  <td className="py-1 text-right w-12 text-neutral-500">{appreciation(ligne.noteSur20) ?? '—'}</td>
                </tr>
              ))}
              <tr className="border-t border-neutral-300 font-medium">
                <td className="py-1">Moyenne du bloc</td>
                <td colSpan={3} className="py-1 text-right">{bloc.moyenne?.toFixed(2) ?? '—'}</td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      ))}

      <div className="border-t-2 border-neutral-900 pt-2 flex justify-between items-baseline">
        <span className="text-sm text-neutral-600">Moyenne générale</span>
        <span className="text-xl font-medium">{moyenneGenerale?.toFixed(2) ?? '—'}</span>
      </div>
    </div>
  );
}
