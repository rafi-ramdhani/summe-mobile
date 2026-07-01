import type { ZxcvbnFactory } from "@zxcvbn-ts/core";

let factory: ZxcvbnFactory | null = null;

export async function getPasswordScore(password: string): Promise<number> {
  if (!password) return 0;
  if (!factory) {
    const [{ ZxcvbnFactory }, common] = await Promise.all([
      import("@zxcvbn-ts/core"),
      import("@zxcvbn-ts/language-common"),
    ]);
    factory = new ZxcvbnFactory({
      dictionary: { ...common.dictionary },
      graphs: common.adjacencyGraphs,
    });
  }
  return factory.check(password).score;
}

export const MIN_PASSWORD_SCORE = 3;
