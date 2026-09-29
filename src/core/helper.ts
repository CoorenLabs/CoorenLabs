const languageNames = new Intl.DisplayNames(["en"], { type: "language" });

export function languageName(code: string): string {
  try {
    return languageNames.of(code.replace(/_/g, "-")) ?? code;
  } catch {
    return code;
  }
}
