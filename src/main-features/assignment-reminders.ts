// @ts-nocheck
import { browser, getCurrentDate, getFutureDate } from "../common/utils.js";
import { getSchoolName, getUserId, Toast } from "../fixes-utils/utils.js";

const REMINDER_STATE_KEY = "smpp.assignmentReminderState.v1";
const REMINDER_INTERVAL_MS = 5 * 60 * 1000;
const REMINDER_HOURS = [24, 6, 1];

let initialized = false;

function getReminderBucket(hours: number) {
  return `${hours}h`;
}

function loadReminderState() {
  try {
    const raw = localStorage.getItem(REMINDER_STATE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (_error) {
    return {};
  }
}

function saveReminderState(state: Record<string, any>) {
  localStorage.setItem(REMINDER_STATE_KEY, JSON.stringify(state));
}

function getAssignmentKey(item: any) {
  return `${item.id}:${item.period?.dateTimeFrom || ""}`;
}

function getReminderContent(item: any, hours: number) {
  const title = item.name || "Onbekende taak";
  const dueDate = new Date(item.period?.dateTimeFrom || Date.now());
  const dueTime = dueDate.toLocaleTimeString("nl-BE", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `Nog ${hours}u voor '${title}' (deadline ${dueTime}).`;
}

async function remindersEnabled() {
  const enabled = await browser.runtime.sendMessage({
    action: "getSetting",
    name: "other.reminders.assignments",
  });
  return enabled !== false;
}

async function fetchUpcomingAssignments() {
  const schoolName = getSchoolName();
  const userId = getUserId();
  if (!schoolName || !userId) return [];

  const from = getCurrentDate();
  const to = getFutureDate(2);
  const url = `https://${schoolName}.smartschool.be/planner/api/v1/planned-elements/user/${userId}?from=${from}&to=${to}&types=planned-assignments,planned-to-dos`;

  const response = await fetch(url);
  if (!response.ok) return [];

  const data = await response.json();
  if (!Array.isArray(data)) return [];

  const now = Date.now();
  return data.filter((item) => {
    const dueMs = new Date(item.period?.dateTimeFrom || 0).getTime();
    return (
      item.resolvedStatus !== "resolved" &&
      Number.isFinite(dueMs) &&
      dueMs > now
    );
  });
}

async function checkAssignmentReminders() {
  if (window.location.pathname.startsWith("/login")) return;
  if (!(await remindersEnabled())) return;

  const assignments = await fetchUpcomingAssignments();
  const state = loadReminderState();
  const activeKeys = new Set<string>();
  const now = Date.now();

  let notificationsSent = 0;

  for (const item of assignments) {
    const key = getAssignmentKey(item);
    activeKeys.add(key);

    if (!state[key]) state[key] = {};

    const dueTime = new Date(item.period?.dateTimeFrom || 0).getTime();
    const msUntilDue = dueTime - now;
    if (msUntilDue <= 0) continue;

    let targetHour: number | null = null;
    if (msUntilDue <= 1 * 60 * 60 * 1000) {
      targetHour = 1;
    } else if (msUntilDue <= 6 * 60 * 60 * 1000) {
      targetHour = 6;
    } else if (msUntilDue <= 24 * 60 * 60 * 1000) {
      targetHour = 24;
    }

    if (targetHour === null) continue;

    const bucket = getReminderBucket(targetHour);
    if (state[key][bucket]) continue;

    if (notificationsSent < 3) {
      new Toast(getReminderContent(item, targetHour), "warning", 6500).render();
      notificationsSent += 1;
    }
    state[key][bucket] = true;

    for (const hour of REMINDER_HOURS) {
      if (hour < targetHour) continue;
      const higherBucket = getReminderBucket(hour);
      if (state[key][higherBucket] === undefined) {
        state[key][higherBucket] = false;
      }
    }
  }

  for (const knownKey of Object.keys(state)) {
    if (!activeKeys.has(knownKey)) {
      delete state[knownKey];
    }
  }

  saveReminderState(state);
}

export function initializeAssignmentReminders() {
  if (initialized) return;
  initialized = true;

  checkAssignmentReminders().catch((error) => {
    console.error("SMPP reminder check failed:", error);
  });

  setInterval(() => {
    checkAssignmentReminders().catch((error) => {
      console.error("SMPP reminder check failed:", error);
    });
  }, REMINDER_INTERVAL_MS);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "visible") return;
    checkAssignmentReminders().catch((error) => {
      console.error("SMPP reminder check failed:", error);
    });
  });
}
