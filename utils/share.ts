import { Platform, Share } from "react-native";
import * as Clipboard from "expo-clipboard";

export { verseShareText } from "@/utils/verseText";

/**
 * Opens the system share sheet. Where sharing isn't available (most desktop
 * browsers) the text is copied instead. Returns "shared" or "copied".
 */
export async function shareText(message: string): Promise<"shared" | "copied"> {
  const canWebShare = Platform.OS !== "web" || (typeof navigator !== "undefined" && "share" in navigator);
  if (canWebShare) {
    try {
      await Share.share({ message });
      return "shared";
    } catch {
      // fall through to copying
    }
  }
  await Clipboard.setStringAsync(message);
  return "copied";
}
