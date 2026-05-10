// @ts-nocheck
import { getCurrentDate, openURL } from "../common/utils.js";
import { getSchoolName, getUserId } from "../fixes-utils/utils.js";
import { WidgetBase, registerWidget } from "./widgets.js";

function formatTime(dateString) {
  return new Date(dateString).toLocaleTimeString("nl-NL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isAssignment(element) {
  return ["planned-assignments", "planned-to-dos"].includes(
    element.plannedElementType
  );
}

function createStat(value, label) {
  const stat = document.createElement("div");
  stat.classList.add("today-widget-stat");

  const valueElement = document.createElement("strong");
  valueElement.textContent = String(value);

  const labelElement = document.createElement("span");
  labelElement.textContent = label;

  stat.append(valueElement, labelElement);
  return stat;
}

class TodayWidget extends WidgetBase {
  get category() {
    return "other";
  }

  get name() {
    return "TodayWidget";
  }

  async fetchTodayData() {
    const schoolName = getSchoolName();
    const userId = getUserId();
    if (!schoolName || !userId) return null;

    try {
      const date = getCurrentDate();
      const response = await fetch(
        `/planner/api/v1/planned-elements/user/${userId}?from=${date}&to=${date}`
      );

      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.warn("SMPP: today planner data could not be loaded.", error);
      return null;
    }
  }

  createShell() {
    const container = document.createElement("div");
    container.classList.add("today-widget");

    const title = document.createElement("h2");
    title.textContent = "Vandaag";

    const subtitle = document.createElement("p");
    subtitle.classList.add("today-widget-date");
    subtitle.textContent = new Date().toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    container.append(title, subtitle);
    return container;
  }

  createEmptyState() {
    const empty = document.createElement("p");
    empty.classList.add("today-widget-empty");
    empty.textContent = "Geen planning voor vandaag.";
    return empty;
  }

  createNextLesson(lessons) {
    const now = new Date();
    const nextLesson = lessons.find(
      (lesson) => new Date(lesson.period.dateTimeTo) > now
    );

    const block = document.createElement("div");
    block.classList.add("today-widget-next");

    const label = document.createElement("span");
    label.textContent = "Volgende";

    const value = document.createElement("strong");
    if (!nextLesson) {
      value.textContent = "Geen lessen meer";
      block.append(label, value);
      return block;
    }

    const course = nextLesson.courses?.[0]?.name || nextLesson.name || "Les";
    value.textContent = course;

    const time = document.createElement("span");
    time.textContent = `${formatTime(
      nextLesson.period.dateTimeFrom
    )} - ${formatTime(nextLesson.period.dateTimeTo)}`;

    block.append(label, value, time);
    return block;
  }

  createActions() {
    const actions = document.createElement("div");
    actions.classList.add("today-widget-actions");

    const plannerButton = document.createElement("button");
    plannerButton.textContent = "Planner";
    plannerButton.addEventListener("click", () => openURL("/planner"));

    const messagesButton = document.createElement("button");
    messagesButton.textContent = "Berichten";
    messagesButton.addEventListener("click", () => openURL("/messages"));

    actions.append(plannerButton, messagesButton);
    return actions;
  }

  async createContent() {
    const container = this.createShell();
    const loading = document.createElement("p");
    loading.classList.add("today-widget-empty");
    loading.textContent = "Planning laden...";
    container.appendChild(loading);

    this.fetchTodayData().then((data) => {
      loading.remove();

      if (!Array.isArray(data)) {
        container.appendChild(this.createEmptyState());
        container.appendChild(this.createActions());
        return;
      }

      const activeItems = data.filter(
        (item) => item.resolvedStatus !== "resolved"
      );
      const lessons = activeItems
        .filter((item) => !isAssignment(item))
        .sort(
          (a, b) =>
            new Date(a.period.dateTimeFrom) - new Date(b.period.dateTimeFrom)
        );
      const assignments = activeItems.filter(isAssignment);

      const stats = document.createElement("div");
      stats.classList.add("today-widget-stats");
      stats.append(
        createStat(lessons.length, "lessen"),
        createStat(assignments.length, "taken")
      );

      container.append(stats);
      if (activeItems.length === 0) {
        container.appendChild(this.createEmptyState());
      } else {
        container.appendChild(this.createNextLesson(lessons));
      }
      container.appendChild(this.createActions());
    });

    return container;
  }

  async createPreview() {
    const preview = document.createElement("div");
    preview.classList.add("today-widget", "today-widget-preview");

    const title = document.createElement("h2");
    title.textContent = "Vandaag";

    const stats = document.createElement("div");
    stats.classList.add("today-widget-stats");
    stats.append(createStat(4, "lessen"), createStat(2, "taken"));

    preview.append(title, stats);
    return preview;
  }
}

registerWidget(new TodayWidget());
