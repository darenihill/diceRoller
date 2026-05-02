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
      { numberValue: 1, faces: 6, customFaces: [], color: "#E9EAEC" },
      { numberValue: 2, faces: 6, customFaces: [], color: "#E32227" },
      { numberValue: 3, faces: 6, customFaces: ["Barbarian", "Barbarian", "Barbarian", "Blue", "Yellow", "Green"], color: "#C0C0C0" }
    ],
  },
  {
    name: "That's Pretty Clever",
    dice: [
      { numberValue: 1, faces: 6, customFaces: [], color: "#E9EAEC" },
      { numberValue: 2, faces: 6, customFaces: [], color: "#0000FF" },
      { numberValue: 3, faces: 6, customFaces: [], color: "#FBFB3C" },
      { numberValue: 4, faces: 6, customFaces: [], color: "#228B22" },
      { numberValue: 5, faces: 6, customFaces: [], color: "#F28500" },
      { numberValue: 6, faces: 6, customFaces: [], color: "#B24BF3" }
    ],
  },
  {
    name: "Dungeons & Dragons",
    dice: [
      { numberValue: 1, faces: 20, customFaces: [], color: "#000000" },
      { numberValue: 2, faces: 12, customFaces: [], color: "#000000" },
      { numberValue: 3, faces: 10, customFaces: ["00", "10", "20", "30", "40", "50", "60", "70", "80", "90"], color: "#000000" },
      { numberValue: 4, faces: 10, customFaces: [], color: "#000000" },
      { numberValue: 5, faces: 8, customFaces: [], color: "#000000" },
      { numberValue: 6, faces: 6, customFaces: [], color: "#000000" },
      { numberValue: 7, faces: 4, customFaces: [], color: "#000000" }
    ],
  },
  {
    name: "Risk",
    dice: [
      { numberValue: 1, faces: 6, customFaces: [], color: "#E32227" },
      { numberValue: 2, faces: 6, customFaces: [], color: "#E32227" },
      { numberValue: 3, faces: 6, customFaces: [], color: "#E32227" },
      { numberValue: 4, faces: 6, customFaces: [], color: "#E9EAEC" },
      { numberValue: 5, faces: 6, customFaces: [], color: "#E9EAEC" }
    ],
  },
  {
    name: "Catan",
    dice: [
      { numberValue: 1, faces: 6, customFaces: [], color: "#E32227" },
      { numberValue: 2, faces: 6, customFaces: [], color: "#FBFB3C" }
    ],
  },
  {
    name: "King of Tokyo",
    dice: [
      { numberValue: 1, faces: 6, customFaces: ["1", "2", "3", ":icon:Heart", ":icon:Zap", ":icon:Skull"], color: "#000000" },
      { numberValue: 1, faces: 6, customFaces: ["1", "2", "3", ":icon:Heart", ":icon:Zap", ":icon:Skull"], color: "#000000" },
      { numberValue: 1, faces: 6, customFaces: ["1", "2", "3", ":icon:Heart", ":icon:Zap", ":icon:Skull"], color: "#000000" },
      { numberValue: 1, faces: 6, customFaces: ["1", "2", "3", ":icon:Heart", ":icon:Zap", ":icon:Skull"], color: "#000000" },
      { numberValue: 1, faces: 6, customFaces: ["1", "2", "3", ":icon:Heart", ":icon:Zap", ":icon:Skull"], color: "#000000" },
      { numberValue: 1, faces: 6, customFaces: ["1", "2", "3", ":icon:Heart", ":icon:Zap", ":icon:Skull"], color: "#000000" }
    ],
  },
  {
    name: "Zombie Dice",
    dice: [
      { numberValue: 1, faces: 6, customFaces: [":icon:Star", ":icon:Star", ":icon:Star", ":icon:Zap", ":icon:Zap", ":icon:Skull"], color: "#228B22" },
      { numberValue: 1, faces: 6, customFaces: [":icon:Star", ":icon:Star", ":icon:Zap", ":icon:Zap", ":icon:Skull", ":icon:Skull"], color: "#FBFB3C" },
      { numberValue: 1, faces: 6, customFaces: [":icon:Star", ":icon:Zap", ":icon:Zap", ":icon:Skull", ":icon:Skull", ":icon:Skull"], color: "#E32227" }
    ],
  },
  {
    name: "Fate / Fudge",
    dice: [
      { numberValue: 1, faces: 6, customFaces: ["+", "+", "-", "-", " ", " "], color: "#0000FF" },
      { numberValue: 1, faces: 6, customFaces: ["+", "+", "-", "-", " ", " "], color: "#0000FF" },
      { numberValue: 1, faces: 6, customFaces: ["+", "+", "-", "-", " ", " "], color: "#0000FF" },
      { numberValue: 1, faces: 6, customFaces: ["+", "+", "-", "-", " ", " "], color: "#0000FF" }
    ],
  },
  {
    name: "Tenzi",
    dice: Array.from({ length: 10 }).map((_, i) => ({
      numberValue: i + 1, faces: 6, customFaces: [], color: "#B24BF3"
    }))
  }
];
