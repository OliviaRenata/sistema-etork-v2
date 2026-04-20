# 🏁 Etork Brasil — Portal de Franqueados

Portal SaaS completo para gestão de franqueados da Etork Brasil.  
Stack: **React + Vite + TypeScript** (frontend) + **Supabase** (backend)

---

## 🗂️ Estrutura do Projeto

```
etork-portal/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.tsx          # Sidebar + topbar
│   │   └── ui/
│   │       ├── StatusBadge.tsx        # Badge de status do pedido
│   │       ├── NotificationBell.tsx   # Sino de notificações (realtime)
│   │       └── LoadingScreen.tsx      # Tela de carregamento
│   ├── context/
│   │   └── AuthContext.tsx            # Autenticação global
│   ├── lib/
│   │   ├── supabase.ts                # Cliente Supabase + helpers
│   │   └── utils.ts                   # Formatadores de data/moeda
│   ├── pages/
│   │   ├── LoginPage.tsx              # Login com branding Etork
│   │   ├── franchise/
│   │   │   ├── Dashboard.tsx          # Dashboard do franqueado
│   │   │   ├── Orders.tsx             # Lista de pedidos
│   │   │   ├── NewOrder.tsx           # Criar novo pedido (catálogo + carrinho)
│   │   │   └── Financial.tsx          # Extrato financeiro
│   │   └── admin/
│   │       ├── Dashboard.tsx          # Painel admin com alertas
│   │       ├── Orders.tsx             # Gerenciar todos os pedidos
│   │       ├── OrderDetail.tsx        # Detalhe + atualizar status
│   │       ├── Franchisees.tsx        # Gerenciar franqueados
│   │       └── Financial.tsx          # Financeiro geral + exportar CSV
│   ├── types/index.ts                 # Todos os tipos TypeScript
│   └── App.tsx                        # Roteamento principal
│
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql     # ✅ SCHEMA COMPLETO — cole no Supabase
│   └── functions/
│       ├── create-order/index.ts      # Edge Function: criar pedido
│       └── update-order-status/index.ts # Edge Function: atualizar status
│
├── .env.example                       # Variáveis de ambiente necessárias
├── package.json
├── vite.config.ts
└── README.md
```

---

## 🚀 Setup Rápido

### 1. Clonar e instalar
```bash
git clone <seu-repo>
cd etork-portal
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas credenciais do Supabase
```

### 3. Configurar Supabase

#### 3.1 — Criar projeto
Acesse [supabase.com](https://supabase.com) → New Project → anote a URL e a chave anon.

#### 3.2 — Executar o schema SQL
No painel do Supabase: **SQL Editor** → cole o conteúdo de:
```
supabase/migrations/001_initial_schema.sql
```
Clique em **Run**. Isso cria todas as tabelas, triggers, RLS e dados de seed.

#### 3.3 — Criar buckets de Storage
No Supabase: **Storage** → **New bucket**:
- Nome: `order-files` | Público: **Não**
- Nome: `avatars` | Público: **Sim**

Adicione as seguintes políticas para `order-files`:
```sql
-- Upload (usuários autenticados)
CREATE POLICY "order_files_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'order-files' AND auth.uid() IS NOT NULL);

-- Download (usuários autenticados)
CREATE POLICY "order_files_download" ON storage.objects
  FOR SELECT USING (bucket_id = 'order-files' AND auth.uid() IS NOT NULL);
```

#### 3.4 — Deploy das Edge Functions
```bash
npm install -g supabase
supabase login
supabase link --project-ref SEU_PROJECT_ID
supabase functions deploy create-order
supabase functions deploy update-order-status
supabase functions deploy lookup-vehicle

# Defina o token da API de placa como secret (não colocar no frontend)
supabase secrets set WDAPI_TOKEN=SEU_TOKEN_DA_API_DE_PLACA
```

#### 3.5 — Criar usuário admin
No Supabase: **Authentication** → **Users** → **Add user**:
- Email: admin@etorkbrasil.com.br
- Senha: (defina uma senha segura)

Depois, no SQL Editor:
```sql
-- Substituir pelo UUID real do usuário criado
INSERT INTO profiles (id, role, full_name) VALUES
  ('UUID_DO_USUARIO_ADMIN', 'admin', 'Administrador Etork');
```

### 4. Rodar localmente
```bash
npm run dev
# Acesse http://localhost:3000
```

---

## 📋 Fluxo de Pedidos

```
[FRANQUEADO CRIA]     → status: solicitado
[ADMIN ACEITA]        → status: em_producao
[ADMIN ENVIA ARQUIVO] → status: enviado
[ADMIN CONCLUI]       → status: concluido
                      
[QUALQUER ETAPA]      → status: cancelado (com estorno automático)
```

---

## 🔑 Funções da Plataforma

### Franqueado
- Login seguro com Supabase Auth
- Dashboard com estatísticas e pedidos recentes
- Criar pedido: selecionar serviços do catálogo, informar placa, upload de arquivos
- Acompanhar pedidos em tempo real (Supabase Realtime)
- Histórico financeiro / extrato

### Administrador
- Dashboard operacional com alertas de pedidos pendentes
- Visualizar e filtrar todos os pedidos
- Detalhes do pedido: itens, arquivos, histórico de status
- Atualizar status com validação de transições
- Download de arquivos dos franqueados
- Gerenciar franqueados
- Financeiro geral com exportação CSV

---

## 🛡️ Segurança

- **Row Level Security (RLS)** em todas as tabelas
- Franqueados só acessam seus próprios dados
- Admins têm acesso completo
- Edge Functions com validação server-side
- Preços nunca vêm do cliente — sempre do banco
- Arquivos em bucket privado com Signed URLs

---

## 📞 Contato Etork Brasil
- WhatsApp: (67) 99254-9181
- Instagram: @etorkbrasil
- Endereço: Av. Mascarenhas de Moraes, 1937 - Campo Grande/MS
