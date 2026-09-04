-- Coins and XP were payable an unlimited number of times for the same work.
--
-- award_xp() (0055) pays a flat 15-coin activity bonus, and full XP, on every
-- call where the caller has *any* progress row for that skill touched in the
-- last 2 minutes. Nothing checks whether this particular chapter has already
-- been paid for, and nothing checks whether the learner got anything right —
-- so replaying one finished chapter, or answering every question wrong, mints
-- coins and XP just the same. The user's words: "막 문제푸는데 다틀려도
-- 보상을주니까.. 무한 동력이야".
--
-- History matters here, because two earlier attempts at this were reverted:
--   0051 capped coin-earning awards at 20/day  -> reverted by 0052, because a
--        dedicated day of real chapters hit the same ceiling as a script:
--        "챕터를 많이 깨면 코인은 계속 얻어야지".
--   0052 put a 5-second cooldown between awards -> reverted by 0053:
--        "코인보상은 그냥 15씩 계속줘 그냥".
-- So this migration deliberately does NOT reintroduce any daily cap or
-- cooldown. Clearing a hundred *new* chapters in one sitting still pays for
-- every one of them. What stops paying is repeating work already paid for.
--
-- The rule, decided with the user:
--   * First completion of a chapter/item: full XP, and 15 coins if the
--     learner scored at least c_min_score.
--   * First completion below c_min_score: full XP, no coins. Coming back
--     later and doing it properly pays the coins once (a "top-up", see
--     v_topup below) — the reward for a chapter is earned once, whenever it
--     is actually earned.
--   * Any further repeat: no XP, no coins.
--   * Vocabulary is the exception, and deliberately so: repetition is how
--     vocabulary is learned, not a way of gaming it. Both the chapter
--     sessions and the word-bank SRS review are keyed by server-side date,
--     so each pays once per calendar day and re-studying tomorrow pays
--     again. Same reasoning that got 0051's daily cap reverted — don't
--     punish the study loop, only the loop that isn't studying.
--
-- Why a ledger table instead of reading the progress tables: each skill's
-- progress table behaves differently on a repeat. writing_progress and
-- grammar_progress have completed_at overwritten by the client on every
-- resubmit; reading_progress/vocabulary_progress only set created_at on the
-- first insert; speaking_progress never bumps its timestamp on repeats;
-- challenge_progress bumps updated_at on any new personal best. There is no
-- consistent "was this the first time" signal to read. reward_grants records
-- what was actually paid, once, keyed by (user, skill, item), and is written
-- by this security-definer function itself.
--
-- Scope of the guarantee, stated honestly: RLS lets a learner write their own
-- *_progress rows, so a determined caller hitting the API directly can still
-- forge the progress a reward is checked against. This closes farming through
-- the app itself (replaying chapters, failing on purpose), and it also caps
-- p_points server-side so the RPC can no longer be called with an arbitrary
-- 1-100 XP value. It is progression integrity, not a security boundary —
-- coins buy cosmetics only.
--
-- Idempotent: create table if not exists + drop/create function, safe to re-run.

create table if not exists public.reward_grants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  -- The award_xp p_skill value ('writing', 'vocabulary', ...).
  skill text not null,
  -- Stable identity of the thing that was paid for: a chapter key, a lesson
  -- key, or 'review:<date>' for the daily SRS review.
  item_key text not null,
  points_awarded integer not null default 0,
  coins_awarded integer not null default 0,
  -- Best score seen for this item, 0-100; null when the activity has no score.
  score smallint,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, skill, item_key)
);

create index if not exists reward_grants_user_idx on public.reward_grants (user_id, created_at desc);

alter table public.reward_grants enable row level security;

-- Read-only to its owner (for support/debugging and any future "already
-- earned" UI). Nothing may insert or update it from a client session: the
-- security-definer award_xp below is the only writer.
drop policy if exists "reward_grants_select_own" on public.reward_grants;
create policy "reward_grants_select_own" on public.reward_grants
  for select using (auth.uid() = user_id);

drop function if exists public.award_xp(integer, text);
drop function if exists public.award_xp(integer, text, text, smallint);

create function public.award_xp(
  p_points integer,
  p_skill text default null,
  -- Stable identity of the chapter/item being completed. Vocabulary keys
  -- (chapters and the 'review' sentinel alike) get '<current_date>' appended
  -- by the function, making them pay once a day rather than once ever — and
  -- appended server-side, so the window follows the server clock rather than
  -- whatever date the caller claims it is.
  p_item_key text default null,
  -- 0-100 accuracy for this attempt, or null when the activity has no score
  -- (a vocabulary flip-through, say). Null never fails the accuracy gate.
  p_score smallint default null
)
returns table (
  new_xp integer,
  new_level integer,
  leveled_up boolean,
  coins_earned integer,
  -- What this call actually added to profiles.xp. 0 on a repeat. Result
  -- screens show this instead of the static XP_POINTS value, so a repeat
  -- can't claim "+15 XP" while paying nothing.
  points_awarded integer,
  -- True when this call paid nothing because the item was already paid for.
  already_earned boolean
)
language plpgsql
security definer set search_path = public
as $$
declare
  v_xp integer;
  v_before integer;
  v_after integer;
  v_points integer;
  v_plus boolean;
  v_coins_reward integer := 0;
  -- Only the item's own activity bonus. Level-milestone coins ride on the
  -- same call but belong to the level, not the chapter — recording them
  -- against the item would make its coins_awarded non-zero and lock out the
  -- top-up a low-scoring first attempt is still owed.
  v_activity_coins integer := 0;
  v_milestone integer;
  v_has_recent_progress boolean := false;
  v_item_key text;
  v_inserted integer := 0;
  v_first boolean := true;
  v_topup boolean := false;
  v_prior_coins integer;
  v_prior_points integer;
  v_base_points integer;
  v_score_ok boolean;
  v_already boolean := false;
  v_cap integer;
  c_activity_bonus_coins constant integer := 15;
  c_proof_window constant interval := interval '2 minutes';
  -- Below this, the attempt pays XP but no coins. 60 = "most of it right",
  -- matching the writing result page's own "headline60" band.
  c_min_score constant smallint := 60;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_points is null or p_points < 1 or p_points > 100 then
    raise exception 'points out of range';
  end if;

  -- Server-side ceiling on what one call of a given skill can be worth.
  -- Mirrors XP_POINTS in src/lib/activity.ts. Partial credit still works —
  -- it asks for less than the cap, and least() leaves it alone.
  v_cap := case p_skill
    when 'reading' then 15
    when 'writing' then 15
    when 'listening' then 12
    when 'speaking' then 12
    when 'vocabulary' then 10
    when 'grammar' then 10
    when 'pronunciation' then 6
    when 'hangul' then 6
    when 'slang' then 4
    when 'quest' then 10
    else 15
  end;
  v_points := least(p_points, v_cap);

  -- Vocabulary pays per day, not per lifetime: the server stamps the date
  -- onto the key so 'review' becomes 'review:2026-09-04' and a chapter
  -- becomes 'vocab:food:2:2026-09-04'. Every other skill keeps its bare key
  -- and is therefore paid once ever.
  v_item_key := case
    when p_item_key is null then null
    when p_skill = 'vocabulary'
      then p_item_key || ':' || to_char((now() at time zone 'utc')::date, 'YYYY-MM-DD')
    else p_item_key
  end;

  v_score_ok := p_score is null or p_score >= c_min_score;

  -- The ledger is an account per (user, skill, item), not a yes/no flag: it
  -- records how much has been paid so far, and an item can never pay more
  -- than the skill's own rate in total. A flag would break partial credit —
  -- leaving a dialogue halfway pays 6 of its 12 XP, and coming back to
  -- finish it has to be able to pay the other 6, not be refused as "already
  -- rewarded". The insert doubles as the concurrency test: it succeeds
  -- exactly once, so two calls racing on the same item can't both pay.
  if v_item_key is not null then
    insert into public.reward_grants (user_id, skill, item_key, score)
    values (auth.uid(), p_skill, v_item_key, p_score)
    on conflict (user_id, skill, item_key) do nothing;
    get diagnostics v_inserted = row_count;
    v_first := v_inserted > 0;

    if not v_first then
      -- Table-qualified throughout: this function's OUT columns include
      -- points_awarded, which would otherwise be ambiguous against the
      -- table's column of the same name (Postgres raises rather than guessing).
      select rg.points_awarded, rg.coins_awarded into v_prior_points, v_prior_coins
      from public.reward_grants rg
      where rg.user_id = auth.uid() and rg.skill = p_skill and rg.item_key = v_item_key
      for update;

      -- Whatever is left of this item's full rate, if anything.
      v_points := greatest(0, least(v_points, v_cap - coalesce(v_prior_points, 0)));
      -- Coins are paid once per item. The one case that reopens them is an
      -- earlier attempt that scored too low to earn them: doing it properly
      -- later pays them then, and only then.
      v_topup := coalesce(v_prior_coins, 0) = 0 and v_score_ok;
      v_already := v_points = 0 and not v_topup;
    end if;
  end if;

  select xp, (plus_until is not null and plus_until > now())
    into v_xp, v_plus
  from public.profiles where id = auth.uid() for update;

  -- The ledger accounts in base points, before the Plus weekend bonus, so a
  -- Plus subscriber's Saturday doesn't use up an item's allowance faster
  -- than anyone else's Monday.
  v_base_points := v_points;
  if v_plus and extract(isodow from now()) in (6, 7) and v_points > 0 then
    v_points := round(v_points * 1.5);
  end if;

  v_before := public.level_from_xp(v_xp);
  v_xp := v_xp + v_points;
  v_after := public.level_from_xp(v_xp);

  -- Proof of progress: the activity bonus is only for someone who actually
  -- just did something. Unchanged from 0054/0055.
  if p_skill = 'vocabulary' then
    select exists(
      select 1 from public.vocabulary_progress
      where user_id = auth.uid() and (created_at > now() - c_proof_window or last_reviewed_at > now() - c_proof_window)
    ) into v_has_recent_progress;
  elsif p_skill = 'writing' then
    select exists(
      select 1 from public.writing_progress
      where user_id = auth.uid() and completed_at > now() - c_proof_window
    ) into v_has_recent_progress;
  elsif p_skill = 'reading' then
    select exists(
      select 1 from public.reading_progress
      where user_id = auth.uid() and (created_at > now() - c_proof_window or last_reviewed_at > now() - c_proof_window)
    ) into v_has_recent_progress;
  elsif p_skill = 'listening' then
    select exists(
      select 1 from public.listening_progress
      where user_id = auth.uid() and completed_at > now() - c_proof_window
    ) into v_has_recent_progress;
  elsif p_skill = 'grammar' then
    select exists(
      select 1 from public.grammar_progress
      where user_id = auth.uid() and completed_at > now() - c_proof_window
    ) into v_has_recent_progress;
  elsif p_skill = 'pronunciation' then
    select exists(
      select 1 from public.speaking_progress
      where user_id = auth.uid() and completed_at > now() - c_proof_window
    ) or exists(
      select 1 from public.challenge_progress
      where user_id = auth.uid() and updated_at > now() - c_proof_window
    ) into v_has_recent_progress;
  else
    v_has_recent_progress := false;
  end if;

  -- The activity bonus now needs all three: real recent progress, a good
  -- enough attempt, and this item not having been paid for already (or being
  -- the one allowed coin top-up).
  if v_has_recent_progress and v_score_ok and (v_first or v_topup) then
    -- An item key is required: without one there is nothing to record the
    -- payment against, so there would be nothing stopping the next replay.
    if v_item_key is not null then
      v_activity_coins := c_activity_bonus_coins;
      v_coins_reward := v_activity_coins;
    end if;
  end if;

  -- Level milestones ride on XP, which is now gated, so these can't repeat.
  v_milestone := 10;
  while v_milestone <= 50 loop
    if v_before < v_milestone and v_after >= v_milestone then
      v_coins_reward := v_coins_reward + 150;
    end if;
    v_milestone := v_milestone + 10;
  end loop;

  v_milestone := 60;
  while v_milestone <= 120 loop
    if v_before < v_milestone and v_after >= v_milestone then
      v_coins_reward := v_coins_reward + 200;
    end if;
    v_milestone := v_milestone + 10;
  end loop;

  update public.profiles
    set xp = v_xp, coins = coins + v_coins_reward, updated_at = now()
  where id = auth.uid();

  -- Record what was paid, so the next call sees the balance. One statement
  -- covers both the row just inserted (0 + this) and a repeat topping up.
  if v_item_key is not null then
    update public.reward_grants
      set points_awarded = public.reward_grants.points_awarded + v_base_points,
          coins_awarded = public.reward_grants.coins_awarded + v_activity_coins,
          score = greatest(coalesce(public.reward_grants.score, 0), coalesce(p_score, 0)),
          updated_at = now()
    where public.reward_grants.user_id = auth.uid()
      and public.reward_grants.skill = p_skill
      and public.reward_grants.item_key = v_item_key;
  end if;

  -- A repeat earned nothing; logging it as an XP event would inflate the
  -- weekly-XP charts with points that were never awarded.
  if v_points > 0 then
    insert into public.xp_events (user_id, points, skill)
    values (auth.uid(), v_points, p_skill);
  end if;

  return query select v_xp, v_after, v_after > v_before, v_coins_reward, v_points, v_already;
end;
$$;
