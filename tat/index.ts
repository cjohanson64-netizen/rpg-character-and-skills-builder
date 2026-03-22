import { printAST } from "./ast/printAST.js";
import { tokenize, type Token } from "./lexer/tokenize.js";
import { parse, ParseError } from "./parser/parse.js";
import type { ProgramNode } from "./ast/nodeTypes.js";

export interface TatParseResult {
  source: string;
  tokens: Token[];
  ast: ProgramNode;
  printedAst: string;
}

export function tokenizeTat(source: string): Token[] {
  return tokenize(source);
}

export function parseTatToAst(source: string): ProgramNode {
  return parse(tokenizeTat(source));
}

export function printTatAst(source: string): string {
  return printAST(parseTatToAst(source));
}

export function parseTat(source: string): TatParseResult {
  const tokens = tokenizeTat(source);
  const ast = parse(tokens);
  const printedAst = printAST(ast);

  return {
    source,
    tokens,
    ast,
    printedAst,
  };
}

export type { Token, ProgramNode };
export { ParseError, tokenize, parse, printAST };

// runtime exports
export { executeTat, executeTatSource } from "./runtime/index.js";
export { executeTatModule } from "./runtime/executeModule.js";
export {
  addBranch,
  removeBranch,
  addProgress,
  setNodeState,
  removeNodeState,
  setNodeMeta,
  removeNodeMeta,
  cloneGraph,
  graphToDebugObject,
  hydrateGraph,
} from "./runtime/graph.js";
