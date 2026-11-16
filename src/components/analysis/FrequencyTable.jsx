import React from 'react';
import AdminTable from '../admin/AdminTable';
import { formatNumber } from '../../utils/formatters/numberFormatter';

export default function FrequencyTable({ title, tableData, isMultiSelect = false }) {
  if (!tableData) return null;

  if (isMultiSelect) {
    const columns = [
      { key: 'option', label: 'Option Selected' },
      { key: 'count', label: 'Count (n)', numeric: true },
      {
        key: 'percentOfRespondents',
        label: '% of Respondents',
        numeric: true,
        render: row => `${formatNumber(row.percentOfRespondents, 1)}%`,
      },
      {
        key: 'percentOfSelections',
        label: '% of Total Selections',
        numeric: true,
        render: row => `${formatNumber(row.percentOfSelections, 1)}%`,
      },
    ];

    return (
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">{title}</h3>
            <p className="admin-card-sub">
              Multi-select question ({tableData.respondentsWithSelection} of {tableData.totalRespondents} respondents answered · {tableData.totalSelections} total selections; respondent percentages may exceed 100%).
            </p>
          </div>
        </div>
        <AdminTable
          columns={columns}
          rows={tableData.options || []}
          rowKey={r => r.option}
          apa
        />
      </div>
    );
  }

  const columns = [
    { key: 'category', label: 'Category' },
    { key: 'count', label: 'Frequency (n)', numeric: true },
    {
      key: 'percentTotal',
      label: 'Percent (%)',
      numeric: true,
      render: row => `${formatNumber(row.percentTotal, 1)}%`,
    },
    {
      key: 'validPercent',
      label: 'Valid Percent (%)',
      numeric: true,
      render: row => `${formatNumber(row.validPercent, 1)}%`,
    },
  ];

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <h3 className="admin-card-title">{title}</h3>
          <p className="admin-card-sub">
            Total N = {tableData.totalN} · Valid = {tableData.validCount} · Missing = {tableData.missingCount}
          </p>
        </div>
      </div>
      <AdminTable
        columns={columns}
        rows={tableData.categories || []}
        rowKey={r => r.category}
        apa
      />
    </div>
  );
}
