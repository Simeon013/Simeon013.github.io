-- Jeu de l'Avent « Les guirlandes » : prénoms uniques, statistiques anonymes et avis des joueurs.
-- Suite de avent-classement.sql. Tout passe par des fonctions ; aucune table n'est lisible avec la clé publique.
-- Les statistiques ne contiennent rien de personnel : un identifiant d'appareil tiré au hasard, un type
-- d'événement (visite, partie commencée, victoire…), le numéro de la grille et quelques chiffres de la partie.

-- 1. Les joueurs : un prénom par appareil, et un prénom n'appartient qu'à un appareil ----------------------------
create table if not exists public.avent_joueurs (
  appareil  uuid        primary key,
  nom       text        not null,
  nom_cle   text        not null unique,        -- le prénom sans majuscules ni accents : « Awa » = « àwa »
  cree      timestamptz not null default now(),
  maj       timestamptz not null default now()
);
alter table public.avent_joueurs enable row level security;
revoke all on public.avent_joueurs from anon, authenticated;

create or replace function public.avent_cle_nom(p_nom text) returns text
language sql immutable as $$
  select lower(translate(btrim(regexp_replace(coalesce(p_nom, ''), '\s+', ' ', 'g')),
    'àâäáãåçéèêëíìîïñóòôöõúùûüýÿÀÂÄÁÃÅÇÉÈÊËÍÌÎÏÑÓÒÔÖÕÚÙÛÜÝ',
    'aaaaaaceeeeiiiinooooouuuuyyAAAAAACEEEEIIIINOOOOOUUUUY'))
$$;

-- Enregistre (ou change) le prénom d'un appareil ; erreurs : « nom refusé », « nom pris ».
create or replace function public.avent_choisir_nom(p_appareil uuid, p_nom text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_nom text := btrim(regexp_replace(coalesce(p_nom, ''), '\s+', ' ', 'g'));
  v_cle text := public.avent_cle_nom(p_nom);
  v_proprio uuid;
begin
  if v_nom !~ '^[[:alnum:]À-ÖØ-öø-ÿ][[:alnum:]À-ÖØ-öø-ÿ .''-]{0,15}$'
     or v_cle ~ '(merde|connard|connasse|salope|pute|encul|batard|nique|tapette|nazi|hitler|lutin|admin|simeon)'
     or v_cle ~ '\m(fdp|ntm|pd|bot)\M' then
    raise exception 'nom refusé';
  end if;
  select appareil into v_proprio from public.avent_joueurs where nom_cle = v_cle;
  if v_proprio is not null and v_proprio <> p_appareil then
    raise exception 'nom pris';
  end if;
  insert into public.avent_joueurs (appareil, nom, nom_cle) values (p_appareil, v_nom, v_cle)
  on conflict (appareil) do update set nom = excluded.nom, nom_cle = excluded.nom_cle, maj = now();
  update public.avent_scores set nom = v_nom where appareil = p_appareil and nom <> v_nom;
  return v_nom;
end;
$$;

-- Envoyer un temps : le prénom est d'abord enregistré (ou vérifié), puis on garde le meilleur temps.
create or replace function public.avent_envoyer(p_jour int, p_appareil uuid, p_nom text, p_temps_ms int)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_cotonou timestamp := (now() at time zone 'Africa/Porto-Novo');
  v_minimum int;
  v_nom     text;
begin
  if p_jour < 1 or p_jour > 24 or v_cotonou < make_timestamp(2026, 12, p_jour, 0, 0, 0) then
    raise exception 'grille fermée';
  end if;
  v_minimum := case when p_jour <= 2 then 3000 when p_jour <= 6 then 5000 when p_jour <= 13 then 7000 else 9000 end;
  if p_temps_ms < v_minimum or p_temps_ms > 6 * 3600 * 1000 then
    raise exception 'temps refusé';
  end if;
  v_nom := public.avent_choisir_nom(p_appareil, p_nom);
  insert into public.avent_scores as s (jour, appareil, nom, temps_ms)
  values (p_jour, p_appareil, v_nom, p_temps_ms)
  on conflict (jour, appareil) do update
    set temps_ms = least(s.temps_ms, excluded.temps_ms), nom = excluded.nom, maj = now();
end;
$$;

-- 2. Les statistiques anonymes ----------------------------------------------------------------------------------
create table if not exists public.avent_evenements (
  id        bigint generated always as identity primary key,
  appareil  uuid        not null,
  type      text        not null check (type in ('visite', 'debut', 'victoire', 'abandon', 'indice', 'partage', 'regle', 'avis_ouvert')),
  jour      smallint    check (jour between 0 and 24),
  donnees   jsonb       not null default '{}'::jsonb,
  cree      timestamptz not null default now()
);
create index if not exists avent_evenements_type_cree on public.avent_evenements (type, cree);
create index if not exists avent_evenements_appareil on public.avent_evenements (appareil, cree);
alter table public.avent_evenements enable row level security;
revoke all on public.avent_evenements from anon, authenticated;

create or replace function public.avent_evenement(p_appareil uuid, p_type text, p_jour int, p_donnees jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_type not in ('visite', 'debut', 'victoire', 'abandon', 'indice', 'partage', 'regle', 'avis_ouvert')
     or (p_jour is not null and (p_jour < 0 or p_jour > 24))
     or length(coalesce(p_donnees, '{}'::jsonb)::text) > 1000 then
    return;                                   -- on ignore sans bruit ce qui ne ressemble pas au jeu
  end if;
  -- au plus 600 événements par appareil et par heure (une partie normale en envoie une dizaine)
  if (select count(*) from public.avent_evenements where appareil = p_appareil and cree > now() - interval '1 hour') >= 600 then
    return;
  end if;
  insert into public.avent_evenements (appareil, type, jour, donnees) values (p_appareil, p_type, p_jour, coalesce(p_donnees, '{}'::jsonb));
end;
$$;

-- 3. Les avis des joueurs ---------------------------------------------------------------------------------------
create table if not exists public.avent_avis (
  id        bigint generated always as identity primary key,
  appareil  uuid        not null,
  nom       text,
  note      smallint    check (note between 1 and 5),
  message   text        check (char_length(message) <= 1000),
  contexte  jsonb       not null default '{}'::jsonb,
  lu        boolean     not null default false,
  cree      timestamptz not null default now()
);
alter table public.avent_avis enable row level security;
revoke all on public.avent_avis from anon, authenticated;

create or replace function public.avent_donner_avis(p_appareil uuid, p_note int, p_message text, p_contexte jsonb)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_note is null and coalesce(btrim(p_message), '') = '' then raise exception 'avis vide'; end if;
  if (select count(*) from public.avent_avis where appareil = p_appareil and cree > now() - interval '1 day') >= 5 then
    raise exception 'trop d''avis';
  end if;
  insert into public.avent_avis (appareil, nom, note, message, contexte)
  values (p_appareil, (select nom from public.avent_joueurs where appareil = p_appareil),
          case when p_note between 1 and 5 then p_note end, left(btrim(p_message), 1000),
          case when length(coalesce(p_contexte, '{}'::jsonb)::text) <= 500 then coalesce(p_contexte, '{}'::jsonb) else '{}'::jsonb end);
end;
$$;

revoke all on function public.avent_cle_nom(text) from public;
revoke all on function public.avent_choisir_nom(uuid, text) from public;
revoke all on function public.avent_envoyer(int, uuid, text, int) from public;
revoke all on function public.avent_evenement(uuid, text, int, jsonb) from public;
revoke all on function public.avent_donner_avis(uuid, int, text, jsonb) from public;
grant execute on function public.avent_choisir_nom(uuid, text) to anon;
grant execute on function public.avent_envoyer(int, uuid, text, int) to anon;
grant execute on function public.avent_evenement(uuid, text, int, jsonb) to anon;
grant execute on function public.avent_donner_avis(uuid, int, text, jsonb) to anon;

-- 4. Le classement général : d'abord le nombre de grilles terminées, puis le temps moyen ---------------------------
create or replace function public.avent_classement_general(p_appareil uuid)
returns table (rang bigint, nom text, grilles bigint, moyenne_ms int, moi boolean, joueurs bigint)
language sql stable security definer set search_path = public as $$
  with parjoueur as (
    select s.appareil, max(s.nom) nom, count(*) grilles, round(avg(s.temps_ms))::int moyenne_ms, max(s.maj) derniere
    from public.avent_scores s group by s.appareil
  ), classe as (
    select rank() over (order by grilles desc, moyenne_ms, derniere) rang, nom, grilles, moyenne_ms,
           appareil = p_appareil moi, count(*) over () joueurs
    from parjoueur
  )
  select rang, nom, grilles, moyenne_ms, moi, joueurs from classe where rang <= 10 or moi order by rang limit 11;
$$;
revoke all on function public.avent_classement_general(uuid) from public;
grant execute on function public.avent_classement_general(uuid) to anon;
