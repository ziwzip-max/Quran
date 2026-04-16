import { View } from "react-native";
import { useSettings } from "@/contexts/SettingsContext";

export default function SettingsTab() {
  const { colors } = useSettings();
  return <View style={{ flex: 1, backgroundColor: colors.bgDark }} />;
}
