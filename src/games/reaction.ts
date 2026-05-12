// @ts-nocheck
import { registerWidget, WidgetBase } from "../widgets/widgets.js";

class ReactionWidget extends WidgetBase {
  timeoutId;
  startedAt;
  state = "idle";
  root;
  status;
  score;
  button;

  get category() {
    return "games";
  }

  get name() {
    return "ReactionWidget";
  }

  defaultSettings() {
    return {
      bestTime: null,
    };
  }

  clearPendingRound() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  setState(state) {
    this.state = state;
    this.root.dataset.state = state;
  }

  renderScore() {
    this.score.textContent = this.settings.bestTime
      ? `Best: ${this.settings.bestTime} ms`
      : "Best: --";
  }

  armRound() {
    this.clearPendingRound();
    this.setState("waiting");
    this.status.textContent = "Wait for green...";
    this.button.textContent = "Wait";

    const delay = 1200 + Math.random() * 2800;
    this.timeoutId = setTimeout(() => {
      this.startedAt = performance.now();
      this.setState("ready");
      this.status.textContent = "Click now!";
      this.button.textContent = "Click";
    }, delay);
  }

  async finishRound() {
    const reactionTime = Math.round(performance.now() - this.startedAt);
    this.setState("done");
    this.status.textContent = `${reactionTime} ms`;
    this.button.textContent = "Play again";

    if (!this.settings.bestTime || reactionTime < this.settings.bestTime) {
      await this.setSetting("bestTime", reactionTime);
      this.status.textContent = `${reactionTime} ms - new best`;
    }

    this.renderScore();
  }

  async handlePress() {
    if (
      this.state === "idle" ||
      this.state === "done" ||
      this.state === "early"
    ) {
      this.armRound();
      return;
    }

    if (this.state === "waiting") {
      this.clearPendingRound();
      this.setState("early");
      this.status.textContent = "Too soon";
      this.button.textContent = "Try again";
      return;
    }

    if (this.state === "ready") {
      await this.finishRound();
    }
  }

  async createContent() {
    this.root = document.createElement("div");
    this.root.classList.add("game-container", "reaction-game");
    this.root.dataset.state = "idle";

    const title = document.createElement("h2");
    title.classList.add("game-title");
    title.textContent = "Reaction++";

    this.score = document.createElement("span");
    this.score.classList.add("game-score");

    this.status = document.createElement("strong");
    this.status.classList.add("reaction-game-status");
    this.status.textContent = "Ready?";

    this.button = document.createElement("button");
    this.button.classList.add("game-button");
    this.button.textContent = "Play";
    this.button.addEventListener("click", () => this.handlePress());

    this.root.append(title, this.score, this.status, this.button);
    this.renderScore();
    return this.root;
  }

  async createPreview() {
    const preview = document.createElement("div");
    preview.classList.add(
      "game-container",
      "reaction-game",
      "reaction-preview"
    );

    const title = document.createElement("h2");
    title.classList.add("game-title");
    title.textContent = "Reaction++";

    const status = document.createElement("strong");
    status.classList.add("reaction-game-status");
    status.textContent = "Click fast";

    preview.append(title, status);
    return preview;
  }

  onRemove() {
    this.clearPendingRound();
  }
}

registerWidget(new ReactionWidget());
