// @ts-nocheck
import { WidgetBase, registerWidget } from "./widgets.js";

class NotesWidget extends WidgetBase {
  saveTimeout;
  textarea;
  status;

  get category() {
    return "other";
  }

  get name() {
    return "NotesWidget";
  }

  defaultSettings() {
    return {
      text: "",
    };
  }

  scheduleSave() {
    clearTimeout(this.saveTimeout);
    this.status.textContent = "Saving...";
    this.saveTimeout = setTimeout(async () => {
      await this.setSetting("text", this.textarea.value);
      this.status.textContent = "Saved";
    }, 350);
  }

  async createContent() {
    const container = document.createElement("div");
    container.classList.add("notes-widget");

    const header = document.createElement("div");
    header.classList.add("notes-widget-header");

    const title = document.createElement("h2");
    title.textContent = "Notes++";

    this.status = document.createElement("span");
    this.status.textContent = "Saved";

    header.append(title, this.status);

    this.textarea = document.createElement("textarea");
    this.textarea.placeholder = "Quick notes, reminders, links...";
    this.textarea.value = this.settings.text || "";
    this.textarea.addEventListener("input", () => this.scheduleSave());

    container.append(header, this.textarea);
    return container;
  }

  async createPreview() {
    const preview = document.createElement("div");
    preview.classList.add("notes-widget", "notes-widget-preview");

    const title = document.createElement("h2");
    title.textContent = "Notes++";

    const lines = document.createElement("div");
    lines.classList.add("notes-preview-lines");
    lines.innerHTML = "<span></span><span></span><span></span>";

    preview.append(title, lines);
    return preview;
  }
}

registerWidget(new NotesWidget());
