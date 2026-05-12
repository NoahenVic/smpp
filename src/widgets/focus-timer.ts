// @ts-nocheck
import { WidgetBase, registerWidget } from "./widgets.js";

const MODES = {
  focus: { label: "Focus", seconds: 25 * 60 },
  short: { label: "Break", seconds: 5 * 60 },
  long: { label: "Long break", seconds: 15 * 60 },
};

function formatSeconds(seconds) {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

class FocusTimerWidget extends WidgetBase {
  mode = "focus";
  remaining = MODES.focus.seconds;
  interval;
  running = false;
  timeElement;
  modeElement;
  startButton;

  get category() {
    return "other";
  }

  get name() {
    return "FocusTimerWidget";
  }

  defaultSettings() {
    return {
      completedSessions: 0,
    };
  }

  syncDisplay() {
    this.modeElement.textContent = MODES[this.mode].label;
    this.timeElement.textContent = formatSeconds(this.remaining);
    this.startButton.textContent = this.running ? "Pause" : "Start";
  }

  setMode(mode) {
    this.stop();
    this.mode = mode;
    this.remaining = MODES[mode].seconds;
    this.syncDisplay();
  }

  stop() {
    clearInterval(this.interval);
    this.interval = null;
    this.running = false;
  }

  async complete() {
    this.stop();
    if (this.mode === "focus") {
      await this.setSetting(
        "completedSessions",
        Number(this.settings.completedSessions || 0) + 1
      );
    }
    this.setMode(this.mode === "focus" ? "short" : "focus");
  }

  toggle() {
    if (this.running) {
      this.stop();
      this.syncDisplay();
      return;
    }

    this.running = true;
    this.interval = setInterval(() => {
      this.remaining -= 1;
      if (this.remaining <= 0) {
        this.complete();
        return;
      }
      this.syncDisplay();
    }, 1000);
    this.syncDisplay();
  }

  createModeButton(mode) {
    const button = document.createElement("button");
    button.textContent = MODES[mode].label;
    button.addEventListener("click", () => this.setMode(mode));
    return button;
  }

  async createContent() {
    const container = document.createElement("div");
    container.classList.add("focus-timer-widget");

    this.modeElement = document.createElement("span");
    this.modeElement.classList.add("focus-timer-mode");

    this.timeElement = document.createElement("strong");
    this.timeElement.classList.add("focus-timer-time");

    this.startButton = document.createElement("button");
    this.startButton.classList.add("focus-timer-main-button");
    this.startButton.addEventListener("click", () => this.toggle());

    const modeButtons = document.createElement("div");
    modeButtons.classList.add("focus-timer-mode-buttons");
    modeButtons.append(
      this.createModeButton("focus"),
      this.createModeButton("short"),
      this.createModeButton("long")
    );

    const sessions = document.createElement("span");
    sessions.classList.add("focus-timer-sessions");
    sessions.textContent = `${this.settings.completedSessions || 0} sessions`;

    container.append(
      this.modeElement,
      this.timeElement,
      this.startButton,
      modeButtons,
      sessions
    );
    this.syncDisplay();
    return container;
  }

  async createPreview() {
    const preview = document.createElement("div");
    preview.classList.add("focus-timer-widget", "focus-timer-preview");

    const title = document.createElement("span");
    title.classList.add("focus-timer-mode");
    title.textContent = "Focus Timer";

    const time = document.createElement("strong");
    time.classList.add("focus-timer-time");
    time.textContent = "25:00";

    preview.append(title, time);
    return preview;
  }

  onRemove() {
    this.stop();
  }
}

registerWidget(new FocusTimerWidget());
