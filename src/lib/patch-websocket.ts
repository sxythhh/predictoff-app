"use client";

/**
 * Patches WebSocket.prototype.addEventListener so that "message" listeners
 * are wrapped in a try-catch. This prevents the Azuro SDK's live-statistics
 * socket from throwing uncaught SyntaxErrors when the server sends non-JSON
 * error strings (e.g. "Error: game...").
 */
if (typeof window !== "undefined") {
  const origAddEventListener = WebSocket.prototype.addEventListener;

  WebSocket.prototype.addEventListener = function (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) {
    if (type === "message" && typeof listener === "function") {
      const original = listener;
      const wrapped = function (this: WebSocket, event: Event) {
        try {
          original.call(this, event);
        } catch (err) {
          // Silently ignore JSON parse errors from non-JSON WebSocket messages
          if (err instanceof SyntaxError) {
            return;
          }
          throw err;
        }
      };
      return origAddEventListener.call(this, type, wrapped, options);
    }
    return origAddEventListener.call(this, type, listener, options);
  };
}
