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
          <li><strong>Usage Stats:</strong> Track session stats, total rolls, highest sum, and favorite game presets in real time under Tools &gt; Usage Stats.</li>
          <li><strong>Colorblind Friendly:</strong> Automatic contrast coloring ensures text and icons are perfectly readable against any background color.</li>
        </ul>
      </div>
    </Modal>
  );
};
