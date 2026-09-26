import type { ImageMetadata } from 'astro';
import type { Locale } from '../i18n/ui';
import icibillet from '../assets/projects/icibillet.png';
import layersTec from '../assets/projects/layers-tec.png';
import olaCompagny from '../assets/projects/ola-compagny.png';

export type Localized = Record<Locale, string>;

export type ProjectVisual =
  | { kind: 'image'; images: { src: ImageMetadata; alt: Localized }[] }
  // Pas de capture publique pour ces projets : une maquette dessinée en CSS,
  // signalée comme illustration, plutôt qu'une image vide ou inventée.
  | { kind: 'mock'; mock: 'order' | 'insurance' };

export type Project = {
  id: string;
  name: string;
  category: Localized;
  summary: Localized;
  stack: string[];
  links?: { label: string; url: string }[];
  visual: ProjectVisual;
};

// Réalisations livrées ou en production, les plus récentes d'abord.
export const projects: Project[] = [
  {
    id: 'quickeat',
    name: 'QuickEat',
    category: { fr: 'Produit · web', en: 'Product · web' },
    summary: {
      fr: 'Commande au QR code en restaurant : le client scanne sa table, commande et appelle le serveur depuis son téléphone.',
      en: 'QR-code ordering for restaurants: guests scan their table, order and call the waiter from their phone.',
    },
    stack: ['Next.js', 'FastAPI'],
    visual: { kind: 'mock', mock: 'order' },
  },
  {
    id: 'icibillet-scan',
    name: 'ICIBillet Scan',
    category: { fr: 'Application mobile', en: 'Mobile app' },
    summary: {
      fr: 'Les organisateurs et contrôleurs scannent le QR code des billets pour gérer l’accès aux événements.',
      en: 'Organisers and staff scan ticket QR codes to manage event access.',
    },
    stack: ['Flutter'],
    links: [{ label: 'icibillet.com', url: 'https://icibillet.com/solutions/icibillet-scan' }],
    visual: {
      kind: 'image',
      images: [{ src: icibillet, alt: { fr: 'Application ICIBillet Scan', en: 'ICIBillet Scan app' } }],
    },
  },
  {
    id: 'insurance',
    name: 'Assurance auto',
    category: { fr: 'Application mobile', en: 'Mobile app' },
    summary: {
      fr: 'Gestion des véhicules, des clients et des contrats d’assurance, avec les échéanciers et les impayés à relancer en un clic.',
      en: 'Vehicles, clients and insurance contracts, with payment schedules and one-tap reminders for unpaid premiums.',
    },
    stack: ['Flutter'],
    visual: { kind: 'mock', mock: 'insurance' },
  },
  {
    id: 'client-sites',
    name: 'Layers-Tec · Ola Compagny',
    category: { fr: 'Sites web', en: 'Websites' },
    summary: {
      fr: 'Sites d’une startup tech et d’une agence de communication digitale, avec un back-office pour gérer contenus et blog.',
      en: 'Websites for a tech startup and a digital communication agency, with a back office for content and blog.',
    },
    stack: ['Laravel', 'Filament'],
    links: [
      { label: 'layers-tec.com', url: 'https://layers-tec.com/' },
      { label: 'olacompagny.com', url: 'https://olacompagny.com/' },
    ],
    visual: {
      kind: 'image',
      images: [
        { src: layersTec, alt: { fr: 'Site de Layers-Tec', en: 'Layers-Tec website' } },
        { src: olaCompagny, alt: { fr: 'Site d’Ola Compagny', en: 'Ola Compagny website' } },
      ],
    },
  },
];

export type LabItem = { name: string; status: Localized; summary: Localized; stack: string; url: string };

// Projets de test ou en cours de développement, non déployés : on le dit.
export const lab: LabItem[] = [
  {
    name: 'SmartQueue',
    status: { fr: 'en cours', en: 'in progress' },
    summary: {
      fr: 'Gestion de files d’attente : établissements, services, tickets et historique.',
      en: 'Queue management: venues, services, tickets and history.',
    },
    stack: 'Laravel',
    url: 'https://github.com/Simeon013/SmartQueue',
  },
  {
    name: 'StylingAI',
    status: { fr: 'expérimentation', en: 'experiment' },
    summary: {
      fr: 'Essayer un vêtement sur soi à partir d’une photo, grâce à l’IA.',
      en: 'Try clothes on yourself from a photo, powered by AI.',
    },
    stack: 'React · Gemini',
    url: 'https://github.com/Simeon013/StylingAI',
  },
  {
    name: 'Quizizy',
    status: { fr: 'prototype', en: 'prototype' },
    summary: {
      fr: 'Quiz par catégories, avec administration des questions et statistiques.',
      en: 'Quizzes by category, with question management and statistics.',
    },
    stack: 'Laravel · Vue',
    url: 'https://github.com/Simeon013/quizizy',
  },
  {
    name: 'Pokédex',
    status: { fr: 'exercice', en: 'exercise' },
    summary: { fr: 'Un Pokédex mobile.', en: 'A mobile Pokédex.' },
    stack: 'Flutter',
    url: 'https://github.com/Simeon013/my_pokedex_app',
  },
  {
    name: 'Démos d’interface',
    status: { fr: 'exercices', en: 'exercises' },
    summary: {
      fr: 'Banque, maison connectée, horloge, connexion animée, météo : des interfaces reproduites en Flutter.',
      en: 'Banking, smart home, clock, animated login, weather: interfaces rebuilt in Flutter.',
    },
    stack: 'Flutter',
    url: 'https://github.com/Simeon013?tab=repositories&language=dart',
  },
  {
    name: 'TikTask · Rolivoice',
    status: { fr: 'anciens projets', en: 'early projects' },
    summary: {
      fr: 'Une liste de tâches et un générateur de reçus.',
      en: 'A to-do app and a receipt generator.',
    },
    stack: 'Flutter · Hive',
    url: 'https://github.com/Simeon013/generateur_de_recu',
  },
];

export const skills: { group: Localized; items: string[] }[] = [
  { group: { fr: 'Web', en: 'Web' }, items: ['Laravel', 'Filament', 'PHP', 'Tailwind CSS', 'Next.js', 'FastAPI'] },
  { group: { fr: 'Mobile', en: 'Mobile' }, items: ['Flutter', 'Dart'] },
  { group: { fr: 'Données', en: 'Data' }, items: ['MySQL'] },
  { group: { fr: 'Outils', en: 'Tools' }, items: ['Git', 'GitHub', 'Figma', 'Canva', 'Premiere Pro'] },
];

export type JourneyStep = { period: Localized; title: Localized; place: string; detail?: Localized };

export const journey: JourneyStep[] = [
  {
    period: { fr: '2022 — aujourd’hui', en: '2022 — today' },
    title: { fr: 'Développeur freelance', en: 'Freelance developer' },
    place: 'Freelance',
    detail: {
      fr: 'Sites web avec back-office, applications mobiles Flutter et outils métier pour des entreprises, une ONG et des startups.',
      en: 'Websites with back offices, Flutter mobile apps and business tools for companies, an NGO and startups.',
    },
  },
  {
    period: { fr: 'Avril — juillet 2022', en: 'April — July 2022' },
    title: { fr: 'Stage de fin d’études', en: 'Final-year internship' },
    place: 'SeniorDev',
    detail: {
      fr: 'Une plateforme d’envoi de SMS en masse et une application de gestion de stocks pour une PME.',
      en: 'A bulk SMS platform and a stock management app for an SME.',
    },
  },
  {
    period: { fr: '2022', en: '2022' },
    title: { fr: 'Licence en Architecture Logicielle', en: 'Bachelor’s in Software Architecture' },
    place: 'ESGIS',
  },
  {
    period: { fr: '2019', en: '2019' },
    title: { fr: 'Baccalauréat scientifique', en: 'Scientific baccalaureate' },
    place: 'CSS/CED',
  },
];

export const contact = {
  email: 'simeondaouda@gmail.com',
  phone: '+229 01 66 58 88 21',
  phoneHref: 'tel:+2290166588821',
  whatsapp: 'https://wa.me/2290166588821',
  linkedin: 'https://www.linkedin.com/in/simeon013/',
  github: 'https://github.com/Simeon013',
  cv: '/cv/simeon-daouda-cv.pdf',
};
