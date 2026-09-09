# Omarchy Finance Widget — Product Specification

## 1. Project summary

Omarchy Finance Widget is a native Omarchy Shell plugin built for Quickshell. It provides a compact finance indicator in the Omarchy bar and an expanded panel for searching financial instruments, maintaining a watchlist, tracking one personal portfolio, and reviewing the performance of currently held positions.

The main product feature is an optional portfolio-performance indicator. When enabled, the compact widget shows the portfolio's net percentage return, weighted by remaining cost basis. When disabled, it shows the daily percentage change of the first instrument in the user's manually ordered watchlist.

The product is local-first, single-user, and requires no account, cloud service, or API key.

## 2. Problem and context

Omarchy users need a fast way to inspect markets and their current holdings without opening a browser or full trading application. Existing price tickers generally cover watchlists but do not model purchases, withdrawals, recurring management costs, foreign exchange effects, or aggregate portfolio performance.

This project combines two workflows:

1. Discover instruments through search and add them to a watchlist.
2. Track current holdings and calculate net performance from their purchase history.

The widget is informational. It is not a broker, accounting system, tax tool, or source of real-time market data.

## 3. Intended users and success outcome

### Intended user

An individual retail investor using a currently supported Omarchy release who wants a lightweight overview of one personal portfolio and one watchlist.

### Success outcome

The user can see portfolio performance at a glance, open a detailed overview, search and classify instruments, record position changes, and recover or transfer local data without using an external account.

Success is determined by the acceptance criteria in this document. The product collects no analytics or telemetry.

## 4. Goals

- Provide a native, theme-aware Omarchy bar widget on every monitor.
- Search the major classes of publicly quoted financial instruments.
- Keep watchlist instruments separate from portfolio instruments.
- Calculate current-position performance from multiple purchases and withdrawals.
- Include foreign exchange effects and optional recurring management costs.
- Display historical charts and transaction markers.
- Store all personal data locally and support JSON import and export.
- Operate with a free market-data source that requires no API key.

## 5. Non-goals

- Trade execution or broker integration.
- Multiple users, profiles, portfolios, or watchlists.
- Real-time prices.
- Realized gain or loss calculations.
- Recording sale proceeds.
- Dividend accounting.
- Tax reporting.
- Transaction commission tracking as a separate field. Purchase commissions are part of the entered cost basis.
- Cloud storage or synchronization.
- Alerts and notifications.
- Investment advice or recommendations.
- A standalone desktop application.
- A screener or discovery feed.
- Guaranteed coverage of instruments absent from the selected data provider.

## 6. User interface and primary flows

### 6.1 Compact bar widget

- The widget appears in the Omarchy bar on every monitor.
- One global position applies to all monitors: left, center, or right.
- The user changes the position from the widget's settings screen.
- When portfolio performance is enabled and the portfolio contains an active position, the widget shows the aggregate net return percentage.
- When portfolio performance is disabled, the widget shows the daily percentage change of the first watchlist instrument.
- The watchlist order is changed manually by drag-and-drop. New items are appended.
- If the selected mode has no data to display, the widget shows an em dash (`—`).
- Clicking the compact widget opens the expanded panel.

### 6.2 Expanded panel

The expanded panel contains:

- Portfolio overview.
- Watchlist.
- Instrument search.
- Settings.

The portfolio overview shows aggregate current value, aggregate remaining cost basis, accrued management costs, absolute profit or loss, and net percentage return. It contains one selectable row per instrument.

Each portfolio row shows the instrument's current price, currency, daily change, current position value, remaining cost basis, absolute profit or loss, and percentage return.

Selecting a portfolio instrument opens its detail view. The detail view shows:

- Current price and quote currency.
- Daily percentage change.
- Exchange or market.
- Market open or closed status when available.
- TER when applicable and available.
- Current position value.
- Remaining cost basis.
- Absolute and percentage profit or loss.
- Performance chart.
- Purchase and withdrawal history.
- A toggle that shows or hides purchase and withdrawal markers on the chart.
- Split and reverse-split events on the chart.

Chart periods are: one day, one week, one month, three months, one year, and maximum available history.

### 6.3 Search and classification

- Search accepts instrument name, ticker, or another identifier exposed by the provider.
- Supported classes are stocks, ETFs, ETCs, ETNs, indices, mutual funds, bonds, cryptocurrencies, foreign exchange instruments, and commodities.
- A search result can be added to the watchlist or receive a first purchase and enter the portfolio.
- Watchlist and portfolio membership are mutually exclusive.
- Adding the first purchase to a watchlist instrument moves it to the portfolio.
- An instrument absent from the provider produces only a `Not found` result. Manual creation of unsupported instruments is out of scope.

## 7. Position model

### 7.1 Purchases

Each purchase contains:

- Instrument identifier.
- Purchase date.
- Quantity, optional when cost basis is supplied.
- Cost basis, optional when quantity is supplied.
- Cost-basis currency when cost basis is supplied.

The purchase date is required. At least one of quantity or cost basis is required.

When both quantity and cost basis are supplied, they are treated as authoritative. The cost basis includes purchase commissions and any other acquisition cost the user wants included.

When only quantity is supplied, cost basis is estimated from the provider's historical price and the historical exchange rate for the purchase date. When only cost basis is supplied, quantity is estimated using the same data. Estimated values must be visibly identified as estimates.

An instrument can contain any number of purchases. Its weighted average cost is calculated across all purchases that remain in the active position.

### 7.2 Withdrawals and sales

A withdrawal represents a partial or total sale. It contains only:

- Withdrawal date.
- Quantity withdrawn.

Sale proceeds are not recorded. Withdrawals do not create realized profit or loss. They only reduce the active position.

The system uses the weighted-average-cost method. A withdrawal reduces quantity and remaining cost basis proportionally; the average cost per unit remains unchanged.

A withdrawal is invalid when it exceeds the quantity held on its date. A total withdrawal removes the instrument from active portfolio totals. The instrument remains available in local history and may be moved to the watchlist or deleted.

### 7.3 Corporate actions

- Splits and reverse splits automatically adjust quantity and average cost per unit.
- Total cost basis remains unchanged by a split.
- Dividends are ignored.

## 8. Performance calculations

All portfolio-level calculations use the configured base currency.

For an active position at time `t`:

```text
market_value(t) = active_quantity(t) * market_price(t)
total_capital(t) = remaining_cost_basis(t) + accrued_position_costs(t)
net_profit(t) = market_value(t) - total_capital(t)
net_return(t) = net_profit(t) / total_capital(t)
```

For the portfolio:

```text
portfolio_market_value(t) = sum of active position market values
portfolio_total_capital(t) = sum of active position total capital
                           + accrued portfolio-level costs
portfolio_net_profit(t) = portfolio_market_value(t) - portfolio_total_capital(t)
portfolio_net_return(t) = portfolio_net_profit(t) / portfolio_total_capital(t)
```

The aggregate return is therefore weighted by invested capital, not an arithmetic mean of instrument percentages.

Example:

```text
remaining cost basis = EUR 1,000
current market value = EUR 1,100
accrued management costs = EUR 20
net return = (1,100 - 1,000 - 20) / (1,000 + 20) = 7.84%
```

The historical performance chart applies only purchases, withdrawals, management-cost charges, and corporate actions that had occurred by each plotted timestamp.

## 9. Management costs and TER

Management costs are optional. They can apply to the entire portfolio or one instrument.

Each cost schedule contains:

- Name.
- Fixed amount.
- Currency.
- Frequency: monthly or annual.
- Start date.
- Optional end date.
- Scope: portfolio or instrument.

Costs are recognized only on recurrence dates. They are not accrued pro rata each day. Costs in another currency are converted to the base currency using the exchange rate for the charge date.

TER is displayed as instrument metadata when applicable. It is not deducted from performance because quoted fund prices or NAV values already reflect fund-level expenses.

## 10. Currency behavior

- The base currency is configurable.
- The default base currency is derived from the system locale.
- A supplied cost basis is entered in the currency actually paid by the user.
- Current values are converted to the base currency using the latest delayed foreign exchange rate.
- Historical estimates and chart values use historical exchange rates.
- Portfolio performance includes foreign exchange gains and losses.

## 11. Data source, refresh, and caching

- The initial provider is Yahoo Finance or an equivalent free source.
- The provider must require no user account or API key.
- Quotes may be delayed.
- Provider-specific behavior must remain isolated so the provider can be replaced without changing portfolio data.
- Automatic quote refresh occurs at most once every six hours.
- Data is refreshed at startup or panel opening only when the shared cache is expired.
- The user can request a manual refresh.
- All monitors share one cache and one refresh operation.
- Interactive search requests are user initiated and are separate from periodic quote refreshes.
- Historical data is cached where practical.
- An existing instrument is never removed because of a temporary provider failure.

## 12. Settings

The expanded panel provides a settings screen for:

- Portfolio-performance indicator toggle.
- Bar position: left, center, or right.
- Base currency.
- Portfolio-level management-cost schedules.
- Instrument-level management-cost schedules.
- Import and export.

The refresh interval is fixed at six hours in version 1.

## 13. Localization and theming

- Version 1 supports English and Italian.
- The system language selects the interface language automatically.
- English is used when the system language is unsupported.
- Dates, numbers, percentages, and currencies follow the system locale.
- The widget follows the active Omarchy theme.
- The design must remain usable with supported light and dark Omarchy themes.

## 14. Local storage, import, and export

- Portfolio, watchlist, transactions, costs, preferences, and schema version are stored locally.
- No personal portfolio data is transmitted except values required in market-data requests.
- No telemetry is collected.
- JSON export includes all user-owned data needed to reproduce the widget state. Cached market data may be omitted.
- JSON import validates schema version, field types, required values, instrument references, transaction ordering, quantities, and currencies.
- A failed import must not partially overwrite current data.
- Importing a valid export must reproduce portfolio calculations, watchlist order, and settings.

Exported files contain sensitive financial information and must be clearly identified as such in the interface.

## 15. Error handling

- No search match: show `Not found`.
- Network or provider failure with cached data: show cached values, last-update time, and a stale indicator.
- Network or provider failure without cached data: show unavailable state, not zero.
- Missing optional metadata such as TER or market status: show an unavailable marker without rejecting the instrument.
- Missing both quantity and cost basis on a purchase: reject the purchase with a field-level error.
- Withdrawal larger than available quantity on that date: reject the withdrawal with a field-level error.
- Invalid or incompatible import: explain the validation failure and preserve existing local data.
- A failure on one instrument must not prevent other instruments from updating.

## 16. Compatibility and non-functional requirements

- Target the current stable Omarchy Shell plugin interface at release time.
- Support up to 100 total instruments across the watchlist and portfolio without visible interaction stalls.
- With cached data and 100 instruments, opening the expanded panel and switching its main sections must not block the interface for more than 500 ms on a supported Omarchy installation.
- Persist user data across Omarchy Shell restarts and widget updates.
- Avoid continuous polling or one refresh per monitor.
- Do not require credentials or store secrets.
- Display the market-data timestamp where users could otherwise interpret delayed data as current.
- Keep financial calculations deterministic for the same imported data and cached market data.

## 17. Acceptance criteria

- `AC-001` The compact widget appears on every monitor in the same configured bar section.
- `AC-002` With portfolio performance enabled, the compact widget shows the aggregate net return calculated from remaining cost basis and applicable management costs.
- `AC-003` With portfolio performance disabled, the compact widget shows the daily change of the first manually ordered watchlist instrument.
- `AC-004` Search can return every supported asset class when the provider contains a matching instrument; an absent instrument shows `Not found`.
- `AC-005` Adding a first purchase to a watchlist instrument moves it to the portfolio and does not create a duplicate.
- `AC-006` A purchase with date, quantity, and cost basis uses exact user values.
- `AC-007` A purchase with only quantity or only cost basis derives the missing value from historical price and foreign exchange data and marks it as estimated.
- `AC-008` Two purchases at different costs produce the correct weighted average cost.
- `AC-009` A partial withdrawal reduces quantity and remaining cost basis proportionally without calculating proceeds or realized gain.
- `AC-010` A withdrawal that exceeds holdings on its date is rejected.
- `AC-011` The instrument detail chart reflects purchases and withdrawals over time and can toggle their markers.
- `AC-012` A split changes quantity and unit cost but leaves total cost basis unchanged.
- `AC-013` For a EUR 1,000 remaining cost basis, EUR 1,100 market value, and EUR 20 accrued costs, the displayed net return is 7.84% after rounding to two decimal places.
- `AC-014` A foreign-currency holding changes base-currency performance when the exchange rate changes.
- `AC-015` Monthly and annual fixed costs are counted on their due dates and not prorated between them.
- `AC-016` TER is displayed when available and does not create a second expense deduction.
- `AC-017` Automatic refresh does not occur more than once within six hours for the same shared cache.
- `AC-018` A provider failure preserves cached values, labels them stale, and never replaces them with zero.
- `AC-019` Export followed by import reproduces portfolio calculations, transaction history, watchlist order, and settings.
- `AC-020` A malformed import leaves all existing data unchanged.
- `AC-021` English and Italian follow the system language, while unsupported languages fall back to English.
- `AC-022` The widget adapts to supported light and dark Omarchy themes.
- `AC-023` With 100 instruments and cached data, expanded-panel navigation remains within the 500 ms interaction limit.

## 18. Confirmed decisions and assumptions

### Confirmed decisions

- Native Omarchy Shell/Quickshell bar plugin with expanded panel.
- One local portfolio and one local watchlist.
- Same bar position on all monitors.
- All listed financial instrument classes are in scope.
- Delayed, free, keyless market data.
- Six-hour automatic refresh interval.
- Weighted-average-cost accounting.
- Sale date and quantity only; no proceeds or realized return.
- Net return uses total capital, including accrued management costs, as denominator.
- Optional fixed monthly or annual management costs at portfolio and instrument scope.
- TER is informational only.
- Foreign exchange effects are included.
- English and Italian localization.
- JSON import and export.

### Safe assumptions

- Version 1 supports the current stable Omarchy release rather than historical Omarchy versions.
- A fully withdrawn instrument is excluded from active totals but retained locally until moved to the watchlist or deleted.
- Manual refresh remains available even though automatic refresh is limited to once every six hours.
- Search calls are not blocked by the six-hour quote-cache interval.

No unresolved decision currently changes version 1 scope or its acceptance criteria.
