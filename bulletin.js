// ------------------------------------------------------------------
// lib/bulletin.js
// Logique de calcul du bulletin — reproduit exactement le fichier Excel
// ENIET Douala. Fonctions pures : aucune dépendance à React ni à la BDD,
// donc testables et réutilisables (écran de saisie, PDF, API, etc.)
// ------------------------------------------------------------------

/**
 * Calcule Note/20 et Total pour chaque matière d'un élève.
 * @param {Array} matieres  [{ id, nom, bloc, coefficient }]
 * @param {Object} notesEval  { [matiereId]: { 1: eval1, 2: eval2 } }
 * @returns {Array} lignes [{ matiere, noteSur20, total }]
 */
export function calculerLignesMatieres(matieres, notesEval) {
  return matieres.map((matiere) => {
    const paire = notesEval[matiere.id] || {};
    const { 1: eval1, 2: eval2 } = paire;
    const hasBoth = eval1 !== undefined && eval1 !== '' && eval2 !== undefined && eval2 !== '';
    const noteSur20 = hasBoth ? (Number(eval1) + Number(eval2)) / 2 : null;
    const total = noteSur20 !== null ? noteSur20 * matiere.coefficient : null;
    return { matiere, eval1, eval2, noteSur20, total };
  });
}

/**
 * Regroupe les lignes par bloc et calcule le sous-total et la moyenne de chaque bloc.
 * Moyenne du bloc = somme(Total du bloc) / somme(Coefficient du bloc)
 * Les matières sans note complète sont ignorées dans le calcul (comme dans l'Excel).
 */
export function grouperParBloc(lignes) {
  const blocsMap = new Map();
  for (const ligne of lignes) {
    const nomBloc = ligne.matiere.bloc;
    if (!blocsMap.has(nomBloc)) blocsMap.set(nomBloc, []);
    blocsMap.get(nomBloc).push(ligne);
  }

  return Array.from(blocsMap.entries()).map(([nom, lignesBloc]) => {
    const lignesNotees = lignesBloc.filter((l) => l.total !== null);
    const totalCoef = lignesNotees.reduce((s, l) => s + l.matiere.coefficient, 0);
    const totalPoints = lignesNotees.reduce((s, l) => s + l.total, 0);
    const moyenne = totalCoef > 0 ? totalPoints / totalCoef : null;
    return { nom, lignes: lignesBloc, totalCoef, totalPoints, moyenne };
  });
}

/**
 * Moyenne générale de l'élève sur l'ensemble des blocs.
 * = somme(Total général) / somme(Coefficient général)
 */
export function calculerMoyenneGenerale(blocs) {
  const totalCoef = blocs.reduce((s, b) => s + b.totalCoef, 0);
  const totalPoints = blocs.reduce((s, b) => s + b.totalPoints, 0);
  return totalCoef > 0 ? totalPoints / totalCoef : null;
}

/**
 * Calcule le rang de chaque élève d'une classe à partir de leur moyenne générale.
 * @param {Array} resultatsClasse  [{ eleveId, moyenneGenerale }]
 * @returns {Array} même tableau, enrichi d'un champ "rang" (1 = meilleur)
 */
export function calculerRangs(resultatsClasse) {
  const tries = [...resultatsClasse].sort((a, b) => b.moyenneGenerale - a.moyenneGenerale);
  let rangCourant = 0;
  let derniereNote = null;
  return tries.map((resultat, index) => {
    if (resultat.moyenneGenerale !== derniereNote) {
      rangCourant = index + 1;
      derniereNote = resultat.moyenneGenerale;
    }
    return { ...resultat, rang: rangCourant };
  });
}

/**
 * Traduit une note/20 en appréciation, selon l'échelle du bulletin ENIET.
 * ECA = En cours d'acquisition ; A = Acquise ; E = Expert ; NA = Non acquise
 */
export function appreciation(noteSur20) {
  if (noteSur20 === null || noteSur20 === undefined) return null;
  if (noteSur20 >= 16) return 'E';
  if (noteSur20 >= 12) return 'A';
  if (noteSur20 >= 8) return 'ECA';
  return 'NA';
}

/**
 * Fonction "tout-en-un" : calcule le bulletin complet d'un élève.
 */
export function calculerBulletinEleve(matieres, notesEval) {
  const lignes = calculerLignesMatieres(matieres, notesEval);
  const blocs = grouperParBloc(lignes);
  const moyenneGenerale = calculerMoyenneGenerale(blocs);
  return { lignes, blocs, moyenneGenerale };
}
