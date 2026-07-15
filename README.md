# 🌿 Life OS — your all-in-one life planner

A cozy, Notion-inspired **operating system for your life**: one dashboard where everything you track comes together, with detail pages underneath — and a built-in AI assistant that can extend the app for you.

No server, no account, no build step. Open `index.html` (or host the folder anywhere, e.g. GitHub Pages) and everything is saved privately in your browser.

## ✨ What's inside

| Area | What it does |
|---|---|
| 🏡 **Dashboard** | Everything on one page: stats row, vision board, today's tasks, habits ring, weekly planner, upcoming events, finance snapshot, bookshelf, mood, gratitude, custom widgets |
| 🌱 **Habits** | Daily check-offs, per-habit 🔥 current & 🏆 best streaks, a **perfect-day streak** (all habits done, day after day), a 20-week consistency heatmap and 7-day completion chart |
| 🎯 **Goals** | Vision-board cards with milestones, progress bars, categories, and your "why" |
| 📅 **Planner** | Monday–Sunday weekly board plus today's task list and important dated events |
| ✒️ **Journal** | Gratitude, reflections and free entries, plus a mood-per-day month strip |
| 🪙 **Finance** | Income/expense log, monthly balance, 6-month income-vs-expense chart, category breakdown |
| 📚 **Books** | Shelf with want-to-read / reading / read, star ratings, "currently reading" on the dashboard |
| 🍽️ **Meals** | Weekly meal planner (breakfast/lunch/dinner per day) plus a shopping list; today's plate on the dashboard |
| 💪 **Workout** | Log sessions by type and minutes, weekly stats, 7-day minutes chart; movement summary on the dashboard |
| 🧩 **Widgets** | Build your own dashboard widgets: counters (water 💧), daily trackers (sleep hours), checklists, sticky notes |
| ✨ **Sage, the AI assistant** | Floating chat that adds habits/tasks/goals/expenses/books, logs journal entries, builds new widgets, switches themes and reports your progress |

Two hand-crafted themes — **Cream** (light) ☀️ and **Cocoa** (dark) 🌙 — with a hand-drawn illustrated header.

## 🤖 The assistant

Sage works out of the box with built-in commands (type `help` in the chat):

```
add habit Stretch 🧘
add task Buy groceries on friday
add expense 45 food
create a water tracker
how am I doing?
```

For full natural-language mode (planning your week, designing widgets, open conversation), add an **Anthropic API key** in ⚙️ Settings. The key is stored only in your browser and calls Claude directly.

## 💾 Your data

- Stored in `localStorage` under `lifeos-v1` — private to your browser.
- ⚙️ Settings → **Export** downloads a JSON backup; **Import** restores it on any device.

## 🚀 Running it

```bash
# any static server works — or just double-click index.html
python3 -m http.server 8080
```

Then open http://localhost:8080.

### GitHub Pages

A workflow at `.github/workflows/pages.yml` deploys the app automatically on every push to `main`. After the first merge, the site appears at `https://<your-username>.github.io/Bushdio-90/`. (If the first run reports Pages isn't enabled, flip Settings → Pages → Source to **GitHub Actions** and re-run it.)

