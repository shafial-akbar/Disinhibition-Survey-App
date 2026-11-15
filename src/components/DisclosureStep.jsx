import React from 'react';
import { sections } from '../data/questions';
import { ScaleQuestionnaire } from './FormControls';

const disclosureSection = sections.find(s => s.id === 'disclosure') || sections[2];

export default function DisclosureStep({ answers, onSelectAnswer, primaryAiTool, back, next }) {
  return (
    <ScaleQuestionnaire
      stepNumber={6}
      scale={disclosureSection}
      answers={answers}
      onSelectAnswer={onSelectAnswer}
      primaryAiTool={primaryAiTool}
      back={back}
      next={next}
      nextLabel="Review answers"
    />
  );
}
