-- Employees table
create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid references auth.users(id),
  name text not null,
  email text,
  phone text,
  role text,
  employment_type text not null default 'w2',
  hire_date date,
  is_active boolean not null default true,
  bank_routing_number text,
  bank_account_number text,
  bank_account_type text default 'checking',
  created_at timestamptz not null default now()
);

-- Compensation plans table
create table if not exists public.compensation_plans (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.teams(id) on delete cascade,
  employee_id uuid not null references public.employees(id) on delete cascade,
  name text not null,
  pay_model text not null default 'hourly',
  hourly_rate numeric(8,2),
  per_machine_rate numeric(8,2),
  per_stop_rate numeric(8,2),
  revenue_share_pct numeric(5,2),
  effective_from date not null default current_date,
  effective_to date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_employees_business on public.employees(business_id);
create index if not exists idx_employees_active on public.employees(business_id, is_active);
create index if not exists idx_compensation_plans_employee on public.compensation_plans(employee_id);
create index if not exists idx_compensation_plans_business on public.compensation_plans(business_id);
create index if not exists idx_compensation_plans_active on public.compensation_plans(employee_id, is_active);

-- RLS
alter table public.employees enable row level security;
alter table public.compensation_plans enable row level security;

create policy "Users can view employees in their team"
  on public.employees for select
  using (business_id in (select team_id from public.users_on_team where user_id = auth.uid()));

create policy "Users can insert employees in their team"
  on public.employees for insert
  with check (business_id in (select team_id from public.users_on_team where user_id = auth.uid()));

create policy "Users can update employees in their team"
  on public.employees for update
  using (business_id in (select team_id from public.users_on_team where user_id = auth.uid()));

create policy "Users can delete employees in their team"
  on public.employees for delete
  using (business_id in (select team_id from public.users_on_team where user_id = auth.uid()));

create policy "Users can view compensation plans in their team"
  on public.compensation_plans for select
  using (business_id in (select team_id from public.users_on_team where user_id = auth.uid()));

create policy "Users can insert compensation plans in their team"
  on public.compensation_plans for insert
  with check (business_id in (select team_id from public.users_on_team where user_id = auth.uid()));

create policy "Users can update compensation plans in their team"
  on public.compensation_plans for update
  using (business_id in (select team_id from public.users_on_team where user_id = auth.uid()));

create policy "Users can delete compensation plans in their team"
  on public.compensation_plans for delete
  using (business_id in (select team_id from public.users_on_team where user_id = auth.uid()));
