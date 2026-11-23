-- Classement public du jeu de l'Avent « Les guirlandes » (simeon013.github.io/avent), projet Supabase de Siméon.
--
-- Ce qui est gardé : pour chaque grille du jour, un prénom (choisi par le joueur, 16 caractères au plus), son
-- meilleur temps, et un identifiant d'appareil tiré au hasard par la page (aucune donnée personnelle : pas de
-- compte, pas d'e-mail, pas d'adresse IP).
-- Personne ne lit ni n'écrit la table directement : la page passe par deux fonctions qui vérifient tout.
-- Les données des autres schémas (app.*) restent inaccessibles avec la clé publique.

create table if not exists public.avent_scores (
  jour      smallint    not null check (jour between 1 and 24),
  appareil  uuid        not null,
  nom       text        not null check (char_length(nom) between 1 and 16),
  temps_ms  integer     not null check (temps_ms > 0),
  maj       timestamptz not null default now(),
  primary key (jour, appareil)
);
create index if not exists avent_scores_jour_temps on public.avent_scores (jour, temps_ms);

alter table public.avent_scores enable row level security;   -- aucune règle : accès direct refusé à tous
revoke all on public.avent_scores from anon, authenticated;

-- Envoyer un temps : on garde le meilleur temps de l'appareil pour cette grille.
create or replace function public.avent_envoyer(p_jour int, p_appareil uuid, p_nom text, p_temps_ms int)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nom      text := btrim(regexp_replace(coalesce(p_nom, ''), '\s+', ' ', 'g'));
  v_cotonou  timestamp := (now() at time zone 'Africa/Porto-Novo');
  v_minimum  int;
begin
  -- la grille doit être ouverte (le jour J s'ouvre le J décembre 2026 à minuit, heure de Cotonou)
  if p_jour < 1 or p_jour > 24 or v_cotonou < make_timestamp(2026, 12, p_jour, 0, 0, 0) then
    raise exception 'grille fermée';
  end if;
  -- un temps humainement possible (un fil tracé case par case prend du temps)
  v_minimum := case when p_jour <= 2 then 3000 when p_jour <= 6 then 5000 when p_jour <= 13 then 7000 else 9000 end;
  if p_temps_ms < v_minimum or p_temps_ms > 6 * 3600 * 1000 then
    raise exception 'temps refusé';
  end if;
  -- un prénom simple : lettres (accents compris), chiffres, espace, tiret, point, apostrophe
  if v_nom !~ '^[[:alnum:]À-ÖØ-öø-ÿ][[:alnum:]À-ÖØ-öø-ÿ .''-]{0,15}$' then
    raise exception 'nom refusé';
  end if;
  if lower(v_nom) ~ '(merde|connard|connasse|salope|pute|encul|batard|bâtard|nique|tapette|nazi|hitler|lutin|admin|simeon|siméon)'
     or lower(v_nom) ~ '\m(fdp|ntm|pd|bot)\M' then
    raise exception 'nom refusé';      -- insultes, et les noms qui feraient croire à un bot ou à Siméon
  end if;
  insert into public.avent_scores as s (jour, appareil, nom, temps_ms)
  values (p_jour, p_appareil, v_nom, p_temps_ms)
  on conflict (jour, appareil) do update
    set temps_ms = least(s.temps_ms, excluded.temps_ms),
        nom = excluded.nom,
        maj = now();
end;
$$;

-- Lire le classement d'une grille : les 10 meilleurs, plus la ligne de l'appareil qui demande.
create or replace function public.avent_classement(p_jour int, p_appareil uuid)
returns table (rang bigint, nom text, temps_ms int, moi boolean, joueurs bigint)
language sql
stable
security definer
set search_path = public
as $$
  with classe as (
    select rank() over (order by s.temps_ms, s.maj) as rang, s.nom, s.temps_ms, s.appareil = p_appareil as moi,
           count(*) over () as joueurs
    from public.avent_scores s
    where s.jour = p_jour
  )
  select rang, nom, temps_ms, moi, joueurs from classe where rang <= 10 or moi order by rang limit 11;
$$;

revoke all on function public.avent_envoyer(int, uuid, text, int) from public;
revoke all on function public.avent_classement(int, uuid) from public;
grant execute on function public.avent_envoyer(int, uuid, text, int) to anon;
grant execute on function public.avent_classement(int, uuid) to anon;
