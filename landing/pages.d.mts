export interface LandingPage {
  slug: string;
  title: string;
  description: string;
  heading: string;
  start: {
    preset?: string;
    name?: string;
    rpg?: boolean;
    dice?: Record<string, unknown>[];
  };
  body: string;
}
export declare const landingPages: LandingPage[];
