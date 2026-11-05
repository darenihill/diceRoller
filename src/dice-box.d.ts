// dice-box ships no types; src/utils/dice3d.ts describes the parts the app uses
declare module '@3d-dice/dice-box' {
  const DiceBox: new (config: Record<string, unknown>) => unknown;
  export default DiceBox;
}
