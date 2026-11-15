import React from 'react';
import { sections } from '../data/questions';
import { ScaleQuestionnaire } from './FormControls';

const warmthSection = sections.find(s => s.id === 'warmth') || sections[0];

export default function WarmthStep({ answers, onSelectAnswer, primaryAiTool, back, next }) {
  return (
    <ScaleQuestionnaire
      stepNumber={4}
      scale={warmthSection}
      answers={answers}
      onSelectAnswer={onSelectAnswer}
      primaryAiTool={primaryAiTool}
      back={back}
      next={next}
      nextLabel="Continue"
    />
  );
}
