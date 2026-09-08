import type { ImageSourcePropType } from "react-native";

const officialConnectionMarkSourceById: Record<string, ImageSourcePropType> = {
  gmail: require("../assets/connections/gmail.png"),
  telegram: require("../assets/connections/telegram.png"),
  calendar: require("../assets/connections/google-calendar.png"),
  google_drive: require("../assets/connections/google-drive.png"),
  whatsapp: require("../assets/connections/whatsapp.png"),
  slack: require("../assets/connections/slack.png"),
  discord: require("../assets/connections/discord.png"),
};

export function officialConnectionMarkSource(connectionId: string): ImageSourcePropType | null {
  return officialConnectionMarkSourceById[connectionId] ?? null;
}
