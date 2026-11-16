import React from 'react';
import PageTitle from '../../../components/common/PageTitle';
import ReliabilityTable from '../../../components/analysis/ReliabilityTable';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import InterpretationBox from '../../../components/analysis/InterpretationBox';
import { formatNumber } from '../../../utils/formatters/numberFormatter';

export default function ReliabilityAnalysis({ analysis, onRefresh }) {
  const { cleaning, reliability, settings } = analysis;
  const scales = reliability.scales || [];

  return (
    <>
      <PageTitle
        title="Reliability Analysis (Cronbach's Alpha)"
        subtitle="Internal consistency reliability calculated directly from individual Likert items (PCW 4 items, PT 6 items, WSD 8 items)."
      />

      {cleaning.validCount === 0 ? (
        <AdminEmptyState onRefresh={onRefresh} />
      ) : (
        <>
          <div className="admin-banner admin-banner-info">
            {reliability.methodologyNote}
          </div>

          {scales.map(scale => (
            <ReliabilityTable key={scale.code} scale={scale} />
          ))}

          <InterpretationBox
            showBanglaDefault={settings.showBanglaExplanations}
            whatItIs="Cronbach's Alpha (α) measures how consistently the items inside a single questionnaire scale move together."
            whyUseIt="Researchers verify reliability before combining items into a composite score to show the questions consistently capture the same construct."
            howCalculated="α = [k / (k − 1)] × [1 − (Sum of individual item sample variances / Variance of total scale score)]. Corrected item-total correlation checks each item against the sum of the remaining items."
            highVsLow="Values ≥ .70 are generally considered acceptable, ≥ .80 good, and ≥ .90 excellent. Values below .60 suggest weak consistency (often sensitive to small samples or short 4-item scales)."
            howToInterpret="Check 'Cronbach's α if Item Deleted': if removing one item dramatically raises α and its corrected item-total correlation is below .30, note that item for discussion."
            thesisText={`Internal consistency reliability was evaluated using Cronbach's alpha on item-level responses (n = ${cleaning.validCount}): ${scales
              .map(s => `${s.name} (${s.itemCount} items, α = ${formatNumber(s.alpha, 3)})`)
              .join('; ')}.`}
            banglaSummary="ক্রনবাখের আলফা (Cronbach's Alpha) যাচাই করে প্রতিটি স্কেলের প্রশ্নগুলো একে অপরের সাথে সামঞ্জস্যপূর্ণভাবে একই বিষয় পরিমাপ করছে কি না। সাধারণত ০.৭০ বা তার বেশি আলফা ভালো গ্রহণযোগ্যতা নির্দেশ করে।"
          />
        </>
      )}
    </>
  );
}
