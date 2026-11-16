import React from 'react';
import PageTitle from '../../../components/common/PageTitle';
import AdminCard from '../../../components/admin/AdminCard';
import HypothesisResult from '../../../components/analysis/HypothesisResult';
import AdminEmptyState from '../../../components/admin/AdminEmptyState';
import InterpretationBox from '../../../components/analysis/InterpretationBox';
import { formatNumber, formatPValue } from '../../../utils/formatters/numberFormatter';

export default function HypothesisTesting({ analysis, onRefresh }) {
  const { cleaning, hypothesesResult, settings } = analysis;
  const { hypotheses, exploratory } = hypothesesResult;

  return (
    <>
      <PageTitle
        title="Hypothesis Testing (H1–H3) & Exploratory Analysis"
        subtitle="Confirmatory testing of pre-specified study hypotheses separated strictly from post-hoc exploratory subgroup checks."
        meta={`Primary Method: ${
          hypothesesResult.methodUsed === 'spearman' ? "Spearman's ρ" : "Pearson's r"
        } (two-tailed) · α = ${hypothesesResult.alphaLevel}`}
      />

      {cleaning.validCount === 0 ? (
        <AdminEmptyState onRefresh={onRefresh} />
      ) : (
        <>
          <AdminCard
            title="Part 1: Confirmatory Study Hypotheses (H1–H3)"
            subtitle="Evaluated strictly using calculated correlation coefficient, direction, 95% confidence interval, and two-tailed p-value."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {hypotheses.map(h => (
                <HypothesisResult key={h.id} hypothesis={h} />
              ))}
            </div>
          </AdminCard>

          <AdminCard
            title="Part 2: Additional Exploratory Analyses (Non-Confirmatory)"
            subtitle={exploratory.disclaimer}
          >
            <div className="admin-banner admin-banner-warn" style={{ marginBottom: 16 }}>
              <strong>Confirmatory vs. Exploratory Separation:</strong> The subgroup tests and simple regressions below are strictly exploratory checks. They are only computed when subgroup sample sizes satisfy statistical requirements (n ≥ 2 per group).
            </div>

            <div className="analysis-grid-2">
              <div className="hypothesis-card">
                <strong style={{ fontSize: 14 }}>{exploratory.genderComparison.title}</strong>
                {exploratory.genderComparison.tTest.applicable ? (
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
                    <div>
                      Male (n={exploratory.genderComparison.tTest.nA}): M = {formatNumber(exploratory.genderComparison.tTest.meanA, 2)}, SD = {formatNumber(exploratory.genderComparison.tTest.sdA, 2)}
                    </div>
                    <div>
                      Female (n={exploratory.genderComparison.tTest.nB}): M = {formatNumber(exploratory.genderComparison.tTest.meanB, 2)}, SD = {formatNumber(exploratory.genderComparison.tTest.sdB, 2)}
                    </div>
                    <div>
                      Welch&apos;s t({formatNumber(exploratory.genderComparison.tTest.df, 1)}) = {formatNumber(exploratory.genderComparison.tTest.tStat, 3)}, p {formatPValue(exploratory.genderComparison.tTest.pValue) === '< .001' ? '< .001' : `= ${formatPValue(exploratory.genderComparison.tTest.pValue)}`}, d = {formatNumber(exploratory.genderComparison.tTest.cohensD, 2)}
                    </div>
                    {exploratory.genderComparison.mannWhitney.applicable && (
                      <div>
                        Mann-Whitney U = {formatNumber(exploratory.genderComparison.mannWhitney.uStat, 1)}, p {formatPValue(exploratory.genderComparison.mannWhitney.pValue) === '< .001' ? '< .001' : `= ${formatPValue(exploratory.genderComparison.mannWhitney.pValue)}`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    Not run: {exploratory.genderComparison.tTest.reason}
                  </div>
                )}
              </div>

              <div className="hypothesis-card">
                <strong style={{ fontSize: 14 }}>{exploratory.ageGroupComparison.title}</strong>
                {exploratory.ageGroupComparison.anova.applicable ? (
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
                    <div>
                      One-Way ANOVA: F({exploratory.ageGroupComparison.anova.df1}, {exploratory.ageGroupComparison.anova.df2}) = {formatNumber(exploratory.ageGroupComparison.anova.fStat, 3)}, p {formatPValue(exploratory.ageGroupComparison.anova.pValue) === '< .001' ? '< .001' : `= ${formatPValue(exploratory.ageGroupComparison.anova.pValue)}`}, η² = {formatNumber(exploratory.ageGroupComparison.anova.etaSquared, 3)}
                    </div>
                    {exploratory.ageGroupComparison.kruskalWallis.applicable && (
                      <div>
                        Kruskal-Wallis H({exploratory.ageGroupComparison.kruskalWallis.df}) = {formatNumber(exploratory.ageGroupComparison.kruskalWallis.hStat, 3)}, p {formatPValue(exploratory.ageGroupComparison.kruskalWallis.pValue) === '< .001' ? '< .001' : `= ${formatPValue(exploratory.ageGroupComparison.kruskalWallis.pValue)}`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    Not run: {exploratory.ageGroupComparison.anova.reason}
                  </div>
                )}
              </div>

              <div className="hypothesis-card">
                <strong style={{ fontSize: 14 }}>{exploratory.frequencyComparison.title}</strong>
                {exploratory.frequencyComparison.anova.applicable ? (
                  <div style={{ fontSize: 13, lineHeight: 1.7, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
                    <div>
                      One-Way ANOVA: F({exploratory.frequencyComparison.anova.df1}, {exploratory.frequencyComparison.anova.df2}) = {formatNumber(exploratory.frequencyComparison.anova.fStat, 3)}, p {formatPValue(exploratory.frequencyComparison.anova.pValue) === '< .001' ? '< .001' : `= ${formatPValue(exploratory.frequencyComparison.anova.pValue)}`}, η² = {formatNumber(exploratory.frequencyComparison.anova.etaSquared, 3)}
                    </div>
                    {exploratory.frequencyComparison.kruskalWallis.applicable && (
                      <div>
                        Kruskal-Wallis H({exploratory.frequencyComparison.kruskalWallis.df}) = {formatNumber(exploratory.frequencyComparison.kruskalWallis.hStat, 3)}, p {formatPValue(exploratory.frequencyComparison.kruskalWallis.pValue) === '< .001' ? '< .001' : `= ${formatPValue(exploratory.frequencyComparison.kruskalWallis.pValue)}`}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 13, color: '#64748b' }}>
                    Not run: {exploratory.frequencyComparison.anova.reason}
                  </div>
                )}
              </div>

              <div className="hypothesis-card">
                <strong style={{ fontSize: 14 }}>Exploratory Simple Linear Regressions</strong>
                {exploratory.regressions.map((reg, i) => (
                  <div key={i} style={{ fontSize: 12.5, lineHeight: 1.65, color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>
                    <strong>{reg.title}:</strong>{' '}
                    {reg.applicable
                      ? `b = ${formatNumber(reg.slope, 3)} (SE = ${formatNumber(reg.seSlope, 3)}), R² = ${formatNumber(reg.rSquared, 3)}, t(${reg.df}) = ${formatNumber(reg.tStat, 2)}, p ${formatPValue(reg.pValue) === '< .001' ? '< .001' : `= ${formatPValue(reg.pValue)}`}`
                      : `Not run (${reg.reason})`}
                  </div>
                ))}
              </div>
            </div>
          </AdminCard>

          <InterpretationBox
            showBanglaDefault={settings.showBanglaExplanations}
            whatItIs="Hypothesis testing checks whether the evidence in your collected sample supports each pre-stated research prediction (H1, H2, H3)."
            whyUseIt="A thesis needs clear, objective decisions ('Supported' vs. 'Not supported by the statistical evidence') based on predetermined thresholds rather than guesswork."
            howCalculated="A hypothesis is marked Supported only when the observed correlation is positive (> 0) AND the two-tailed p-value is below α (default 0.05)."
            howToInterpret="If a hypothesis is 'Not supported', do not say it was 'disproven'; instead explain that sample evidence was insufficient at α = .05. Never describe cross-sectional correlation as proof of cause-and-effect."
            thesisText={hypotheses
              .map(
                h =>
                  `${h.id} (${h.title}): ${h.decision} (${formatNumber(h.coefficient, 3)}, p ${
                    formatPValue(h.pValue) === '< .001' ? '< .001' : `= ${formatPValue(h.pValue)}`
                  }, n = ${h.n}).`
              )
              .join(' ')}
            banglaSummary="অনুকল্প পরীক্ষা (Hypothesis Testing) আমাদের নির্ধারিত অনুমানগুলো (H1, H2, H3) তথ্য-উপাত্ত দ্বারা সমর্থিত কি না তা নির্ণয় করে। এখানে p < .05 এবং ধনাত্মক সম্পর্ক থাকলে অনুকল্পটি 'Supported' হিসেবে বিবেচিত হয়।"
          />
        </>
      )}
    </>
  );
}
