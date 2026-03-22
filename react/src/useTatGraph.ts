import { useCallback, useEffect, useRef, useState } from "react";

import {
  executeTatSource,
  addBranch,
  removeBranch,
  setNodeState,
  removeNodeState,
  setNodeMeta,
  removeNodeMeta,
  graphToDebugObject,
  cloneGraph,
  hydrateGraph,
} from "@tryangletree/tat/browser";

type UseTatGraphOptions = {
  tatPath?: string;
  tatSource?: string;
  graphName: string;
};

type TatGraph = Parameters<typeof cloneGraph>[0];
type TatGraphValue = Parameters<typeof setNodeState>[3];
type TatHistoryEntry = TatGraph["history"][number];
type TatGraphSnapshot = Parameters<typeof hydrateGraph>[0];

export function useTatGraph({
  tatPath,
  tatSource,
  graphName,
}: UseTatGraphOptions) {
  const graphRef = useRef<TatGraph | null>(null);
  const initialGraphRef = useRef<TatGraph | null>(null);
  const replayBaseRef = useRef<TatGraph | null>(null);

  const [graphView, setGraphView] = useState<ReturnType<
    typeof graphToDebugObject
  > | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const syncView = useCallback(() => {
    if (!graphRef.current) return;
    setGraphView(graphToDebugObject(graphRef.current));
  }, []);

  function createReplayBase(graph: TatGraph): TatGraph {
    const replayBase = cloneGraph(graph);
    const initialHistory = [...replayBase.history];

    for (let index = initialHistory.length - 1; index >= 0; index -= 1) {
      const entry = initialHistory[index];

      switch (entry.op) {
        case "@graft.branch":
          removeBranch(
            replayBase,
            getStringPayload(entry, "subject"),
            getStringPayload(entry, "relation"),
            getStringPayload(entry, "object"),
          );
          break;

        case "@graft.state":
          removeNodeState(
            replayBase,
            getStringPayload(entry, "nodeId"),
            getStringPayload(entry, "key"),
          );
          break;

        case "@graft.meta":
          removeNodeMeta(
            replayBase,
            getStringPayload(entry, "nodeId"),
            getStringPayload(entry, "key"),
          );
          break;
      }
    }

    replayBase.history = [];
    return replayBase;
  }

  function applyGraph(graph: TatGraph) {
    const loadedGraph = cloneGraph(graph);
    const replayBase = createReplayBase(loadedGraph);

    graphRef.current = loadedGraph;
    initialGraphRef.current = cloneGraph(loadedGraph);
    replayBaseRef.current = replayBase;
    setGraphView(graphToDebugObject(loadedGraph));
  }

  const loadGraph = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let source = tatSource;

      if (!source) {
        if (!tatPath) {
          throw new Error("useTatGraph requires either tatSource or tatPath");
        }

        const response = await fetch(tatPath);

        if (!response.ok) {
          throw new Error(
            `Failed to load TAT source from "${tatPath}" (${response.status} ${response.statusText})`,
          );
        }

        source = await response.text();
      }

      const result = executeTatSource(source);
      const graph = result.execution.state.graphs.get(graphName);

      if (!graph) {
        throw new Error(`Graph "${graphName}" not found`);
      }

      applyGraph(graph);
    } catch (err: unknown) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setGraphView(null);
    } finally {
      setIsLoading(false);
    }
  }, [tatPath, tatSource, graphName]);

  const resetGraph = useCallback(() => {
    if (!initialGraphRef.current) return;
    graphRef.current = cloneGraph(initialGraphRef.current);
    syncView();
  }, [syncView]);

  const mutate = useCallback(
    (fn: (graph: TatGraph) => void) => {
      if (!graphRef.current) return;
      fn(graphRef.current);
      syncView();
    },
    [syncView],
  );

  const api = {
    addBranch: (s: string, r: string, o: string) =>
      mutate((g: TatGraph) => addBranch(g, s, r, o)),

    setNodeState: (id: string, key: string, value: TatGraphValue) =>
      mutate((g: TatGraph) => setNodeState(g, id, key, value)),

    setNodeMeta: (id: string, key: string, value: TatGraphValue) =>
      mutate((g: TatGraph) => setNodeMeta(g, id, key, value)),
  };

  function getStringPayload(
    entry: TatHistoryEntry,
    key: string,
  ): string {
    const value = entry.payload[key];

    if (typeof value !== "string") {
      throw new Error(
        `Invalid history payload for ${entry.op}: expected "${key}" to be a string`,
      );
    }

    return value;
  }

  function getValuePayload(
    entry: TatHistoryEntry,
    key: string,
  ): TatGraphValue {
    return entry.payload[key] as TatGraphValue;
  }

  const replayTo = useCallback((historyIndex: number) => {
    if (!graphRef.current || !replayBaseRef.current) return;

    const base = cloneGraph(replayBaseRef.current);
    const fullHistory = graphRef.current.history;
    const slice = fullHistory.slice(0, historyIndex + 1);

    for (const entry of slice) {
      switch (entry.op) {
        case "@graft.branch":
          addBranch(
            base,
            getStringPayload(entry, "subject"),
            getStringPayload(entry, "relation"),
            getStringPayload(entry, "object"),
          );
          break;

        case "@graft.state":
          setNodeState(
            base,
            getStringPayload(entry, "nodeId"),
            getStringPayload(entry, "key"),
            getValuePayload(entry, "value"),
          );
          break;

        case "@graft.meta":
          setNodeMeta(
            base,
            getStringPayload(entry, "nodeId"),
            getStringPayload(entry, "key"),
            getValuePayload(entry, "value"),
          );
          break;
      }
    }

    graphRef.current = base;
    setGraphView(graphToDebugObject(base));
  }, []);

  const loadSnapshot = useCallback((snapshot: TatGraphSnapshot) => {
    setError(null);
    applyGraph(hydrateGraph(snapshot));
  }, []);

  useEffect(() => {
    void loadGraph();
  }, [loadGraph]);

  return {
    graph: graphRef.current,
    graphView,
    isLoading,
    error,
    reload: loadGraph,
    reset: resetGraph,
    mutate,
    loadSnapshot,
    ...api,
    replayTo
  };
}
