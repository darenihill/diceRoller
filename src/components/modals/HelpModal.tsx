import React from 'react';
import { Modal } from '../Modal';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.875rem', lineHeight: 1.6 }}>
        <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <li><strong>Add and roll:</strong> Tap <code>+</code> to add a die. Tap Roll to roll every die that isn't held.</li>
          <li><strong>Hold:</strong> Tap a die, then Hold. Held dice stay put when you roll. Tap the gold HELD tag, or Release above Roll, to let them roll again.</li>
          <li><strong>Die settings:</strong> Tap a die, then Settings. Change its name, color and faces, or add words, icons and pictures as faces. Pictures stay on this device; share links show the face's words instead.</li>
          <li><strong>Games:</strong> Open the menu (☰) and tap Games. Load one of the popular games, like <em>Catan</em> or <em>Dungeons &amp; Dragons</em>, or one of your games. Tap Save to keep the dice you have as a game.</li>
          <li><strong>A 7 in Catan:</strong> In <em>Catan</em> or <em>Cities &amp; Knights</em>, a roll of 7 shows 🎯 and what to do just above Roll, until the next roll.</li>
          <li><strong>Default dice:</strong> Tap Set default in the menu, and Dice Roller opens with these dice every time.</li>
          <li><strong>RPG mode:</strong> Tap RPG mode in the menu for D&amp;D dice, a modifier and advantage or disadvantage. Advantage keeps the highest of matching plain dice; disadvantage keeps the lowest.</li>
          <li><strong>Type a roll:</strong> In RPG mode, type a roll like <code>2d6+3</code> or <code>d20 adv</code> in the box at the top, then tap Roll there or the big Roll button. Tap <em>Save this roll</em> to keep it as a button.</li>
          <li><strong>Table view:</strong> Tap Table view in the menu to show each total big, with an upside-down copy for the people across the table. Tap × to turn it off.</li>
          <li><strong>History:</strong> Tap History in the menu to see past rolls and how often each total came up.</li>
          <li><strong>Target hit:</strong> In Customize, type the totals you want, like <code>7, 11</code>. A roll that hits one gets a 🎯.</li>
          <li><strong>Usage stats:</strong> Your total rolls, highest roll and most played games. They stay on this device.</li>
          <li><strong>Erase everything:</strong> At the bottom of Usage stats. It asks first, then takes your games, History, pictures, stats and settings off this phone.</li>
          <li><strong>Keyboard:</strong> On a computer, press <kbd>Space</kbd> or <kbd>R</kbd> to roll.</li>
          <li><strong>Fair dice:</strong> Every roll uses your browser's secure random numbers, so each face is equally likely.</li>
          <li><strong>Colorblind friendly:</strong> Text and icons on each die get a color that stands out from the die, and states are shown in words, not color alone.</li>
        </ul>
      </div>
    </Modal>
  );
};
