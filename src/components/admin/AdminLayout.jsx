import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import { ALL_ADMIN_MENU_ITEMS } from '../../config/adminMenuConfig';

export default function AdminLayout({
  children,
  session,
  onLogout,
  onRefresh,
  loading,
  isFiltered,
  snapshotMeta,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const currentMenu =
    ALL_ADMIN_MENU_ITEMS.find(item => item.path === location.pathname) ||
    ALL_ADMIN_MENU_ITEMS[0];

  const breadcrumbs = ['Research Admin', currentMenu?.category || 'DASHBOARD', currentMenu?.label || 'Overview'];

  return (
    <div className="admin-shell">
      <AdminSidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        onLogout={onLogout}
        username={session?.username}
      />
      <div className="admin-main">
        <AdminHeader
          breadcrumbs={breadcrumbs}
          onToggleMobileMenu={() => setMobileMenuOpen(o => !o)}
          onRefresh={onRefresh}
          loading={loading}
        />

        <main className="admin-content">
          {isFiltered && (
            <div className="admin-banner admin-banner-info">
              <strong>Filtered Subgroup View Active:</strong> Displaying calculations for{' '}
              <strong>{snapshotMeta?.validN ?? 0}</strong> valid filtered responses out of{' '}
              <strong>{snapshotMeta?.fullDatasetTotal ?? 0}</strong> total database rows.
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
}
