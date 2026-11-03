import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// In a real app, we'd need to pass more than just masteryMap to know when things are due.
// For this task, we assume "due" means any bookmarked verse that isn't L3, 
// or we can just simplify it to any verse in the mastery map that is below L3.
// The session plan says: "based on existing SRS logic in bookmarks.tsx"
// Looking at bookmarks.tsx (via T004 context) there might be SRS logic there.

export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  return finalStatus === "granted";
}

export async function scheduleSmartNotification(
  enabled: boolean,
  hour: number,
  minute: number,
  dueCount: number
) {
  if (Platform.OS === "web") return;

  // Clear existing notifications
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!enabled) return;

  const content: Notifications.NotificationContentInput = {
    title: "مراجعة الورد اليومي",
    body: dueCount > 0 
      ? `لديك ${dueCount} آيات تستحق المراجعة اليوم` 
      : "لا تنس مراجعة وردك اليوم للبقاء على اتصال مع القرآن",
    sound: true,
    data: { url: "/bookmarks" },
  };

  await Notifications.scheduleNotificationAsync({
    content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export { countDueVerses } from "@/utils/srs";
