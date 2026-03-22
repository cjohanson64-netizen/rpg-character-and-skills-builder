import React from "react";
import CharacterInspector from "./features/character-inspector/CharacterInspector";
import CharacterEditorModal from "./features/character-editor/CharacterEditorModal";
import "./App.css";
import { useAppController } from "./app/useAppController";

export default function App() {
  const {
    characterState,
    workspaceState,
    worldState,
    inspectorActions,
    createModalProps,
  } = useAppController();

  return (
    <>
      <CharacterInspector
        characterState={characterState}
        workspaceState={workspaceState}
        worldState={worldState}
        inspectorActions={inspectorActions}
      />
      <CharacterEditorModal {...createModalProps} />
    </>
  );
}
