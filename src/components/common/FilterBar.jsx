import React from 'react';
import { RotateCcw } from 'lucide-react';
import SearchBox from './SearchBox';

export default function FilterBar({
  filters,
  filterOptions,
  onUpdateFilter,
  onResetFilters,
  isFiltered,
  compact = false,
}) {
  return (
    <div className="admin-filter-bar">
      {!compact && (
        <div className="admin-filter-field" style={{ flex: '1.5 1 220px' }}>
          <label>Search</label>
          <SearchBox
            value={filters.search}
            onChange={v => onUpdateFilter('search', v)}
          />
        </div>
      )}

      <div className="admin-filter-field">
        <label>Date From</label>
        <input
          type="date"
          className="admin-input"
          value={filters.dateFrom}
          onChange={e => onUpdateFilter('dateFrom', e.target.value)}
        />
      </div>

      <div className="admin-filter-field">
        <label>Date To</label>
        <input
          type="date"
          className="admin-input"
          value={filters.dateTo}
          onChange={e => onUpdateFilter('dateTo', e.target.value)}
        />
      </div>

      <div className="admin-filter-field">
        <label>Age Group</label>
        <select
          className="admin-select"
          value={filters.age_group}
          onChange={e => onUpdateFilter('age_group', e.target.value)}
        >
          <option value="all">All Age Groups</option>
          {(filterOptions.age_group || []).map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <div className="admin-filter-field">
        <label>Gender</label>
        <select
          className="admin-select"
          value={filters.gender}
          onChange={e => onUpdateFilter('gender', e.target.value)}
        >
          <option value="all">All Genders</option>
          {(filterOptions.gender || []).map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <div className="admin-filter-field">
        <label>Education</label>
        <select
          className="admin-select"
          value={filters.education}
          onChange={e => onUpdateFilter('education', e.target.value)}
        >
          <option value="all">All Education</option>
          {(filterOptions.education || []).map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <div className="admin-filter-field">
        <label>Primary AI Tool</label>
        <select
          className="admin-select"
          value={filters.primary_ai_tool}
          onChange={e => onUpdateFilter('primary_ai_tool', e.target.value)}
        >
          <option value="all">All AI Tools</option>
          {(filterOptions.primary_ai_tool || []).map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <div className="admin-filter-field">
        <label>Usage Frequency</label>
        <select
          className="admin-select"
          value={filters.ai_frequency}
          onChange={e => onUpdateFilter('ai_frequency', e.target.value)}
        >
          <option value="all">All Frequencies</option>
          {(filterOptions.ai_frequency || []).map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
      </div>

      <div className="admin-filter-field">
        <label>Status</label>
        <select
          className="admin-select"
          value={filters.status}
          onChange={e => onUpdateFilter('status', e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="included">Included in Analysis</option>
          <option value="excluded">Excluded Flag</option>
          <option value="locked">Locked (Post-3 Days)</option>
          <option value="pending">Pending Withdrawal Window</option>
        </select>
      </div>

      {isFiltered && (
        <button type="button" className="admin-btn" onClick={onResetFilters}>
          <RotateCcw size={14} /> Reset
        </button>
      )}
    </div>
  );
}
