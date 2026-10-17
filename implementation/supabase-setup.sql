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

-- OK/パスは誘われた人だけ、取り消しは誘った人だけ。内容の書き換えは禁止
create or replace function public.invites_guard()
returns trigger
language plpgsql
as $$
begin
  if new.from_id <> old.from_id or new.to_id <> old.to_id or new.recipe <> old.recipe
     or new.slot <> old.slot or new.place <> old.place
     or new.from_foods <> old.from_foods or new.to_foods <> old.to_foods then
    raise exception '誘いの内容は変更できません';
  end if;
  if new.status in ('accepted', 'declined') and auth.uid() <> old.to_id then
    raise exception '返事ができるのは誘われた人だけです';
  end if;
  if new.status = 'cancelled' and auth.uid() <> old.from_id then
    raise exception '取り消しができるのは誘った人だけです';
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

drop policy if exists "meal_posts: read" on public.meal_posts;
create policy "meal_posts: read" on public.meal_posts
  for select using (public.is_hokudai());
drop policy if exists "meal_posts: post" on public.meal_posts;
create policy "meal_posts: post" on public.meal_posts
  for insert with check (user_id = auth.uid() and public.is_hokudai() and exists (
    select 1 from public.invites i
    where i.id = invite_id and i.status = 'accepted' and (i.from_id = auth.uid() or i.to_id = auth.uid())
  ));
drop policy if exists "meal_posts: delete own" on public.meal_posts;
create policy "meal_posts: delete own" on public.meal_posts
  for delete using (user_id = auth.uid());

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
    (select count(*) from public.meal_posts m where m.user_id = p.id) as meal_count,
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

-- ---------- 写真の保存場所 ----------
insert into storage.buckets (id, name, public)
values ('meal-photos', 'meal-photos', true)
on conflict (id) do nothing;

drop policy if exists "meal photos: upload" on storage.objects;
create policy "meal photos: upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'meal-photos' and public.is_hokudai());
