import React from 'react';
import { Modal } from '../Modal';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help & Guide">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--md-sys-color-on-surface-variant)', fontSize: 14, lineHeight: 1.6 }}>
        <p>Welcome to <strong>Dice Roller</strong>! Here is how to use the available features:</p>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li><strong>Add / Roll Dice:</strong> Use the <code>+</code> button at the bottom to add dice, and the main button to roll all unheld dice.</li>
          <li><strong>Hold individual dice:</strong> Simply click/tap any die to hold or release it. Held dice stay locked across rolls.</li>
          <li><strong>Lock All:</strong> Toggle the Lock icon in the action bar to instantly hold or release all dice at once.</li>
          <li><strong>Custom Faces:</strong> Click the gear icon on a die to open settings. You can add custom text, special icons, and pick custom background colors for each face.</li>
          <li><strong>Games & Presets:</strong> Quickly load predefined configurations like <em>Cities & Knights</em> or <em>That's Pretty Clever</em>, or save and load your own custom games!</li>
          <li><strong>RPG Mode:</strong> Toggle under Tools to unlock polyhedral dice shapes, a roll modifier, and Advantage / Disadvantage. Advantage keeps the highest (Disadvantage the lowest) among identical plain dice — custom-faced dice like percentile pairs always count normally.</li>
          <li><strong>Target Highlight:</strong> Set target totals under Tools &gt; Customize (e.g. <code>7, 11</code>) and get a 🎯 celebration whenever a roll hits one.</li>
          <li><strong>Colorblind Friendly:</strong> Automatic contrast coloring ensures text and icons are perfectly readable against any background color.</li>
        </ul>
      </div>
    </Modal>
  );
};
