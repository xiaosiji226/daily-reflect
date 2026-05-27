import { Outlet } from 'react-router-dom';
import Header from './Header';
import BottomNav from './BottomNav';

export default function AppShell() {
  return (
    <div className="min-h-dvh bg-slate-50 flex flex-col">
      <Header />
      <main className="flex-1 pt-14 pb-16 overflow-y-auto">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
