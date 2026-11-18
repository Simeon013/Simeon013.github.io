// Contenu du CV, en français et en anglais. Pour mettre le CV à jour : modifier ici, puis `npm run cv`.
// Règles validées avec Siméon (17/11/2026) : une page, pas de certifications en ligne, pas de réseaux
// autres que LinkedIn, pas d'Axory. QuickEat : ne dire que ce que le produit fait aujourd'hui
// (liste noire dans docs/communication.md du dépôt QuickEat).

export const contacts = [
  { label: '+229 01 66 58 88 21', href: 'tel:+2290166588821' },
  { label: 'simeondaouda@gmail.com', href: 'mailto:simeondaouda@gmail.com' },
  { label: 'simeon013.github.io', href: 'https://simeon013.github.io/', hrefEn: 'https://simeon013.github.io/en/' },
  { label: 'github.com/Simeon013', href: 'https://github.com/Simeon013' },
  { label: 'linkedin.com/in/simeon013', href: 'https://www.linkedin.com/in/simeon013/' },
];

export const cv = {
  fr: {
    lang: 'fr',
    fichier: 'simeon-daouda-cv.pdf',
    titrePage: 'CV — Siméon Daouda',
    role: 'Développeur web et mobile',
    sousRole: 'Cofondateur & CTO de Layers-Tec',
    lieu: 'Cotonou, Bénin',
    sections: { profil: 'Profil', experience: 'Expérience', competences: 'Compétences', formation: 'Formation', langues: 'Langues' },
    profil:
      'Développeur web et mobile freelance depuis 2022, cofondateur et CTO de Layers-Tec depuis 2024. Je conçois et livre des applications utilisées au quotidien (commande en restaurant, contrôle d’accès à des événements, gestion d’assurance), du recueil du besoin jusqu’à la mise en ligne.',
    experiences: [
      {
        poste: 'Cofondateur & CTO',
        lieu: 'Layers-Tec',
        periode: '2024 — aujourd’hui',
        points: [
          ['QuickEat', ', commande au QR code en restaurant : développement de l’interface web (Next.js) et contributions à l’API (FastAPI).'],
          ['Sites de Layers-Tec, d’OC Digital et du Groupe ADECO', ' : sites vitrines avec back-office pour gérer contenus et blog (Laravel, Filament).'],
          ['Direction technique', ' : choix des technologies, répartition du travail, déploiement.'],
        ],
      },
      {
        poste: 'Développeur web et mobile freelance',
        lieu: 'Indépendant',
        periode: '2022 — aujourd’hui',
        points: [
          ['ICIBillet Scan', ' (2024–2026) : toute l’application mobile (Flutter). Les organisateurs et contrôleurs scannent les billets en QR code à l’entrée des événements.'],
          ['Assurance auto', ' : application Flutter de gestion des véhicules, clients, contrats et échéanciers, avec relance des impayés en un clic.'],
          ['Pâtisserie', ' : application Flutter de commande pour les clients.'],
        ],
      },
      {
        poste: 'Stage de fin d’études',
        lieu: 'SeniorDev',
        periode: 'avril — juillet 2022',
        points: [['', 'Plateforme d’envoi de SMS en masse et application de gestion de stocks pour une PME.']],
      },
    ],
    competences: [
      ['Web', 'Laravel, Filament, PHP, Next.js, FastAPI, Tailwind CSS'],
      ['Mobile', 'Flutter, Dart'],
      ['Données', 'MySQL, PostgreSQL, Supabase'],
      ['IA', 'Développement assisté par IA (Claude Code), intégration d’API d’IA dans des applications'],
      ['Outils', 'Git, GitHub, Figma'],
      ['Transversal', 'Recueil du besoin client, conception UI/UX, déploiement et mise en ligne, direction d’une équipe technique'],
    ],
    formation: [
      { titre: 'Licence en Architecture Logicielle', lieu: 'ESGIS', periode: '2022' },
      { titre: 'Baccalauréat scientifique', lieu: 'CSS/CED', periode: '2019' },
    ],
    langues: [
      ['Français', 'langue maternelle'],
      ['Anglais', 'lecture technique'],
    ],
  },
  en: {
    lang: 'en',
    fichier: 'simeon-daouda-cv-en.pdf',
    titrePage: 'CV — Siméon Daouda',
    role: 'Web and mobile developer',
    sousRole: 'Co-founder & CTO of Layers-Tec',
    lieu: 'Cotonou, Benin',
    sections: { profil: 'Profile', experience: 'Experience', competences: 'Skills', formation: 'Education', langues: 'Languages' },
    profil:
      'Freelance web and mobile developer since 2022, co-founder and CTO of Layers-Tec since 2024. I design and ship apps people use every day (restaurant ordering, event access control, insurance management), from gathering requirements to going live.',
    experiences: [
      {
        poste: 'Co-founder & CTO',
        lieu: 'Layers-Tec',
        periode: '2024 — present',
        points: [
          ['QuickEat', ', QR-code ordering for restaurants: built the web interface (Next.js) and contributed to the API (FastAPI).'],
          ['Layers-Tec, OC Digital and Groupe ADECO websites', ': showcase sites with a back office for content and blog (Laravel, Filament).'],
          ['Technical leadership', ': technology choices, splitting the work, deployment.'],
        ],
      },
      {
        poste: 'Freelance web and mobile developer',
        lieu: 'Independent',
        periode: '2022 — present',
        points: [
          ['ICIBillet Scan', ' (2024–2026): the whole mobile app (Flutter). Organisers and door staff scan QR-code tickets at event entrances.'],
          ['Car insurance', ': Flutter app to manage vehicles, clients, contracts and payment schedules, with one-tap reminders for unpaid instalments.'],
          ['Bakery', ': Flutter ordering app for customers.'],
        ],
      },
      {
        poste: 'Final-year internship',
        lieu: 'SeniorDev',
        periode: 'April — July 2022',
        points: [['', 'A bulk SMS platform and a stock management app for an SME.']],
      },
    ],
    competences: [
      ['Web', 'Laravel, Filament, PHP, Next.js, FastAPI, Tailwind CSS'],
      ['Mobile', 'Flutter, Dart'],
      ['Data', 'MySQL, PostgreSQL, Supabase'],
      ['AI', 'AI-assisted development (Claude Code), integrating AI APIs into applications'],
      ['Tools', 'Git, GitHub, Figma'],
      ['Beyond code', 'Gathering client requirements, UI/UX design, deployment and launch, leading a tech team'],
    ],
    formation: [
      { titre: 'Bachelor’s in Software Architecture', lieu: 'ESGIS', periode: '2022' },
      { titre: 'Scientific baccalaureate', lieu: 'CSS/CED', periode: '2019' },
    ],
    langues: [
      ['French', 'native'],
      ['English', 'technical reading'],
    ],
  },
};
