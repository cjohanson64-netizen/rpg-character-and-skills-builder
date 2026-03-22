import { setNodeState, cloneGraph, hydrateGraph } from "@tryangletree/tat/browser";
type UseTatGraphOptions = {
    tatPath?: string;
    tatSource?: string;
    graphName: string;
};
type TatGraph = Parameters<typeof cloneGraph>[0];
type TatGraphValue = Parameters<typeof setNodeState>[3];
type TatGraphSnapshot = Parameters<typeof hydrateGraph>[0];
export declare function useTatGraph({ tatPath, tatSource, graphName, }: UseTatGraphOptions): {
    replayTo: (historyIndex: number) => void;
    addBranch: (s: string, r: string, o: string) => void;
    setNodeState: (id: string, key: string, value: TatGraphValue) => void;
    setNodeMeta: (id: string, key: string, value: TatGraphValue) => void;
    graph: import("@tryangletree/tat/browser").Graph | null;
    graphView: import("@tryangletree/tat/browser").GraphSnapshot | null;
    isLoading: boolean;
    error: Error | null;
    reload: () => Promise<void>;
    reset: () => void;
    mutate: (fn: (graph: TatGraph) => void) => void;
    loadSnapshot: (snapshot: TatGraphSnapshot) => void;
};
export {};
//# sourceMappingURL=useTatGraph.d.ts.map