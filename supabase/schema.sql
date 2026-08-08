-- quotes: 노션 견적서 데이터 캐시
create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  notion_page_id text not null unique,
  invoice_number text not null,
  client_name text not null,
  issue_date date,
  expiry_date date,
  status text not null default 'pending',
  total_amount numeric(12, 2) not null default 0,
  share_token text unique,
  viewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- quote_items: 견적서 품목
create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  notion_page_id text unique,
  quote_id uuid not null references public.quotes (id) on delete cascade,
  item_name text not null,
  quantity integer not null default 1,
  unit_price numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

-- 인증 기능을 제외하기로 결정해 관리자 계정(profiles)/소유권(user_id) 구조는 두지 않는다.
