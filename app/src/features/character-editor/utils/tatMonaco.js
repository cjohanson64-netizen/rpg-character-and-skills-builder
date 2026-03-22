export const TAT_LANGUAGE_ID = "tat";
export const TAT_MARKER_OWNER = "tat-validation";

let isTatLanguageRegistered = false;

export function configureTatMonaco(monaco) {
  if (isTatLanguageRegistered) {
    return;
  }

  isTatLanguageRegistered = true;

  monaco.languages.register({ id: TAT_LANGUAGE_ID });

  monaco.languages.setMonarchTokensProvider(TAT_LANGUAGE_ID, {
    defaultToken: "",
    tokenPostfix: ".tat",
    keywords: ["export", "import"],
    tokenizer: {
      root: [
        [/\/\/.*$/, "comment"],
        [/#.*$/, "comment"],
        [/@[A-Za-z_][\w.]*/, "keyword"],
        [/[A-Za-z_][\w$]*/, {
          cases: {
            "@keywords": "keyword",
            "@default": "identifier",
          },
        }],
        [/"([^"\\]|\\.)*$/, "string.invalid"],
        [/"/, "string", "@string"],
        [/\d+(\.\d+)?/, "number"],
        [/:=|->|<>|:/, "operator"],
        [/[{}[\]()]/, "@brackets"],
        [/[,:]/, "delimiter"],
      ],
      string: [
        [/[^\\"]+/, "string"],
        [/\\./, "string.escape"],
        [/"/, "string", "@pop"],
      ],
    },
  });

  monaco.languages.setLanguageConfiguration(TAT_LANGUAGE_ID, {
    comments: {
      lineComment: "//",
    },
    brackets: [
      ["{", "}"],
      ["[", "]"],
      ["(", ")"],
    ],
    autoClosingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
    ],
    surroundingPairs: [
      { open: "{", close: "}" },
      { open: "[", close: "]" },
      { open: "(", close: ")" },
      { open: '"', close: '"' },
    ],
  });

  monaco.editor.defineTheme("tat-dark", {
    base: "vs-dark",
    inherit: true,
    rules: [
      { token: "keyword", foreground: "7dd3fc", fontStyle: "bold" },
      { token: "operator", foreground: "f59e0b" },
      { token: "string", foreground: "86efac" },
      { token: "number", foreground: "fca5a5" },
      { token: "comment", foreground: "64748b", fontStyle: "italic" },
      { token: "identifier", foreground: "e2e8f0" },
    ],
    colors: {
      "editor.background": "#020817",
      "editor.foreground": "#e2e8f0",
      "editorLineNumber.foreground": "#475569",
      "editorLineNumber.activeForeground": "#cbd5e1",
      "editor.selectionBackground": "#1d4ed833",
      "editor.inactiveSelectionBackground": "#1e293b",
      "editorCursor.foreground": "#7dd3fc",
    },
  });
}
