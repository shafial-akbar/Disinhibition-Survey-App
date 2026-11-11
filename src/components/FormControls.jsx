import React from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { likert } from '../data/questions';

export function Field({ label, required, children }) {
  return (
    <div className="field">
      <label>
        {label} {required && <b>*</b>}
      </label>
      {children}
    </div>
  );
}

export function Select({ value, set, opts, optional }) {
  return (
    <select value={value} onChange={e => set(e.target.value)}>
      <option value="">{optional ? 'Select an option (optional)' : 'Select an option'}</option>
      {opts.map(x => (
        <option key={x}>{x}</option>
      ))}
    </select>
  );
}

export function Choices({ value, set, options }) {
  return (
    <div className="choices">
      {options.map(v => (
        <label className={value === v ? 'active' : ''} key={v}>
          <input type="radio" checked={value === v} onChange={() => set(v)} />
          {v === 'yes' ? 'Yes' : 'No'}
        </label>
      ))}
    </div>
  );
}

export function Multi({ vals, toggle, opts }) {
  return (
    <div className="multi">
      {opts.map(v => (
        <label className={vals.includes(v) ? 'active' : ''} key={v}>
          <input
            type="checkbox"
            checked={vals.includes(v)}
            onChange={() => toggle(v)}
          />
          {v}
        </label>
      ))}
    </div>
  );
}

export function Nav({ back, next, label = 'Continue' }) {
  return (
    <div className="nav">
      <button type="button" className="secondary" onClick={back}>
        <ArrowLeft size={16} /> Back
      </button>
      <button type="button" className="primary" onClick={next}>
        {label} <ArrowRight size={17} />
      </button>
    </div>
  );
}

export function Row({ label, value }) {
  return (
    <div className="row">
      <span>{label}</span>
      <b>{value || '—'}</b>
    </div>
  );
}

export function ScaleQuestionnaire({
  stepNumber,
  scale,
  answers,
  onSelectAnswer,
  back,
  next,
  nextLabel = 'Continue',
}) {
  if (!scale) return null;

  return (
    <>
      <div className="kicker">STEP {stepNumber} OF 7 · MEASUREMENT</div>
      <h2>
        {scale.title}{' '}
        {scale.titleBn && <span className="bn-title">({scale.titleBn})</span>}
      </h2>
      <p className="muted">
        {scale.description}{' '}
        {scale.descriptionBn && <span className="bn">({scale.descriptionBn})</span>}{' '}
        Select one response for each statement.
      </p>
      <div className="scalehint">
        <span>
          1 = Strongly disagree <em className="bn">(সম্পূর্ণ অসম্মত)</em>
        </span>
        <span>
          5 = Strongly agree <em className="bn">(সম্পূর্ণ সম্মত)</em>
        </span>
      </div>
      {scale.items.map((q, i) => {
        const k = `${scale.prefix}_${i + 1}`;
        const qBn = scale.itemsBn?.[i];
        return (
          <div className="question" key={k}>
            <div className="qtext">
              <span>{i + 1}</span>
              <div>
                {q} {qBn && <span className="bn">({qBn})</span>} <b>*</b>
              </div>
            </div>
            <div className="likert">
              {likert.map(([v, label, labelBn]) => (
                <label
                  className={Number(answers[k]) === Number(v) ? 'chosen' : ''}
                  key={v}
                >
                  <input
                    type="radio"
                    name={k}
                    checked={Number(answers[k]) === Number(v)}
                    onChange={() => onSelectAnswer(k, Number(v))}
                  />
                  <strong>{v}</strong>
                  <small>
                    {label}
                    {labelBn && <span className="bn-likert">({labelBn})</span>}
                  </small>
                </label>
              ))}
            </div>
          </div>
        );
      })}
      <Nav back={back} next={next} label={nextLabel} />
    </>
  );
}
