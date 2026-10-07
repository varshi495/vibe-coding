# Phase 5: Media Sharing, File Attachments & Voice Notes — Context

**Gathered:** 2026-10-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver rich media messaging capabilities: upload and in-chat rendering of images (with lightbox modal), inline video playback, document downloads with type badge and size, and in-browser voice note recording with audio waveform playback. Enforce strict 25MB file size limits and MIME type validation.

## Core Requirements

- **MED-01**: User can upload and send images displayed directly in chat with lightbox preview.
- **MED-02**: User can upload and send video files playable in-line.
- **MED-03**: User can upload and send documents/files with file type icon, name, size, and download link.
- **MED-04**: User can record voice notes using microphone with live duration timer.
- **MED-05**: User can send recorded voice notes with duration indicator and playable audio waveform element.
- **MED-06**: System enforces file size limits (max 25MB) and validates allowed MIME types.

## Schema Changes Required

### Extend `MessageType` enum in `server/prisma/schema.prisma`
```prisma
enum MessageType {
  TEXT
  SYSTEM
  IMAGE
  VIDEO
  AUDIO
  DOCUMENT
}
```

### Extend `Message` model in `server/prisma/schema.prisma`
```prisma
model Message {
  id             String        @id @default(uuid())
  conversationId String
  senderId       String
  content        String        // caption, text, or fallback filename
  type           MessageType   @default(TEXT)
  mediaUrl       String?       // path or URL to media asset
  mediaType      String?       // MIME type (e.g., image/jpeg, audio/webm)
  fileName       String?       // original uploaded filename
  fileSize       Int?          // size in bytes
  status         MessageStatus @default(SENT)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  conversation   Conversation  @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender         User          @relation("SentMessages", fields: [senderId], references: [id], onDelete: Cascade)
}
```

## Architectural Decisions

1. **Storage Service Pattern**:
   - Local disk storage into `server/uploads/` via Multer, statically served at `/uploads/*`.
   - Pluggable media service interface allowing Cloudinary if environment credentials are provided.
   - Ensures zero-config local development, instant test execution, and offline development capabilities.
2. **File Size & MIME Type Validation**:
   - Strict 25MB limit handled directly at the Multer middleware level (`limits: { fileSize: 25 * 1024 * 1024 }`).
   - Disallowed files rejected with descriptive `400 Bad Request` or `413 Payload Too Large`.
3. **Voice Recording via Web APIs**:
   - Uses standard browser `navigator.mediaDevices.getUserMedia({ audio: true })` and `MediaRecorder` API.
   - Generates `audio/webm` or `audio/ogg` audio chunks, assembled into a single Blob for upload.
   - Live recording timer displayed in compose area with Cancel (trash) and Send actions.
4. **Chat Bubble Media Rendering**:
   - **Image**: Inline thumbnail/preview with loading state, click opens full-screen lightbox modal with download link.
   - **Video**: Inline HTML5 `<video controls>` with dark video player UI.
   - **Audio / Voice Note**: Play/Pause button, timeline slider/bars, and duration indicator.
   - **Document**: Document card with file icon, name, file size (KB/MB), and direct download button.
5. **Real-Time Delivery**:
   - Media messages dispatched through REST upload followed by Socket.IO `send_message` or REST message creation with socket broadcast.
   - Receiver receives message with `type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT'` and media metadata.

## API Surface

### REST Endpoints
- `POST /api/media/upload` (multipart/form-data) — Upload file, validate size & MIME, returns `{ url, fileName, fileSize, mediaType, messageType }`.
- `POST /api/conversations/:id/messages/media` — Send media message directly, or client uploads then calls `send_message` with media fields.

### Static Asset Route
- `GET /uploads/:filename` — Serves uploaded static files with proper MIME headers.
</domain>
