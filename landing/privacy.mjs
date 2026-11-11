// The Privacy page (owner, 2026-11-10: "Say plainly what goes to Google", way
// "Privacy page plus a Help line"). His text, kept true to what today's app
// sends (src/utils/analytics.ts and every trackEvent call). Run
// `npm run landing` after editing; src/test/privacyPage.test.ts fails while
// public/privacy/index.html is stale.
export const privacyPage = {
  slug: 'privacy',
  title: 'Privacy — Custom Dice Roller',
  description: 'What Custom Dice Roller keeps on your phone, what goes to Google while Page metrics is on, and how to turn it off.',
  sections: [
    {
      heading: 'Stays on this phone',
      body: 'Your dice, games, History and pictures. Nothing you type, name or photograph is ever sent. Erase everything, at the bottom of Usage stats, takes it all off this phone.',
    },
    {
      heading: 'Goes to Google while Page metrics is on',
      body: 'Your visits and taps, with each roll’s total and RPG settings; how many dice you roll, save, share or add; whether a roll was typed (never the words); the popular game you load, the theme you pick and the switches you turn on or off; how far you scroll; the page you came from and your screen size; your rough city, device, browser and language; a random ID Google keeps on this phone for up to 2 years after your last visit.',
    },
    {
      heading: 'Turning it off',
      body: 'Customize, Page metrics, Off. Then nothing more goes to Google and its ID is deleted from this phone.',
    },
  ],
};
