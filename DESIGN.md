---
version: alpha
name: TaskFlow
description: Jasny warsztat zespołu studenckiego z rytmem planera akademickiego.
colors:
  primary: "#183b55"
  accent: "#087f8c"
  background: "#f5f7fa"
  surface: "#ffffff"
  text: "#172c3c"
  muted: "#566b7b"
  border: "#dce4eb"
  danger: "#ac2938"
  success: "#176b50"
  warning: "#866012"
typography:
  display:
    fontFamily: "Georgia, Cambria, serif"
    fontSize: "2rem"
    lineHeight: "1.2"
  body:
    fontFamily: "Segoe UI, system-ui, sans-serif"
    fontSize: "0.9375rem"
    lineHeight: "1.6"
  utility:
    fontFamily: "Consolas, ui-monospace, monospace"
    fontSize: "0.75rem"
    lineHeight: "1.5"
rounded:
  DEFAULT: "0.625rem"
  card: "0.875rem"
spacing:
  control: "0.75rem"
  panel: "1.5rem"
  section: "2rem"
components:
  button:
    rounded: "0.625rem"
  card:
    rounded: "0.875rem"
  dialog:
    rounded: "0.875rem"
---

# TaskFlow

## Overview

Product register: a daily workspace for Polish student teams. The reference is a well-organized academic planner: a quiet navigation rail, course names as folder labels, precise dates and an unobtrusive teal progress rule. The signature is the horizontal project notebook header, pairing a restrained Georgia project name with compact course metadata and a progress line. Kanban and forms remain familiar, legible and practical. No marketing hero, gratuitous charts, decorative numbers or fake activity.

The interface uses pl-PL and Europe/Warsaw for timestamps; date-only deadlines never pass through UTC conversion. Desktop work is primary, with mobile task updates equally available. Existing API and permission rules in docs/API.md govern behavior.

Runtime ownership is model B: web/src/tokens.css is the canonical hand-maintained token source and this document mirrors accepted values. The shared UI and CSS Modules consume semantic variables directly. Changes update both files. Mapping: colors.primary → --primary; accent → --accent; background → --background; surface → --surface; text → --text; muted → --muted; border → --border; danger/success/warning → matching variables. typography.display/body/utility → --font-display/body/utility; rounded.DEFAULT/card → --radius/--radius-card; spacing.control/panel/section → --space-control/panel/section. Static audit and browser checks detect drift.

## Colors

Deep blue anchors navigation and primary actions; teal marks progress and selection. White panels sit on a pale cool gray workspace. Status always has text: Do zrobienia, W toku, Gotowe. Danger is reserved for deletion/errors, amber for calendar caution, green for completion. Light is the only supported theme. Focus uses a visible accent outline; forced colors remain platform-owned.

## Typography

Georgia is reserved for page and project titles, evoking a syllabus without turning the app into an editorial site. Segoe UI provides Polish glyphs, familiar controls and readable forms. Consolas is restrained to compact workspace metadata. No remote fonts or late font swapping. Body 15px/1.6, section labels 12–13px, headings 24–32px. Long names wrap.

## Layout

Desktop has a 232px navigation rail and a natural-height document scroller; workspace maximum width 1440px. At 1000px the rail narrows; at 760px it becomes a top navigation strip. Cards follow content, Kanban columns have independent minimum widths with horizontal scrolling only inside the board. Forms use one column except related short fields. Rhythm uses 6/12/18/24/32px based on the planner's row spacing. Table wrappers own horizontal overflow. Pagination is client-side in version 1 because the API returns bounded membership lists without pagination.

## Elevation & Depth

Cards use thin borders and no decorative shadow. Hover slightly strengthens borders. Only dialogs and select popups use a restrained shadow; modal backdrop dims the current workspace. Toasts occupy one stable bottom-right location.

## Shapes

Controls use 10px corners and cards/dialogs 14px. Avatars are circular. Status badges are compact soft rectangles. Dividers encode grouping rather than decoration.

## Components

Buttons keep their labels and width while busy. Solid primary, outline neutral, ghost contextual and explicit danger variants belong to one Button primitive. Fields share labels, hint/error slots, invalid semantics and first-error focus. Textareas auto-grow and never expose a resize handle. Search has an explicit clear control. Select owns listbox behavior and popup visuals; native date inputs intentionally accept platform-owned date popup language/geometry while displayed application dates remain Polish.

Modal uses the browser dialog element as an app-owned accessible primitive: modal focus containment, Escape, initial focus and restoration. Dirty forms require an app-owned discard confirmation. Destructive operations name the affected object and consequences. Shared notifications use one polite live region; critical errors remain inline. Loading uses an indeterminate labelled spinner and stable content area. Navigation, tables and tabs share the same spacing, labels and color roles. Icons use Lucide 18–20px strokes; icon-only actions always have labels. All interactions have hover, focus, active, disabled and busy states.

Motion is limited to 120ms control color transitions and a loading spinner; reduced motion removes animation. Copy uses Polish sentence case and explicit verbs. Progress derives only from real API counts and exposes a labelled progress element. Read-only archive banners explain available actions.

## Do's and Don'ts

- Keep deadlines, course and ownership visible at the moment they inform a decision.
- Reuse shared fields, dialogs, error messages and mutation feedback across screens.
- Never imply live collaboration; the version uses the last successful write and refreshes on focus.
- Avoid decorative dashboards, native alert/confirm/prompt, icon-only unfamiliar actions, and placeholder production data.
