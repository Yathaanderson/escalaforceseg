import { NavLink, useLocation } from 'react-router-dom';
import { Home, Calendar, Megaphone, Clock } from 'lucide-react';

const items = [
  { to: '/app', icon: Home, label: 'Início' },
  { to: '/app/escala', icon: Calendar, label: 'Escala' },
  { to: '/app/avisos', icon: Megaphone, label: 'Avisos' },
  { to: '/app/folgas', icon: Clock, label: 'Folgas' },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <div className="page-container max-w-lg mx-auto">
        {children}
      </div>
      <nav className="nav-bottom">
        {items.map(item => {
          const active = location.pathname === item.to;
          return (
            <NavLink key={item.to} to={item.to} className={`nav-bottom-item ${active ? 'active' : ''}`}>
              <item.icon size={24} strokeWidth={active ? 2.5 : 1.8} />
              <span className="text-xs font-semibold">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
