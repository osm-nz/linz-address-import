declare global {
  interface ObjectConstructor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fromEntries<K extends keyof any, V>(o: [K, V][]): Record<K, V>;
  }
}

export {};
