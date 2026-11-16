import React from 'react';
import { Menu, RefreshCw, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../common/Breadcrumb';

export default function AdminHeader({
  breadcrumbs,
  onToggleMobileMenu,
  onRefresh,
  loading,
}) {
  return (
    <header className="admin-topbar">
      <div className="admin-topbar-left">
        <button
          type="button"
          className="admin-mobile-menu-btn"
          onClick={onToggleMobileMenu}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>
        <Breadcrumb items={breadcrumbs} />
      </div>

      <div className="admin-topbar-actions">
        <button
          type="button"
          className="admin-btn admin-btn-primary"
          onClick={onRefresh}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin' : ''} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
        <Link to="/" className="admin-btn">
          <ExternalLink size={14} /> Survey View
        </Link>
      </div>
    </header>
  );
}
