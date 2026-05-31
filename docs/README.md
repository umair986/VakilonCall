# Vakil On Call UI/UX Redesign Plan

## Design Goals

Vakil On Call should feel like a serious legal assistance product, not a generic emergency app or promotional SaaS dashboard. The interface should communicate trust, urgency, restraint, and clarity through a black and white legal visual system.

The redesign should prioritize fast comprehension under stress, especially for citizens requesting legal help. Lawyer-facing screens should feel operational and professional, with dense but calm dashboard modules.

## Visual Language

- Use near-black backgrounds, charcoal surfaces, warm white text, paper-gray secondary text, and thin borders.
- Use muted red only for destructive or urgent states and muted green only for verified/success states.
- Avoid decorative gradients, bright purple/blue SaaS colors, oversized rounded cards, emojis, and playful illustrations.
- Use legal and operational icons: scale, gavel, shield, document, phone, lawyer profile, bank, history, and alert.
- Keep cards at 6-8px radius with clear borders and disciplined spacing.

## Color Tokens

- Background: `#080808`
- Surface: `#141414`
- Elevated surface: `#1C1C1C`
- Primary text: `#F7F7F2`
- Secondary text: `#B8B8B2`
- Muted text: `#7E7E78`
- Borders: `#2E2E2E`
- Disabled: `#6B6B66`
- Danger: `#B42318`
- Success: `#16794C`

## Typography Rules

- Screen titles use compact 24-28px type.
- Section labels use uppercase 12px text with subtle tracking.
- Body copy uses 14-16px text with enough line height for legal reading.
- Timers, balances, and currency values use tabular numerals where supported.
- Button labels are short, direct, and action-oriented.

## Component Inventory

The mobile app should share these primitives from `apps/mobile/components/ui.tsx`:

- `Screen`: common safe-area shell with optional scrolling.
- `ScreenHeader`: centered route title with optional back action and subtitle.
- `LegalCard`: bordered card with default, outlined, notice, and danger variants.
- `StatusPill`: compact state label for verification, readiness, success, warning, and danger states.
- `MetricTile`: reusable dashboard metric tile.
- `ActionRow`: dense navigation or action row with icon, title, and supporting text.
- `EmptyState`: calm no-data/error state.
- `PrimaryAction`: high-contrast white primary button.
- `DangerAction`: restrained destructive outlined button.

## Screen Redesign Notes

- Login and OTP now use a formal legal identity mark, compact phone/OTP forms, and quiet secondary rights access.
- Citizen home is a legal command center with identity, token balance, response expectation, primary request action, common situations, rights, SOS, and token access.
- Scenario selection uses legal category cards and a sticky bottom action so the next step is always available.
- Matching uses a sober pulsing legal seal, elapsed timer, and calm matched/no-lawyer states.
- Rights reads like a legal reference library with article metadata and concise plain-language summaries.
- Token store uses pricing rows, restrained badges, radio selection, and formal payment notices.
- Profile, SOS contacts, lawyer registration, lawyer dashboard, earnings, transactions, and rating now use the same shell, cards, metrics, and icons.

## Implementation Order

1. Maintain the monochrome theme and shared UI primitives as the source of truth.
2. Keep citizen request flows polished first: login, home, scenario selection, matching, and rights.
3. Keep payment and account flows consistent: token store, transactions, profile, and SOS contacts.
4. Keep lawyer workflows dense and professional: registration, dashboard, earnings, payout, and rating.
5. Add future admin/web work only after an `apps/admin` implementation exists.

## Future Admin/Web Direction

The repo currently exposes an `admin:dev` script but does not include an `apps/admin` app. When added, the admin experience should use the same monochrome legal operations language:

- Dense dashboard layout with tables, filters, and clear review queues.
- Lawyer verification queue with document preview, Bar Council metadata, approve/reject actions, and audit trail.
- Call sessions, users, payments, refunds, and disputes as operational tables.
- Minimal decoration, high information density, and strong empty/loading/error states.

## QA Checklist

- Run `npm run typecheck --workspace=apps/mobile`.
- Run Expo bundle/export verification for mobile.
- Inspect login to OTP, citizen home to scenario selection to matching, token store, rights, profile, SOS contacts, lawyer dashboard, lawyer registration, earnings, transactions, and rating.
- Confirm no emoji-based UI remains.
- Confirm purple/blue SaaS colors and bright promotional cards are removed.
- Confirm cards/buttons use the 6-8px professional radius system.
- Confirm small-screen text does not overflow buttons, metric tiles, or cards.
- Confirm primary actions are obvious without looking promotional.
