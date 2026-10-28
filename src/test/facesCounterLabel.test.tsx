import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiceSettingsModal } from '../components/DiceSettingsModal';
import type { DiceData } from '../types';

const die = (customFaces: string[]): DiceData => ({
  id: 'd1', numberValue: 1, faces: 6, customFaces, color: '#6750A4', held: false,
});

const renderWith = (d: DiceData) => render(
  <DiceSettingsModal dice={d} isOpen onClose={() => {}} onUpdate={() => {}} onRemove={() => {}} onClone={() => {}} allDice={[d]} />
);

describe('Faces counter label', () => {
  it('names the custom faces it would replace', () => {
    renderWith(die(['YES', 'NO', 'MAYBE']));
    expect(screen.getByLabelText(/Standard Faces\s*Replaces your 3 custom faces/)).toBeInTheDocument();
  });

  it('uses the singular for one face', () => {
    renderWith(die(['STAR']));
    expect(screen.getByText('Replaces your 1 custom face')).toBeInTheDocument();
  });

  it('says nothing extra on a plain numbered die', () => {
    renderWith(die([]));
    expect(screen.getByLabelText('Standard Faces')).toBeInTheDocument();
    expect(screen.queryByText(/Replaces your/)).not.toBeInTheDocument();
  });
});
