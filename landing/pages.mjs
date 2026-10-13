// Search landing pages. Each one is a real page with its own title and writing
// that opens the app with a chosen set already loaded (ROADMAP.md, "landing
// pages that preload state"). scripts/landing-pages.mjs turns these into
// <slug>/index.html and the sitemap; never edit those generated files by hand.
//
// start.preset names a set in src/utils/presets.ts; start.dice gives dice
// directly. start.name is the name the chip shows when the dice are not a
// built-in game. start.rpg turns RPG mode on.

export const landingPages = [
  {
    slug: 'dnd-dice-roller',
    title: 'D&D Dice Roller — Free Online d20, d12, d10, d8, d6, d4',
    description: 'Free D&D dice roller with the full polyhedral set, advantage and disadvantage, modifiers and natural 20 highlighting. No sign-up, works on any device.',
    heading: 'D&D dice roller',
    start: { preset: 'Dungeons & Dragons', rpg: true },
    body: `
<p>This page opens with a full Dungeons &amp; Dragons set ready to roll: d20, d12, two d10s for percentile rolls, d8, d6 and d4. Press Roll to roll the whole set, and hold any die you want to keep.</p>
<h2>Which die is for what</h2>
<ul>
  <li><strong>d20</strong> decides whether you succeed: attack rolls, ability checks and saving throws.</li>
  <li><strong>d4 to d12</strong> roll damage and healing. A dagger is a d4, a shortsword a d6, a longsword a d8 (d10 with two hands) and a greataxe a d12.</li>
  <li><strong>The two d10s</strong> make a d100 for wild magic and random tables: one gives the tens, the other the units.</li>
</ul>
<h2>Advantage, modifiers and crits</h2>
<p>RPG mode is already on. Choose advantage to roll two d20s and keep the higher, or disadvantage to keep the lower. Add your modifier and the total includes it. A natural 20 and a natural 1 are highlighted so nobody misses a critical.</p>
<h2>Make it your character's set</h2>
<p>Hold dice between rolls, change colours, or add more d6s for a fireball. Save the set under your character's name, then share it with your table as a link, so everyone rolls the same dice. It is free, needs no account and works on phones, tablets and laptops.</p>
`,
  },
  {
    slug: 'd20-roller',
    title: 'd20 Roller — Roll a 20-Sided Die Online, With Advantage',
    description: 'Roll a d20 online for free. Advantage and disadvantage, modifiers, and natural 20 and natural 1 highlighting. No sign-up, no ads.',
    heading: 'd20 roller',
    start: {
      name: 'd20',
      rpg: true,
      dice: [{ numberValue: 1, faces: 20, customFaces: [], color: '#384050', name: 'd20' }],
    },
    body: `
<p>One twenty-sided die, ready to roll. Press Roll. Each number from 1 to 20 has the same 5% chance, which is why a single d20 roll can swing a whole game.</p>
<h2>Natural 20s and natural 1s</h2>
<p>In most tabletop RPGs a natural 20 is a critical success and a natural 1 is a critical failure, whatever your modifier. Both are highlighted here, so the moment is hard to miss.</p>
<h2>Advantage and disadvantage</h2>
<p>RPG mode is already on. With advantage you roll two d20s and keep the higher; with disadvantage you keep the lower. The difference is bigger than it sounds:</p>
<ul>
  <li>The chance of rolling 11 or more goes from 50% to 75% with advantage, and down to 25% with disadvantage.</li>
  <li>The chance of at least one natural 20 nearly doubles, from 5% to 9.75%.</li>
</ul>
<h2>Modifiers and more dice</h2>
<p>Set your modifier once and every total includes it. Need damage dice too? Use the + button to add a d6, d8 or any die you like, or open the D&amp;D set from the menu. Roll history shows your last rolls if anyone asks what you got.</p>
`,
  },
  {
    slug: 'catan-dice-roller',
    title: 'Catan Dice Roller — Free Online Red and Yellow Dice',
    description: 'Roll Catan dice online: the red and yellow pair, with the total shown and a chart of how often each number comes up. Free, no sign-up.',
    heading: 'Catan dice roller',
    start: { preset: 'Catan' },
    body: `
<p>Lost the dice, or want rolls everyone at the table can see? This page opens with Catan's red and yellow pair. Press Roll and the total appears on the button.</p>
<h2>Why 7 comes up most</h2>
<p>Two six-sided dice can land in 36 ways, and six of them add up to 7, so a 7 comes up about one roll in six. That is why the robber moves on a 7 and why nothing is built on it.</p>
<h2>Reading the number tokens</h2>
<p>The dots under each number on the board count the ways to roll it:</p>
<ul>
  <li><strong>6 and 8</strong>, the red numbers, have five ways each: about 14% of rolls.</li>
  <li><strong>5 and 9</strong> have four ways, <strong>4 and 10</strong> three, <strong>3 and 11</strong> two.</li>
  <li><strong>2 and 12</strong> have one way each: under 3% of rolls.</li>
</ul>
<p>A settlement on a 6, an 8 and a 5 collects on 14 of every 36 rolls on average. One on 2, 12 and 11 collects on 4.</p>
<h2>Check your luck</h2>
<p>Open History from the menu to see every roll and a chart of how often each total has come up this game. If the 6s seem to have vanished, the chart will tell you whether that is true. Playing Cities &amp; Knights? Load its set from Games to add the event die.</p>
`,
  },
  {
    slug: 'classroom-dice-roller',
    title: 'Classroom Dice Roller — Free Virtual Dice for Teachers',
    description: 'Free virtual dice for the classroom: big dice for the projector, a frequency chart for probability lessons, and word dice. No accounts, no ads.',
    heading: 'Classroom dice roller',
    start: {
      name: 'Classroom',
      dice: [
        { numberValue: 1, faces: 6, customFaces: [], color: '#0056D2', name: '' },
        { numberValue: 2, faces: 6, customFaces: [], color: '#2E7D32', name: '' },
      ],
    },
    body: `
<p>Virtual dice that work on a projector, a smartboard or every student's Chromebook. It is free, there are no accounts to create and no ads, and nothing needs installing. Post the link in Google Classroom and the whole class has the same dice.</p>
<h2>A probability lesson in ten minutes</h2>
<ol>
  <li>Ask the class which total of two dice will come up most often, and why.</li>
  <li>Roll 50 times. Students can each roll on their own device and pool the results.</li>
  <li>Open History from the menu. Its chart shows how often each total came up.</li>
  <li>Compare it with the 36 ways two dice can land: six of them make 7, only one makes 2 or 12.</li>
</ol>
<p>Add a third die with the + button and the shape of the chart changes, which makes a good follow-up question.</p>
<h2>Make your own dice</h2>
<p>Any face can carry a word, a number or an icon, so you can make word dice as easily as number dice. Teachers use them for:</p>
<ul>
  <li>times-table and number-bond practice,</li>
  <li>story starters and vocabulary review,</li>
  <li>picking groups or turn order fairly.</li>
</ul>
<h2>Save a set and share it with your class</h2>
<ol>
  <li>Build your dice, open the menu and tap Save. Name the set, for example "Week 3 vocabulary".</li>
  <li>Tap Share. A link to exactly those dice is copied, set name included.</li>
  <li>Paste it into Google Classroom, an email or a slide. Students open the same dice, named at the top, with no sign-in.</li>
</ol>
<p>Saved sets stay on that device under Load, ready for the next lesson. On a classroom computer, Set Default opens your set every time. Anonymous page statistics can be switched off under Customize.</p>
`,
  },
];
