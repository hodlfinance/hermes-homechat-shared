import assert from "node:assert/strict";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import {
  HomechatComposerChrome,
  HomechatMessageFrame,
  HomechatTranscript,
  shouldSubmitHomechatComposerOnEnter,
} from "../src/react.tsx";
import type { SharedHomechatMessage } from "../src/index.ts";

test("renders product-owned source, artifact, and action slots without package styling", () => {
  const html = renderToStaticMarkup(
    <HomechatTranscript<SharedHomechatMessage>
      classes={{ root: "product-transcript", entry: "product-entry" }}
      messages={[{ id: "message-1", role: "assistant", content: "Answer" }]}
      renderers={{
        message: (message) => <HomechatMessageFrame role={message.role}>{message.content}</HomechatMessageFrame>,
        source: (source) => <a href={source.href}>{source.label}</a>,
        artifact: (artifact) => <span>{artifact.title}</span>,
        action: (action) => <button>{action.label}</button>,
      }}
      slots={{
        byMessageId: {
          "message-1": {
            sources: [{ id: "source-1", kind: "market", label: "Market source", href: "/source" }],
            artifacts: [{ id: "artifact-1", kind: "report", title: "Report" }],
            actions: [{ id: "action-1", kind: "confirm", label: "Confirm" }],
          },
        },
        byRunId: {},
      }}
    />,
  );
  assert.match(html, /product-transcript/);
  assert.match(html, /data-homechat-slot="sources"/);
  assert.match(html, /Market source/);
  assert.match(html, /Report/);
  assert.match(html, /Confirm/);
  assert.doesNotMatch(html, /finance|hey-hermes/i);
});

test("keeps empty, pending, and composer chrome controlled by the consumer", () => {
  const transcript = renderToStaticMarkup(
    <HomechatTranscript<SharedHomechatMessage>
      messages={[]}
      empty={<p>Product empty state</p>}
      pending={<p>Product pending state</p>}
      renderers={{ message: (message) => message.content }}
    />,
  );
  assert.match(transcript, /Product empty state/);
  assert.match(transcript, /Product pending state/);

  const composer = renderToStaticMarkup(
    <HomechatComposerChrome
      ariaLabel="Message"
      onValueChange={() => undefined}
      placeholder="Ask"
      value="Draft"
      sendButton={<button>Send</button>}
    />,
  );
  assert.match(composer, /Draft/);
  assert.match(composer, /Send/);
});

test("does not submit Enter while an IME composition is active", () => {
  assert.equal(shouldSubmitHomechatComposerOnEnter({ key: "Enter", isComposing: true }), false);
  assert.equal(shouldSubmitHomechatComposerOnEnter({ key: "Enter", keyCode: 229 }), false);
  assert.equal(shouldSubmitHomechatComposerOnEnter({ key: "Enter", shiftKey: true }), false);
  assert.equal(shouldSubmitHomechatComposerOnEnter({ key: "Enter" }), true);
});
