import type { ImageMetadata } from 'astro';
import type { Locale } from '../i18n/ui';
import type { Localized } from './projects';
import qeCarte from '../assets/case-studies/quickeat/client-carte.png';
import qeSuivi from '../assets/case-studies/quickeat/client-suivi.png';
import qeSalle from '../assets/case-studies/quickeat/salle-tablette.png';
import qeTableau from '../assets/case-studies/quickeat/tableau-de-bord.png';
import icibillet from '../assets/projects/icibillet.png';

// Règle pour QuickEat : ne dire que ce que le produit fait aujourd'hui.
// La liste noire vit dans le dépôt QuickEat (docs/communication.md) :
// aucun nombre de clients, pas de Mobile Money, pas de commande à emporter.
// Les captures viennent de « Le Béninois », restaurant fictif de préproduction.

export type Shot = { src: ImageMetadata; alt: Localized; caption: Localized; kind: 'phone' | 'wide' };

export type CaseStudy = {
  slug: string;
  name: string;
  category: Localized;
  tagline: Localized;
  meta: { label: Localized; value: Localized }[];
  link?: { label: string; url: string };
  hero: Shot;
  problem: Localized[];
  built: { intro: Localized; shots: Shot[] };
  role: Localized[];
  choices: { title: Localized; text: Localized }[];
  status?: Localized;
};

const l = (fr: string, en: string): Localized => ({ fr, en });

export const caseStudies: CaseStudy[] = [
  {
    slug: 'quickeat',
    name: 'QuickEat',
    category: l('Produit · web', 'Product · web'),
    tagline: l(
      'Le client commande depuis sa table, la salle suit en direct, le patron pilote depuis son téléphone.',
      'Guests order from their table, the floor follows live, the owner runs it from a phone.',
    ),
    meta: [
      { label: l('Rôle', 'Role'), value: l('Interface web, contributions à l’API', 'Web interface, API contributions') },
      { label: l('Équipe', 'Team'), value: l('Layers-Tec', 'Layers-Tec') },
      { label: l('Période', 'When'), value: l('2026', '2026') },
      { label: l('Stack', 'Stack'), value: l('Next.js · FastAPI', 'Next.js · FastAPI') },
      { label: l('Statut', 'Status'), value: l('Bêta, restaurants pilotes', 'Beta, pilot restaurants') },
    ],
    link: { label: 'quickeat.bj', url: 'https://quickeat.bj' },
    hero: {
      src: qeTableau,
      kind: 'wide',
      alt: l('Tableau de bord QuickEat du manager : encaissé du jour, commandes, état des tables', 'QuickEat manager dashboard: takings, orders, table status'),
      caption: l('Le tableau de bord du manager, sur un restaurant de démonstration.', 'The manager dashboard, on a demo restaurant.'),
    },
    problem: [
      l(
        'Dans un maquis ou une brasserie de Cotonou, une commande fait plusieurs allers-retours : le client appelle, le serveur note sur un bout de papier, la cuisine attend ce papier.',
        'In a Cotonou maquis or brasserie, an order travels back and forth: the guest calls, the waiter writes it on a slip, the kitchen waits for that slip.',
      ),
      l(
        'Les bons se perdent entre le passe et la table, l’addition d’une tablée qui a pris trois tournées se reconstitue de mémoire, et le patron ne sait ce qui s’est vendu qu’en fin de journée.',
        'Slips get lost between the pass and the table, the bill for a table that ordered three rounds is rebuilt from memory, and the owner only knows what sold at the end of the day.',
      ),
    ],
    built: {
      intro: l(
        'QuickEat relie les trois acteurs de la salle. Le paiement, lui, reste au restaurant : le client règle comme il l’a toujours fait, le serveur note seulement le mode de paiement.',
        'QuickEat connects the three people in the room. Payment stays with the restaurant: guests pay as they always have, the waiter only records how.',
      ),
      shots: [
        {
          src: qeCarte,
          kind: 'phone',
          alt: l('Carte QuickEat sur téléphone, catégorie petit-déjeuner', 'QuickEat menu on a phone, breakfast category'),
          caption: l('Le client vise le QR code de sa table : la carte s’ouvre, sans application à installer.', 'The guest points the camera at the table’s QR code: the menu opens, nothing to install.'),
        },
        {
          src: qeSuivi,
          kind: 'phone',
          alt: l('Suivi de commande : reçue, acceptée, prête, servie, payée', 'Order tracking: received, accepted, ready, served, paid'),
          caption: l('Il suit sa commande en direct, de « Reçue » à « Payée ».', 'They follow the order live, from “Received” to “Paid”.'),
        },
        {
          src: qeSalle,
          kind: 'wide',
          alt: l('Écran de salle sur tablette : grille des tables et leur état', 'Floor screen on a tablet: grid of tables and their status'),
          caption: l('La salle voit chaque table à la seconde : à accepter, en cuisine, prête à servir, à encaisser.', 'The floor sees every table instantly: to accept, cooking, ready to serve, to cash in.'),
        },
      ],
    },
    role: [
      l(
        'Au sein de l’équipe Layers-Tec, j’ai développé l’interface web : la carte côté client, l’écran de salle des serveurs et le back-office du manager.',
        'Within the Layers-Tec team, I built the web interface: the guest menu, the waiters’ floor screen and the manager back office.',
      ),
      l('J’ai aussi contribué à plusieurs évolutions de l’API FastAPI.', 'I also contributed to several changes in the FastAPI backend.'),
    ],
    choices: [
      {
        title: l('Le contrat d’API fait foi', 'The API contract is the source of truth'),
        text: l(
          'Les types TypeScript de l’interface sont générés depuis le schéma OpenAPI de l’API, jamais écrits à la main. Un champ renommé côté serveur casse la compilation, pas l’écran d’un client.',
          'The interface’s TypeScript types are generated from the API’s OpenAPI schema, never hand-written. A renamed field breaks the build, not a guest’s screen.',
        ),
      },
      {
        title: l('Pensé pour une salle pleine', 'Built for a busy room'),
        text: l(
          'Zones tactiles de 44 px minimum, 52 px sur la tablette des serveurs, qu’on utilise debout et pressé. Un statut porte toujours un mot en plus de sa couleur.',
          'Touch targets of at least 44 px, 52 px on the waiters’ tablet, used standing and in a hurry. A status always carries a word, not just a colour.',
        ),
      },
      {
        title: l('Un seul vocabulaire', 'One vocabulary'),
        text: l(
          'Les statuts viennent de l’API et sont traduits une seule fois, au même endroit. Le client, la salle et le manager lisent les mêmes mots pour la même commande.',
          'Statuses come from the API and are translated once, in one place. Guest, floor and manager read the same words for the same order.',
        ),
      },
    ],
    status: l(
      'En bêta depuis septembre 2026, avec des restaurants pilotes à Cotonou.',
      'In beta since September 2026, with pilot restaurants in Cotonou.',
    ),
  },
  {
    slug: 'icibillet-scan',
    name: 'ICIBillet Scan',
    category: l('Application mobile', 'Mobile app'),
    tagline: l(
      'Le contrôle des billets à l’entrée des événements ICIBillet, depuis un téléphone.',
      'Ticket checks at the door of ICIBillet events, from a phone.',
    ),
    meta: [
      { label: l('Rôle', 'Role'), value: l('Application mobile complète', 'Entire mobile app') },
      { label: l('Client', 'Client'), value: l('ICIBillet', 'ICIBillet') },
      { label: l('Période', 'When'), value: l('2024 — 2026', '2024 — 2026') },
      { label: l('Stack', 'Stack'), value: l('Flutter', 'Flutter') },
    ],
    link: { label: 'icibillet.com', url: 'https://icibillet.com/solutions/icibillet-scan' },
    hero: {
      src: icibillet,
      kind: 'wide',
      alt: l('Visuel de présentation d’ICIBillet Scan', 'ICIBillet Scan presentation visual'),
      caption: l('Visuel de présentation d’ICIBillet.', 'ICIBillet presentation visual.'),
    },
    problem: [
      l(
        'À l’entrée d’un événement, les billets vendus en ligne doivent être vérifiés vite, par plusieurs personnes à la fois, sans file qui s’allonge.',
        'At an event’s door, tickets sold online must be checked fast, by several people at once, without the queue growing.',
      ),
      l(
        'L’organisateur, lui, doit pouvoir confier ce contrôle à son équipe sans lui donner la main sur tout le reste.',
        'The organiser needs to hand that job to their team without giving them control of everything else.',
      ),
    ],
    built: {
      intro: l(
        'Une application Flutter avec deux espaces, selon qui se connecte.',
        'A Flutter app with two spaces, depending on who signs in.',
      ),
      shots: [],
    },
    role: [
      l(
        'J’ai développé l’application mobile de bout en bout pour ICIBillet : écrans, navigation, gestion des comptes et échanges avec l’API d’ICIBillet, qui décide si un billet est valable.',
        'I built the mobile app end to end for ICIBillet: screens, navigation, account handling and the calls to ICIBillet’s API, which decides whether a ticket is valid.',
      ),
    ],
    choices: [
      {
        title: l('Deux espaces, deux métiers', 'Two spaces, two jobs'),
        text: l(
          'L’organisateur gère ses événements, crée et modifie les comptes de ses contrôleurs, consulte les participants. Le contrôleur ne voit que ce qu’il lui faut pour vérifier.',
          'The organiser manages events, creates and edits controller accounts, and sees attendees. The controller only sees what they need to check tickets.',
        ),
      },
      {
        title: l('Un verdict qu’on entend', 'A verdict you can hear'),
        text: l(
          'Après le scan, un écran plein « validé » ou « refusé », doublé d’un son différent : le contrôleur n’a pas besoin de lire l’écran dans le bruit d’une entrée.',
          'After a scan, a full-screen “valid” or “refused”, doubled by a distinct sound: the controller doesn’t need to read the screen in a noisy entrance.',
        ),
      },
      {
        title: l('Un plan B au scan', 'A fallback for the scan'),
        text: l(
          'Si le QR code est abîmé ou l’écran du participant illisible, le code du billet se saisit à la main. Le billet validé s’affiche avec son événement, ses dates et sa date d’achat.',
          'If the QR code is damaged or the attendee’s screen unreadable, the ticket code can be typed in. A validated ticket shows its event, dates and purchase date.',
        ),
      },
    ],
  },
];

export const caseStudyPath: Record<Locale, (slug: string) => string> = {
  fr: (slug) => `projets/${slug}`,
  en: (slug) => `work/${slug}`,
};
