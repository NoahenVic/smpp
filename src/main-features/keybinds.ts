// @ts-nocheck
import { keybinds } from "./main.js";
import { do_qm } from "./quick-menu/quick.js";
import { openSettingsWindow } from "./settings/main-settings.js";
import { openGlobalChat } from "./globalchat.js";
import {
  widgetEditMode,
  widgetEditModeInit,
  setEditMode,
  toggleBag,
} from "../widgets/widgets.js";
import { openURL } from "../common/utils.js";

export type Keybind = Uppercase<string> | symbol | "None" | "Space";

function openPageShortcut(selector: string, fallbackUrl: string) {
  const button = document.querySelector(selector) as HTMLElement | null;
  if (button) {
    button.click();
    return;
  }
  openURL(fallbackUrl);
}

function handlePageNavigationKeybind(key: string): boolean {
  if (!keybinds?.pageNavigation) return false;

  switch (key) {
    case keybinds.pageNavigation.home:
      openURL("/");
      return true;
    case keybinds.pageNavigation.messages:
      openPageShortcut(".js-btn-messages", "/messages");
      return true;
    case keybinds.pageNavigation.planner:
      openURL("/planner");
      return true;
    default:
      return false;
  }
}

document.addEventListener("keyup", async (e) => {
  if (e.target?.tagName === "INPUT") return;
  if (e.target?.tagName === "TEXTAREA") return;
  if (document.getElementById("tinymce")) return;

  const key =
    e.key === " " ? "Space" : e.key.length === 1 ? e.key.toUpperCase() : e.key; // this is so readable i love it

  if (
    (typeof keybinds === "undefined" ||
      !keybinds ||
      Object.keys(keybinds).length === 0) &&
    key === ":"
  ) {
    do_qm("dmenu");
    return;
  }

  if (handlePageNavigationKeybind(key)) return;

  // General
  switch (key) {
    case keybinds.dmenu:
      do_qm(keybinds.dmenu);
      break;
    case keybinds.settings:
      openSettingsWindow(e);
      break;
    case keybinds.gc:
      openGlobalChat(e);
      break;
  }

  // Widget
  if (!widgetEditModeInit) return;

  if (key === "Escape" && widgetEditMode) {
    await setEditMode(false);
    return;
  }

  switch (key) {
    case keybinds.widgetEditMode:
      await setEditMode(true);
      break;
    case keybinds.widgetBag:
      if (widgetEditMode) toggleBag();
      break;
  }
});
