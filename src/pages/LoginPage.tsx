import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Shield, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const ok = login(email, password);
    if (!ok) {
      setError('E-mail ou senha incorretos');
      return;
    }
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
            <label className="block text-sm font-semibold text-foreground mb-1.5">E-mail</label>
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="h-12 text-base"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5">Senha</label>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••"
              className="h-12 text-base"
              required
            />
          </div>

          {error && (
            <p className="text-destructive text-sm font-medium text-center">{error}</p>
          )}

          <Button type="submit" className="w-full h-12 text-base font-semibold gap-2">
            <LogIn size={20} />
            Entrar
          </Button>

          <div className="text-xs text-muted-foreground text-center space-y-1 pt-2">
            <p className="font-semibold">Contas de demonstração:</p>
            <p>Admin: admin@escala.com / admin123</p>
            <p>Funcionário: carlos@escala.com / 123456</p>
          </div>
        </form>
      </div>
    </div>
  );
}
