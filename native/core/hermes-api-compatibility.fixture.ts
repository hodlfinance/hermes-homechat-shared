import type { CreateHermesRunRequest } from "./hermes-channel";
import { HERMES_API_CONTRACT_VERSION } from "./hermes-api";

export const hermesApiCompatibilityFixture = {
  contractVersion: HERMES_API_CONTRACT_VERSION,
  request: {
    message: "Review the attached report.",
    conversationId: "conversation_fixture",
    surface: "hey_hermes",
    channel: "hey_hermes_web",
    sensitivity: "general",
    allowedSurfaces: ["hey_hermes", "finhermes"],
    artifactReferences: [
      {
        id: "artifact_fixture",
        kind: "document",
        source: "upload",
        version: 1,
        sensitivity: "broker_context",
        label: "Private report",
        safeSummary: "Private artifact",
        href: "/artifacts/artifact_fixture/versions/1",
      },
    ],
  } satisfies CreateHermesRunRequest,
} as const;
