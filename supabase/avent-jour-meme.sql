-- Jeu de l'Avent « Les guirlandes » : deux règles de plus pour des classements justes.
-- Suite de avent-classement.sql et avent-statistiques.sql.
--
-- 1. Seuls les temps faits le jour de la grille comptent. Chaque matin, le post du jour montre la solution
--    de la veille : un temps envoyé après coup pourrait être recopié. Une grille reste donc classée de son
--    ouverture (minuit, heure du Bénin) jusqu'au lendemain 6 h, juste avant que sa solution soit publiée.
--    Après, elle reste jouable pour le plaisir, mais le temps n'est plus envoyé au classement.
-- 2. Un joueur peut être mis « hors classement » (Siméon, qui connaît les solutions) : il joue normalement,
--    mais n'apparaît ni dans le classement du jour, ni dans le général, ni dans les posts.

alter table public.avent_joueurs add column if not exists hors_classement boolean not null default false;

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
  if v_cotonou >= make_timestamp(2026, 12, p_jour, 0, 0, 0) + interval '1 day 6 hours' then
    raise exception 'hors délai';
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

create or replace function public.avent_classement(p_jour int, p_appareil uuid)
returns table (rang bigint, nom text, temps_ms int, moi boolean, joueurs bigint)
language sql stable security definer set search_path = public as $$
  with classe as (
    select rank() over (order by s.temps_ms, s.maj) as rang, s.nom, s.temps_ms, s.appareil = p_appareil as moi,
           count(*) over () as joueurs
    from public.avent_scores s
    where s.jour = p_jour
      and not exists (select 1 from public.avent_joueurs j where j.appareil = s.appareil and j.hors_classement)
  )
  select rang, nom, temps_ms, moi, joueurs from classe where rang <= 10 or moi order by rang limit 11;
$$;

create or replace function public.avent_classement_general(p_appareil uuid)
returns table (rang bigint, nom text, grilles bigint, moyenne_ms int, moi boolean, joueurs bigint)
language sql stable security definer set search_path = public as $$
  with parjoueur as (
    select s.appareil, max(s.nom) nom, count(*) grilles, round(avg(s.temps_ms))::int moyenne_ms, max(s.maj) derniere
    from public.avent_scores s
    where not exists (select 1 from public.avent_joueurs j where j.appareil = s.appareil and j.hors_classement)
    group by s.appareil
  ), classe as (
    select rank() over (order by grilles desc, moyenne_ms, derniere) rang, nom, grilles, moyenne_ms,
           appareil = p_appareil moi, count(*) over () joueurs
    from parjoueur
  )
  select rang, nom, grilles, moyenne_ms, moi, joueurs from classe where rang <= 10 or moi order by rang limit 11;
$$;

-- les droits ne changent pas (create or replace les garde) ; rappel :
revoke all on function public.avent_envoyer(int, uuid, text, int) from public;
revoke all on function public.avent_classement(int, uuid) from public;
revoke all on function public.avent_classement_general(uuid) from public;
grant execute on function public.avent_envoyer(int, uuid, text, int) to anon;
grant execute on function public.avent_classement(int, uuid) to anon;
grant execute on function public.avent_classement_general(uuid) to anon;
