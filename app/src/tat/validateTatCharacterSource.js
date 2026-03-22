import { executeTatSource, graphToDebugObject } from "@tryangletree/tat";

function buildValidationResult({
  ok,
  errorType = null,
  message,
  snapshot = null,
  availableCharacterNames = [],
  marker = null,
}) {
  return {
    ok,
    errorType,
    message,
    snapshot,
    availableCharacterNames,
    marker,
  };
}

function extractMarker(message) {
  const match = message.match(/(?:at|line)\s+(\d+):(\d+)/i) ?? message.match(/(\d+):(\d+)/);

  if (!match) {
    return null;
  }

  const lineNumber = Number(match[1]);
  const column = Number(match[2]);

  if (Number.isNaN(lineNumber) || Number.isNaN(column)) {
    return null;
  }

  return {
    startLineNumber: lineNumber,
    startColumn: column,
    endLineNumber: lineNumber,
    endColumn: column + 1,
  };
}

function classifyTatError(error, message) {
  if (error instanceof Error && error.name === "ParseError") {
    return "parse_error";
  }

  if (message.startsWith("Validation failed")) {
    return "validation_error";
  }

  if (/unexpected|expected/i.test(message)) {
    return "parse_error";
  }

  return "runtime_error";
}

export function validateTatCharacterSource({ source, characterName }) {
  const normalizedSource = source.trim();
  const normalizedCharacterName = characterName.trim();

  if (!normalizedSource) {
    return buildValidationResult({
      ok: false,
      errorType: "empty_source",
      message: "Enter TAT source to begin validation.",
    });
  }

  if (!normalizedCharacterName) {
    return buildValidationResult({
      ok: false,
      errorType: "missing_character_name",
      message: "Enter the character export name to validate and create.",
    });
  }

  try {
    const result = executeTatSource(source);
    const availableCharacterNames = Array.from(result.execution.state.graphs.keys());
    const graph = result.execution.state.graphs.get(normalizedCharacterName);

    if (!graph) {
      return buildValidationResult({
        ok: false,
        errorType: "missing_character_export",
        message:
          availableCharacterNames.length > 0
            ? `Character export "${normalizedCharacterName}" was not found. Available characters: ${availableCharacterNames.join(", ")}`
            : `Character export "${normalizedCharacterName}" was not found. The source executed, but it did not produce any character exports.`,
        availableCharacterNames,
      });
    }

    const snapshot = graphToDebugObject(graph);

    if (!snapshot || !Array.isArray(snapshot.nodes) || !Array.isArray(snapshot.edges)) {
      return buildValidationResult({
        ok: false,
        errorType: "invalid_character_result",
        message: `Character export "${normalizedCharacterName}" did not produce a usable character result.`,
        availableCharacterNames,
      });
    }

    return buildValidationResult({
      ok: true,
      message: `Character "${normalizedCharacterName}" is valid and ready to create.`,
      snapshot,
      availableCharacterNames,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    return buildValidationResult({
      ok: false,
      errorType: classifyTatError(error, message),
      message,
      marker: extractMarker(message),
    });
  }
}
