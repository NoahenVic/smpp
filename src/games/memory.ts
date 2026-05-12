// @ts-nocheck
import { registerWidget, WidgetBase } from "../widgets/widgets.js";

const SYMBOLS = ["A", "B", "C", "D", "E", "F"];

function shuffle(values) {
  const items = [...values];
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

class MemoryWidget extends WidgetBase {
  cards = [];
  selected = [];
  locked = false;
  moves = 0;
  matches = 0;
  movesElement;
  bestElement;
  board;

  get category() {
    return "games";
  }

  get name() {
    return "MemoryWidget";
  }

  defaultSettings() {
    return {
      bestMoves: null,
    };
  }

  renderStats() {
    this.movesElement.textContent = `${this.moves} moves`;
    this.bestElement.textContent = this.settings.bestMoves
      ? `Best: ${this.settings.bestMoves}`
      : "Best: --";
  }

  createCard(symbol, index) {
    const card = document.createElement("button");
    card.classList.add("memory-card");
    card.type = "button";
    card.dataset.symbol = symbol;
    card.dataset.index = String(index);
    card.textContent = "?";
    card.addEventListener("click", () => this.pickCard(card));
    return card;
  }

  resetGame() {
    this.moves = 0;
    this.matches = 0;
    this.selected = [];
    this.locked = false;
    this.cards = shuffle([...SYMBOLS, ...SYMBOLS]);
    this.board.innerHTML = "";
    this.cards.forEach((symbol, index) => {
      this.board.appendChild(this.createCard(symbol, index));
    });
    this.renderStats();
  }

  reveal(card) {
    card.classList.add("is-open");
    card.textContent = card.dataset.symbol;
  }

  hide(card) {
    card.classList.remove("is-open");
    card.textContent = "?";
  }

  async finishIfDone() {
    if (this.matches !== SYMBOLS.length) return;

    if (!this.settings.bestMoves || this.moves < this.settings.bestMoves) {
      await this.setSetting("bestMoves", this.moves);
    }
    this.renderStats();
  }

  async pickCard(card) {
    if (
      this.locked ||
      card.classList.contains("is-open") ||
      card.classList.contains("is-matched")
    ) {
      return;
    }

    this.reveal(card);
    this.selected.push(card);

    if (this.selected.length !== 2) return;

    this.moves += 1;
    this.renderStats();
    const [first, second] = this.selected;

    if (first.dataset.symbol === second.dataset.symbol) {
      first.classList.add("is-matched");
      second.classList.add("is-matched");
      this.selected = [];
      this.matches += 1;
      await this.finishIfDone();
      return;
    }

    this.locked = true;
    setTimeout(() => {
      this.hide(first);
      this.hide(second);
      this.selected = [];
      this.locked = false;
    }, 650);
  }

  async createContent() {
    const container = document.createElement("div");
    container.classList.add("memory-game", "game-container");

    const title = document.createElement("h2");
    title.classList.add("game-title");
    title.textContent = "Memory++";

    const stats = document.createElement("div");
    stats.classList.add("memory-stats");
    this.movesElement = document.createElement("span");
    this.bestElement = document.createElement("span");
    stats.append(this.movesElement, this.bestElement);

    this.board = document.createElement("div");
    this.board.classList.add("memory-board");

    const resetButton = document.createElement("button");
    resetButton.classList.add("game-button");
    resetButton.textContent = "New game";
    resetButton.addEventListener("click", () => this.resetGame());

    container.append(title, stats, this.board, resetButton);
    this.resetGame();
    return container;
  }

  async createPreview() {
    const preview = document.createElement("div");
    preview.classList.add("memory-game", "game-container", "memory-preview");

    const title = document.createElement("h2");
    title.classList.add("game-title");
    title.textContent = "Memory++";

    const board = document.createElement("div");
    board.classList.add("memory-board");
    for (let i = 0; i < 6; i++) {
      const card = document.createElement("div");
      card.classList.add("memory-card");
      card.textContent = "?";
      board.appendChild(card);
    }

    preview.append(title, board);
    return preview;
  }
}

registerWidget(new MemoryWidget());
