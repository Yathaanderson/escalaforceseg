-- ============================================================
-- MIGRATION COMPLETA - Escala Force Seg
-- Cole este SQL inteiro no SQL Editor do Supabase
-- ============================================================

-- Enum for roles
CREATE TYPE public.app_role AS ENUM ('admin', 'funcionario');

-- Enum for escala status
CREATE TYPE public.escala_status AS ENUM ('planejado', 'confirmado', 'concluido', 'falta', 'precisa_cobertura');

-- Enum for checkin type
CREATE TYPE public.checkin_tipo AS ENUM ('checkin', 'checkout');

-- Enum for pedido folga status
CREATE TYPE public.folga_status AS ENUM ('pendente', 'aprovado', 'rejeitado');

-- Profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  cpf TEXT,
  telefone TEXT,
  funcao TEXT DEFAULT 'Vigilante',
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  dados_pagamento TEXT,
  usuario TEXT UNIQUE,
  email TEXT,
  valor_diaria NUMERIC DEFAULT 0,
  salario_mensal NUMERIC DEFAULT 0,
  valor_extra NUMERIC DEFAULT 0
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Postos table
CREATE TABLE public.postos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_cliente TEXT NOT NULL,
  endereco TEXT NOT NULL,
  tipo_servico TEXT NOT NULL DEFAULT '',
  observacoes TEXT DEFAULT '',
  valor_mensal NUMERIC DEFAULT 0,
  dia_pagamento INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Turnos table
CREATE TABLE public.turnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fim TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Escalas table
CREATE TABLE public.escalas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  posto_id UUID NOT NULL REFERENCES public.postos(id) ON DELETE CASCADE,
  turno_id UUID NOT NULL REFERENCES public.turnos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  status escala_status NOT NULL DEFAULT 'planejado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (funcionario_id, data, turno_id)
);

-- Checkins table
CREATE TABLE public.checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  escala_id UUID NOT NULL REFERENCES public.escalas(id) ON DELETE CASCADE,
  tipo checkin_tipo NOT NULL,
  data_hora TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Pedidos de folga table
CREATE TABLE public.pedidos_folga (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funcionario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  datas DATE[] NOT NULL,
  motivo TEXT NOT NULL,
  status folga_status NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Avisos table
CREATE TABLE public.avisos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  texto TEXT NOT NULL,
  data_validade DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.postos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escalas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_folga ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avisos ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Trigger: auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email), NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- PROFILES
CREATE POLICY "Anon can read profiles for login" ON public.profiles
  FOR SELECT TO anon USING (true);

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (id = auth.uid());

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert profiles" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- USER_ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- POSTOS
CREATE POLICY "Authenticated users can read postos" ON public.postos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage postos" ON public.postos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- TURNOS
CREATE POLICY "Authenticated users can read turnos" ON public.turnos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage turnos" ON public.turnos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ESCALAS
CREATE POLICY "Users can view own escalas" ON public.escalas
  FOR SELECT TO authenticated USING (funcionario_id = auth.uid());

CREATE POLICY "Admins can view all escalas" ON public.escalas
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage escalas" ON public.escalas
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- CHECKINS
CREATE POLICY "Users can view own checkins" ON public.checkins
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.escalas WHERE escalas.id = checkins.escala_id AND escalas.funcionario_id = auth.uid())
  );

CREATE POLICY "Users can insert own checkins" ON public.checkins
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.escalas WHERE escalas.id = checkins.escala_id AND escalas.funcionario_id = auth.uid())
  );

CREATE POLICY "Admins can view all checkins" ON public.checkins
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- PEDIDOS_FOLGA
CREATE POLICY "Users can view own pedidos" ON public.pedidos_folga
  FOR SELECT TO authenticated USING (funcionario_id = auth.uid());

CREATE POLICY "Users can insert own pedidos" ON public.pedidos_folga
  FOR INSERT TO authenticated WITH CHECK (funcionario_id = auth.uid());

CREATE POLICY "Admins can view all pedidos" ON public.pedidos_folga
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update pedidos" ON public.pedidos_folga
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- AVISOS
CREATE POLICY "Authenticated users can read avisos" ON public.avisos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage avisos" ON public.avisos
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
