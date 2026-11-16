import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  Table2,
  ShieldAlert,
  ClipboardCheck,
  Users,
  Bot,
  Calculator,
  BarChart3,
  CheckSquare,
  Activity,
  GitCompare,
  Target,
  BookOpen,
  Download,
  SlidersHorizontal,
  Settings,
  LogOut,
  GraduationCap,
} from 'lucide-react';
import { ADMIN_MENU_CATEGORIES } from '../../config/adminMenuConfig';

const ICON_MAP = {
  LayoutDashboard,
  Database,
  Table2,
  ShieldAlert,
  ClipboardCheck,
  Users,
  Bot,
  Calculator,
  BarChart3,
  CheckSquare,
  Activity,
  GitCompare,
  Target,
  BookOpen,
  Download,
  SlidersHorizontal,
  Settings,
};

export default function AdminSidebar({ isOpen, onClose, onLogout, username }) {
  return (
    <>
      <div
        className={`admin-overlay-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`} aria-label="Admin Navigation">
        <div className="admin-sidebar-brand">
          <div className="admin-brand-mark">
            <GraduationCap size={18} />
          </div>
          <div>
            <div className="admin-brand-title">Research Analytics</div>
            <div className="admin-brand-sub">DU Psychology · AI Study</div>
          </div>
        </div>

        <nav className="admin-sidebar-nav">
          {ADMIN_MENU_CATEGORIES.map(group => (
            <div className="admin-nav-group" key={group.category}>
              <div className="admin-nav-category">{group.category}</div>
              {group.items.map(item => {
                const Icon = ICON_MAP[item.icon] || LayoutDashboard;
                const end = item.path === '/admin/dashboard';
                return (
                  <NavLink
                    key={item.id}
                    to={item.path}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `admin-nav-item ${isActive ? 'active' : ''}`
                    }
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div style={{ fontSize: 12, color: '#475569' }}>
            Signed in as <strong>{username || 'admin'}</strong>
          </div>
          <button
            type="button"
            className="admin-btn admin-btn-danger"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={onLogout}
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
