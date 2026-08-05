-- Optional local/staging seed. Do not run against production without approval.
insert into public.companies (name, cnpj, address, city, state)
values (
  'ARATI DISTRIBUIDORA DE BEBIDAS E ALIMENTOS LTDA',
  '10.712.785/0001-89',
  'Trav. Agripino de Matos, nº 800, Laguinho, CEP 68041-125',
  'Santarém',
  'PA'
)
on conflict do nothing;

insert into public.elections (
  company_id, slug, title, management_period, voting_date, voting_start, voting_end,
  status, total_employees, titulares_count, suplentes_count
)
select id, 'arati-2026-2027', 'Eleição da CIPA ARATI', '2026/2027', '2026-08-06',
  '2026-08-06 08:00:00-03', '2026-08-06 17:00:00-03', 'draft', 53, 1, 1
from public.companies
where cnpj = '10.712.785/0001-89'
on conflict (slug) do nothing;

insert into public.candidates (election_id, display_order, name, role, slogan)
select e.id, c.display_order, c.name, c.role, c.slogan
from public.elections e
cross join (values
  (1, 'Rosiane Farias', 'Serviços Gerais', 'Um ambiente seguro começa com atitudes responsáveis.'),
  (2, 'Mateus Silveira Duarte', 'Auxiliar de carga', 'Atitude segura, trabalho seguro.'),
  (3, 'João Sarmento Paz', 'Auxiliar de carga', 'Segurança é atitude e responsabilidade.'),
  (4, 'Emerson Rodrigues Bastos', 'Supervisor de Frota', 'O trabalho bem feito é o trabalho feito com segurança.')
) as c(display_order, name, role, slogan)
where e.slug = 'arati-2026-2027'
on conflict (election_id, display_order) do nothing;
