-- M0 core schema (spec §10). Clients read/write `geojson`; triggers maintain PostGIS columns.
-- Every synced table: id, created_at, updated_at, deleted_at (soft delete), owner/area for RLS.

create extension if not exists postgis with schema extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Pin types (lookup table, not an enum — spec §10.1).
-- Keep in sync with packages/shared/src/pin-types.ts (a test enforces it).
-- ---------------------------------------------------------------------------

create table public.pin_types (
  id text primary key,
  category text not null
    check (category in ('sign','habitat','setup','access','property','event','custom')),
  geometry_kind text not null check (geometry_kind in ('point','line','polygon','any')),
  alt_geometry_kind text check (alt_geometry_kind in ('point','line','polygon')),
  half_life_days int check (half_life_days > 0)
);

insert into public.pin_types (id, category, geometry_kind, alt_geometry_kind, half_life_days) values
  ('rub',            'sign',     'point',   null,      30),
  ('rub_line',       'sign',     'line',    null,      30),
  ('scrape',         'sign',     'point',   null,      14),
  ('tracks',         'sign',     'point',   null,      3),
  ('droppings',      'sign',     'point',   null,      3),
  ('bed',            'sign',     'point',   null,      14),
  ('trail',          'sign',     'line',    null,      null),
  ('crossing',       'sign',     'point',   null,      null),
  ('shed',           'sign',     'point',   null,      null),
  ('food_source',    'habitat',  'point',   'polygon', null),
  ('water',          'habitat',  'point',   'polygon', null),
  ('bedding_area',   'habitat',  'polygon', null,      null),
  ('thick_cover',    'habitat',  'polygon', null,      null),
  ('sanctuary',      'habitat',  'polygon', null,      null),
  ('stand',          'setup',    'point',   null,      null),
  ('blind',          'setup',    'point',   null,      null),
  ('trail_camera',   'setup',    'point',   null,      null),
  ('feeder_mineral', 'setup',    'point',   null,      null),
  ('glassing_point', 'setup',    'point',   null,      null),
  ('parking',        'access',   'point',   null,      null),
  ('access_point',   'access',   'point',   null,      null),
  ('entry_route',    'access',   'line',    null,      null),
  ('exit_route',     'access',   'line',    null,      null),
  ('boundary',       'property', 'polygon', null,      null),
  ('corner',         'property', 'point',   null,      null),
  ('neighbor_stand', 'property', 'point',   null,      null),
  ('no_hunt_zone',   'property', 'polygon', null,      null),
  ('hazard',         'property', 'point',   null,      null),
  ('sighting',       'event',    'point',   null,      null),
  ('harvest',        'event',    'point',   null,      null),
  ('hit_site',       'event',    'point',   null,      null),
  ('blood',          'event',    'point',   null,      null),
  ('last_blood',     'event',    'point',   null,      null),
  ('recovery',       'event',    'point',   null,      null),
  ('custom',         'custom',   'any',     null,      null);

-- ---------------------------------------------------------------------------
-- Profiles (one per auth user, created by trigger)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  experience text not null default 'beginner'
    check (experience in ('beginner','intermediate','experienced')),
  home_state char(2) check (home_state ~ '^[A-Z]{2}$'),
  units text not null default 'imperial' check (units in ('imperial','metric')),
  -- Youth fields are never set from the client; the mentor-linking flow (M3) will own them.
  is_youth boolean not null default false,
  mentor_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Hunt areas & membership
-- ---------------------------------------------------------------------------

create table public.hunt_areas (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id),
  name text not null,
  boundary_geojson jsonb,
  boundary extensions.geometry(MultiPolygon, 4326),
  state char(2) check (state ~ '^[A-Z]{2}$'),
  rut_region_id text,
  rut_override jsonb,
  analysis_status text not null default 'none'
    check (analysis_status in ('none','queued','running','ready','failed')),
  analysis_version int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index hunt_areas_boundary_idx on public.hunt_areas using gist (boundary);
create index hunt_areas_owner_idx on public.hunt_areas (owner_id);

create table public.area_members (
  area_id uuid references public.hunt_areas(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  role text not null check (role in ('owner','admin','member','youth','guest')),
  expires_at timestamptz,
  primary key (area_id, user_id)
);
create index area_members_user_idx on public.area_members (user_id);

-- ---------------------------------------------------------------------------
-- Pins, tracks, sits, sightings, wind checks
-- ---------------------------------------------------------------------------

create table public.pins (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id),
  area_id uuid references public.hunt_areas(id),
  type text not null references public.pin_types(id),
  subtype text,
  name text,
  notes text,
  geojson jsonb not null,
  geom extensions.geometry(Geometry, 4326),
  observed_at timestamptz,
  attrs jsonb not null default '{}',
  visibility text not null default 'private' check (visibility in ('private','area')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index pins_geom_idx on public.pins using gist (geom);
create index pins_area_type_idx on public.pins (area_id, type) where deleted_at is null;
create index pins_owner_idx on public.pins (owner_id);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references public.profiles(id),
  area_id uuid references public.hunt_areas(id),
  kind text not null check (kind in ('scouting','entry','exit','blood_trail','shed_hunt','other')),
  started_at timestamptz not null,
  ended_at timestamptz,
  geojson jsonb,                               -- LineString coords [lon, lat, ele_m, epoch_s]
  geom extensions.geometry(LineStringZM, 4326),
  stats jsonb,                                 -- distance_m, gain_m, loss_m, duration_s
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index tracks_owner_idx on public.tracks (owner_id);

create table public.sits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id),
  area_id uuid references public.hunt_areas(id),
  stand_pin_id uuid references public.pins(id),
  geojson jsonb,
  started_at timestamptz not null,
  ended_at timestamptz,
  weapon text,
  weather_snapshot jsonb,
  tips jsonb,
  outcome text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index sits_user_idx on public.sits (user_id);

create table public.sightings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id),
  area_id uuid references public.hunt_areas(id),
  sit_id uuid references public.sits(id),
  observed_at timestamptz not null,
  observer_geojson jsonb,
  animal_geojson jsonb,
  species text not null default 'whitetail',
  sex text,
  age_class text,
  count int not null default 1 check (count > 0),
  behavior text,
  heading_deg smallint check (heading_deg between 0 and 359),
  distance_yd smallint check (distance_yd >= 0),
  weather jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index sightings_user_idx on public.sightings (user_id);

create table public.wind_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles(id),
  stand_pin_id uuid references public.pins(id),
  observed_at timestamptz not null,
  geojson jsonb,
  drift_toward_deg smallint check (drift_toward_deg between 0 and 359),
  strength text check (strength in ('calm','light','steady','swirling')),
  modeled jsonb,
  created_at timestamptz not null default now()
);
create index wind_checks_user_idx on public.wind_checks (user_id);

-- updated_at triggers
create trigger hunt_areas_updated_at before update on public.hunt_areas
  for each row execute function public.set_updated_at();
create trigger pins_updated_at before update on public.pins
  for each row execute function public.set_updated_at();
create trigger tracks_updated_at before update on public.tracks
  for each row execute function public.set_updated_at();
create trigger sits_updated_at before update on public.sits
  for each row execute function public.set_updated_at();
create trigger sightings_updated_at before update on public.sightings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- GeoJSON → PostGIS triggers
-- ---------------------------------------------------------------------------

create or replace function public.geojson_to_geom(g jsonb)
returns extensions.geometry
language sql
immutable
set search_path = ''
as $$
  select case when g is null then null
    else extensions.st_setsrid(extensions.st_geomfromgeojson(g::text), 4326) end;
$$;

create or replace function public.hunt_areas_sync_geom()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.boundary := extensions.st_multi(public.geojson_to_geom(new.boundary_geojson));
  return new;
end;
$$;

create trigger hunt_areas_geom before insert or update of boundary_geojson on public.hunt_areas
  for each row execute function public.hunt_areas_sync_geom();

-- Also validates that the geometry matches the pin type (spec §5.2 table).
create or replace function public.pins_sync_geom()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  kind text;
  alt text;
  actual text;
begin
  new.geom := public.geojson_to_geom(new.geojson);
  select geometry_kind, alt_geometry_kind into kind, alt from public.pin_types where id = new.type;
  actual := case extensions.geometrytype(new.geom)
    when 'POINT' then 'point'
    when 'LINESTRING' then 'line'
    when 'POLYGON' then 'polygon'
    else 'other'
  end;
  if kind <> 'any' and actual <> kind and actual is distinct from alt then
    raise exception 'pin type % expects % geometry, got %', new.type, kind, actual
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger pins_geom before insert or update of geojson, type on public.pins
  for each row execute function public.pins_sync_geom();

create or replace function public.tracks_sync_geom()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.geom := extensions.st_force4d(public.geojson_to_geom(new.geojson));
  return new;
end;
$$;

create trigger tracks_geom before insert or update of geojson on public.tracks
  for each row execute function public.tracks_sync_geom();

-- ---------------------------------------------------------------------------
-- Membership helpers (security definer so policies don't recurse through RLS)
-- ---------------------------------------------------------------------------

create or replace function public.area_role(p_area uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select m.role
  from public.area_members m
  join public.hunt_areas a on a.id = m.area_id
  where m.area_id = p_area
    and m.user_id = (select auth.uid())
    and a.deleted_at is null
    and (m.expires_at is null or m.expires_at > now());
$$;

create or replace function public.is_area_member(p_area uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.area_role(p_area) is not null;
$$;

create or replace function public.can_write_area(p_area uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.area_role(p_area) in ('owner','admin','member','youth'), false);
$$;

create or replace function public.can_admin_area(p_area uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.area_role(p_area) in ('owner','admin'), false);
$$;

-- A mentor sees a linked youth's sit status — nothing else (spec §10.4).
create or replace function public.is_mentor_of(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user and is_youth and mentor_id = (select auth.uid())
  );
$$;

revoke execute on function public.area_role(uuid) from public, anon;
revoke execute on function public.is_area_member(uuid) from public, anon;
revoke execute on function public.can_write_area(uuid) from public, anon;
revoke execute on function public.can_admin_area(uuid) from public, anon;
revoke execute on function public.is_mentor_of(uuid) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- The owner is always a member, so one membership check covers owners too.
create or replace function public.hunt_areas_add_owner()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.area_members (area_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;
revoke execute on function public.hunt_areas_add_owner() from public, anon, authenticated;

create trigger hunt_areas_owner_member after insert on public.hunt_areas
  for each row execute function public.hunt_areas_add_owner();

-- Ownership never changes after insert (admins moderating shared pins can't reassign them).
create or replace function public.forbid_owner_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'owner_id cannot be changed' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger hunt_areas_owner_fixed before update of owner_id on public.hunt_areas
  for each row execute function public.forbid_owner_change();
create trigger pins_owner_fixed before update of owner_id on public.pins
  for each row execute function public.forbid_owner_change();
create trigger tracks_owner_fixed before update of owner_id on public.tracks
  for each row execute function public.forbid_owner_change();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.pin_types enable row level security;
alter table public.profiles enable row level security;
alter table public.hunt_areas enable row level security;
alter table public.area_members enable row level security;
alter table public.pins enable row level security;
alter table public.tracks enable row level security;
alter table public.sits enable row level security;
alter table public.sightings enable row level security;
alter table public.wind_checks enable row level security;

-- pin_types: read-only reference data
create policy "pin types are readable" on public.pin_types
  for select to authenticated using (true);

-- profiles: your own row. Youth/mentor columns are not client-writable.
create policy "read own profile" on public.profiles
  for select to authenticated using (id = (select auth.uid()));
create policy "update own profile" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, experience, home_state, units) on public.profiles to authenticated;

-- hunt_areas
create policy "members read areas" on public.hunt_areas
  for select to authenticated
  using (owner_id = (select auth.uid()) or public.is_area_member(id));
create policy "create own areas" on public.hunt_areas
  for insert to authenticated with check (owner_id = (select auth.uid()));
create policy "admins update areas" on public.hunt_areas
  for update to authenticated
  using (public.can_admin_area(id))
  with check (public.can_admin_area(id));
create policy "owners delete areas" on public.hunt_areas
  for delete to authenticated using (owner_id = (select auth.uid()));

-- area_members: members see the roster; owners/admins manage it.
-- Nobody but the owner can grant or hold the 'owner' role (it is created by trigger).
create policy "members read roster" on public.area_members
  for select to authenticated using (public.is_area_member(area_id));
create policy "admins add members" on public.area_members
  for insert to authenticated
  with check (public.can_admin_area(area_id) and role <> 'owner');
create policy "admins change members" on public.area_members
  for update to authenticated
  using (public.can_admin_area(area_id) and role <> 'owner')
  with check (public.can_admin_area(area_id) and role <> 'owner');
create policy "admins remove members, anyone leaves" on public.area_members
  for delete to authenticated
  using ((public.can_admin_area(area_id) or user_id = (select auth.uid())) and role <> 'owner');

-- pins: private by default; 'area' pins are visible to current members.
create policy "read own or shared pins" on public.pins
  for select to authenticated
  using (
    owner_id = (select auth.uid())
    or (visibility = 'area' and area_id is not null and public.is_area_member(area_id))
  );
create policy "create own pins" on public.pins
  for insert to authenticated
  with check (
    owner_id = (select auth.uid())
    and (area_id is null or public.can_write_area(area_id))
  );
create policy "owners edit pins, admins moderate shared" on public.pins
  for update to authenticated
  using (
    owner_id = (select auth.uid())
    or (visibility = 'area' and area_id is not null and public.can_admin_area(area_id))
  )
  with check (
    (owner_id = (select auth.uid()) and (area_id is null or public.can_write_area(area_id)))
    or (area_id is not null and public.can_admin_area(area_id))
  );
create policy "owners delete pins" on public.pins
  for delete to authenticated using (owner_id = (select auth.uid()));

-- tracks: private
create policy "own tracks" on public.tracks
  for all to authenticated
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()) and (area_id is null or public.can_write_area(area_id)));

-- sits: private; a linked mentor may read a youth's sits
create policy "own sits" on public.sits
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (area_id is null or public.can_write_area(area_id)));
create policy "mentor reads youth sits" on public.sits
  for select to authenticated using (public.is_mentor_of(user_id));

-- sightings, wind checks: private
create policy "own sightings" on public.sightings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and (area_id is null or public.can_write_area(area_id)));
create policy "own wind checks" on public.wind_checks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- No anonymous access to anything.
revoke all on all tables in schema public from anon;
