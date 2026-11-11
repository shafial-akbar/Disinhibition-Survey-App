import React from 'react';
import { sections } from '../data/questions';
import { ScaleQuestionnaire } from './FormControls';

const trustSection = sections.find(s => s.id === 'trust') || sections[1];

export default function TrustStep({ answers, onSelectAnswer, back, next }) {
  return (
    <ScaleQuestionnaire
      stepNumber={5}
      scale={trustSection}
      answers={answers}
      onSelectAnswer={onSelectAnswer}
      back={back}
      next={next}
      nextLabel="Continue"
    />
  );
}
