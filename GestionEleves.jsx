import { useState, useMemo } from 'react';

// ------------------------------------------------------------------
// Gestion des élèves — liste + fiche d'ajout/modification
// Champs alignés sur la table `eleves` du schema.sql :
//   matricule, nom_prenoms, date_naissance, lieu_naissance, sexe,
//   section, statut (+ classe via la table `inscriptions`)
// Données simulées ici — remplacées par des appels API une fois la BDD
// branchée : GET/POST/PUT /api/eleves
// ------------------------------------------------------------------

const ELEVES_MOCK = [
  {
    id: 1,
    matricule: '240495084',
    nomPrenoms: 'GUEWA TATCHIM MARIUS JIVANO',
    dateNaissance: '2006-03-27',
    lieuNaissance: 'Douala',
    sexe: 'M',
    section: 'Industrielle',
    statut: 'Nouveau',
    classe: '2ème année EE',
  },
  {
    id: 2,
    matricule: '240495192',
    nomPrenoms: 'KAHA TALLA PASSO BELVANIE',
    dateNaissance: '1998-12-09',
    lieuNaissance: 'Babadjou',
    sexe: 'F',
    section: 'Industrielle',
    statut: 'Nouveau',
    classe: '2ème année EE',
  },
];

const CHAMPS_VIDES = {
  matricule: '',
  nomPrenoms: '',
  dateNaissance: '',
  lieuNaissance: '',
  sexe: 'M',
  section: '',
  statut: 'Nouveau',
  classe: '',
};

export default function GestionEleves() {
  const [eleves, setEleves] = useState(ELEVES_MOCK);
  const [recherche, setRecherche] = useState('');
  const [eleveEnEdition, setEleveEnEdition] = useState(null); // null = liste, {} = ajout, objet = modif
  const [erreurs, setErreurs] = useState({});

  const elevesFiltres = useMemo(() => {
    const q = recherche.trim().toLowerCase();
    if (!q) return eleves;
    return eleves.filter(
      (e) => e.nomPrenoms.toLowerCase().includes(q) || e.matricule.includes(q)
    );
  }, [eleves, recherche]);

  const ouvrirAjout = () => {
    setEleveEnEdition({ ...CHAMPS_VIDES });
    setErreurs({});
  };

  const ouvrirModification = (eleve) => {
    setEleveEnEdition({ ...eleve });
    setErreurs({});
  };

  const validerFormulaire = (data) => {
    const err = {};
    if (!data.matricule.trim()) err.matricule = 'Le matricule est obligatoire.';
    if (!data.nomPrenoms.trim()) err.nomPrenoms = 'Le nom est obligatoire.';
    if (!data.classe.trim()) err.classe = 'La classe est obligatoire.';
    const matriculeExisteDejaAilleurs = eleves.some(
      (e) => e.matricule === data.matricule && e.id !== data.id
    );
    if (matriculeExisteDejaAilleurs) err.matricule = 'Ce matricule est déjà utilisé.';
    return err;
  };

  const enregistrer = () => {
    const err = validerFormulaire(eleveEnEdition);
    if (Object.keys(err).length > 0) {
      setErreurs(err);
      return;
    }
    if (eleveEnEdition.id) {
      setEleves((prev) => prev.map((e) => (e.id === eleveEnEdition.id ? eleveEnEdition : e)));
    } else {
      setEleves((prev) => [...prev, { ...eleveEnEdition, id: Date.now() }]);
    }
    setEleveEnEdition(null);
  };

  const champ = (name, label, type = 'text') => (
    <div className="mb-3">
      <label className="block text-sm text-neutral-600 mb-1">{label}</label>
      <input
        type={type}
        value={eleveEnEdition[name]}
        onChange={(e) => setEleveEnEdition({ ...eleveEnEdition, [name]: e.target.value })}
        className={`w-full border rounded-md px-3 py-2 text-sm ${
          erreurs[name] ? 'border-red-400' : 'border-neutral-300'
        }`}
      />
      {erreurs[name] && <p className="text-xs text-red-600 mt-1">{erreurs[name]}</p>}
    </div>
  );

  // ---------------- Vue formulaire (ajout ou modification) ----------------
  if (eleveEnEdition) {
    return (
      <div className="max-w-md mx-auto p-4 sm:p-6">
        <h2 className="text-lg font-medium mb-4">
          {eleveEnEdition.id ? 'Modifier la fiche élève' : 'Nouvel élève'}
        </h2>

        {champ('matricule', 'Matricule')}
        {champ('nomPrenoms', 'Noms et prénoms')}
        {champ('dateNaissance', 'Date de naissance', 'date')}
        {champ('lieuNaissance', 'Lieu de naissance')}

        <div className="mb-3">
          <label className="block text-sm text-neutral-600 mb-1">Sexe</label>
          <select
            value={eleveEnEdition.sexe}
            onChange={(e) => setEleveEnEdition({ ...eleveEnEdition, sexe: e.target.value })}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </div>

        {champ('section', 'Section (ex: Industrielle)')}
        {champ('classe', 'Classe (ex: 2ème année EE)')}

        <div className="mb-4">
          <label className="block text-sm text-neutral-600 mb-1">Statut</label>
          <select
            value={eleveEnEdition.statut}
            onChange={(e) => setEleveEnEdition({ ...eleveEnEdition, statut: e.target.value })}
            className="w-full border border-neutral-300 rounded-md px-3 py-2 text-sm"
          >
            <option value="Nouveau">Nouveau</option>
            <option value="Ancien">Ancien</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={enregistrer}
            className="flex-1 bg-neutral-900 text-white rounded-md px-4 py-2 text-sm"
          >
            Enregistrer
          </button>
          <button
            onClick={() => setEleveEnEdition(null)}
            className="flex-1 border border-neutral-300 rounded-md px-4 py-2 text-sm"
          >
            Annuler
          </button>
        </div>
      </div>
    );
  }

  // ---------------- Vue liste ----------------
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Rechercher par nom ou matricule..."
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="flex-1 border border-neutral-300 rounded-md px-3 py-2 text-sm"
        />
        <button
          onClick={ouvrirAjout}
          className="bg-neutral-900 text-white rounded-md px-4 py-2 text-sm whitespace-nowrap"
        >
          Ajouter un élève
        </button>
      </div>

      {elevesFiltres.length === 0 ? (
        <p className="text-sm text-neutral-500 text-center py-8">Aucun élève trouvé.</p>
      ) : (
        <div className="divide-y divide-neutral-200 border border-neutral-200 rounded-lg">
          {elevesFiltres.map((eleve) => (
            <button
              key={eleve.id}
              onClick={() => ouvrirModification(eleve)}
              className="w-full text-left px-4 py-3 hover:bg-neutral-50 flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-medium">{eleve.nomPrenoms}</p>
                <p className="text-xs text-neutral-500">{eleve.classe} — {eleve.matricule}</p>
              </div>
              <span className="text-neutral-400">›</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
