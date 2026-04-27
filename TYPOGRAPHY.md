# Typography Token System

Derived from the corrected UI on Pages 1 (Details) and 2 (Review), which serve as the source of truth for the payments link prototype. All other screens have been normalized to match these principles.

---

## What Was Standardized

### Problems resolved
- `font-bold` was used on multiple headings across Success, Portal (all steps), and OrderDetail — replaced with `font-medium` throughout.
- `font-semibold` was used on non-price headings in PortalHome, OrderDetail, AccessPanel, ToolAccessList, and PartialPaymentStatus — replaced with `font-medium`.
- Gender toggle buttons in Portal Step 2 used `font-normal`; AccessPanel used `font-medium` for the same buttons — normalized to `font-medium`.
- The "Order Summary" eyebrow in PartialPaymentStatus used `text-sm uppercase tracking-wide` — reduced to `text-xs uppercase tracking-wider` to match the eyebrow token.
- Schedule row amounts in PartialPaymentStatus used `text-slate-800` — updated to `text-slate-900` to match all other key values.

### Pages 1 & 2 as reference
- Page 1 (`Details.tsx`): establishes `text-2xl font-medium` for the page title, `text-base font-medium` for section/card headings, `text-sm font-normal text-slate-600` for body, and `text-xs text-slate-400` for metadata.
- Page 2 (`Review.tsx`): establishes `text-xl font-medium` for payment option amounts, `text-lg font-medium` for elevated feature headings, and the eyebrow pattern (`text-xs font-medium uppercase tracking-widest text-primary`). It also confirms that `font-semibold` is permitted only for add-on prices (`+₹X`) and status-colored amounts.

---

## Token System

### `page-title`
- **Use:** The primary h1 on a full-page route. Used once per screen.
- **Size:** `text-2xl` (1.5rem)
- **Weight:** `font-medium` (500)
- **Line height:** `leading-snug` (1.3em)
- **Letter spacing:** none
- **Color:** `text-slate-900`
- **Example screens:** Details, Review, PortalHome ("My Orders")
- **Do not use for:** step/card headings within a wizard, section dividers, confirmation headings inside a card

---

### `card-title`
- **Use:** The primary heading within a wizard step, a confirmation card, or a focused modal-like card. Functions as a page title within its bounded scope.
- **Size:** `text-xl` (1.25rem)
- **Weight:** `font-medium` (500)
- **Line height:** `leading-normal` (1.4em)
- **Letter spacing:** none
- **Color:** `text-slate-900` (or `text-white` on dark surfaces)
- **Example screens:** Portal Step 1 "Payment Confirmed!", Step 3 "Setting up your access…", Step 4 "You're all set!", PartialPaymentStatus hero "Booking Confirmed!"
- **Do not use for:** section dividers within a multi-section page, transactional amounts

---

### `feature-heading`
- **Use:** A section heading that is slightly more prominent than a standard section heading — used for feature/deal sections or major content blocks.
- **Size:** `text-lg` (1.125rem)
- **Weight:** `font-medium` (500)
- **Line height:** `leading-normal` (1.4em)
- **Letter spacing:** none
- **Color:** `text-slate-900`
- **Example screens:** Review "What's Included", payment option card labels
- **Do not use for:** every h3; this is elevated and should be used sparingly

---

### `section-heading`
- **Use:** h2/h3 section dividers within a page or a card. The most commonly used heading role.
- **Size:** `text-base` (1rem)
- **Weight:** `font-medium` (500)
- **Line height:** `leading-normal` (1.4em)
- **Letter spacing:** none
- **Color:** `text-slate-900`
- **Example screens:** Details "Select Cohort", "Your Details", "Payment Summary"; Review "Payment Breakdown", "Order Summary", "Billing"; OrderDetail "Payments", "Get Access"; AccessPanel sub-panel headings; ToolAccessList section heading
- **Do not use for:** page titles, card/step titles; avoid using for minor labels that don't divide content

---

### `body`
- **Use:** Descriptions, explanatory copy, cohort descriptions, banner text, list content.
- **Size:** `text-sm` (0.875rem)
- **Weight:** `font-normal` (400)
- **Line height:** `leading-loose` (1.5em) — important for readability of multi-line descriptions
- **Letter spacing:** none
- **Color:** `text-slate-600` (primary body), `text-slate-700` (slightly stronger body)
- **Example screens:** cohort description box, commitment banner secondary text, bump/addon product descriptions, amber/red notice body text
- **Do not use for:** short single-line labels or row values — use `label` or `value` instead

---

### `label`
- **Use:** Form field labels, table/row labels (the left-hand side of a key-value pair), input help context.
- **Size:** `text-sm` (0.875rem)
- **Weight:** `font-normal` (400)
- **Line height:** `leading-normal` (1.4em)
- **Letter spacing:** none
- **Color:** `text-slate-700`
- **Example screens:** "Full Name", "Email Address", "Phone Number" input labels; "Cohort", "Applicable Taxes", "Order ID" row labels in summaries
- **Do not use for:** section headings, descriptive body copy

---

### `value`
- **Use:** The right-hand value in a key-value pair. Key data like names, cohort names, dates, included/excluded flags.
- **Size:** `text-sm` or `text-base` depending on context
- **Weight:** `font-medium` (500) for important values; `font-normal` (400) for neutral/secondary values
- **Line height:** `leading-normal` (1.4em)
- **Letter spacing:** none
- **Color:** `text-slate-900`
- **Example screens:** order summary rows (program name, cohort, payment amount), user details strip (name = `font-medium`, email/phone = `font-normal`)
- **Do not use for:** totals and amounts (use `amount-total`); large pricing displays (use `amount-large`)

---

### `amount-large`
- **Use:** Large payment option amounts, prominent pricing on selection cards.
- **Size:** `text-xl` (1.25rem)
- **Weight:** `font-medium` (500)
- **Line height:** `leading-relaxed` (1.35em)
- **Letter spacing:** none
- **Color:** `text-slate-900` (neutral), `text-primary` (discounted/promotional amounts)
- **Example screens:** Review payment option cards (Full Payment / Booking Amount amounts), discount window discounted amount
- **Do not use for:** totals in order summaries, amounts in row lists — those are smaller and use `amount-total` or `value`

---

### `amount-total`
- **Use:** "Due Today" / "Amount Payable" totals at the bottom of summaries or in sticky footers.
- **Size:** `text-base` (1rem)
- **Weight:** `font-medium` (500)
- **Line height:** `leading-normal` (1.4em)
- **Letter spacing:** none
- **Color:** `text-slate-900`
- **Example screens:** Review order summary sidebar "Total Due Today", mobile sticky footer amount, PriceRow `isTotal` variant
- **Do not use for:** individual line items within a breakdown; large payment option amounts (use `amount-large`)

---

### `metadata`
- **Use:** De-emphasized data that the user rarely needs to act on — SKU IDs, NSDC course names, order IDs in secondary positions.
- **Size:** `text-sm` (0.875rem)
- **Weight:** `font-normal` (400)
- **Line height:** `leading-normal` (1.4em)
- **Letter spacing:** none
- **Color:** `text-slate-400`
- **Example screens:** ProductMeta (SKU ID, NSDC name below each product), header SKU/NSDC strip on Review page
- **Do not use for:** timestamps, footnotes, fine print (use `caption`); anything the user needs to read actively (use `body` or `label`)

---

### `helper` / `caption`
- **Use:** Fine print, footnote copy, confirmation email notes, security badges, timestamps on payment rows, "questions?" footer links.
- **Size:** `text-xs` (0.75rem)
- **Weight:** `font-normal` (400)
- **Line height:** `leading-normal` (1.4em)
- **Letter spacing:** none
- **Color:** `text-slate-400` (dimmest), `text-slate-500` (slightly stronger helper)
- **Example screens:** "Confirmation sent to your email", "Secure Payment · 256-bit SSL Encrypted", payment timestamp rows, page footer support links, phone country hint
- **Do not use for:** body copy that the user needs to read for action; section eyebrows (use `eyebrow`)

---

### `eyebrow`
- **Use:** Promotional category markers, limited-time offer labels, short category tags that precede a section. Always uppercase.
- **Size:** `text-xs` (0.75rem)
- **Weight:** `font-medium` (500)
- **Line height:** `leading-normal` (1.4em)
- **Letter spacing:** `tracking-widest`
- **Color:** `text-primary` (on light backgrounds), `text-slate-500` (neutral, on white/slate backgrounds)
- **Example screens:** Review discount window "LIMITED-TIME OFFER", PartialPaymentStatus "ORDER SUMMARY" strip
- **Do not use for:** general body labels, section headings, helper text

---

### `button`
- **Use:** All interactive button labels.
- **Size:** `text-sm` (0.875rem)
- **Weight:** `font-medium` (500)
- **Line height:** inherited from button height
- **Letter spacing:** none
- **Color:** inherits from button variant (white on primary, primary on outline)
- **Example screens:** "Proceed to Review", "Pay ₹X,XXX", "Confirm & Continue", "View my orders"
- **Do not use for:** link-style text actions (use `text-sm text-primary font-medium` without button component)

---

## Weight Usage Rules

| Weight | When to use |
|--------|-------------|
| `font-normal` (400) | Body copy, descriptions, labels, metadata, helper text, neutral row values |
| `font-medium` (500) | All headings (page, card, feature, section), key values, totals, button labels |
| `font-semibold` (600) | **Only:** incremental add-on prices ("+₹X,XXX" in breakdowns/sidebar), and status-colored amounts (green paid amounts, amber pending amounts) |
| `font-bold` (700) | **Never** in editorial content. Permitted only in UI chrome (step indicator circle numbers). |

---

## What Not to Do

- Do not use `font-bold` on any heading, title, or amount — it breaks the calm, intentional hierarchy.
- Do not use `font-semibold` on section headings, card titles, or tool names — reserve it for differentiated pricing signals.
- Do not make transactional amounts the largest text on a page unless they are genuinely the primary focus (e.g., the payment option card). Summary row totals use `text-base`, not `text-xl`.
- Do not use `text-sm uppercase` for eyebrows — eyebrows are always `text-xs`.
- Do not use multiple font sizes within a single card for headings — pick one heading level per card and stick to it.
- Do not add `font-medium` to body descriptions just to add emphasis — use color (`text-slate-900` vs `text-slate-600`) to create hierarchy within body text instead.
