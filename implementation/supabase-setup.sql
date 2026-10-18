-- =========================================================
--  のこりものクラブ:Supabase の初期設定
--  Supabase の「SQL Editor」にこのファイルの中身を全部貼り付けて「Run」を押してください。
--  何度実行しても大丈夫なように書いてあります。
-- =========================================================

-- ---------- 北大のメールアドレスか判定する ----------
-- 〜@hokudai.ac.jp、〜@(サブドメイン).hokudai.ac.jp でログインした人だけ true
create or replace function public.is_hokudai()
returns boolean
language sql stable
as $$
  select coalesce((auth.jwt() ->> 'email') ~* '@([a-z0-9-]+\.)*hokudai\.ac\.jp$', false);
$$;

-- 日本時間の「今日」
create or replace function public.jst_today()
returns date
language sql stable
as $$
  select (now() at time zone 'Asia/Tokyo')::date;
$$;

-- ---------- プロフィール ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  country text not null default 'その他',
  flag text not null default '🌏',
  student_type text not null check (student_type in ('intl', 'jp')),
  faculty_year text not null default '' check (char_length(faculty_year) <= 30),
  bio text not null default '' check (char_length(bio) <= 80),
  langs text[] not null default '{}',
  diet text[] not null default '{}',
  allergies text not null default '' check (char_length(allergies) <= 60),
  gender text not null default 'private' check (gender in ('female', 'male', 'other', 'private')),
  gender_public boolean not null default false,
  same_gender_only boolean not null default false,
  cooking_level text not null default 'ふつう' check (cooking_level in ('苦手', 'ふつう', '得意')),
  fav_cuisines text[] not null default '{}',
  match_on boolean not null default false,
  slots text[] not null default '{}',   -- 例:'2026-10-18|night'
  places text[] not null default '{}',
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- 自分のプロフィールだけ読み書きできる(他の人の情報は下の match_candidates 経由でのみ見える)
drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select using (id = auth.uid());
drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert with check (id = auth.uid() and public.is_hokudai());
drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid() and public.is_hokudai());

-- ---------- マッチ用に共有する食材(期限3日以内・マッチONのときだけ) ----------
create table if not exists public.shared_foods (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  expiry date not null
);
alter table public.shared_foods enable row level security;

drop policy if exists "shared_foods: read own" on public.shared_foods;
create policy "shared_foods: read own" on public.shared_foods
  for select using (user_id = auth.uid());
drop policy if exists "shared_foods: insert own" on public.shared_foods;
create policy "shared_foods: insert own" on public.shared_foods
  for insert with check (user_id = auth.uid() and public.is_hokudai());
drop policy if exists "shared_foods: delete own" on public.shared_foods;
create policy "shared_foods: delete own" on public.shared_foods
  for delete using (user_id = auth.uid());

-- ---------- ごはんの誘い ----------
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references public.profiles(id) on delete cascade,
  to_id uuid not null references public.profiles(id) on delete cascade,
  from_name text not null,
  from_flag text not null default '🌏',
  to_name text not null,
  to_flag text not null default '🌏',
  recipe text not null,
  recipe_emoji text not null default '🍳',
  slot text not null,
  place text not null,
  from_foods text[] not null default '{}',
  to_foods text[] not null default '{}',
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz not null default now(),
  check (from_id <> to_id)
);
alter table public.invites enable row level security;

-- 写真の公開の許可(2人とも true のときだけ、ほかの北大生にも写真が見える)
alter table public.invites add column if not exists from_photo_ok boolean not null default false;
alter table public.invites add column if not exists to_photo_ok boolean not null default false;

drop policy if exists "invites: read mine" on public.invites;
create policy "invites: read mine" on public.invites
  for select using (from_id = auth.uid() or to_id = auth.uid());
drop policy if exists "invites: send" on public.invites;
create policy "invites: send" on public.invites
  for insert with check (from_id = auth.uid() and status = 'pending' and public.is_hokudai());
drop policy if exists "invites: answer" on public.invites;
create policy "invites: answer" on public.invites
  for update using (from_id = auth.uid() or to_id = auth.uid())
  with check (from_id = auth.uid() or to_id = auth.uid());

-- OK/パスは誘われた人だけ、取り消しは誘った人だけ。内容の書き換えは禁止。
-- 写真の公開の許可は、それぞれ自分の分だけ、マッチ成立後にだけ変えられる
create or replace function public.invites_guard()
returns trigger
language plpgsql
as $$
begin
  if new.from_id <> old.from_id or new.to_id <> old.to_id or new.recipe <> old.recipe
     or new.slot <> old.slot or new.place <> old.place
     or new.from_foods <> old.from_foods or new.to_foods <> old.to_foods
     or new.from_name <> old.from_name or new.to_name <> old.to_name
     or new.created_at <> old.created_at then
    raise exception '誘いの内容は変更できません';
  end if;
  if new.status is distinct from old.status then
    if old.status <> 'pending' then
      raise exception 'この誘いは、もう返事が決まっています';
    end if;
    if new.status in ('accepted', 'declined') and auth.uid() <> old.to_id then
      raise exception '返事ができるのは誘われた人だけです';
    end if;
    if new.status = 'cancelled' and auth.uid() <> old.from_id then
      raise exception '取り消しができるのは誘った人だけです';
    end if;
  end if;
  if new.from_photo_ok is distinct from old.from_photo_ok and auth.uid() <> old.from_id then
    raise exception '写真の公開は、自分の分しか変えられません';
  end if;
  if new.to_photo_ok is distinct from old.to_photo_ok and auth.uid() <> old.to_id then
    raise exception '写真の公開は、自分の分しか変えられません';
  end if;
  if (new.from_photo_ok is distinct from old.from_photo_ok or new.to_photo_ok is distinct from old.to_photo_ok)
     and new.status <> 'accepted' then
    raise exception '写真の公開は、マッチ成立後に決められます';
  end if;
  return new;
end;
$$;
drop trigger if exists invites_guard on public.invites;
create trigger invites_guard before update on public.invites
  for each row execute function public.invites_guard();

-- ---------- 定型メッセージ(マッチ成立後だけ・決まった文だけ送れる) ----------
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  invite_id uuid not null references public.invites(id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  sender_name text not null,
  text text not null check (text in (
    '向かっています / On my way',
    '少し遅れます / Running a bit late',
    '着きました / I''m here',
    '楽しみにしています! / Looking forward to it!',
    '今日はありがとう! / Thank you for today!'
  )),
  created_at timestamptz not null default now()
);
alter table public.messages enable row level security;

drop policy if exists "messages: read" on public.messages;
create policy "messages: read" on public.messages
  for select using (exists (
    select 1 from public.invites i
    where i.id = invite_id and (i.from_id = auth.uid() or i.to_id = auth.uid())
  ));
drop policy if exists "messages: send" on public.messages;
create policy "messages: send" on public.messages
  for insert with check (sender_id = auth.uid() and exists (
    select 1 from public.invites i
    where i.id = invite_id and i.status = 'accepted' and (i.from_id = auth.uid() or i.to_id = auth.uid())
  ));

-- ---------- みんなで作ったごはんの写真 ----------
create table if not exists public.meal_posts (
  id bigint generated always as identity primary key,
  invite_id uuid references public.invites(id) on delete set null,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  author_name text not null,
  author_flag text not null default '🌏',
  recipe text not null,
  photo_path text not null,
  created_at timestamptz not null default now()
);
alter table public.meal_posts enable row level security;

-- この「ごはん会」の写真を見てよいか:
--   ・ごはん会の2人 → いつでも見られる
--   ・ほかの北大生 → 2人とも「公開を許可」したときだけ
create or replace function public.can_see_meal(inv uuid)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_hokudai() and exists (
    select 1 from public.invites i
    where i.id = inv and i.status = 'accepted'
      and (i.from_id = auth.uid() or i.to_id = auth.uid() or (i.from_photo_ok and i.to_photo_ok))
  );
$$;

-- 写真ファイル(保存場所のパス)を見てよいか
create or replace function public.can_see_meal_photo(p text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.meal_posts m where m.photo_path = p and public.can_see_meal(m.invite_id));
$$;

drop policy if exists "meal_posts: read" on public.meal_posts;
create policy "meal_posts: read" on public.meal_posts
  for select using (public.can_see_meal(invite_id));
drop policy if exists "meal_posts: post" on public.meal_posts;
create policy "meal_posts: post" on public.meal_posts
  for insert with check (user_id = auth.uid() and public.is_hokudai() and exists (
    select 1 from public.invites i
    where i.id = invite_id and i.status = 'accepted' and (i.from_id = auth.uid() or i.to_id = auth.uid())
  ));
drop policy if exists "meal_posts: delete own" on public.meal_posts;
create policy "meal_posts: delete own" on public.meal_posts
  for delete using (user_id = auth.uid());

-- ---------- アプリ(ログインした人)が表を使えるようにする ----------
-- 「Automatically expose new tables」をOFFにしたプロジェクトでも動くように、明示的に許可する。
-- 実際に読み書きできる範囲は、上のアクセス制限(policy)で守られている。
grant usage on schema public to authenticated;
grant select, insert, update, delete on
  public.profiles, public.shared_foods, public.invites, public.messages, public.meal_posts
  to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ---------- 料理の実績(写真をシェアしたごはん会の回数) ----------
create or replace function public.meal_count_of(target uuid)
returns bigint
language sql stable security definer
set search_path = public
as $$
  select count(distinct m.invite_id)
  from public.meal_posts m
  join public.invites i on i.id = m.invite_id
  where i.status = 'accepted' and (i.from_id = target or i.to_id = target);
$$;
revoke all on function public.meal_count_of(uuid) from public, anon;

-- ---------- マッチ候補を返す関数 ----------
-- 性別はここでだけ使い、非公開の人の性別は外に出さない
drop function if exists public.match_candidates();
create function public.match_candidates()
returns table (
  id uuid,
  display_name text,
  country text,
  flag text,
  student_type text,
  faculty_year text,
  bio text,
  langs text[],
  diet text[],
  allergies text,
  cooking_level text,
  fav_cuisines text[],
  slots text[],
  places text[],
  gender_label text,
  meal_count bigint,
  foods jsonb
)
language sql stable security definer
set search_path = public
as $$
  with me as (select * from public.profiles where id = auth.uid())
  select
    p.id, p.display_name, p.country, p.flag, p.student_type, p.faculty_year, p.bio,
    p.langs, p.diet, p.allergies, p.cooking_level, p.fav_cuisines, p.slots, p.places,
    case when p.gender_public then p.gender else null end as gender_label,
    public.meal_count_of(p.id) as meal_count,
    coalesce((
      select jsonb_agg(jsonb_build_object('name', f.name, 'expiry', f.expiry) order by f.expiry)
      from public.shared_foods f
      where f.user_id = p.id and f.expiry between public.jst_today() and public.jst_today() + 3
    ), '[]'::jsonb) as foods
  from public.profiles p, me
  where public.is_hokudai()
    and me.match_on
    and p.match_on
    and p.id <> me.id
    -- 自分が「同性のみ」なら、相手は同じ性別(未回答の人は除く)
    and (not me.same_gender_only or (me.gender <> 'private' and p.gender = me.gender))
    -- 相手が「同性のみ」なら、自分も同じ性別であること
    and (not p.same_gender_only or (p.gender <> 'private' and me.gender = p.gender));
$$;
revoke all on function public.match_candidates() from public, anon;
grant execute on function public.match_candidates() to authenticated;

-- ---------- 相手のプロフィール(表示してよい項目だけ) ----------
-- 見られるのは「マッチをONにしている人」か「自分と誘いのやりとりがある人」だけ。性別は公開設定の人だけ
drop function if exists public.public_profile(uuid);
create function public.public_profile(target uuid)
returns table (
  id uuid,
  display_name text,
  country text,
  flag text,
  student_type text,
  faculty_year text,
  bio text,
  langs text[],
  diet text[],
  cooking_level text,
  fav_cuisines text[],
  gender_label text,
  meal_count bigint
)
language sql stable security definer
set search_path = public
as $$
  select p.id, p.display_name, p.country, p.flag, p.student_type, p.faculty_year, p.bio,
         p.langs, p.diet, p.cooking_level, p.fav_cuisines,
         case when p.gender_public then p.gender else null end,
         public.meal_count_of(p.id)
  from public.profiles p
  where public.is_hokudai()
    and p.id = target
    and (p.id = auth.uid() or p.match_on or exists (
      select 1 from public.invites i
      where (i.from_id = auth.uid() and i.to_id = p.id) or (i.to_id = auth.uid() and i.from_id = p.id)
    ));
$$;
revoke all on function public.public_profile(uuid) from public, anon;
grant execute on function public.public_profile(uuid) to authenticated;

-- ---------- 料理の履歴(ごはん会ごとに1行) ----------
-- 写真のパスは、見てよい人にだけ返す(それ以外は null =「非公開」と表示)
drop function if exists public.meal_history(uuid);
create function public.meal_history(target uuid)
returns table (
  invite_id uuid,
  recipe text,
  recipe_emoji text,
  meal_date timestamptz,
  photo_path text,
  is_public boolean
)
language sql stable security definer
set search_path = public
as $$
  select distinct on (i.id)
    i.id, i.recipe, i.recipe_emoji, m.created_at,
    case when public.can_see_meal(i.id) then m.photo_path else null end,
    (i.from_photo_ok and i.to_photo_ok)
  from public.invites i
  join public.meal_posts m on m.invite_id = i.id
  where public.is_hokudai()
    and i.status = 'accepted'
    and (i.from_id = target or i.to_id = target)
    and exists (select 1 from public.public_profile(target))
  order by i.id, m.created_at
$$;
revoke all on function public.meal_history(uuid) from public, anon;
grant execute on function public.meal_history(uuid) to authenticated;

-- ---------- 写真の保存場所(非公開。見てよい人にだけ、期限付きのURLを発行する) ----------
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', false)
on conflict (id) do update set public = false;

-- 写真を上げられるのは、マッチが成立したごはん会の2人だけ(パスの先頭 = 誘いのID)
drop policy if exists "meal photos: upload" on storage.objects;
create policy "meal photos: upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'meal-photos' and public.is_hokudai() and exists (
      select 1 from public.invites i
      where i.id::text = split_part(name, '/', 1) and i.status = 'accepted'
        and (i.from_id = auth.uid() or i.to_id = auth.uid())
    )
  );

-- 写真を見られる(期限付きURLを作れる)のは、見てよい人だけ
drop policy if exists "meal photos: read" on storage.objects;
create policy "meal photos: read" on storage.objects
  for select to authenticated
  using (bucket_id = 'meal-photos' and public.can_see_meal_photo(name));
