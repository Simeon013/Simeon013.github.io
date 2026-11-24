-- Jeu de l'Avent « Les guirlandes » : un seul essai classé par grille, et pas de numéro de téléphone en pseudo.
-- Suite de avent-securite.sql.
--
-- 1. La grille du jour n'arrive qu'avec le chrono : avent_commencer la donne et lance le temps en même temps
--    (avent_grille n'est plus appelable avec la clé publique). Impossible de l'étudier avant de commencer.
-- 2. Le premier essai de l'appareil est le seul classé. Le chrono ne s'arrête pas : recommencer ou quitter la
--    grille ne le remet pas à zéro (revenir reprend le même essai). Une fois cet essai fini, on peut rejouer pour
--    le plaisir : ces essais libres ne sont jamais classés.
-- 3. Un pseudo qui ressemble à un numéro de téléphone est refusé (le classement est public).

alter table public.avent_parties add column if not exists classee boolean not null default true;

drop function if exists public.avent_commencer(int, uuid);   -- elle rendait un uuid, elle rend maintenant la grille aussi
create function public.avent_commencer(p_jour int, p_appareil uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  p public.avent_parties;
  v_grille jsonb;
  v_id uuid;
  v_classee boolean;
begin
  if not public.avent_ouverte(p_jour, p_appareil) then raise exception 'grille fermée'; end if;
  select grille into v_grille from public.avent_grilles where jour = p_jour;
  select * into p from public.avent_parties where jour = p_jour and appareil = p_appareil and classee order by debut limit 1;
  if p.id is not null and p.fin is null then        -- l'essai classé continue : on le reprend, chrono compris
    return jsonb_build_object('partie', p.id, 'classee', true, 'indices', p.indices,
                              'ecoule_ms', (extract(epoch from (now() - p.debut)) * 1000)::int, 'grille', v_grille);
  end if;
  if (select count(*) from public.avent_parties where appareil = p_appareil and debut > now() - interval '1 hour') >= 120 then
    raise exception 'trop de parties';
  end if;
  v_classee := p.id is null;
  insert into public.avent_parties (jour, appareil, classee) values (p_jour, p_appareil, v_classee) returning id into v_id;
  return jsonb_build_object('partie', v_id, 'classee', v_classee, 'indices', 0, 'ecoule_ms', 0, 'grille', v_grille);
end;
$$;

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
  if not p.classee then
    return jsonb_build_object('classe', false, 'raison', 'essai libre');
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
  v_nom := public.avent_choisir_nom(p_appareil, p_nom);
  insert into public.avent_scores as s (jour, appareil, nom, temps_ms)
  values (p.jour, p_appareil, v_nom, p.temps_ms)
  on conflict (jour, appareil) do update set temps_ms = excluded.temps_ms, nom = excluded.nom, maj = now();
  return jsonb_build_object('classe', true);
end;
$$;

create or replace function public.avent_choisir_nom(p_appareil uuid, p_nom text)
returns text
language plpgsql security definer set search_path = public as $$
declare
  v_nom text := btrim(regexp_replace(coalesce(p_nom, ''), '\s+', ' ', 'g'));
  v_cle text := public.avent_cle_nom(p_nom);
  v_proprio uuid;
begin
  if length(regexp_replace(v_nom, '\D', '', 'g')) >= 6 then
    raise exception 'numéro';                       -- un numéro de téléphone serait visible par tous
  end if;
  if v_nom !~ '^[[:alnum:]À-ÖØ-öø-ÿ][[:alnum:]À-ÖØ-öø-ÿ .''-]{0,15}$'
     or v_cle ~ '(merde|connard|connasse|salope|pute|encul|batard|nique|tapette|nazi|hitler|lutin|admin)'
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

-- la grille ne s'obtient plus qu'avec avent_commencer (et le chrono qui va avec)
revoke execute on function public.avent_grille(int, uuid) from anon, authenticated;
revoke all on function public.avent_commencer(int, uuid) from public;
revoke execute on function public.avent_commencer(int, uuid) from authenticated;
revoke execute on function public.avent_classer(uuid, uuid, text) from authenticated;
revoke execute on function public.avent_choisir_nom(uuid, text) from authenticated;
grant execute on function public.avent_commencer(int, uuid) to anon;
grant execute on function public.avent_classer(uuid, uuid, text) to anon;
grant execute on function public.avent_choisir_nom(uuid, text) to anon;
