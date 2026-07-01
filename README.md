# BiDi Bracket Fixer for Google Docs

A Google Docs add-on that fixes brackets — parentheses `()`, square brackets `[]`, and curly braces `{}` — that appear **flipped or on the wrong side** when your text mixes right-to-left languages (Hebrew, Arabic) with left-to-right ones (English, and more).

<!-- Replace with a real GIF of the tool in action — this is the single most convincing thing in the whole README -->
![Demo](docs/demo.gif)

---

## The problem

When you write mixed-direction text, an opening bracket sits between two letters of opposite direction and gets "confused" about which way to face. For example, typing a Hebrew word, a space, then `(English)` can make the opening parenthesis flip to the wrong side:

```
Wrong:   שלום )World(
Right:   שלום (World)
```

This happens because brackets are **direction-neutral** characters — they have no direction of their own, so they inherit it from their surroundings. At the seam between two languages, they guess wrong.

## The fix

The add-on scans your document and inserts an **invisible directional mark** (`U+200E` LRM or `U+200F` RLM) right before any bracket that sits on a genuine direction boundary. The mark gives the bracket a direction to anchor to, so it faces the right way. It's invisible, so your text looks identical — the brackets just stop flipping.

Crucially, it only touches brackets that are actually on a boundary between opposite directions. A bracket sitting between two English words (or two Hebrew words) is left untouched, because it wasn't broken to begin with.

---

## Installation

This add-on isn't on the Marketplace — you set it up from your own copy in about two minutes.

1. Open any Google Doc.
2. Go to **Extensions → Apps Script**. A new editor tab opens.
3. Delete the placeholder code in `Code.gs` and paste in the contents of [`Code.gs`](Code.gs) from this repo.
4. Click the **+** next to *Files*, choose **HTML**, name it `Sidebar` (exactly), and paste in the contents of [`Sidebar.html`](Sidebar.html).
5. Save (Ctrl/Cmd + S).
6. Go back to your Google Doc and **reload the page**. A new **Fixing BiDi** menu appears in the top bar.

## Usage

1. Click **Fixing BiDi → Open Window** in the menu bar.
2. **The first time only:** Google will ask you to authorize the script (see [First-run permissions](#first-run-permissions) below). Approve it once, then click the menu item again.
3. A sidebar opens. Click **Fix Text Direction**.
4. The tool scans the document and reports how many corrections it made, grouped by direction transition.

You can run it as many times as you like — though note it doesn't yet skip brackets that already have a mark (see [Known limitations](#known-limitations)).

---

## First-run-permissions

The very first time you open the tool, Google walks you through a one-time authorization. You'll see two things:

**1. A permission request.** The add-on asks for access to the current document because it needs to read the text (to find boundary brackets) and edit it (to insert the invisible marks). It does **not** send your document anywhere — all processing happens inside Google's own Apps Script runtime, and nothing leaves your Google account.

**2. A "Google hasn't verified this app" screen.** This is expected and safe here. The warning appears for any script that hasn't gone through Google's formal review — it says nothing about the code being harmful. In this case *you* are the one who pasted in the code and are running it on your own document, so there's no third party involved at all; it's like running a script you wrote yourself.

To get past it:

1. On the warning screen, click **Advanced** (bottom-left).
2. Click **Go to *[project name]* (unsafe)**.
3. Review the permissions and click **Allow**.

The word "unsafe" is Google's generic label for any unverified script — it doesn't mean this one is. The exact button wording may differ slightly by interface language, but the flow is the same. You only need to do this once; after that the tool just works.

---

## How it works (the interesting parts)

*This section is for the curious — and for anyone reviewing the code.*

A few design decisions were non-obvious and worth explaining:

**Why `findText` + `insertText` instead of `replaceText`.**
The natural tool for "replace X with Y" is `replaceText`, but it forces you to reconstruct whatever you matched — and Apps Script's regex engine (RE2) doesn't reliably support the `$1` backreference in replacements here. Since I only need to *insert* a character (not rewrite anything), it's cleaner to find the position of the bracket and inject the mark there, leaving the surrounding letters completely untouched.

**Why scanning runs from end to start.**
Inserting a character shifts every position after it by one. If you collect all match positions and then insert front-to-back, every insertion invalidates the positions you haven't handled yet. Walking backwards means each insertion only affects positions you've already processed — so the un-handled offsets stay accurate. This is a general pattern for any in-place edit over a collection of offsets.

**Why RE2 has no look-behind — and how I worked around it.**
The correct rule is "a bracket *between* two opposite-direction letters." Expressing that wants a look-behind ("only if preceded by X"), which RE2 doesn't support. So instead the pattern matches the whole trio — `[before-letter] space? [bracket] [after-letter]` — and then a small loop locates the bracket *within* the match to know exactly where to insert. Only genuine direction transitions match, which is why same-direction brackets are safely ignored.

**Data-driven direction rules.**
Rather than hard-coding one block per language, the languages live in two character-class groups (all RTL ranges, all LTR ranges), and two rules describe the two possible transitions (RTL→LTR needs an LRM, LTR→RTL needs an RLM). Adding a language is a one-line change to a range string.

---

## Known limitations

- **Re-running stacks marks.** Running the tool twice adds a second mark before the same bracket, since it doesn't check for an existing one. Harmless visually, but worth knowing. (Planned fix: skip brackets already preceded by a mark.)
- **Batch, not live.** It fixes an existing document on demand — it doesn't correct text as you type. For live correction you'd need an OS-level tool (e.g. AutoHotkey on Windows) that intercepts keystrokes before Google Docs sees them.
- **Boundary brackets only.** A bracket at the very start of a paragraph, or one preceded by punctuation rather than a letter, won't be caught — because without two opposite-direction anchors there's usually no BiDi problem to fix.
- **Paragraph-level direction is out of scope.** This tool fixes character-order issues within a line. Whole-paragraph alignment/direction is a separate property and isn't addressed here.

## Supported languages

RTL: Hebrew, Arabic (incl. basic Persian/Urdu), Syriac, Thaana, N'Ko.
LTR: Latin (basic + extended: French, Spanish, German…), Greek, Cyrillic, Armenian, Devanagari.

Adding more is a one-line edit — see the range strings at the top of `fixBidiBrackets` in [`Code.gs`](Code.gs).

## License

MIT — see [LICENSE](LICENSE).
