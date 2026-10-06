import { useEffect, useState } from "react";
import { ActivityIndicator, Image, StyleSheet, Text, View } from "react-native";
import type { AppLocale } from "../core/index";
import type { AssistantMessageImage } from "../core/assistant-message-images";
import { useMobilePalette } from "./mobile-palette-context";

/** Reads one agent image; resolves to a data URI, or null when it cannot be shown. */
export type AssistantImageReader = (runId: string, imageId: string, signal: AbortSignal) => Promise<string | null>;

// HPD-1062. Images the agent made, under the text of its answer. Read only when
// the message is drawn, one request per image; the bytes never enter the chat
// state. A failed read says so in one muted line instead of leaving a hole.
export function assistantImageUnavailableText(locale: AppLocale): string {
  return locale === "de" ? "Bild konnte nicht geladen werden." : "The image could not be loaded.";
}

export function AssistantMessageImages({
  images,
  locale,
  readImage,
}: {
  images: readonly AssistantMessageImage[];
  locale: AppLocale;
  readImage?: AssistantImageReader;
}) {
  if (!images.length || !readImage) return null;
  return (
    <View style={styles.list}>
      {images.map((image) => (
        <AssistantMessageImageView key={image.key} image={image} locale={locale} readImage={readImage} />
      ))}
    </View>
  );
}

function AssistantMessageImageView({
  image,
  locale,
  readImage,
}: {
  image: AssistantMessageImage;
  locale: AppLocale;
  readImage: AssistantImageReader;
}) {
  const palette = useMobilePalette();
  const [state, setState] = useState<{ phase: "loading" } | { phase: "ready"; uri: string } | { phase: "error" }>({ phase: "loading" });
  const [aspectRatio, setAspectRatio] = useState(16 / 10);
  useEffect(() => {
    const controller = new AbortController();
    setState({ phase: "loading" });
    readImage(image.runId, image.imageId, controller.signal)
      .then((uri) => {
        if (controller.signal.aborted) return;
        setState(uri ? { phase: "ready", uri } : { phase: "error" });
      })
      .catch(() => {
        if (!controller.signal.aborted) setState({ phase: "error" });
      });
    return () => controller.abort();
  }, [image.runId, image.imageId, readImage]);

  if (state.phase === "error") {
    return (
      <Text style={[styles.unavailable, { color: palette.muted }]} accessibilityRole="text">
        {assistantImageUnavailableText(locale)}
      </Text>
    );
  }
  if (state.phase === "loading") {
    return (
      <View style={[styles.frame, styles.placeholder, { aspectRatio, borderColor: palette.lineStrong }]}>
        <ActivityIndicator size="small" color={palette.muted} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri: state.uri }}
      style={[styles.frame, { aspectRatio, borderColor: palette.lineStrong }]}
      resizeMode="contain"
      accessibilityLabel={image.label || (locale === "de" ? "Bild" : "Image")}
      accessibilityIgnoresInvertColors
      onLoad={(event) => {
        const { width, height } = event.nativeEvent.source ?? {};
        if (width && height) setAspectRatio(width / height);
      }}
      onError={() => setState({ phase: "error" })}
      testID={`assistant-image-${image.imageId}`}
    />
  );
}

const styles = StyleSheet.create({
  list: { gap: 8, marginTop: 8 },
  frame: { width: "100%", borderRadius: 10, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  placeholder: { alignItems: "center", justifyContent: "center" },
  unavailable: { fontSize: 13, marginTop: 6 },
});
