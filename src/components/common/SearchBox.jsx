import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchBox({ value, onChange, placeholder = 'Search by ID, tool, demographic...' }) {
  return (
    <div style={{ position: 'relative', flex: '1 1 220px', minWidth: 200 }}>
      <Search
        size={15}
        style={{
          position: 'absolute',
          left: 10,
          top: '50%',
          transform: 'translateY(-50%)',
          color: '#64748b',
          pointerEvents: 'none',
        }}
      />
      <input
        type="text"
        className="admin-input"
        style={{ paddingLeft: 32, paddingRight: value ? 30 : 10 }}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            border: 0,
            background: 'transparent',
            color: '#64748b',
            cursor: 'pointer',
            padding: 4,
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
