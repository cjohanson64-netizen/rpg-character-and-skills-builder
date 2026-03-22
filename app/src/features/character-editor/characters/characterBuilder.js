const CORE_STAT_FIELDS = ["hp", "atk", "def", "int", "res", "spd"];
const CHARACTER_TYPES = ["hero", "enemy", "npc"];

function slugify(value, fallback = "character") {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function toTatString(value) {
  return JSON.stringify(value);
}

function coerceNumber(value, fallback = 0) {
  const numericValue =
    typeof value === "number" ? value : Number.parseInt(String(value ?? ""), 10);

  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function escapeTatIdentifier(value, fallback) {
  const candidate = String(value ?? "").trim();

  if (/^[A-Za-z_$][\w$]*$/.test(candidate)) {
    return candidate;
  }

  return fallback;
}

function parseCharacterExportName(source, fallback = "character") {
  if (typeof source !== "string" || !source.trim()) {
    return fallback;
  }

  const exportMatch = source.match(/^\s*([A-Za-z_$][\w$]*)\s*:=\s*@seed/m);
  return exportMatch?.[1] ?? fallback;
}

function parseStringLiteral(rawValue, fallback = "") {
  if (typeof rawValue !== "string") {
    return fallback;
  }

  try {
    return JSON.parse(rawValue);
  } catch {
    return fallback;
  }
}

function extractRootFields(source) {
  if (typeof source !== "string" || !source.trim()) {
    return {};
  }

  const rootMatch = source.match(
    /^\s*[A-Za-z_$][\w$]*\s*=\s*<\{\s*id:\s*("([^"\\]|\\.)*")\s*,\s*type:\s*("([^"\\]|\\.)*")\s*,\s*name:\s*("([^"\\]|\\.)*")\s*\}>\s*$/m,
  );

  if (!rootMatch) {
    return {};
  }

  return {
    rootId: parseStringLiteral(rootMatch[1]),
    type: parseStringLiteral(rootMatch[3], "hero"),
    displayName: parseStringLiteral(rootMatch[5]),
  };
}

function extractStateValue(source, key, fallback) {
  if (typeof source !== "string" || !source.trim()) {
    return fallback;
  }

  const stateMatch = source.match(
    new RegExp(`@graft\\.state\\([^\\n]*"${key}"\\s*,\\s*(-?\\d+(?:\\.\\d+)?)\\)`),
  );

  if (!stateMatch) {
    return fallback;
  }

  return coerceNumber(stateMatch[1], fallback);
}

function extractMetaStringValue(source, key, fallback = "") {
  if (typeof source !== "string" || !source.trim()) {
    return fallback;
  }

  const metaMatch = source.match(
    new RegExp(`@graft\\.meta\\([^\\n]*"${key}"\\s*,\\s*("([^"\\\\]|\\\\.)*")\\)`),
  );

  if (!metaMatch) {
    return fallback;
  }

  return parseStringLiteral(metaMatch[1], fallback);
}

export function createCharacterBuilderForm(overrides = {}) {
  return {
    builderKind: "character",
    instanceName: "",
    characterExportName: "",
    rootId: "",
    displayName: "",
    type: "hero",
    hp: 10,
    atk: 1,
    def: 1,
    int: 1,
    res: 1,
    spd: 1,
    description: "",
    biography: "",
    notes: "",
    ...overrides,
  };
}

export function normalizeCharacterBuilderForm(form) {
  const nextForm = createCharacterBuilderForm(form);
  const normalizedInstanceName = String(nextForm.instanceName ?? "").trim();
  const normalizedRootId =
    String(nextForm.rootId ?? "").trim() || slugify(normalizedInstanceName, "root");
  const normalizedDisplayName =
    String(nextForm.displayName ?? "").trim() || normalizedInstanceName;
  const normalizedCharacterExportName =
    String(nextForm.characterExportName ?? "").trim() ||
    `${slugify(normalizedInstanceName, "character")}Character`;
  const normalizedType = CHARACTER_TYPES.includes(String(nextForm.type ?? "").trim())
    ? String(nextForm.type).trim()
    : CHARACTER_TYPES[0];

  return {
    ...nextForm,
    builderKind: "character",
    instanceName: normalizedInstanceName,
    characterExportName: normalizedCharacterExportName,
    rootId: normalizedRootId,
    displayName: normalizedDisplayName,
    type: normalizedType,
    hp: coerceNumber(nextForm.hp, 10),
    atk: coerceNumber(nextForm.atk, 1),
    def: coerceNumber(nextForm.def, 1),
    int: coerceNumber(nextForm.int, 1),
    res: coerceNumber(nextForm.res, 1),
    spd: coerceNumber(nextForm.spd, 1),
    description: String(nextForm.description ?? "").trim(),
    biography: String(nextForm.biography ?? "").trim(),
    notes: String(nextForm.notes ?? "").trim(),
  };
}

export function createCharacterBuilderFormFromInstance(instance) {
  const snapshot = instance?.snapshot ?? null;
  const rootNode =
    snapshot?.nodes?.find((node) => node.id === snapshot?.root) ??
    snapshot?.nodes?.[0] ??
    null;
  const rootValue = rootNode?.value ?? {};
  const rootState = rootNode?.state ?? {};
  const rootMeta = rootNode?.meta ?? {};

  return normalizeCharacterBuilderForm(
    createCharacterBuilderForm({
      instanceName: instance?.name ?? "",
      characterExportName: parseCharacterExportName(
        instance?.source,
        instance?.sourceCharacterName ?? snapshot?.characterName ?? "character",
      ),
      rootId: rootValue.id ?? snapshot?.root ?? rootNode?.id ?? "",
      displayName: rootValue.name ?? instance?.name ?? "",
      type: rootValue.type ?? "hero",
      hp: rootState.hp ?? 10,
      atk: rootState.atk ?? 1,
      def: rootState.def ?? 1,
      int: rootState.int ?? 1,
      res: rootState.res ?? 1,
      spd: rootState.spd ?? 1,
      description: rootMeta.description ?? "",
      biography: rootMeta.biography ?? "",
      notes: rootMeta.notes ?? "",
    }),
  );
}

export function createCharacterBuilderFormFromTemplate(template, overrides = {}) {
  const source = template?.source ?? "";
  const rootFields = extractRootFields(source);

  return normalizeCharacterBuilderForm(
    createCharacterBuilderForm({
      characterExportName: parseCharacterExportName(
        source,
        template?.characterName ?? "character",
      ),
      rootId: rootFields.rootId ?? "",
      displayName: rootFields.displayName ?? "",
      type: rootFields.type ?? "hero",
      hp: extractStateValue(source, "hp", 10),
      atk: extractStateValue(source, "atk", 1),
      def: extractStateValue(source, "def", 1),
      int: extractStateValue(source, "int", 1),
      res: extractStateValue(source, "res", 1),
      spd: extractStateValue(source, "spd", 1),
      description: extractMetaStringValue(source, "description", ""),
      biography: extractMetaStringValue(source, "biography", ""),
      notes: extractMetaStringValue(source, "notes", ""),
      ...overrides,
    }),
  );
}

export function validateCharacterBuilderForm(form) {
  const normalizedForm = normalizeCharacterBuilderForm(form);

  if (!normalizedForm.instanceName) {
    return {
      ok: false,
      message: "Enter a character name to create a new character instance.",
    };
  }

  if (!normalizedForm.rootId) {
    return {
      ok: false,
      message: "Enter a root id for the character root node.",
    };
  }

  if (!normalizedForm.displayName) {
    return {
      ok: false,
      message: "Enter a display name for the root node.",
    };
  }

  if (!normalizedForm.type) {
    return {
      ok: false,
      message: "Choose a character type.",
    };
  }

  return {
    ok: true,
    message: "Character form is ready to generate a character.",
  };
}

function buildSeedBlock(rootIdentifier) {
  return [
    "@seed:",
    `  nodes: [${rootIdentifier}]`,
    "  edges: []",
    "  state: {}",
    "  meta: {}",
    `  root: ${rootIdentifier}`,
    "",
  ];
}

export function createCharacter(form) {
  const normalizedForm = normalizeCharacterBuilderForm(form);
  const rootIdentifier = escapeTatIdentifier(
    normalizedForm.rootId.replace(/[^A-Za-z0-9_$]/g, "_"),
    "rootNode",
  );
  const rootLine = `${rootIdentifier} = <{ id: ${toTatString(
    normalizedForm.rootId,
  )}, type: ${toTatString(normalizedForm.type)}, name: ${toTatString(
    normalizedForm.displayName,
  )} }>`;
  const stateLines = CORE_STAT_FIELDS.map(
    (statKey) =>
      `  -> @graft.state(${rootIdentifier}, ${toTatString(statKey)}, ${normalizedForm[statKey]})`,
  );
  const metaEntries = [
    ["graphKind", "character"],
    ["interactionRole", "actor"],
    ["description", normalizedForm.description],
    ["biography", normalizedForm.biography],
    ["notes", normalizedForm.notes],
  ].filter(([, value]) => value !== "");
  const metaLines = metaEntries.map(
    ([metaKey, metaValue]) =>
      `  -> @graft.meta(${rootIdentifier}, ${toTatString(metaKey)}, ${toTatString(
        metaValue,
      )})`,
  );

  return [
    rootLine,
    "",
    ...buildSeedBlock(rootIdentifier),
    `${normalizedForm.characterExportName} := @seed`,
    ...stateLines,
    ...metaLines,
    '  <> @project(format: "graph")',
    "",
    `export { ${rootIdentifier}, ${normalizedForm.characterExportName} }`,
    "",
  ].join("\n");
}

export function buildTatCharacterSourceFromForm(form) {
  return createCharacter(normalizeCharacterBuilderForm(form));
}
