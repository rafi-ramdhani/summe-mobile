import { ZxcvbnFactory } from "@zxcvbn-ts/core";
import { adjacencyGraphs, dictionary } from "@zxcvbn-ts/language-common";

// summe-web lazy-loads zxcvbn via dynamic import() for web bundle-splitting.
// On React Native/Metro the whole JS bundle loads at startup, so there is no
// splitting benefit, and dynamic import() fails on Hermes ("Requiring unknown
// module …") when the strength meter runs on each keystroke. Import statically.

let factory: ZxcvbnFactory | null = null;

export async function getPasswordScore(password: string): Promise<number> {
  if (!password) return 0;
  if (!factory) {
    factory = new ZxcvbnFactory({
      dictionary: { ...dictionary },
      graphs: adjacencyGraphs,
    });
  }
  return factory.check(password).score;
}

export const MIN_PASSWORD_SCORE = 3;
