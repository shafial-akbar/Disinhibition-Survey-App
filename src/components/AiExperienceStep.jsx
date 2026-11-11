import React from 'react';
import { Field, Select, Multi, Nav } from './FormControls';

export const toolOpts = [
  'ChatGPT',
  'Google Gemini',
  'Microsoft Copilot',
  'Meta AI',
  'Other AI chatbot',
];

export const purposeOpts = [
  'Education and learning',
  'Professional or work-related tasks',
  'Information searching',
  'Writing and communication',
  'Personal discussions',
  'Entertainment',
  'Other',
];

export default function AiExperienceStep({ profile, setField, toggleField, back, next }) {
  return (
    <>
      <div className="kicker">STEP 3 OF 7</div>
      <h2>Your AI experience</h2>
      <p className="muted">Answer based on your use of conversational AI tools.</p>

      <Field label="Which conversational AI tools have you used?" required>
        <Multi
          vals={profile.ai_tools}
          toggle={v => toggleField('ai_tools', v)}
          opts={toolOpts}
        />
      </Field>

      <Field label="How frequently do you use conversational AI?" required>
        <Select
          value={profile.ai_frequency}
          set={v => setField('ai_frequency', v)}
          opts={[
            'Daily',
            'Several times a week',
            'Once a week',
            'A few times a month',
            'Rarely',
          ]}
        />
      </Field>

      <Field label="How long have you been using conversational AI?" required>
        <Select
          value={profile.ai_duration}
          set={v => setField('ai_duration', v)}
          opts={[
            'Less than 3 months',
            '3–6 months',
            '6–12 months',
            '1–2 years',
            'More than 2 years',
          ]}
        />
      </Field>

      <Field label="What do you mainly use conversational AI for?" required>
        <Multi
          vals={profile.ai_purpose}
          toggle={v => toggleField('ai_purpose', v)}
          opts={purposeOpts}
        />
      </Field>

      <Field label="How familiar are you with conversational AI tools?" required>
        <Select
          value={profile.ai_familiarity}
          set={v => setField('ai_familiarity', v)}
          opts={[
            'Not very familiar',
            'Slightly familiar',
            'Moderately familiar',
            'Very familiar',
            'Extremely familiar',
          ]}
        />
      </Field>

      <Nav back={back} next={next} />
    </>
  );
}
