import { executeTatModule as executeTatModuleInternal } from "./executeModule.js";
export {
  tokenizeTat,
  parseTatToAst,
  printTatAst,
  parseTat,
  executeTat,
  executeTatSource,
  type TatParseResult,
  type TatExecuteResult,
  type Token,
  type ProgramNode,
  type ExecuteProgramResult,
  ParseError,
  tokenize,
  parse,
  printAST,
} from "./executeSource.js";

export function executeTatModule(entryPath: string): ReturnType<typeof executeTatModuleInternal> {
  return executeTatModuleInternal(entryPath);
}
