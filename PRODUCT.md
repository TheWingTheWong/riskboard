# Product

<!-- impeccable:product-schema 1 -->

> Recorded from the build brief. No interview channel was available in this session, so every fact below is inferred from that brief and marked as such where it goes beyond it.

## Platform

web

## Stack

Pinned by the brief: TypeScript, React, Vite; static build (`npm run build`); charts are hand-written SVG components, no chart library; vitest for the pure `risk` module.

## Users

(Inferred) Portfolio managers, risk analysts, finance students and engineers who want to see how a change in weights moves a portfolio's tail risk. They sit at a desk with a laptop or external monitor, often comparing several weightings in one sitting.

## Product Purpose

riskboard lets a user edit a portfolio (tickers and weights) and immediately see its risk: historical, parametric and Monte Carlo VaR, CVaR, volatility, beta against an index, correlation, per-asset risk contribution and where the portfolio sits relative to the mean-variance efficient frontier. Success: a user can answer "what is my 99% one-day loss and which holding drives it" in under a minute, and trust the arithmetic because it is open and tested.

## Positioning

Three VaR methods computed side by side from the same data in the browser, with the math in a small, unit-tested TypeScript module anyone can read. No account, no API key, no server.

## Capabilities and Constraints

- Bundled data is SYNTHETIC: 15 fictional assets and a fictional benchmark (RBX), 756 trading days, generated from a seeded factor model. It must be labelled synthetic in the UI and README.
- Confidence levels: 90, 95, 99%. Horizons: 1 and 10 trading days (square-root-of-time for historical).
- Long-only weights entered in percent; normalised to 100% for computation.
- Must run fully offline: fonts and assets are bundled, nothing fetched at runtime.

## Evidence on Hand

- `src/data/returns.json`: the synthetic dataset. No real market data, customers, users, or benchmarks exist; none may be implied.

## Product Principles

1. Numbers first: every visual answers a risk question with a figure the user can read off.
2. Show the method: label which model produced each number and its assumptions.
3. Honest data: synthetic is stated plainly, never dressed up as real.
4. Instant feedback: a weight change updates every panel without a submit step.

## Accessibility & Inclusion

(Inferred) WCAG AA contrast; colour is never the only carrier of meaning in charts (diverging heatmap carries numeric labels on hover/focus, VaR lines are labelled); keyboard-operable editor and confidence control.
