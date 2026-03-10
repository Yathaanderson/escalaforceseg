import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, LogIn, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';

export default function LoginPage() {
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Lookup email by usuario
      const { data: profile, error: lookupError } = await supabase
        .from('profiles')
        .select('email')
        .eq('usuario', usuario.trim())
        .single();

      if (lookupError || !profile?.email) {
        setError('Usuário ou senha incorretos');
        setLoading(false);
        return;
      }

      const err = await login(profile.email, password);
      if (err) setError('Usuário ou senha incorretos');
    } catch {
      setError('Usuário ou senha incorretos');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-foreground/10 mb-4">
            <Shield size={36} className="text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-primary-foreground">EscalaPro</h1>
          <p className="text-primary-foreground/70 mt-1">Sistema de Escala</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-xl space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Usuário</label>
            <Input
              type="text"
              value={usuario}
              onChange={e => setUsuario(e.target.value)}
              placeholder="seu.usuario"
              className="h-12 text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Senha</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••"
                className="h-12 text-base pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-destructive text-sm font-medium text-center">{error}</p>
          )}

          <Button type="submit" className="w-full h-12 text-base font-semibold gap-2" disabled={loading}>
            <LogIn size={20} />
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>
      </div>
    </div>
  );
}
