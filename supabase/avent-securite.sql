-- Jeu de l'Avent « Les guirlandes » : un jeu qu'on ne peut pas truquer depuis le navigateur.
-- Suite de avent-classement.sql et avent-statistiques.sql. Remplace avent_envoyer (qui croyait le temps envoyé).
--
-- Principe : le navigateur n'est jamais cru sur parole.
-- 1. Les grilles et leurs solutions vivent dans une table privée. Le jeu reçoit une grille SANS sa solution, et
--    seulement à partir de minuit (heure du Bénin) le jour où elle s'ouvre. Les indices sont donnés un par un par
--    le serveur, qui les compte lui-même (+5 s chacun).
-- 2. Le chrono est mesuré par le serveur : une partie commence au premier coup (avent_commencer) et se termine
--    quand le serveur a vérifié que le fil respecte toutes les règles (avent_terminer).
-- 3. Seuls les temps faits le jour de la grille comptent : de minuit au lendemain 6 h, juste avant que le post
--    du matin montre la solution. Après, la grille reste jouable, mais n'est plus classée.
-- 4. Un « organisateur » (Siméon) peut ouvrir toutes les grilles pour les tester ; ses temps ne sont jamais classés.

-- ---------- tables privées ----------
create table if not exists public.avent_grilles (
  jour      smallint primary key check (jour between 1 and 24),
  grille    jsonb not null,                    -- titre, regle, w, h, cases, depart, arrivee, boules, bloques, etoiles
  solution  jsonb not null                     -- [[x, y], …]
);
alter table public.avent_grilles enable row level security;
revoke all on public.avent_grilles from anon, authenticated;

create table if not exists public.avent_parties (
  id        uuid primary key default gen_random_uuid(),
  jour      smallint not null,
  appareil  uuid not null,
  debut     timestamptz not null default now(),
  indices   int not null default 0,
  fin       timestamptz,
  temps_ms  int
);
create index if not exists avent_parties_appareil on public.avent_parties (appareil, debut);
alter table public.avent_parties enable row level security;
revoke all on public.avent_parties from anon, authenticated;

alter table public.avent_joueurs add column if not exists organisateur boolean not null default false;

-- ---------- outils internes (non appelables avec la clé publique) ----------
create or replace function public.avent_cotonou() returns timestamp
language sql stable as $$ select (now() at time zone 'Africa/Porto-Novo') $$;

create or replace function public.avent_organisateur(p_appareil uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select organisateur from public.avent_joueurs where appareil = p_appareil), false)
$$;

create or replace function public.avent_ouverte(p_jour int, p_appareil uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select p_jour between 1 and 24
     and (public.avent_cotonou() >= make_timestamp(2026, 12, p_jour, 0, 0, 0) or public.avent_organisateur(p_appareil))
$$;

-- le fil respecte-t-il toutes les règles ? (départ, arrivée, cases voisines, chaque case une fois, les boules)
create or replace function public.avent_fil_valide(p_grille jsonb, p_chemin jsonb) returns boolean
language plpgsql immutable as $$
declare
  n int := jsonb_array_length(p_chemin);
  vus text[] := '{}';
  i int; x int; y int; px int; py int; nx int; ny int; cle text; boule text; tourne boolean;
begin
  if jsonb_typeof(p_chemin) <> 'array' or n <> jsonb_array_length(p_grille->'cases') or n > 64 then return false; end if;
  if p_chemin->0 <> p_grille->'depart' or p_chemin->(n - 1) <> p_grille->'arrivee' then return false; end if;
  for i in 0 .. n - 1 loop
    x := (p_chemin->i->>0)::int; y := (p_chemin->i->>1)::int;
    cle := x || ',' || y;
    if cle = any(vus) or not (p_grille->'cases' @> jsonb_build_array(jsonb_build_array(x, y))) then return false; end if;
    vus := vus || cle;
    if i > 0 then
      px := (p_chemin->(i - 1)->>0)::int; py := (p_chemin->(i - 1)->>1)::int;
      if abs(x - px) + abs(y - py) <> 1 then return false; end if;
    end if;
    boule := p_grille->'boules'->>cle;
    if boule is not null then
      if i = 0 or i = n - 1 then return false; end if;
      px := (p_chemin->(i - 1)->>0)::int; py := (p_chemin->(i - 1)->>1)::int;
      nx := (p_chemin->(i + 1)->>0)::int; ny := (p_chemin->(i + 1)->>1)::int;
      tourne := (x - px, y - py) <> (nx - x, ny - y);
      if (boule = 'tourne') <> tourne then return false; end if;
    end if;
  end loop;
  return true;
exception when others then
  return false;                                   -- coordonnées illisibles : refusé
end;
$$;

-- ---------- ce que le jeu peut appeler ----------
-- une grille ouverte, sans sa solution
create or replace function public.avent_grille(p_jour int, p_appareil uuid) returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare v jsonb;
begin
  if not public.avent_ouverte(p_jour, p_appareil) then raise exception 'grille fermée'; end if;
  select grille || jsonb_build_object('jour', jour) into v from public.avent_grilles where jour = p_jour;
  return v;
end;
$$;

-- premier coup joué : le serveur lance le chrono
create or replace function public.avent_commencer(p_jour int, p_appareil uuid) returns uuid
language plpgsql security definer set search_path = public as $$
declare v uuid;
begin
  if not public.avent_ouverte(p_jour, p_appareil) then raise exception 'grille fermée'; end if;
  if (select count(*) from public.avent_parties where appareil = p_appareil and debut > now() - interval '1 hour') >= 120 then
    raise exception 'trop de parties';
  end if;
  insert into public.avent_parties (jour, appareil) values (p_jour, p_appareil) returning id into v;
  return v;
end;
$$;

-- un indice : la case suivante, ou la case où revenir ; +5 s comptés par le serveur
create or replace function public.avent_indice(p_partie uuid, p_appareil uuid, p_chemin jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_jour int; v_sol jsonb; k int := 0; n int;
begin
  select jour into v_jour from public.avent_parties where id = p_partie and appareil = p_appareil and fin is null;
  if v_jour is null then raise exception 'partie inconnue'; end if;
  select solution into v_sol from public.avent_grilles where jour = v_jour;
  n := least(coalesce(jsonb_array_length(p_chemin), 0), jsonb_array_length(v_sol));
  while k < n and p_chemin->k = v_sol->k loop k := k + 1; end loop;
  update public.avent_parties set indices = indices + 1 where id = p_partie;
  if k = coalesce(jsonb_array_length(p_chemin), 0) and k < jsonb_array_length(v_sol) then
    return jsonb_build_object('case', v_sol->k, 'retour', false);
  end if;
  return jsonb_build_object('case', v_sol->greatest(k - 1, 0), 'retour', true);
end;
$$;

-- classer une partie terminée (appelé par avent_terminer, ou plus tard si le joueur choisit son pseudo après)
create or replace function public.avent_classer(p_partie uuid, p_appareil uuid, p_nom text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  p public.avent_parties;
  v_nom text;
  v_minimum int;
begin
  select * into p from public.avent_parties where id = p_partie and appareil = p_appareil and fin is not null;
  if p.id is null then raise exception 'partie inconnue'; end if;
  if public.avent_organisateur(p_appareil) then
    return jsonb_build_object('classe', false, 'raison', 'organisateur');
  end if;
  if public.avent_cotonou() >= make_timestamp(2026, 12, p.jour, 0, 0, 0) + interval '1 day 6 hours' then
    return jsonb_build_object('classe', false, 'raison', 'hors délai');
  end if;
  v_minimum := case when p.jour <= 2 then 3000 when p.jour <= 6 then 5000 when p.jour <= 13 then 7000 else 9000 end;
  if p.temps_ms < v_minimum then
    return jsonb_build_object('classe', false, 'raison', 'temps refusé');
  end if;
  if coalesce(btrim(p_nom), '') = '' then
    return jsonb_build_object('classe', false, 'raison', 'sans pseudo');
  end if;
  v_nom := public.avent_choisir_nom(p_appareil, p_nom);       -- « nom refusé » / « nom pris » remontent au jeu
  insert into public.avent_scores as s (jour, appareil, nom, temps_ms)
  values (p.jour, p_appareil, v_nom, p.temps_ms)
  on conflict (jour, appareil) do update
    set temps_ms = least(s.temps_ms, excluded.temps_ms), nom = excluded.nom, maj = now();
  return jsonb_build_object('classe', true);
end;
$$;

-- fin de partie : le serveur vérifie le fil, calcule le temps officiel, puis classe si possible
create or replace function public.avent_terminer(p_partie uuid, p_appareil uuid, p_chemin jsonb, p_nom text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  p public.avent_parties;
  v_grille jsonb;
  v_temps int;
  v_classe jsonb;
begin
  select * into p from public.avent_parties where id = p_partie and appareil = p_appareil;
  if p.id is null then raise exception 'partie inconnue'; end if;
  if p.fin is not null then raise exception 'partie déjà terminée'; end if;
  select grille into v_grille from public.avent_grilles where jour = p.jour;
  if not public.avent_fil_valide(v_grille, p_chemin) then raise exception 'fil refusé'; end if;
  v_temps := (extract(epoch from (now() - p.debut)) * 1000)::int + 5000 * p.indices;
  update public.avent_parties set fin = now(), temps_ms = v_temps where id = p_partie;
  begin
    v_classe := public.avent_classer(p_partie, p_appareil, p_nom);
  exception when others then                      -- pseudo pris ou refusé : la partie reste vérifiée, on la classera après
    v_classe := jsonb_build_object('classe', false, 'raison', sqlerrm);
  end;
  return jsonb_build_object('temps_ms', v_temps, 'indices', p.indices) || v_classe;
end;
$$;

-- ---------- classements : les organisateurs n'y figurent jamais ----------
create or replace function public.avent_classement(p_jour int, p_appareil uuid)
returns table (rang bigint, nom text, temps_ms int, moi boolean, joueurs bigint)
language sql stable security definer set search_path = public as $$
  with classe as (
    select rank() over (order by s.temps_ms, s.maj) as rang, s.nom, s.temps_ms, s.appareil = p_appareil as moi,
           count(*) over () as joueurs
    from public.avent_scores s
    where s.jour = p_jour
      and not exists (select 1 from public.avent_joueurs j where j.appareil = s.appareil and j.organisateur)
  )
  select rang, nom, temps_ms, moi, joueurs from classe where rang <= 10 or moi order by rang limit 11;
$$;

create or replace function public.avent_classement_general(p_appareil uuid)
returns table (rang bigint, nom text, grilles bigint, moyenne_ms int, moi boolean, joueurs bigint)
language sql stable security definer set search_path = public as $$
  with parjoueur as (
    select s.appareil, max(s.nom) nom, count(*) grilles, round(avg(s.temps_ms))::int moyenne_ms, max(s.maj) derniere
    from public.avent_scores s
    where not exists (select 1 from public.avent_joueurs j where j.appareil = s.appareil and j.organisateur)
    group by s.appareil
  ), classe as (
    select rank() over (order by grilles desc, moyenne_ms, derniere) rang, nom, grilles, moyenne_ms,
           appareil = p_appareil moi, count(*) over () joueurs
    from parjoueur
  )
  select rang, nom, grilles, moyenne_ms, moi, joueurs from classe where rang <= 10 or moi order by rang limit 11;
$$;

-- ---------- droits : la clé publique n'atteint que ces fonctions ----------
revoke all on function public.avent_cotonou() from public;
revoke all on function public.avent_organisateur(uuid) from public;
revoke all on function public.avent_ouverte(int, uuid) from public;
revoke all on function public.avent_fil_valide(jsonb, jsonb) from public;
revoke all on function public.avent_grille(int, uuid) from public;
revoke all on function public.avent_commencer(int, uuid) from public;
revoke all on function public.avent_indice(uuid, uuid, jsonb) from public;
revoke all on function public.avent_classer(uuid, uuid, text) from public;
revoke all on function public.avent_terminer(uuid, uuid, jsonb, text) from public;
revoke all on function public.avent_envoyer(int, uuid, text, int) from public, anon;   -- l'ancienne porte est fermée
grant execute on function public.avent_grille(int, uuid) to anon;
grant execute on function public.avent_commencer(int, uuid) to anon;
grant execute on function public.avent_indice(uuid, uuid, jsonb) to anon;
grant execute on function public.avent_classer(uuid, uuid, text) to anon;
grant execute on function public.avent_terminer(uuid, uuid, jsonb, text) to anon;
grant execute on function public.avent_classement(int, uuid) to anon;
grant execute on function public.avent_classement_general(uuid) to anon;

-- Supabase donne d'office l'exécution des nouvelles fonctions aux rôles anon et authenticated : on la retire
-- explicitement aux fonctions internes, et à authenticated partout (le jeu n'utilise que la clé publique).
revoke execute on function public.avent_cotonou() from anon, authenticated;
revoke execute on function public.avent_organisateur(uuid) from anon, authenticated;
revoke execute on function public.avent_ouverte(int, uuid) from anon, authenticated;
revoke execute on function public.avent_fil_valide(jsonb, jsonb) from anon, authenticated;
revoke execute on function public.avent_cle_nom(text) from anon, authenticated;
revoke execute on function public.avent_envoyer(int, uuid, text, int) from anon, authenticated;
revoke execute on function public.avent_choisir_nom(uuid, text) from authenticated;
revoke execute on function public.avent_classement(int, uuid) from authenticated;
revoke execute on function public.avent_classement_general(uuid) from authenticated;
revoke execute on function public.avent_classer(uuid, uuid, text) from authenticated;
revoke execute on function public.avent_commencer(int, uuid) from authenticated;
revoke execute on function public.avent_donner_avis(uuid, int, text, jsonb) from authenticated;
revoke execute on function public.avent_evenement(uuid, text, int, jsonb) from authenticated;
revoke execute on function public.avent_grille(int, uuid) from authenticated;
revoke execute on function public.avent_indice(uuid, uuid, jsonb) from authenticated;
revoke execute on function public.avent_terminer(uuid, uuid, jsonb, text) from authenticated;
