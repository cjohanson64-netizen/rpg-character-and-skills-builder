const CORE_STAT_FIELDS = ["hp", "atk", "def", "int", "res", "spd"];

export const LOCKED_CHARACTER_TEMPLATE_SCHEMA = {
  templateId: "character",
  editableFields: [
    { id: "root.id", type: "string" },
    { id: "root.type", type: "string" },
    { id: "root.name", type: "string" },
    { id: "hp", type: "number" },
    { id: "atk", type: "number" },
    { id: "def", type: "number" },
    { id: "int", type: "number" },
    { id: "res", type: "number" },
    { id: "spd", type: "number" },
    { id: "description", type: "string" },
  ],
};

function toTatString(value) {
  return JSON.stringify(value);
}

function coerceNumber(value, fallback = 0) {
  const numericValue =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function escapeTatIdentifier(value, fallback = "root") {
  const candidate = String(value ?? "").trim();

  if (/^[A-Za-z_$][\w$]*$/.test(candidate)) {
    return candidate;
  }

  return fallback;
}

function createDefaultLockedCharacterValues(overrides = {}) {
  return {
    rootId: "root",
    rootType: "hero",
    rootName: "New Character",
    hp: 10,
    atk: 2,
    def: 2,
    int: 2,
    res: 2,
    spd: 2,
    description: "",
    characterExportName: "blankCharacter",
    ...overrides,
  };
}

function parseStringLiteral(rawValue) {
  if (typeof rawValue !== "string") {
    return "";
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return rawValue.replace(/^"(.*)"$/s, "$1");
  }
}

function extractRootFields(source) {
  const rootMatch = source.match(
    /^\s*[A-Za-z_$][\w$]*\s*=\s*<\{\s*id:\s*("([^"\\]|\\.)*")\s*,\s*type:\s*("([^"\\]|\\.)*")\s*,\s*name:\s*("([^"\\]|\\.)*")\s*\}>\s*$/m,
  );

  if (!rootMatch) {
    return {};
  }

  return {
    rootId: parseStringLiteral(rootMatch[1]),
    rootType: parseStringLiteral(rootMatch[3]),
    rootName: parseStringLiteral(rootMatch[5]),
  };
}

function extractStateValue(source, key, fallback) {
  const stateMatch = source.match(
    new RegExp(`@graft\\.state\\([^\\n]*"${key}"\\s*,\\s*([^\\)]+)\\)`),
  );

  if (!stateMatch) {
    return fallback;
  }

  return coerceNumber(stateMatch[1].trim(), fallback);
}

function extractMetaStringValue(source, key, fallback) {
  const metaMatch = source.match(
    new RegExp(`@graft\\.meta\\([^\\n]*"${key}"\\s*,\\s*("([^"\\\\]|\\\\.)*")\\)`),
  );

  if (!metaMatch) {
    return fallback;
  }

  return parseStringLiteral(metaMatch[1]);
}

function extractCharacterExportName(source, fallback) {
  const exportMatch = source.match(/^\s*([A-Za-z_$][\w$]*)\s*:=\s*@seed/m);
  return exportMatch ? exportMatch[1] : fallback;
}

export function parseLockedCharacterValuesFromTemplate(template) {
  const source = typeof template?.source === "string" ? template.source : "";
  const defaults = createDefaultLockedCharacterValues({
    characterExportName:
      typeof template?.characterName === "string" && template.characterName.trim()
        ? template.characterName.trim()
        : "character",
  });

  const rootFields = extractRootFields(source);
  const statValues = CORE_STAT_FIELDS.reduce(
    (nextValues, statKey) => ({
      ...nextValues,
      [statKey]: extractStateValue(source, statKey, defaults[statKey]),
    }),
    {},
  );

  return createDefaultLockedCharacterValues({
    ...defaults,
    ...rootFields,
    ...statValues,
    description: extractMetaStringValue(source, "description", defaults.description),
    characterExportName: extractCharacterExportName(
      source,
      defaults.characterExportName,
    ),
  });
}

export function normalizeLockedCharacterValues(values) {
  const nextValues = createDefaultLockedCharacterValues(values);

  return {
    rootId: String(nextValues.rootId ?? "").trim(),
    rootType: String(nextValues.rootType ?? "").trim(),
    rootName: String(nextValues.rootName ?? "").trim(),
    hp: coerceNumber(nextValues.hp, 10),
    atk: coerceNumber(nextValues.atk, 2),
    def: coerceNumber(nextValues.def, 2),
    int: coerceNumber(nextValues.int, 2),
    res: coerceNumber(nextValues.res, 2),
    spd: coerceNumber(nextValues.spd, 2),
    description: String(nextValues.description ?? "").trim(),
    characterExportName:
      String(nextValues.characterExportName ?? "").trim() || "character",
  };
}

export function validateLockedCharacterValues(values) {
  const normalizedValues = normalizeLockedCharacterValues(values);

  if (!normalizedValues.rootId) {
    return { ok: false, message: "Enter a root id for the character." };
  }

  if (!normalizedValues.rootType) {
    return { ok: false, message: "Enter a root type for the character." };
  }

  if (!normalizedValues.rootName) {
    return { ok: false, message: "Enter a root name for the character." };
  }

  return { ok: true, message: "Character values are ready to generate TAT." };
}

export function buildLockedCharacterTatSource(values) {
  const normalizedValues = normalizeLockedCharacterValues(values);
  const rootIdentifier = escapeTatIdentifier(
    normalizedValues.rootId.replace(/[^A-Za-z0-9_$]/g, "_"),
    "root",
  );

  return [
    `${rootIdentifier} = <{ id: ${toTatString(normalizedValues.rootId)}, type: ${toTatString(normalizedValues.rootType)}, name: ${toTatString(normalizedValues.rootName)} }>`,
    "",
    "@seed:",
    `  nodes: [${rootIdentifier}]`,
    "  edges: []",
    "  state: {}",
    "  meta: {}",
    `  root: ${rootIdentifier}`,
    "",
    `${normalizedValues.characterExportName} := @seed`,
    `  -> @graft.state(${rootIdentifier}, "hp", ${normalizedValues.hp})`,
    `  -> @graft.state(${rootIdentifier}, "atk", ${normalizedValues.atk})`,
    `  -> @graft.state(${rootIdentifier}, "def", ${normalizedValues.def})`,
    `  -> @graft.state(${rootIdentifier}, "int", ${normalizedValues.int})`,
    `  -> @graft.state(${rootIdentifier}, "res", ${normalizedValues.res})`,
    `  -> @graft.state(${rootIdentifier}, "spd", ${normalizedValues.spd})`,
    `  -> @graft.meta(${rootIdentifier}, "description", ${toTatString(normalizedValues.description)})`,
    '  <> @project(format: "graph")',
    "",
    `export { ${rootIdentifier}, ${normalizedValues.characterExportName} }`,
    "",
  ].join("\n");
}
