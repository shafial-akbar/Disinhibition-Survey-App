import React from 'react';
import { Field, Select, Nav } from './FormControls';

export default function DemographicStep({ profile, setField, back, next }) {
  return (
    <>
      <div className="kicker">STEP 2 OF 7</div>
      <h2>About you</h2>
      <p className="muted">Please provide general demographic details only.</p>

      <Field label="Age group" required>
        <Select
          value={profile.age_group}
          set={v => setField('age_group', v)}
          opts={['18–24 years', '25–34 years', '35–44 years', '45 years or above']}
        />
      </Field>

      <Field label="Gender">
        <Select
          value={profile.gender}
          set={v => setField('gender', v)}
          opts={['Male', 'Female', 'Other', 'Prefer not to say']}
          optional
        />
      </Field>

      <Field label="Highest educational qualification" required>
        <Select
          value={profile.education}
          set={v => setField('education', v)}
          opts={['Secondary', 'Higher Secondary', 'Undergraduate', 'Postgraduate', 'Other']}
        />
      </Field>

      <Field label="Current occupation">
        <Select
          value={profile.occupation}
          set={v => setField('occupation', v)}
          opts={[
            'Student',
            'Government employee',
            'Private-sector employee',
            'Business / Self-employed',
            'Other',
            'Prefer not to say',
          ]}
          optional
        />
      </Field>

      <Nav back={back} next={next} />
    </>
  );
}
