import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Cpu,
  FileText,
  ClipboardCheck,
  ScrollText,
  TerminalSquare,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  User,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: '概览仪表盘' },
  { path: '/models', icon: Cpu, label: '模型管理' },
  { path: '/templates', icon: FileText, label: 'Prompt模板' },
  { path: '/evaluations', icon: ClipboardCheck, label: '评估管道' },
  { path: '/logs', icon: ScrollText, label: '调用日志' },
  { path: '/playground', icon: TerminalSquare, label: 'API Playground' },
];

export default function AppLayout() {
  const location = useLocation();
  const { sidebarCollapsed, setSidebarCollapsed } = useAppStore();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen flex">
      <aside
        className={cn(
          'bg-bg-secondary border-r border-border flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'w-20' : 'w-64'
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-9 h-9 rounded-lg bg-gradient-brand flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="overflow-hidden">
                <h1 className="font-display font-bold text-lg text-text-primary whitespace-nowrap">
                  LLM Gateway
                </h1>
                <p className="text-xs text-text-muted whitespace-nowrap">企业智能网关</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              location.pathname.startsWith(item.path + '/');
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn('nav-item', isActive && 'nav-item-active')}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="nav-item w-full justify-center"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>收起侧边栏</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-bg-secondary/50 backdrop-blur-sm border-b border-border flex items-center justify-between px-6">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                placeholder="搜索模板、日志、模型..."
                className="input pl-10"
                onFocus={() => setSearchOpen(true)}
                onBlur={() => setTimeout(() => setSearchOpen(false), 200)}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-danger rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-border">
              <div className="w-9 h-9 rounded-full bg-gradient-brand flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden lg:block">
                <p className="text-sm font-medium text-text-primary">管理员</p>
                <p className="text-xs text-text-muted">admin@company.com</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
