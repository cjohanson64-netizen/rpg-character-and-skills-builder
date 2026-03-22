import { useCallback, useEffect, useRef, useState } from "react";
import { executeTatSource, addBranch, removeBranch, setNodeState, removeNodeState, setNodeMeta, removeNodeMeta, graphToDebugObject, cloneGraph, hydrateGraph, } from "@tryangletree/tat/browser";
export function useTatGraph({ tatPath, tatSource, graphName, }) {
    const graphRef = useRef(null);
    const initialGraphRef = useRef(null);
    const replayBaseRef = useRef(null);
    const [graphView, setGraphView] = useState(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const syncView = useCallback(() => {
        if (!graphRef.current)
            return;
        setGraphView(graphToDebugObject(graphRef.current));
    }, []);
    function createReplayBase(graph) {
        const replayBase = cloneGraph(graph);
        const initialHistory = [...replayBase.history];
        for (let index = initialHistory.length - 1; index >= 0; index -= 1) {
            const entry = initialHistory[index];
            switch (entry.op) {
                case "@graft.branch":
                    removeBranch(replayBase, getStringPayload(entry, "subject"), getStringPayload(entry, "relation"), getStringPayload(entry, "object"));
                    break;
                case "@graft.state":
                    removeNodeState(replayBase, getStringPayload(entry, "nodeId"), getStringPayload(entry, "key"));
                    break;
                case "@graft.meta":
                    removeNodeMeta(replayBase, getStringPayload(entry, "nodeId"), getStringPayload(entry, "key"));
                    break;
            }
        }
        replayBase.history = [];
        return replayBase;
    }
    function applyGraph(graph) {
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
                    throw new Error(`Failed to load TAT source from "${tatPath}" (${response.status} ${response.statusText})`);
                }
                source = await response.text();
            }
            const result = executeTatSource(source);
            const graph = result.execution.state.graphs.get(graphName);
            if (!graph) {
                throw new Error(`Graph "${graphName}" not found`);
            }
            applyGraph(graph);
        }
        catch (err) {
            setError(err instanceof Error ? err : new Error(String(err)));
            setGraphView(null);
        }
        finally {
            setIsLoading(false);
        }
    }, [tatPath, tatSource, graphName]);
    const resetGraph = useCallback(() => {
        if (!initialGraphRef.current)
            return;
        graphRef.current = cloneGraph(initialGraphRef.current);
        syncView();
    }, [syncView]);
    const mutate = useCallback((fn) => {
        if (!graphRef.current)
            return;
        fn(graphRef.current);
        syncView();
    }, [syncView]);
    const api = {
        addBranch: (s, r, o) => mutate((g) => addBranch(g, s, r, o)),
        setNodeState: (id, key, value) => mutate((g) => setNodeState(g, id, key, value)),
        setNodeMeta: (id, key, value) => mutate((g) => setNodeMeta(g, id, key, value)),
    };
    function getStringPayload(entry, key) {
        const value = entry.payload[key];
        if (typeof value !== "string") {
            throw new Error(`Invalid history payload for ${entry.op}: expected "${key}" to be a string`);
        }
        return value;
    }
    function getValuePayload(entry, key) {
        return entry.payload[key];
    }
    const replayTo = useCallback((historyIndex) => {
        if (!graphRef.current || !replayBaseRef.current)
            return;
        const base = cloneGraph(replayBaseRef.current);
        const fullHistory = graphRef.current.history;
        const slice = fullHistory.slice(0, historyIndex + 1);
        for (const entry of slice) {
            switch (entry.op) {
                case "@graft.branch":
                    addBranch(base, getStringPayload(entry, "subject"), getStringPayload(entry, "relation"), getStringPayload(entry, "object"));
                    break;
                case "@graft.state":
                    setNodeState(base, getStringPayload(entry, "nodeId"), getStringPayload(entry, "key"), getValuePayload(entry, "value"));
                    break;
                case "@graft.meta":
                    setNodeMeta(base, getStringPayload(entry, "nodeId"), getStringPayload(entry, "key"), getValuePayload(entry, "value"));
                    break;
            }
        }
        graphRef.current = base;
        setGraphView(graphToDebugObject(base));
    }, []);
    const loadSnapshot = useCallback((snapshot) => {
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
