import assert from "node:assert/strict";
import test from "node:test";

import { createMobileHomechatEventStream } from "../src/homechat-stream";

test("releases a terminal Expo fetch reader without cancelling its native stream", async () => {
  const terminalEvent = new TextEncoder().encode(
    'id: cursor-final\nevent: run.status\ndata: {"runId":"run-1","state":"completed"}\n\n',
  );
  let completeNativeResponse = () => undefined;
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(terminalEvent);
      completeNativeResponse = () => controller.close();
    },
  });
  const stream = createMobileHomechatEventStream(async () => ({
    body,
    ok: true,
    status: 200,
    text: async () => "",
  }));

  const result = await stream("run-1", { onEvent: () => undefined });

  assert.deepEqual(result, { cursor: "cursor-final", terminal: true });
  assert.doesNotThrow(completeNativeResponse);
});
