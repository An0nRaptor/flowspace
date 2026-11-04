export const LabelColorEnum = {
  GRAY: "GRAY",
  RED: "RED",
  ORANGE: "ORANGE",
  YELLOW: "YELLOW",
  GREEN: "GREEN",
  BLUE: "BLUE",
  PURPLE: "PURPLE",
  PINK: "PINK",
} as const;

export type LabelColorEnumType = keyof typeof LabelColorEnum;
