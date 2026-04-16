import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";

export const ALL_DATA_KEYS = [
  "al_hifz_bookmarks",
  "al_hifz_mastery",
  "al_hifz_daily_counts",
  "al_hifz_settings",
  "al_hifz_history",
  "al_hifz_reviews",
  "al_hifz_pins",
  "al_hifz_last_surah",
  "al_hifz_search_history",
];

export interface ExportData {
  version: number;
  exportedAt: string;
  data: Record<string, any>;
}

export async function exportUserData(): Promise<void> {
  const pairs = await AsyncStorage.multiGet(ALL_DATA_KEYS);
  const data: Record<string, any> = {};
  for (const [key, value] of pairs) {
    if (value !== null) {
      try {
        data[key] = JSON.parse(value);
      } catch {
        data[key] = value;
      }
    }
  }

  const exportPayload: ExportData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    data,
  };

  const json = JSON.stringify(exportPayload, null, 2);
  const filename = `al-hifz-backup-${new Date().toISOString().split("T")[0]}.json`;

  if (Platform.OS === "web") {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    const path = (FileSystem.documentDirectory ?? FileSystem.cacheDirectory ?? "") + filename;
    await FileSystem.writeAsStringAsync(path, json, { encoding: FileSystem.EncodingType.UTF8 });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(path, {
        mimeType: "application/json",
        dialogTitle: "مشاركة نسخة احتياطية",
        UTI: "public.json",
      });
    }
  }
}

export async function importUserData(
  onReload: () => Promise<void>
): Promise<{ success: boolean; error?: string }> {
  try {
    let jsonText: string;

    if (Platform.OS === "web") {
      jsonText = await pickFileWeb();
    } else {
      const result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return { success: false, error: "cancelled" };
      }

      const uri = result.assets[0].uri;
      jsonText = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
    }

    const parsed: ExportData = JSON.parse(jsonText);

    if (!parsed.version || !parsed.data || typeof parsed.data !== "object") {
      return { success: false, error: "invalid_format" };
    }

    const pairs: [string, string][] = [];
    for (const key of ALL_DATA_KEYS) {
      if (parsed.data[key] !== undefined) {
        pairs.push([key, JSON.stringify(parsed.data[key])]);
      }
    }

    if (pairs.length === 0) {
      return { success: false, error: "no_data" };
    }

    await AsyncStorage.multiSet(pairs);
    await onReload();

    return { success: true };
  } catch (e: any) {
    if (e?.message === "cancelled") return { success: false, error: "cancelled" };
    return { success: false, error: "parse_error" };
  }
}

function pickFileWeb(): Promise<string> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error("cancelled"));
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.onerror = () => reject(new Error("read_error"));
      reader.readAsText(file);
    };
    input.oncancel = () => reject(new Error("cancelled"));
    input.click();
  });
}
