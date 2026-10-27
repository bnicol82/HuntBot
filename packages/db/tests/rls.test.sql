-- RLS + trigger tests for the M0 schema. Run with `pnpm --filter @huntbot/db test:sql`.
begin;
create extension if not exists pgtap;

select plan(39);

-- Users: A owns the area, B member, C outsider, G guest, X expired guest, Y youth mentored by A.
insert into "user" (id, name, email, "emailVerified") values
  ('00000000-0000-0000-0000-00000000000a', 'Andy', 'a@test.dev', true),
  ('00000000-0000-0000-0000-00000000000b', '', 'b@test.dev', true),
  ('00000000-0000-0000-0000-00000000000c', '', 'c@test.dev', true),
  ('00000000-0000-0000-0000-000000000006', '', 'g@test.dev', true),
  ('00000000-0000-0000-0000-000000000007', '', 'x@test.dev', true),
  ('00000000-0000-0000-0000-000000000009', '', 'y@test.dev', true);

-- 1–2: profile trigger
select is((select count(*)::int from profiles), 6, 'a profile is created for every auth user');
select is((select display_name from profiles where id = '00000000-0000-0000-0000-00000000000a'), 'Andy',
  'display name comes from the auth user');

update profiles set is_youth = true, mentor_id = '00000000-0000-0000-0000-00000000000a'
  where id = '00000000-0000-0000-0000-000000000009';

-- Mirrors packages/db/src/index.ts withUser(): request identity + the app_user role.
create or replace function pg_temp.login(uid uuid) returns void language plpgsql as $$
begin
  reset role;
  perform set_config('app.user_id', uid::text, true);
  set local role app_user;
end;
$$;

-- ---------------------------------------------------------------- A builds an area
select pg_temp.login('00000000-0000-0000-0000-00000000000a');

insert into hunt_areas (id, name, boundary_geojson) values (
  '10000000-0000-0000-0000-000000000001', 'North 40',
  '{"type":"Polygon","coordinates":[[[-90,43],[-89.99,43],[-89.99,43.01],[-90,43.01],[-90,43]]]}'
);
select is((select role from area_members where area_id = '10000000-0000-0000-0000-000000000001'
  and user_id = '00000000-0000-0000-0000-00000000000a'), 'owner', 'creator becomes owner member');
select is((select geometrytype(boundary) from hunt_areas where id = '10000000-0000-0000-0000-000000000001'),
  'MULTIPOLYGON', 'boundary trigger builds a MultiPolygon');

insert into area_members (area_id, user_id, role, expires_at) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000b', 'member', null),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', 'guest', now() + interval '1 day'),
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000007', 'guest', now() - interval '1 day');

select throws_ok(
  $$ insert into area_members (area_id, user_id, role) values
     ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c', 'owner') $$,
  '42501', null, 'nobody can grant the owner role');

insert into pins (id, area_id, type, name, geojson, visibility) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'stand', 'Big oak',
   '{"type":"Point","coordinates":[-89.995,43.005]}', 'area'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'bedding_area', 'Ridge bedding',
   '{"type":"Polygon","coordinates":[[[-90,43],[-89.995,43],[-89.995,43.005],[-90,43]]]}', 'private'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'food_source', 'Clover plot',
   '{"type":"Polygon","coordinates":[[[-90,43],[-89.998,43],[-89.998,43.002],[-90,43]]]}', 'area');

select is((select geometrytype(geom) from pins where id = '20000000-0000-0000-0000-000000000001'), 'POINT',
  'pin geom is maintained from geojson');
select is((select st_srid(geom) from pins where id = '20000000-0000-0000-0000-000000000001'), 4326,
  'pin geom is WGS84');
select throws_ok(
  $$ insert into pins (type, geojson) values ('stand', '{"type":"LineString","coordinates":[[-90,43],[-89.9,43]]}') $$,
  '23514', null, 'geometry must match the pin type');
select lives_ok(
  $$ insert into pins (type, geojson) values ('custom', '{"type":"LineString","coordinates":[[-90,43],[-89.9,43]]}') $$,
  'custom pins accept any geometry');
select throws_ok(
  $$ update pins set owner_id = '00000000-0000-0000-0000-00000000000b' where id = '20000000-0000-0000-0000-000000000001' $$,
  '42501', null, 'pin ownership cannot be reassigned');

insert into sits (id, started_at) values ('30000000-0000-0000-0000-00000000000a', now());

-- A cannot change their own youth flag or mentor link from the client.
select throws_ok(
  $$ update profiles set is_youth = true where id = '00000000-0000-0000-0000-00000000000a' $$,
  '42501', null, 'is_youth is not client-writable');
select lives_ok(
  $$ update profiles set experience = 'experienced', home_state = 'WI' where id = '00000000-0000-0000-0000-00000000000a' $$,
  'users can edit their own profile settings');

-- ---------------------------------------------------------------- B: member
select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from hunt_areas), 1, 'member sees the area');
select results_eq($$ select name from pins order by name $$, array['Big oak', 'Clover plot'],
  'member sees shared pins but not private ones');
select is((select count(*)::int from profiles), 1, 'users see only their own profile');
select lives_ok(
  $$ insert into pins (area_id, type, geojson) values ('10000000-0000-0000-0000-000000000001', 'scrape',
     '{"type":"Point","coordinates":[-89.996,43.004]}') $$,
  'member can add pins to the area');
select is_empty($$ update pins set name = 'mine now' where id = '20000000-0000-0000-0000-000000000001' returning id $$,
  'member cannot edit someone else''s pin');
select throws_ok(
  $$ insert into area_members (area_id, user_id, role) values
     ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000c', 'member') $$,
  '42501', null, 'members cannot invite');
select is((select count(*)::int from sits), 0, 'sits are private');

-- ---------------------------------------------------------------- C: outsider
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select is((select count(*)::int from hunt_areas), 0, 'outsider sees no areas');
select is((select count(*)::int from pins), 0, 'outsider sees no pins');
select is((select count(*)::int from area_members), 0, 'outsider sees no roster');
select throws_ok(
  $$ insert into pins (area_id, type, geojson) values ('10000000-0000-0000-0000-000000000001', 'scrape',
     '{"type":"Point","coordinates":[-89.996,43.004]}') $$,
  '42501', null, 'outsider cannot add pins to the area');
select throws_ok(
  $$ insert into pins (owner_id, type, geojson) values ('00000000-0000-0000-0000-00000000000a', 'scrape',
     '{"type":"Point","coordinates":[-89.996,43.004]}') $$,
  '42501', null, 'cannot create pins as someone else');

-- ---------------------------------------------------------------- G: guest (read-only)
select pg_temp.login('00000000-0000-0000-0000-000000000006');
select is((select count(*)::int from pins), 2, 'guest reads shared pins');
select throws_ok(
  $$ insert into pins (area_id, type, geojson) values ('10000000-0000-0000-0000-000000000001', 'scrape',
     '{"type":"Point","coordinates":[-89.996,43.004]}') $$,
  '42501', null, 'guest cannot add pins to the area');

-- ---------------------------------------------------------------- X: expired guest
select pg_temp.login('00000000-0000-0000-0000-000000000007');
select is((select count(*)::int from hunt_areas), 0, 'expired guest loses the area');
select is((select count(*)::int from pins), 0, 'expired guest loses shared pins');

-- ---------------------------------------------------------------- Y: youth, mentored by A
select pg_temp.login('00000000-0000-0000-0000-000000000009');
insert into sits (id, started_at) values ('30000000-0000-0000-0000-000000000009', now());
insert into sightings (observed_at) values (now());

select pg_temp.login('00000000-0000-0000-0000-00000000000a');
select results_eq($$ select id from sits order by id $$,
  array['30000000-0000-0000-0000-000000000009'::uuid, '30000000-0000-0000-0000-00000000000a'::uuid],
  'mentor sees linked youth''s sits');
select is((select count(*)::int from sightings), 0, 'mentor does not see youth''s sightings');

select pg_temp.login('00000000-0000-0000-0000-00000000000b');
select is((select count(*)::int from sits), 0, 'non-mentor does not see youth''s sits');

-- ---------------------------------------------------------------- age gate
select pg_temp.login('00000000-0000-0000-0000-00000000000c');
select is((select is_youth from confirm_age(true)), true, 'age gate records a youth');
select is((select is_youth from confirm_age(false)), true, 'age answer cannot be changed afterwards');
select isnt((select age_confirmed_at from profiles), null, 'age confirmation time is stored');

-- ---------------------------------------------------------------- auth tables + no identity
select throws_ok($$ select count(*) from "session" $$, '42501', null, 'app_user cannot read auth sessions');
reset role;
select set_config('app.user_id', '', true);
set local role app_user;
select is((select count(*)::int from pins), 0, 'no request identity sees no pins');

-- ---------------------------------------------------------------- account deletion
reset role;
delete from "user" where id = '00000000-0000-0000-0000-00000000000a';
select is((select count(*)::int from profiles where id = '00000000-0000-0000-0000-00000000000a'), 0,
  'deleting an account deletes the profile');
select is((select count(*)::int from pins where owner_id = '00000000-0000-0000-0000-00000000000a'), 0,
  'deleting an account deletes its pins and areas');
select is((select area_id from pins where owner_id = '00000000-0000-0000-0000-00000000000b'), null,
  'other members keep their pins from a deleted area');

select * from finish();
rollback;
