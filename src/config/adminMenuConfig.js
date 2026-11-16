/**
 * Sidebar Navigation Menu Configuration for /admin/dashboard
 */
export const ADMIN_MENU_CATEGORIES = [
  {
    category: 'DASHBOARD',
    items: [
      { id: 'overview', label: 'Overview', path: '/admin/dashboard', icon: 'LayoutDashboard' },
    ],
  },
  {
    category: 'DATA MANAGEMENT',
    items: [
      { id: 'all-responses', label: 'All Responses', path: '/admin/dashboard/responses', icon: 'Database' },
      { id: 'raw-data', label: 'Raw Data', path: '/admin/dashboard/raw-data', icon: 'Table2' },
      { id: 'data-cleaning', label: 'Data Cleaning', path: '/admin/dashboard/cleaning', icon: 'ShieldAlert' },
      { id: 'data-quality', label: 'Data Quality Report', path: '/admin/dashboard/quality', icon: 'ClipboardCheck' },
    ],
  },
  {
    category: 'PARTICIPANT REPORTS',
    items: [
      { id: 'demographics', label: 'Demographic Analysis', path: '/admin/dashboard/demographics', icon: 'Users' },
      { id: 'ai-usage', label: 'AI Usage Analysis', path: '/admin/dashboard/ai-usage', icon: 'Bot' },
    ],
  },
  {
    category: 'STATISTICAL ANALYSIS',
    items: [
      { id: 'scoring', label: 'Scoring Analysis', path: '/admin/dashboard/scoring', icon: 'Calculator' },
      { id: 'descriptive', label: 'Descriptive Statistics', path: '/admin/dashboard/descriptive', icon: 'BarChart3' },
      { id: 'reliability', label: 'Reliability Analysis', path: '/admin/dashboard/reliability', icon: 'CheckSquare' },
      { id: 'normality', label: 'Normality Analysis', path: '/admin/dashboard/normality', icon: 'Activity' },
      { id: 'correlation', label: 'Correlation Analysis', path: '/admin/dashboard/correlation', icon: 'GitCompare' },
      { id: 'hypotheses', label: 'Hypothesis Testing', path: '/admin/dashboard/hypotheses', icon: 'Target' },
    ],
  },
  {
    category: 'THESIS REPORT',
    items: [
      { id: 'chapter-4-apa7', label: 'Chapter 4 - APA 7', path: '/admin/thesis-report/chapter-4', icon: 'FileText' },
      { id: 'chapter-4', label: 'Chapter 4 — Complete Results', path: '/admin/dashboard/chapter-4', icon: 'BookOpen' },
    ],
  },
  {
    category: 'EXPORT',
    items: [
      { id: 'export', label: 'Export Center', path: '/admin/dashboard/export', icon: 'Download' },
    ],
  },
  {
    category: 'SETTINGS',
    items: [
      { id: 'analysis-settings', label: 'Analysis Settings', path: '/admin/dashboard/analysis-settings', icon: 'SlidersHorizontal' },
      { id: 'admin-settings', label: 'Admin Settings', path: '/admin/dashboard/admin-settings', icon: 'Settings' },
    ],
  },
];

export const ALL_ADMIN_MENU_ITEMS = ADMIN_MENU_CATEGORIES.flatMap(group =>
  group.items.map(item => ({ ...item, category: group.category }))
);
