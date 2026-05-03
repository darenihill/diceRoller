export const dicePresets = [
  {
    name: "Yatzee",
    dice: [
      { numberValue: 1, faces: 6, customFaces: [], color: "#E9EAEC" },
      { numberValue: 2, faces: 6, customFaces: [], color: "#E9EAEC" },
      { numberValue: 3, faces: 6, customFaces: [], color: "#E9EAEC" },
      { numberValue: 4, faces: 6, customFaces: [], color: "#E9EAEC" },
      { numberValue: 5, faces: 6, customFaces: [], color: "#E9EAEC" }
    ],
  },
  {
    name: "Cities & Knights",
    dice: [
      { numberValue: 1, faces: 6, customFaces: [], color: "#E9EAEC", name: "Regular" },
      { numberValue: 2, faces: 6, customFaces: [], color: "#E32227", name: "Event" },
      { numberValue: 3, faces: 6, customFaces: ["Barbarian:bg:#1A1A1A", "Barbarian:bg:#1A1A1A", "Barbarian:bg:#1A1A1A", "Blue:bg:#0056D2", "Yellow:bg:#FFD700", "Green:bg:#2E7D32"], color: "#C0C0C0", name: "Progress" }
    ],
  },
  {
    name: "That's Pretty Clever",
    dice: [
      { numberValue: 1, faces: 6, customFaces: [], color: "#E9EAEC", name: "White" },
      { numberValue: 2, faces: 6, customFaces: [], color: "#0056D2", name: "Blue" },
      { numberValue: 3, faces: 6, customFaces: [], color: "#FFD700", name: "Yellow" },
      { numberValue: 4, faces: 6, customFaces: [], color: "#2E7D32", name: "Green" },
      { numberValue: 5, faces: 6, customFaces: [], color: "#F28500", name: "Orange" },
      { numberValue: 6, faces: 6, customFaces: [], color: "#B24BF3", name: "Purple" }
    ],
  },
  {
    name: "Dungeons & Dragons",
    dice: [
      { numberValue: 1, faces: 20, customFaces: [], color: "#1A1A1A", name: "d20" },
      { numberValue: 2, faces: 12, customFaces: [], color: "#1A1A1A", name: "d12" },
      { numberValue: 3, faces: 10, customFaces: ["00", "10", "20", "30", "40", "50", "60", "70", "80", "90"], color: "#1A1A1A", name: "d10 (tens)" },
      { numberValue: 4, faces: 10, customFaces: [], color: "#1A1A1A", name: "d10" },
      { numberValue: 5, faces: 8, customFaces: [], color: "#1A1A1A", name: "d8" },
      { numberValue: 6, faces: 6, customFaces: [], color: "#1A1A1A", name: "d6" },
      { numberValue: 7, faces: 4, customFaces: [], color: "#1A1A1A", name: "d4" }
    ],
  },
  {
    name: "Risk",
    dice: [
      { numberValue: 1, faces: 6, customFaces: [], color: "#E32227", name: "Attacker 1" },
      { numberValue: 2, faces: 6, customFaces: [], color: "#E32227", name: "Attacker 2" },
      { numberValue: 3, faces: 6, customFaces: [], color: "#E32227", name: "Attacker 3" },
      { numberValue: 4, faces: 6, customFaces: [], color: "#E9EAEC", name: "Defender 1" },
      { numberValue: 5, faces: 6, customFaces: [], color: "#E9EAEC", name: "Defender 2" }
    ],
  },
  {
    name: "Catan",
    dice: [
      { numberValue: 1, faces: 6, customFaces: [], color: "#E32227", name: "Red" },
      { numberValue: 2, faces: 6, customFaces: [], color: "#FFD700", name: "Yellow" }
    ],
  },
  {
    name: "King of Tokyo",
    dice: [
      { numberValue: 1, faces: 6, customFaces: ["1", "2", "3", ":icon:Heart:bg:#2E7D32", ":icon:Zap:bg:#0056D2", ":icon:Skull:bg:#D32F2F"], color: "#1A1A1A", name: "Tokyo Die 1" },
      { numberValue: 1, faces: 6, customFaces: ["1", "2", "3", ":icon:Heart:bg:#2E7D32", ":icon:Zap:bg:#0056D2", ":icon:Skull:bg:#D32F2F"], color: "#1A1A1A", name: "Tokyo Die 2" },
      { numberValue: 1, faces: 6, customFaces: ["1", "2", "3", ":icon:Heart:bg:#2E7D32", ":icon:Zap:bg:#0056D2", ":icon:Skull:bg:#D32F2F"], color: "#1A1A1A", name: "Tokyo Die 3" },
      { numberValue: 1, faces: 6, customFaces: ["1", "2", "3", ":icon:Heart:bg:#2E7D32", ":icon:Zap:bg:#0056D2", ":icon:Skull:bg:#D32F2F"], color: "#1A1A1A", name: "Tokyo Die 4" },
      { numberValue: 1, faces: 6, customFaces: ["1", "2", "3", ":icon:Heart:bg:#2E7D32", ":icon:Zap:bg:#0056D2", ":icon:Skull:bg:#D32F2F"], color: "#1A1A1A", name: "Tokyo Die 5" },
      { numberValue: 1, faces: 6, customFaces: ["1", "2", "3", ":icon:Heart:bg:#2E7D32", ":icon:Zap:bg:#0056D2", ":icon:Skull:bg:#D32F2F"], color: "#1A1A1A", name: "Tokyo Die 6" }
    ],
  },
  {
    name: "Zombie Dice",
    dice: [
      { numberValue: 1, faces: 6, customFaces: [":icon:Star:bg:#2E7D32", ":icon:Star:bg:#2E7D32", ":icon:Star:bg:#2E7D32", ":icon:Zap:bg:#FFD700", ":icon:Zap:bg:#FFD700", ":icon:Skull:bg:#D32F2F"], color: "#2E7D32", name: "Green Die" },
      { numberValue: 1, faces: 6, customFaces: [":icon:Star:bg:#2E7D32", ":icon:Star:bg:#2E7D32", ":icon:Zap:bg:#FFD700", ":icon:Zap:bg:#FFD700", ":icon:Skull:bg:#D32F2F", ":icon:Skull:bg:#D32F2F"], color: "#FFD700", name: "Yellow Die" },
      { numberValue: 1, faces: 6, customFaces: [":icon:Star:bg:#2E7D32", ":icon:Zap:bg:#FFD700", ":icon:Zap:bg:#FFD700", ":icon:Skull:bg:#D32F2F", ":icon:Skull:bg:#D32F2F", ":icon:Skull:bg:#D32F2F"], color: "#D32F2F", name: "Red Die" }
    ],
  },
  {
    name: "Fate / Fudge",
    dice: [
      { numberValue: 1, faces: 6, customFaces: ["+:bg:#2E7D32", "+:bg:#2E7D32", "-:bg:#D32F2F", "-:bg:#D32F2F", " :bg:transparent", " :bg:transparent"], color: "#0056D2", name: "Fate 1" },
      { numberValue: 1, faces: 6, customFaces: ["+:bg:#2E7D32", "+:bg:#2E7D32", "-:bg:#D32F2F", "-:bg:#D32F2F", " :bg:transparent", " :bg:transparent"], color: "#0056D2", name: "Fate 2" },
      { numberValue: 1, faces: 6, customFaces: ["+:bg:#2E7D32", "+:bg:#2E7D32", "-:bg:#D32F2F", "-:bg:#D32F2F", " :bg:transparent", " :bg:transparent"], color: "#0056D2", name: "Fate 3" },
      { numberValue: 1, faces: 6, customFaces: ["+:bg:#2E7D32", "+:bg:#2E7D32", "-:bg:#D32F2F", "-:bg:#D32F2F", " :bg:transparent", " :bg:transparent"], color: "#0056D2", name: "Fate 4" }
    ],
  },
  {
    name: "Tenzi",
    dice: Array.from({ length: 10 }).map((_, i) => ({
      numberValue: i + 1, faces: 6, customFaces: [], color: "#B24BF3", name: `Tenzi ${i + 1}`
    }))
  }
];
