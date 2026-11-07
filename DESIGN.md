---
name: riskboard
description: Portfolio risk dashboard printed like security paper; loss is engraved, not filled.
colors:
  z0: "#0a1310"
  z1: "#0e1915"
  z2: "#13211c"
  z3: "#1a2b25"
  z4: "#243a32"
  z5: "#314a40"
  z6: "#48625a"
  z7: "#6c857a"
  z8: "#96ab9f"
  z9: "#c3cfc5"
  z10: "#ede7d7"
  loss: "#ef5c42"
  loss-soft: "rgba(239, 92, 66, 0.14)"
  own: "#d4a862"
  control: "#8db4ea"
  control-dim: "rgba(141, 180, 234, 0.16)"
  hedge: "#48b28c"
typography:
  display:
    fontFamily: "'Bodoni Moda Variable', 'Bodoni 72', 'Didot', Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.01em"
  denomination:
    fontFamily: "'Bodoni Moda Variable', 'Bodoni 72', 'Didot', Georgia, serif"
    fontSize: "1.75rem"
    fontWeight: 500
    lineHeight: 1.05
    fontFeature: "lnum"
  headline:
    fontFamily: "'Bodoni Moda Variable', 'Bodoni 72', 'Didot', Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 600
  title:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 650
    fontVariation: "'wdth' 105"
    fontFeature: "tnum, lnum"
  body:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.45
    fontFeature: "tnum, lnum"
  body-small:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    letterSpacing: "0.06em"
    fontVariation: "'wdth' 112"
  serial:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    letterSpacing: "0.12em"
    fontVariation: "'wdth' 125"
  chart-tick:
    fontFamily: "'Archivo Variable', 'Archivo', system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 400
rounded:
  hairline: "2px"
  sm: "3px"
  point: "50%"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "24px"
  "6": "32px"
  "7": "48px"
components:
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.control}"
    rounded: "{rounded.sm}"
    padding: "7px 12px"
  button-outline-hover:
    backgroundColor: "{colors.control-dim}"
    textColor: "{colors.control}"
  text-button:
    backgroundColor: "transparent"
    textColor: "{colors.control}"
    typography: "{typography.body-small}"
    padding: "2px 0"
  icon-button:
    backgroundColor: "transparent"
    textColor: "{colors.z7}"
    rounded: "{rounded.sm}"
    size: "28px"
  icon-button-hover:
    backgroundColor: "{colors.loss-soft}"
    textColor: "{colors.loss}"
  segmented-option:
    backgroundColor: "transparent"
    textColor: "{colors.z8}"
    typography: "{typography.body-small}"
    padding: "5px 12px"
  segmented-option-selected:
    backgroundColor: "{colors.control-dim}"
    textColor: "{colors.control}"
  input:
    backgroundColor: "{colors.z1}"
    textColor: "{colors.z10}"
    rounded: "{rounded.sm}"
    padding: "6px 8px"
  tooltip:
    backgroundColor: "{colors.z1}"
    textColor: "{colors.z10}"
    typography: "{typography.body-small}"
    rounded: "{rounded.sm}"
    padding: "5px 8px"
  synthetic-flag:
    backgroundColor: "transparent"
    textColor: "{colors.z10}"
    typography: "{typography.label}"
    rounded: "{rounded.hairline}"
    padding: "1px 6px"
---

# Design System: riskboard

## Overview

**Creative North Star: "Security Paper"**

riskboard prints portfolio risk the way banknotes and bond certificates print value: in fine engraved line on a dark intaglio-green ground. Anything beyond a threshold (the loss tail of the return distribution, a hedging contribution) is rendered as hatching rather than a solid fill, so "past the line" reads as a texture. Amounts that matter are set in a Didone face like the denomination on a note; everything operational is set in a width-variable grotesque with tabular figures.

The interface is dense and ruled, not carded. Panels are separated by 1px hairline rules and whitespace; there are no boxed tiles, no background panels and no resting shadows. Security-printing devices carry real information or real labelling: the guilloche band under the masthead changes amplitude with the portfolio's annualised volatility, the microprint rules around the statement line repeat the synthetic-data disclaimer, and the portfolio serial identifies the current holdings.

Colour is assigned by job, not by decoration. The neutral world is one stepped green ramp (z0 to z10). Four hues each carry one meaning: vermilion for loss, bronze for the user's own portfolio, engraving blue for anything operable, banknote green for hedging in data. The system rejects the near-black, neon-cyan trading dashboard with identical stat tiles.

**Key Characteristics:**
- Dark intaglio-green ground; every neutral comes from the eleven-step z ramp.
- Loss and tail regions are hatched in fine line, outlined in vermilion, never filled solid.
- Didone denomination numerals for headline amounts and section heads; Archivo with width axis and tabular figures for UI.
- Hairline rules divide content; no cards, no resting elevation.
- Security-print ornaments (guilloche, microprint, serial) are data-bound or disclosure-bound, never filler.

## Colors

A low-chroma green-black ground with four sparing hues, each owning exactly one meaning.

### Primary
- **Engraving Blue** (control): every operable thing and nothing else. Outline buttons, text-button presets, selected segmented option, slider fill and thumb, focus ring, input focus border, caret colour, text selection. Its tinted fill (control-dim) marks hover and selection on controls.

### Secondary
- **Serial Vermilion** (loss): loss beyond a threshold only. CVaR denominations, maximum drawdown, the VaR marker lines and labels on the histogram, the hatch and outline of tail bins, and the hover state of the remove-holding button (loss-soft fill).

### Tertiary
- **Aged Bronze** (own): the user's own portfolio. The portfolio serial number, held tickers in the correlation heatmap, the "Your portfolio" marker and plate on the frontier, and the moved-row dot in the risk-contribution list.
- **Banknote Green** (hedge): data encoding for hedging only. The negative end of the correlation heatmap's diverging ramp and the hatched share bar of a holding whose risk contribution is negative.

### Neutral
- **Intaglio Black** (z0): page ground; also the halo stroke behind labels drawn over chart data, and the fill of slider thumbs.
- **Plate Green** (z1): field and tooltip background, the one raised surface.
- **Deep Plate** (z2): asset-dot fill and the zero point of the heatmap ramp.
- **Grid Green** (z3): chart gridlines, soft row rules (rule-soft), heatmap diagonal.
- **Rule Green** (z4): primary hairline rules (rule) under panel heads, masthead, rail border, statement line.
- **Muted Plate** (z5): histogram bins, field and segmented borders, slider track, guilloche and microprint ink.
- **Axis Green** (z6): chart axes, zero line in risk bars, tooltip border.
- **Faded Green** (z7): zero-weight holdings, inactive confidence stops, weight-bar outline, idle icon buttons, hover border on fields.
- **Sage** (z8): secondary text (text-2), chart ticks and axis titles.
- **Pale Sage** (z9): share-of-risk hatching, heatmap values, asset-dot outlines.
- **Paper White** (z10): primary text and figures, frontier curve, normal-fit curve.

### Named Rules
**The One Job Rule.** Vermilion means loss, bronze means yours, blue means you can operate it, green means it hedges. A hue never appears outside its job, and no fifth hue is added.

**The Stepped Ramp Rule.** Neutrals snap to the z0 to z10 ramp. Do not interpolate an in-between grey or use opacity on paper white to fake one.

## Typography

**Display Font:** Bodoni Moda Variable (with Bodoni 72, Didot, Georgia)
**Body Font:** Archivo Variable with width axis (with Archivo, system-ui)

**Character:** A high-contrast Didone sets the denominations and section heads like the value on a note; a slightly widened grotesque with tabular, lining figures does the reading and operating. Both are bundled locally through Fontsource so the app runs offline.

### Hierarchy
- **Display** (Bodoni 600, 1.75rem, line-height 1): the riskboard wordmark and the empty-state heading.
- **Denomination** (Bodoni 500, 1.75rem, line-height 1.05, lining figures): VaR and CVaR money amounts in the method table. The only place figures are set in the serif.
- **Headline** (Bodoni 600, 1.25rem): panel and rail section heads (Holdings, Value at Risk, Correlation).
- **Title** (Archivo 650, 1rem, width 105): statement-line figures; also the VaR reading sentence at 1rem/1.5, max 46ch.
- **Body** (Archivo 400, 0.875rem, line-height 1.45, tabular lining figures): default text and all table figures.
- **Body small** (Archivo, 0.75rem): notes, captions, footnotes, statement labels, presets; prose capped at 60 to 72ch.
- **Label** (Archivo 500 to 600, 0.6875rem, width 112, 0.06em tracking, uppercase): form-control labels, table column heads, the synthetic-data flag, the serial caption.
- **Serial** (Archivo 500, 1rem, width 125, 0.12em tracking): the portfolio serial only.
- **Chart tick** (Archivo, 11px fixed): axis ticks, axis titles, VaR line labels; heatmap values at 9px.

### Named Rules
**The Denomination Rule.** The serif is for amounts and headings. Operable text, labels and every comparable column of figures stay in Archivo with tabular numerals.

**The Fixed Label Rule.** Chart text is set at fixed pixel sizes and never scales with the SVG; labels over data carry a 3px intaglio-black halo (paint-order stroke) so they stay legible.

**The Label Is Not a Kicker Rule.** Uppercase tracked labels name a control, a column or a disclosure. They never sit above a heading as an eyebrow.

## Layout

A full-width two-column shell: a sticky left rail (300 to 340px) holding the portfolio editor, divided by a hairline from the main work column (padding 24px 32px 48px, panels stacked with a 48px gap). The masthead spans both, with wordmark, dataset note and serial on a three-column grid above the guilloche band.

Inside the work column, paired content uses unequal fractional splits: the VaR table and histogram at 5fr/7fr, correlation and frontier at 5fr/6fr. Both collapse to one column at 1280px. At 900px the rail becomes static and stacks above the work column, the masthead note drops to its own row, the statement line turns into a two-column list of label and figure, and risk-bar columns tighten.

Spacing runs on a 4px base (4, 8, 12, 16, 24, 32, 48). Rows inside lists use 8px vertical rhythm with a soft rule beneath; panel heads use 8px under the heading and a rule, then 12px before content.

**The Whole Measure Rule.** Figures sit in right-aligned, fixed-width columns so comparable numbers line up digit for digit across rows.

## Elevation & Depth

Flat. Depth comes from rules and the stepped ramp, not from lift. The only raised surface is the chart tooltip, which floats over data on z1 with a z6 border and a soft ambient shadow.

### Shadow Vocabulary
- **Tooltip float** (`box-shadow: 0 6px 18px rgba(0, 0, 0, 0.45)`): chart tooltips only, because they overlap plotted data.

### Named Rules
**The Ruled Not Boxed Rule.** Sections are separated by 1px hairlines (rule z4, rule-soft z3). Never wrap a panel or stat in a filled or shadowed card.

## Shapes

Nearly square. Rectangular controls take a 3px radius (buttons, fields, segmented groups, tooltips); the synthetic flag and focus ring take 2px. Points are true circles: slider thumbs, asset dots sized by portfolio weight, the bronze portfolio marker and the moved-row dot. The minimum-variance point is a diamond. Strokes are fine: 0.6 to 0.7px for engraved ornament (seal, guilloche), 1 to 1.5px for data lines, 2px only for the focus ring and slider thumb border.

**The Engraved Fill Rule.** Regions beyond a threshold are filled with a line pattern (45 degree hatch for the loss tail and hedge bars, horizontal 1px-in-2.5px lines for share-of-risk bars), never a flat block of colour.

## Components

### Buttons
Quiet and outlined; the blue says "operable" on its own.
- **Shape:** gently squared (3px).
- **Outline button:** transparent with a 1px engraving-blue border and blue 600 text, padding 7px 12px, optional 16px line icon. Used for the single "Add" action.
- **Hover / Focus:** blue tint fill (control-dim) over 160ms; focus is a 2px blue outline offset 2px.
- **Text button:** blue 0.75rem text with a 35%-opacity underline at 3px offset that goes solid on hover. Used for presets and "Rescale to 100%".
- **Icon button:** 28px square, faded-green icon; on hover turns vermilion on loss-soft, because it removes a holding.
- **Disabled:** 40% opacity, not-allowed cursor.

### Segmented control
- **Style:** inline group with a 1px z5 border and 3px radius, z5 dividers between options, 0.75rem sage text.
- **State:** the checked option takes control-dim fill and blue 650 text; unchecked options brighten to paper white on hover. Uses radio semantics.

### Inputs / Fields
- **Style:** z1 fill, 1px z5 border, 3px radius, padding 6px 8px; weight fields are 62px, right-aligned, 600.
- **Focus:** border shifts to engraving blue, no glow. Hover raises the border to z7.
- **Range:** a 2px engraved track (z5, filled blue to the value) with a ground-filled circular thumb ringed in 2px blue.

### Masthead
Bodoni wordmark beside a z8 rosette seal (twelve rotated ellipses at 0.6px), the dataset note led by an outlined uppercase "Synthetic data" flag, and the bronze serial at right. Beneath, a 28px guilloche of nine phase-shifted strands in z5 whose amplitude tracks annualised volatility and eases over 600ms.

### Statement line
Five standing figures on one ruled line, each a small sage label and a 1rem paper-white figure, separated by soft vertical rules. Bracketed above and below by a 5px microprint rule in z5 repeating the synthetic-data disclaimer (aria-hidden).

### Method table (signature)
Ruled rows, uppercase column heads, a 22px line key per method (solid, 5 3 dash, 1.5 2.5 dot) that matches the method's line on the histogram. VaR and CVaR are Bodoni denominations, CVaR in vermilion, each with its percentage beneath in small sage.

### Risk-contribution rows (signature)
34px rows on soft rules: ticker, a track with an outlined weight bar and a line-hatched share bar, then weight, share and ratio columns. Rows re-rank in place with a 520ms transform; a moved row shows a bronze dot that fades over 900ms. Ratios above 1.25x get a double underline instead of a colour.

### Charts
Hand-written SVG. Gridlines z3, axes z6, ticks z8 at 11px. Histogram bins in z5 (z7 on hover), tail bins hatched and outlined in vermilion, normal fit in paper white at 85% opacity. The correlation heatmap is a linear diverging ramp from z2 toward banknote green (negative) and paper (positive), with values printed in cells when they are at least 24px wide and an aria-live readout below. The frontier plots a green random-portfolio cloud, a paper-white curve and the bronze "Your portfolio" plate.

### Motion
One easing, `cubic-bezier(0.16, 1, 0.3, 1)`, for every state change: 120 to 160ms for hover, 300 to 520ms for layout re-ranks and bar widths, 600ms for the guilloche. All transitions drop to 0ms under prefers-reduced-motion.

## Do's and Don'ts

### Do:
- **Do** draw any region beyond a threshold as hatching outlined in vermilion (the tail-hatch pattern, 3.5px spacing, 1.2px weight).
- **Do** take every neutral from the z0 to z10 ramp and reserve each hue for its one job.
- **Do** set money amounts that answer the page's question as Bodoni denominations, and every other figure in Archivo with tabular lining numerals.
- **Do** separate content with 1px hairline rules and 48px panel gaps.
- **Do** bind ornament to data or disclosure: guilloche to volatility, microprint to the synthetic-data notice, serial to the holdings.
- **Do** pair every colour encoding with a label, pattern or number so colour never carries meaning alone.

### Don't:
- **Don't** fill loss areas with solid red blocks or red-tinted backgrounds.
- **Don't** build identical stat tiles, cards or neon-on-black trading-terminal chrome.
- **Don't** use engraving blue on anything that cannot be operated, or bronze on anything that is not the user's portfolio.
- **Don't** add resting shadows; the tooltip float is the only shadow.
- **Don't** scale chart text with the SVG viewBox.
- **Don't** place uppercase tracked labels above headings as eyebrows.
