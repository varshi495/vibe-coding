# Phase 3: Presence, Typing Indicators & Delivery/Read Status — Context

**Gathered:** 2026-10-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver live online/offline presence tracking, last seen timestamps, debounced typing indicators, and checkmark receipt statuses (single gray check for SENT, double gray check for DELIVERED, double blue check for READ).

## Core Requirements

- **STAT-01**: User online status indicator (green dot when connected, "last seen" timestamp when offline).
- **STAT-02**: Real-time typing indicators in header and conversation list ("typing...").
- **STAT-03**: Single checkmark receipt (`✓`) when server receives & acknowledges sent message.
- **STAT-04**: Double gray checkmark receipt (`✓✓`) when message is delivered to recipient device.
- **STAT-05**: Double blue checkmark receipt (`✓✓`) when recipient views/reads the conversation.

## Architectural Principles

1. **Multi-device / Multi-tab Presence**: Track socket connections per `userId` in a `Map<string, Set<string>>`. Only broadcast `offline` when ALL sockets for a user disconnect.
2. **Debounced Typing Logic**: Client emits `typing_start` on text input, sets a 3-second timeout to emit `typing_stop`. Sending a message immediately cancels typing state.
3. **Automatic Delivery Receipts**: When client receives `receive_message`, it automatically acknowledges delivery back to server (`message_delivered`), transitioning message status from `SENT` to `DELIVERED`.
4. **Read Receipts**: Opening/focusing a conversation triggers `markAsRead`, updating database records and emitting `message_status_update` with status `READ` to the message sender.
5. **Stitch Design Alignment**: Blue double-check accent color `#34b7f1` (WhatsApp blue check color) or `#00a884` (emerald accent).
</domain>
