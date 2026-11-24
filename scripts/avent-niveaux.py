"""Fabrique les 25 grilles du jeu de l'Avent « Les guirlandes » (src/data/avent-niveaux.json).

    python3 scripts/avent-niveaux.py

Règle du jeu : un seul fil, de l'éclair à l'étoile, qui passe par toutes les cases ; sur une boule rouge le fil
tourne, sur une boule dorée il va tout droit ; on ne passe pas sur les cadeaux ni les sapins.
Chaque grille part d'un chemin tiré au hasard, on y place toutes
les boules qu'il implique, puis on en retire tant que la solution reste unique (vérifié par une recherche
exhaustive) ; quelques boules retirées sont remises pour adoucir la grille (« en_plus »). Grille 0 : l'entraînement.
Sans dépendance : Python 3 suffit.

Sécurité : les grilles 1 à 24 et leurs solutions sont SECRÈTES. Le tirage utilise une graine aléatoire jamais
enregistrée, et le fichier complet est écrit hors du dépôt (chemin donné en argument) ; il est ensuite chargé dans
la table privée public.avent_grilles (voir supabase/avent-securite.sql), d'où le jeu reçoit chaque grille, sans sa
solution, seulement le jour où elle s'ouvre. Le dépôt ne garde que src/data/avent-niveaux.json : l'entraînement
complet (grille 0, publique) et, pour les autres jours, le titre et la taille.

    python3 scripts/avent-niveaux.py /chemin/hors/du/depot/avent-grilles-secretes.json
"""
import os
import json
import random
import sys
from pathlib import Path

sys.setrecursionlimit(20000)


def voisins(p, cases):
    x, y = p
    return [q for q in ((x+1,y),(x-1,y),(x,y+1),(x,y-1)) if q in cases]

def tourne(a, b, c):
    return (a[0]-b[0], a[1]-b[1]) != (b[0]-c[0], b[1]-c[1])

def chemin_aleatoire(cases, depart, rnd, limite=400000):
    n = len(cases); chemin=[depart]; vus={depart}; cpt=[0]
    def rec():
        cpt[0]+=1
        if cpt[0]>limite: return False
        if len(chemin)==n: return True
        opts=[q for q in voisins(chemin[-1], cases) if q not in vus]
        rnd.shuffle(opts)
        opts.sort(key=lambda q: sum(1 for r in voisins(q, cases) if r not in vus))
        for q in opts:
            chemin.append(q); vus.add(q)
            if rec(): return True
            chemin.pop(); vus.discard(q)
        return False
    return list(chemin) if rec() else None

def compter(cases, depart, arrivee, boules, limite=250000):
    """Nombre de solutions (0, 1 ou 2 = « plusieurs »), ou None si la recherche est trop longue."""
    n=len(cases); chemin=[depart]; vus={depart}; cpt=[0]; sols=[0]
    def ok_connexe():
        reste=[c for c in cases if c not in vus]
        if not reste: return True
        tete=chemin[-1]
        # chaque case restante (sauf l'arrivée) doit garder 2 accès ; tout doit rester joignable depuis la tête
        for c in reste:
            d=sum(1 for q in voisins(c, cases) if q not in vus or q==tete)
            if c!=arrivee and d<2: return False
            if c==arrivee and d<1: return False
        seen={reste[0]}; pile=[reste[0]]
        while pile:
            c=pile.pop()
            for q in voisins(c, cases):
                if q not in vus and q not in seen: seen.add(q); pile.append(q)
        if len(seen)!=len(reste): return False
        return any(q not in vus for q in voisins(tete, cases))
    def rec():
        cpt[0]+=1
        if cpt[0]>limite: raise TimeoutError
        tete=chemin[-1]
        if len(chemin)==n:
            if tete==arrivee: sols[0]+=1
            return sols[0]>=2
        for q in voisins(tete, cases):
            if q in vus: continue
            if q==arrivee and len(chemin)!=n-1: continue
            if len(chemin)>=2 and tete in boules:
                if (boules[tete]=="tourne") != tourne(chemin[-2], tete, q): continue
            chemin.append(q); vus.add(q)
            if ok_connexe() and rec(): return True
            chemin.pop(); vus.discard(q)
        return False
    try:
        rec()
    except TimeoutError:
        return None
    return sols[0]

def fabriquer(cases, depart, graine, en_plus, sans_boules=False, minimum=0):
    """Un chemin au hasard, toutes ses boules, puis on retire tout ce qui n'est pas nécessaire à l'unicité."""
    rnd = random.Random(graine)
    cases = set(cases)
    for _ in range(12):
        ch = chemin_aleatoire(cases, depart, rnd, limite=60000)
        if not ch:
            continue
        if sans_boules:
            return ch, {}
        arrivee = ch[-1]
        toutes = {ch[i]: ("tourne" if tourne(ch[i - 1], ch[i], ch[i + 1]) else "droit") for i in range(1, len(ch) - 1)}
        if compter(cases, depart, arrivee, toutes) != 1:
            continue
        boules, retirees = dict(toutes), []
        ordre = list(toutes)
        rnd.shuffle(ordre)
        for c in ordre:
            essai = {k: v for k, v in boules.items() if k != c}
            if compter(cases, depart, arrivee, essai) == 1:
                boules, retirees = essai, retirees + [c]
        for c in retirees[:max(en_plus, minimum - len(boules))]:   # jamais moins de `minimum` boules : ça reste jouable
            boules[c] = toutes[c]
        return ch, boules
    raise RuntimeError("aucune grille trouvée")


def bloqueurs(n, nombre, graine, eviter):
    """Des cadeaux et des sapins posés au hasard, en gardant une grille faisable (autant de cases « noires » que
    « blanches » à une près, comme un damier, sinon aucun fil ne peut tout couvrir)."""
    rnd = random.Random(graine)
    while True:
        b = set()
        while len(b) < nombre:
            p = (rnd.randrange(n), rnd.randrange(n))
            if p != eviter:
                b.add(p)
        reste = [(x, y) for y in range(n) for x in range(n) if (x, y) not in b]
        noires = sum((x + y) % 2 for x, y in reste)
        if abs(2 * noires - len(reste)) <= 1:
            return {p: rnd.choice(["cadeau", "sapin"]) for p in sorted(b)}


def carre(n, b=()):
    b = set(b)
    return [(x, y) for y in range(n) for x in range(n) if (x, y) not in b]


# jour, titre, règle du jour, taille, départ, boules en plus, bloqueurs, difficulté (1 à 5)
PLAN = [
    (0, "Entraînement", "Relie l'éclair à l'étoile en passant par toutes les cases.", 4, (0, 0), 0, 0, 1),
    (1, "Premier circuit", "Relie l'éclair à l'étoile en passant par toutes les cases.", 4, (0, 0), 0, 0, 1),
    (2, "Les premières boules", "Nouvelle règle : sur une boule rouge le fil tourne, sur une boule dorée il va tout droit.", 4, (1, 1), 3, 0, 1),
    (3, "La guirlande du salon", "La grille grandit : 5 × 5.", 5, (2, 2), 4, 0, 2),
    (4, "Le fil du balcon", "5 × 5, suis les boules.", 5, (0, 4), 4, 0, 2),
    (5, "Les boules du sapin", "5 × 5, un peu moins d'aide.", 5, (4, 0), 3, 0, 2),
    (6, "Dimanche en lumière", "5 × 5, départ au milieu d'un bord.", 5, (2, 0), 3, 0, 2),
    (7, "Six sur six", "La grille grandit : 6 × 6.", 6, (0, 0), 6, 0, 3),
    (8, "La vitrine", "6 × 6.", 6, (5, 5), 5, 0, 3),
    (9, "Les cadeaux au milieu", "Nouvelle règle : on ne passe pas sur les cadeaux ni les sapins.", 6, (0, 5), 6, 3, 3),
    (10, "Le marché de Noël", "6 × 6 et ses cadeaux.", 6, (3, 0), 5, 3, 3),
    (11, "Le grand salon", "6 × 6, moins d'aide.", 6, (0, 2), 4, 2, 3),
    (12, "La rue illuminée", "6 × 6, quatre cases interdites.", 6, (5, 0), 5, 4, 3),
    (13, "Dimanche au chaud", "6 × 6.", 6, (2, 2), 4, 3, 3),
    (14, "Sept sur sept", "La grille grandit : 7 × 7.", 7, (0, 0), 9, 0, 4),
    (15, "Le grand sapin", "7 × 7, avec ses cadeaux.", 7, (6, 6), 8, 3, 4),
    (16, "Les lumières de la ville", "7 × 7.", 7, (3, 0), 8, 4, 4),
    (17, "La place du marché", "7 × 7, départ au centre.", 7, (3, 3), 7, 4, 4),
    (18, "La nuit étoilée", "7 × 7, moins d'aide.", 7, (0, 6), 6, 3, 4),
    (19, "Tout ensemble", "7 × 7 : les boules et les cases interdites.", 7, (6, 0), 7, 4, 4),
    (20, "Dimanche des lutins", "7 × 7.", 7, (0, 3), 6, 5, 4),
    (21, "La veille de la veille", "7 × 7, peu d'aide.", 7, (6, 3), 5, 4, 5),
    (22, "Les derniers paquets", "7 × 7, beaucoup de cadeaux.", 7, (0, 0), 6, 6, 5),
    (23, "La veillée", "7 × 7, le plus dur avant le grand soir.", 7, (3, 6), 4, 3, 5),
]


def main():
    if len(sys.argv) != 2 or Path(sys.argv[1]).resolve().is_relative_to(Path(__file__).resolve().parent.parent):
        sys.exit("usage : python3 scripts/avent-niveaux.py /chemin/HORS/du/depot/grilles.json")
    sel = int.from_bytes(os.urandom(8), "big")          # graine secrète, jamais enregistrée (la grille 0 reste fixe)
    niveaux = []
    for jour, titre, regle, n, depart, en_plus, nb_bloq, etoiles in PLAN:
        for essai in range(30):                     # si les cadeaux rendent la grille impossible, on les replace
            g = 0 if jour == 0 else sel
            bloq = bloqueurs(n, nb_bloq, g + 1000 * (essai + 1) + jour, depart) if nb_bloq else {}
            try:
                ch, boules = fabriquer(carre(n, bloq), depart, g + 7 + jour * 13 + essai, en_plus, sans_boules=(en_plus == 0), minimum={5: 6, 6: 9, 7: 12}.get(n, 0))
                break
            except RuntimeError:
                continue
        cases = carre(n, bloq)
        niveaux.append(niveau(jour, titre, regle, n, n, cases, ch, boules, bloq, etoiles))
        print(f"jour {jour:2d} : {n}×{n}, {len(bloq)} bloqueurs, {len(boules)} boules", flush=True)
    # le 24 : la grille dessine un sapin, la prise au pied
    lignes = [(2, 4), (2, 4), (1, 5), (1, 5), (0, 6), (0, 6), (3, 3)]
    sapin = [(x, y) for y, (a, b) in enumerate(lignes) for x in range(a, b + 1)]
    ch, boules = fabriquer(sapin, (3, 6), sel + 24, 5)
    niveaux.append(niveau(24, "Le sapin de Noël", "Le grand soir : la grille dessine un sapin, la prise est au pied.", 7, 7, sapin, ch, boules, {}, 5))
    print(f"jour 24 : sapin, {len(boules)} boules")
    secret = Path(sys.argv[1])
    secret.write_text(json.dumps(niveaux, ensure_ascii=False, separators=(",", ":")) + "\n")
    public = [n if n["jour"] == 0 else {k: n[k] for k in ("jour", "titre", "w", "h", "etoiles")} for n in niveaux]
    sortie = Path(__file__).resolve().parent.parent / "src" / "data" / "avent-niveaux.json"
    sortie.write_text(json.dumps(public, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(secret, "(secret, hors du dépôt)")
    print(sortie, "(public : entraînement + titres)")


def niveau(jour, titre, regle, w, h, cases, ch, boules, bloq, etoiles):
    return dict(jour=jour, titre=titre, regle=regle, w=w, h=h, cases=[list(c) for c in cases],
                depart=list(ch[0]), arrivee=list(ch[-1]),
                boules={f"{x},{y}": v for (x, y), v in boules.items()},
                bloques={f"{x},{y}": t for (x, y), t in bloq.items()},
                solution=[list(p) for p in ch], etoiles=etoiles)


if __name__ == "__main__":
    main()
