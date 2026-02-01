# Architecture Documentation

## Overview

This document describes the architecture of the Collaborative Canvas project. It explains how drawing data flows between users, how WebSocket communication is handled, how undo and redo work globally, and how simultaneous drawing is managed.


## Data Flow Diagram

```text
User
  ↓
Browser (Client)
  ↓ drawing_step (WebSocket)
Server (Node.js + Socket.IO)
  ↓ broadcast
Other Connected Browsers
```


## WebSocket Protocol

### Message formats

**Drawing Data Message**

- Each drawing action is sent as message contains following information.

```
{
  "start": { "x": Number, "y": Number },
  "end": { "x": Number, "y": Number },
  "style": {
    "color": String,
    "width": Number
  },
  "isEraser": Boolean
}
```

**Cursor Position Message**

- Cursor  positions are sent as following.

```
{
  "x": Number,
  "y": Number,
  "color": String
}

```

### Events Sent and Received

**Client → Server Events**
- `drawing_step` – sends drawing stroke data to the server
- `cursor_move` – sends cursor position updates
- `undo` – requests a global undo operation
- `redo` – requests a global redo operation
- `clear_canvas` – clears the canvas for all users

**Server → Client Events**
- `drawing_step` – broadcasts drawing data to other users
- `rebuild_canvas` – sends full stroke history to rebuild the canvas
- `users_list` – sends updated list of connected users
- `cursor_positions` – sends all current cursor positions to a newly connected user
- `cursor_update` – updates cursor position of a specific user
- `cursor_remove` – removes cursor when a user disconnects

## Undo / Redo Strategy

Undo and redo strategy is completely maintained at the server side so that all users remain in sync.

The server maintains two arrays:
- `strokeHistory` to store all drawing actions
- `redoStack` to store strokes that are undone

When a user clicks undo:
- The server checks if `strokeHistory` is not empty
- The last stroke from `strokeHistory` is removed
- That stroke is added to `redoStack`
- The updated `strokeHistory` is sent to all users

When a user clicks redo:
- The server checks if `redoStack` is not empty
- The last stroke from `redoStack` is removed
- That stroke is added back to `strokeHistory`
- The updated `strokeHistory` is sent to all users

Since undo and redo operations are handled at the server side, the changes are reflected for all connected users in real time.

## Performance Decisions

- Instead of sending entire canvas Image, only small drawing strokes is sent to server.
- `requestAnimationFrame` is used while drawing. Mouse move events triggers very frequently, so RAF is used to control how often drawing and data sending happens. This avoids unnecessary rendering and network calls.
- Canvas drawing is handled at client side. Server only handles drawing data and synchronization between users, which keeps server load less.
- Stroke history and redo history are stored in memory at server side. This helps undo and redo to work fast without using any database.
- Cursor positions are sent as normalized values. This helps to support different screen sizes and reduces data size.

## Conflict Handling

- In this application, conflicts can happen when multiple users draw on the same canvas at the same time or at the same place.
- These conflicts are handled at the server side. The server acts as a single source of truth for all drawing actions.
- Whenever multiple users send drawing data at the same time, the server stores each drawing action sequentially into `strokeHistory`.
- This `strokeHistory` is then sent to all other users, and they render the drawings in the same sequence.

In this way, conflicts are handled by storing all drawing actions in a list and processing them in order.

