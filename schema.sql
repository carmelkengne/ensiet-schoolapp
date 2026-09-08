-- ============================================================
-- SCHEMA DE BASE DE DONNEES — SYSTEME DE GESTION SCOLAIRE ENSIET
-- ============================================================
-- Reproduit la logique du bulletin ENIET Douala (fichier ELEC_2.xlsx)
-- Note/20 = moyenne(Eval1, Eval2)
-- Total matière = Note/20 x Coefficient
-- Moyenne bloc = somme(Total) / somme(Coefficient) du bloc
-- Moyenne trimestre = somme(Total général) / somme(Coefficient général)
-- ============================================================

-- ------------------------------------------------------------
-- 1. STRUCTURE ACADEMIQUE
-- ------------------------------------------------------------

CREATE TABLE annees_scolaires (
    id SERIAL PRIMARY KEY,
    libelle VARCHAR(9) NOT NULL UNIQUE          -- ex: '2025-2026'
);

CREATE TABLE trimestres (
    id SERIAL PRIMARY KEY,
    annee_scolaire_id INTEGER NOT NULL REFERENCES annees_scolaires(id),
    numero SMALLINT NOT NULL CHECK (numero IN (1, 2, 3)),
    UNIQUE (annee_scolaire_id, numero)
);

CREATE TABLE filieres (
    id SERIAL PRIMARY KEY,
    nom VARCHAR(150) NOT NULL,                  -- ex: "Electricité d'équipement"
    code VARCHAR(20) NOT NULL UNIQUE             -- ex: 'EE'
);

-- Les 4 blocs vus dans le bulletin : chaque filière peut avoir ses propres blocs,
-- mais dans la pratique ce sont toujours les mêmes 4 catégories.
CREATE TABLE blocs (
    id SERIAL PRIMARY KEY,
    filiere_id INTEGER NOT NULL REFERENCES filieres(id),
    nom VARCHAR(100) NOT NULL,                   -- ex: 'ENSEIGNEMENTS GENERAUX'
    ordre SMALLINT NOT NULL DEFAULT 0,
    UNIQUE (filiere_id, nom)
);

CREATE TABLE enseignants (
    id SERIAL PRIMARY KEY,
    nom_prenoms VARCHAR(150) NOT NULL,
    contact VARCHAR(50)
);

-- Chaque filière définit librement ses matières, coefficients et enseignant attitré.
CREATE TABLE matieres (
    id SERIAL PRIMARY KEY,
    filiere_id INTEGER NOT NULL REFERENCES filieres(id),
    bloc_id INTEGER NOT NULL REFERENCES blocs(id),
    nom VARCHAR(100) NOT NULL,                   -- ex: 'Essais et mesures'
    coefficient NUMERIC(3,1) NOT NULL CHECK (coefficient > 0),
    enseignant_id INTEGER REFERENCES enseignants(id),
    UNIQUE (filiere_id, nom)
);

-- ------------------------------------------------------------
-- 2. CLASSES ET ELEVES
-- ------------------------------------------------------------

CREATE TABLE classes (
    id SERIAL PRIMARY KEY,
    filiere_id INTEGER NOT NULL REFERENCES filieres(id),
    annee_scolaire_id INTEGER NOT NULL REFERENCES annees_scolaires(id),
    niveau VARCHAR(20) NOT NULL,                 -- ex: '2ème année'
    nom VARCHAR(50) NOT NULL,                    -- ex: '2A'
    professeur_principal_id INTEGER REFERENCES enseignants(id),
    UNIQUE (filiere_id, annee_scolaire_id, nom)
);

CREATE TABLE eleves (
    id SERIAL PRIMARY KEY,
    matricule VARCHAR(30) NOT NULL UNIQUE,
    nom_prenoms VARCHAR(150) NOT NULL,
    date_naissance DATE,
    lieu_naissance VARCHAR(100),
    sexe CHAR(1) CHECK (sexe IN ('M', 'F')),
    section VARCHAR(50),                         -- ex: 'Industrielle'
    statut VARCHAR(20) DEFAULT 'Nouveau' CHECK (statut IN ('Nouveau', 'Ancien'))
);

-- Un élève est inscrit dans une classe pour une année scolaire donnée
-- (permet de suivre un élève qui change de classe/filière d'une année à l'autre)
CREATE TABLE inscriptions (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER NOT NULL REFERENCES eleves(id),
    classe_id INTEGER NOT NULL REFERENCES classes(id),
    UNIQUE (eleve_id, classe_id)
);

-- ------------------------------------------------------------
-- 3. EVALUATIONS ET NOTES
-- ------------------------------------------------------------

-- Une évaluation = une matière, pour une classe, un trimestre, un numéro (1 ou 2)
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    matiere_id INTEGER NOT NULL REFERENCES matieres(id),
    classe_id INTEGER NOT NULL REFERENCES classes(id),
    trimestre_id INTEGER NOT NULL REFERENCES trimestres(id),
    numero SMALLINT NOT NULL CHECK (numero IN (1, 2)),
    UNIQUE (matiere_id, classe_id, trimestre_id, numero)
);

CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER NOT NULL REFERENCES evaluations(id),
    eleve_id INTEGER NOT NULL REFERENCES eleves(id),
    note NUMERIC(4,2) NOT NULL CHECK (note >= 0 AND note <= 20),
    UNIQUE (evaluation_id, eleve_id)
);

-- ------------------------------------------------------------
-- 4. DISCIPLINE ET APPRECIATIONS (par élève, par trimestre)
-- ------------------------------------------------------------

CREATE TABLE discipline (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER NOT NULL REFERENCES eleves(id),
    trimestre_id INTEGER NOT NULL REFERENCES trimestres(id),
    retards SMALLINT DEFAULT 0,
    absences SMALLINT DEFAULT 0,
    consignes TEXT,
    UNIQUE (eleve_id, trimestre_id)
);

CREATE TABLE appreciations (
    id SERIAL PRIMARY KEY,
    eleve_id INTEGER NOT NULL REFERENCES eleves(id),
    trimestre_id INTEGER NOT NULL REFERENCES trimestres(id),
    observation_chef_etablissement TEXT,
    decision_conseil_discipline VARCHAR(30)
        CHECK (decision_conseil_discipline IN ('Félicitation', 'Encouragements', 'Avertissement', 'Blâme')),
    decision_conseil_classe VARCHAR(30)
        CHECK (decision_conseil_classe IN ('Félicitation', "Tableau d'honneur", 'Encouragements', 'Avertissement', 'Blâme')),
    UNIQUE (eleve_id, trimestre_id)
);

-- ------------------------------------------------------------
-- 5. VUE CALCULEE : NOTE/20 ET TOTAL PAR MATIERE / EVALUATION-PAIRE
-- ------------------------------------------------------------
-- Reproduit : Note/20 = moyenne(Eval1, Eval2) ; Total = Note/20 x Coefficient

CREATE VIEW v_notes_trimestre AS
SELECT
    e.id AS eleve_id,
    m.id AS matiere_id,
    m.nom AS matiere,
    m.coefficient,
    b.nom AS bloc,
    t.id AS trimestre_id,
    AVG(n.note) AS note_sur_20,
    AVG(n.note) * m.coefficient AS total
FROM notes n
JOIN evaluations ev ON ev.id = n.evaluation_id
JOIN matieres m ON m.id = ev.matiere_id
JOIN blocs b ON b.id = m.bloc_id
JOIN trimestres t ON t.id = ev.trimestre_id
JOIN eleves e ON e.id = n.eleve_id
GROUP BY e.id, m.id, m.nom, m.coefficient, b.nom, t.id;

-- Moyenne générale du trimestre par élève : somme(total) / somme(coefficient)
CREATE VIEW v_moyenne_trimestre AS
SELECT
    eleve_id,
    trimestre_id,
    SUM(total) AS total_general,
    SUM(coefficient) AS coefficient_total,
    ROUND(SUM(total) / NULLIF(SUM(coefficient), 0), 4) AS moyenne_generale
FROM v_notes_trimestre
GROUP BY eleve_id, trimestre_id;

-- Rang de chaque élève dans sa classe, pour un trimestre donné
CREATE VIEW v_rang_trimestre AS
SELECT
    mt.eleve_id,
    mt.trimestre_id,
    i.classe_id,
    mt.moyenne_generale,
    RANK() OVER (PARTITION BY i.classe_id, mt.trimestre_id ORDER BY mt.moyenne_generale DESC) AS rang
FROM v_moyenne_trimestre mt
JOIN inscriptions i ON i.eleve_id = mt.eleve_id;

-- ============================================================
-- NOTES D'IMPLEMENTATION
-- ============================================================
-- - "Note/20" et "Total" sont calculés automatiquement (vue v_notes_trimestre),
--   jamais stockés en dur : si une note change, tout se recalcule.
-- - Le rang (v_rang_trimestre) utilise la fonction RANK() de PostgreSQL,
--   identique en principe à un classement Excel par moyenne décroissante.
-- - Prochaine étape possible : ajouter une table "sms_notifications" pour
--   l'envoi de SMS aux parents (nécessitera un numéro de téléphone par élève
--   ou par tuteur, et une table "tuteurs" séparée si on veut gérer plusieurs
--   parents/contacts par élève).
