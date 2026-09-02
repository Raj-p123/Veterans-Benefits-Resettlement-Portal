import React from 'react';
import { Award, Landmark, HeartPulse, Home, GraduationCap } from 'lucide-react';

export const QuickBenefitSummary = ({
  totalSchemes = 0,
  portalSchemes = [],
  selectedCategory = 'All',
  onSelectCategory,
}) => {
  const getCategoryCount = (catName) => {
    return portalSchemes.filter((s) => s.category === catName).length;
  };

  const cards = [
    {
      id: 'All',
      label: 'Total Schemes',
      count: totalSchemes,
      icon: Award,
      color: 'navy',
    },
    {
      id: 'Pension',
      label: 'Pension Benefits',
      count: getCategoryCount('Pension'),
      icon: Landmark,
      color: 'amber',
    },
    {
      id: 'Healthcare',
      label: 'Healthcare',
      count: getCategoryCount('Healthcare'),
      icon: HeartPulse,
      color: 'green',
    },
    {
      id: 'Housing',
      label: 'Housing & Grants',
      count: getCategoryCount('Housing'),
      icon: Home,
      color: 'blue',
    },
    {
      id: 'Education',
      label: 'Education Support',
      count: getCategoryCount('Education'),
      icon: GraduationCap,
      color: 'purple',
    },
  ];

  return (
    <section className="quick-summary-grid" aria-label="Welfare benefit summary categories">
      {cards.map((item) => {
        const Icon = item.icon;
        const isSelected = selectedCategory === item.id;
        return (
          <button
            key={item.id}
            type="button"
            className={`summary-stat-card theme-${item.color} ${isSelected ? 'active-summary-card' : ''}`}
            onClick={() => onSelectCategory && onSelectCategory(item.id)}
            aria-pressed={isSelected}
            title={`Filter by ${item.label}`}
          >
            <div className="summary-stat-icon-box" aria-hidden="true">
              <Icon size={18} />
            </div>
            <div className="summary-stat-text-stack">
              <span className="summary-stat-label">{item.label}</span>
              <span className="summary-stat-number">{item.count}</span>
            </div>
          </button>
        );
      })}
    </section>
  );
};

export default QuickBenefitSummary;
