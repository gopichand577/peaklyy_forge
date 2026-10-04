/**
 * Peaklyy Forge - Interactive Terminal WebSocket Client
 */

let activeSocket = null;

export function connectInteractiveSession({
  language,
  code,
  files = [],
  input = "",
  onStatus = () => {},
  onPrompt = () => {},
  onStdout = () => {},
  onOutput = null,
  onStderr = () => {},
  onComplete = () => {},
  onFinish = null,
  onError = () => {},
}) {
  if (activeSocket) {
    try {
      activeSocket.send(JSON.stringify({ type: "kill" }));
      activeSocket.close();
    } catch {}
    activeSocket = null;
  }

  const wsUrl =
    (import.meta.env.VITE_COMPILER_WS_URL || "ws://localhost:5000") +
    "/ws/compiler";

  let socket;
  try {
    socket = new WebSocket(wsUrl);
  } catch (err) {
    onError(err);
    return { sendStdin: () => {}, kill: () => {} };
  }

  activeSocket = socket;

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        type: "run",
        language,
        code,
        files,
        input,
      })
    );
  };

  const handleStdout = (chunk) => {
    if (onOutput) onOutput(typeof chunk === "string" ? { text: chunk } : chunk);
    if (onStdout) onStdout(typeof chunk === "object" ? chunk.text : chunk);
  };
  const handleStderr = onStderr || onError || (() => {});
  const handleComplete = onFinish || onComplete || (() => {});
  const handlePrompt = onPrompt || (() => {});
  const handleStatus = onStatus || (() => {});

  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      if (msg.type === "status") {
        handleStatus(msg.status);
      } else if (msg.type === "prompt") {
        handlePrompt(msg.data);
      } else if (msg.type === "stdout") {
        handleStdout(typeof msg.data === "string" ? { text: msg.data } : msg.data);
      } else if (msg.type === "stderr") {
        handleStderr(typeof msg.data === "string" ? msg.data : msg.data?.text);
      } else if (msg.type === "complete") {
        handleComplete(msg.result);
        if (activeSocket === socket) {
          activeSocket = null;
        }
      } else if (msg.type === "error") {
        if (onError) onError(msg.error);
      }
    } catch (e) {
      console.error("WS Parse error:", e);
    }
  };

  socket.onerror = (err) => {
    onError(err);
  };

  socket.onclose = () => {
    if (activeSocket === socket) {
      activeSocket = null;
    }
  };

  return {
    sendStdin: (text) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "stdin", data: text }));
      }
    },
    kill: () => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "kill" }));
        socket.close();
      }
      if (activeSocket === socket) {
        activeSocket = null;
      }
    },
  };
}
