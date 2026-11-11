import React from 'react';
import { sections } from '../data/questions';
import { ScaleQuestionnaire } from './FormControls';

const disclosureSection = sections.find(s => s.id === 'disclosure') || sections[2];

export default function DisclosureStep({ answers, onSelectAnswer, back, next }) {
  return (
    <ScaleQuestionnaire
      stepNumber={6}
      scale={disclosureSection}
      answers={answers}
      onSelectAnswer={onSelectAnswer}
      back={back}
      next={next}
      nextLabel="Review answers"
    />
  );
}
