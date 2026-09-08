"pages/index.js"
import Link from 'next/link';
const MODULES = [
  { href: '/eleves', titre: 'Élèves', description: 'Ajouter, rechercher, modifier une fiche élève' },
  { href: '/notes', titre: 'Notes', description: 'Saisir les notes par matière et évaluation' },
  { href: '/bulletin', titre: 'Bulletin', description: 'Consulter le bulletin calculé d\u2019un élève' },
];

export default function Accueil() {
  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <h1 className="text-lg font-medium mb-1">ENSIET Douala</h1>
      <p className="text-sm text-neutral-500 mb-6">Système de gestion scolaire</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="block border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50"
          >
            <p className="text-sm font-medium">{m.titre}</p>
            <p className="text-xs text-neutral-500 mt-1">{m.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
