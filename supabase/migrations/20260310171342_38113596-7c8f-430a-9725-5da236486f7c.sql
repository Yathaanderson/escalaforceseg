
ALTER TABLE public.profiles ADD COLUMN usuario text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN email text;

-- Allow anon to read profiles for login lookup (usuario -> email)
CREATE POLICY "Anon can read profiles for login" ON public.profiles
FOR SELECT TO anon USING (true);

-- Update handle_new_user to also store email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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
