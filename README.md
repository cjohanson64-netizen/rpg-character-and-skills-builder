# ⚔️ Character Interaction Engine (TAT-Powered RPG Sandbox)

A visual, structured RPG interaction engine built on top of the TryAngleTree (TAT) system.

This app allows users to create characters, define interactions (attacks, heals, buffs), and simulate outcomes in a clean, controlled environment—without writing code.

---

## 🎯 Purpose

This project explores how a graph-based language (TryAngleTree) can power a **user-friendly system for designing and executing game logic**.

Instead of exposing raw graph operations, the app translates them into intuitive concepts:

- Graph → Character  
- Nodes → Identity + Stats  
- Ops → Actions (Attack, Heal, etc.)  
- Derivations → Calculations  

The result is a system that feels like an RPG designer tool, while still being powered by a flexible underlying runtime.

---

## 🚀 Features

### 🧍 Character Creation
- Create characters using structured forms (no raw code required)
- Define:
  - Name
  - Class
  - Type (Hero, Enemy, etc.)
  - Core stats (HP, ATK, DEF, INT, RES, SPD)
  - Metadata (description, notes)

---

### ⚔️ Interaction Definitions
- Define reusable actions such as:
  - Attack
  - Heal
  - Buff / Debuff (via conditions)

- Numeric effects use a clean model:
  - **Base Amount**
  - **Scaling (stat-based)**
  - **Minimum Floor**

Example:
```

Damage = max(min, base + (ATK - DEF))

```

---

### 🧠 Safe Calculation System
- Prevents invalid outcomes:
  - No negative damage turning into healing
  - No negative healing turning into damage
- HP is always clamped:
  - Minimum: `0`
  - Maximum: `base HP`

---

### 🌍 World Interaction System
- Execute interactions between characters:
```

Thoren → Strike → Murg
Effect: HP - 3, Burn

```

- Clean, human-readable history log
- No exposure to internal engine details

---

### 📊 Character View
- Simplified character cards:
  - Name
  - Class
  - Type
  - Core stats
- Designed to feel like a lightweight RPG sheet, not a data inspector

---

### 🧾 Condition System (v1)
- Apply conditions such as:
  - Burn
  - Poison
  - Stun
  - Freeze

- Stored as state and displayed in character view (expanding in future versions)

---

## 🧱 Architecture

### 🔹 UI Layer
- React-based interface
- Form-driven input (no raw code editing required)
- Focus on clarity and constraint over flexibility

### 🔹 Interaction Layer
- Structured definitions for:
  - Numeric effects (damage/heal)
  - Conditions

### 🔹 Execution Layer
- Powered by **TryAngleTree (TAT)**
- Translates user actions into graph mutations
- Applies:
  - State updates
  - Derived calculations
  - Condition grafting

### 🔹 Display Layer
- Clean transformation of engine output into:
  - RPG-style logs
  - Readable stat updates

---

## 🧠 Design Philosophy

> Hide the engine. Show the intent.

This project intentionally avoids exposing raw graph logic to the user.

Instead, it focuses on:
- **Clarity over flexibility**
- **Guided inputs over freeform code**
- **Readable outcomes over internal detail**

The goal is to make complex systems feel simple and approachable.

---

## 🛣️ Future Improvements

### 🎮 Gameplay Layer
- Turn system (SPD-based or manual)
- Action flow (select character → choose action → select target)
- HP bars and visual feedback

---

### 🧪 Condition System Expansion
- Duration (e.g., burn for 3 turns)
- Turn-based effects (damage over time, stun skip)
- Stacking rules

---

### 🧠 System Depth
- Resistances and immunities
- Effect pipelines (queued resolution phases)
- Optional randomness (crit, hit chance)

---

### 🧰 Authoring Experience
- Ability previews (human-readable summaries)
- Preset libraries (characters + abilities)
- Simulation mode (auto-run interactions)
- Validation and guardrails

---

### 🌍 Data & Sharing
- Import / export characters and rule sets
- Shareable interaction definitions
- Potential for full game configurations

---

## 🧪 Why This Project Matters

This project demonstrates that:

- Graph-based systems can power real applications
- Complex logic can be made accessible through strong constraints
- A well-designed UI can turn a language into a product

It serves as both:
- A **TAT proving ground**
- A **foundation for future game/system design tools**

---

## 🧑‍💻 Author

Built by Carl Johanson  
Saratoga Springs, Utah  

- [LinkedIn](https://www.linkedin.com/in/carlbiggersjohanson/)
