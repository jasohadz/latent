Every Latent component, what it's for, and the rules for using it. Props come from the TypeScript source. (AccordionItem–MegaMenuItem)

### AccordionItem
A single collapsible FAQ-style row.
Example: `<AccordionItem title="What is Latent?" open={openId === "1"} onToggle={(open) => setOpenId(open ? "1" : null)}>A proof-of-concept design system.</AccordionItem>`
- Don't render AccordionItem as a standalone list component — it's one row; map over your data and render one instance per row, tracking which id is open yourself.

### Alert
An inline banner for announcements and actionable notices.
Example: `<Alert appearance="inverse" icon={<Icon name="megaphone" />} onDismiss={handleDismiss}>New updates are available.</Alert>`
- Don't expect onDismiss to render anything under appearance="subtle", or onExpand under appearance="inverse" — the trailing action is fixed per appearance, matching the Figma reference's own Style→behavior pairing (Default/dismissible for general banners, Dark/actionable for banners requiring a follow-up action).
- Don't nest interactive content inside `children` expecting independent focus targets beyond the trailing action button — Alert wasn't built as a generic container, just a message + one action, matching its Figma source.

### AlertStack
Composes multiple real Alert instances into a collapsed, peeking fan that separates into a fully readable list on hover or keyboard focus.
Example: `<AlertStack> <Alert icon={<Icon name="megaphone" />} onDismiss={dismissFirst}>First notice</Alert> <Alert icon={<Icon name="megaphone" />} onDismiss={dismissSecond}>Second notice</Alert> <Alert icon={<Icon name="megaphone" />} onDismiss={dismissThird}>Third notice</Alert> </AlertStack>`
- Don't expect a controlled expanded/collapsed prop — the Figma reference defines this as a hover interaction, not a state a consumer sets, so there isn't one.
- Don't stack non-Alert children expecting the fan/peek styling — the negative-margin overlap and inset rules target direct children generically, but the visual design (dark background peeking through) assumes Alert's own appearance.

### Avatar
User representation as initials, an icon, or a placeholder image.
Example: `<Avatar size="medium" shape="circle" initial="F" />`
- Don't pass a multi-character string to `initial` — it will overflow the fixed-width shape; use `icon` or `src` for anything richer.
- Don't hardcode colors/sizes — add or reuse a --lat-* custom property instead.

### AvatarGroup
Stacks multiple real Avatar instances to represent a group of users.
Example: `<AvatarGroup spacing="overlap" avatars={[{ initial: "F" }, { icon: <Icon name="user" /> }]} overflowCount={2} />`
- Don't render the overflow count as an <Avatar initial="+2"> — Avatar's single-character constraint would clip it; AvatarGroup's overflow chip is a separate, matching-styled element on purpose.

### Badge
A small status/label pill.
Example: `<Badge variant="brand" size="medium" icon={<Icon name="sparkles" />}>New</Badge>`
- Don't hardcode colors — each variant already maps to its own semantic background/text token pair; add a new variant rather than overriding via className.

### BadgeGroup
A clickable label row that optionally pairs with a real Badge instance, for "what's new" banners or filter-summary links.
Example: `<BadgeGroup position="leading" badgeLabel="New" onClick={handleClick}>Latent 2.0 is here</BadgeGroup>`
- Don't pass position="trailing" and expect a chevron — trailing intentionally has no chevron, only leading/none do.

### Button
Primitive action trigger.
Example: `<Button variant="primary" size="md" icon={<Icon name="chevron-right" size="xs" />} onClick={handleSave}>Save</Button>`
- Don't use more than one primary-variant button per view — it defeats the hierarchy signal.
- Don't hardcode colors via className overrides; add or reuse a --lat-* custom property instead.
- Don't set iconOnly without an aria-label — the button would have no accessible name at all.
- Don't use the ghost variant with visible text (children) — Figma only defines it for iconOnly.

### Calendar
A date-picker grid with month/year navigation.
Example: `<Calendar month={8} year={2025} selectedDays={[9, 13]} rangeDays={[10, 11, 12]} onSelectDay={handleSelect} onPrevMonth={handlePrev} onNextMonth={handleNext} onMonthChange={setMonth} onYearChange={setYear} />`
- Don't compute the day grid yourself — pass month/year and let Calendar derive weeks (including adjacent-month padding) internally.
- Don't hardcode colors/spacing in overrides; add or reuse a --lat-* custom property instead.

### Card
Flexible content container.
Example: `<Card layout="media" imageSrc="/hero.jpg" title="Ship faster" body="..." ctaLabel="Learn more" />`
- Don't use image-overlay layouts without imageSrc — there's no fallback background, so the progressive-blur scrim would render over nothing.
- Don't expect exact 1:1 parity on the progressive blur — Figma uses 5 fixed bands (2–30px blur, 6%–62% tint); this is a CSS approximation of the same technique, not a pixel-identical port.
- Don't assume image-overlay-horizontal fills its container — Figma ships it as a fixed 640x280 standalone instance size, not a responsive one.

### ChatInput
A message composer bar for AI chat interfaces.
Example: `<ChatInput value={message} onChange={setMessage} onSubmit={sendMessage} />`
- Don't assume the send button's filled-state color is blue/brand — it's color.background.inverse (dark), the same token the empty state's *container* uses elsewhere in the system, not color.action.primary.default.

### ChatWindow
A full AI chat panel.
Example: `<ChatWindow inputProps={{ value: message, onChange: setMessage, onSubmit: send }}><MessageBubble sender="assistant">Hi!</MessageBubble></ChatWindow>`
- Don't pass raw strings/JSX as children — only real MessageBubble instances are the documented content model; anything else skips MessageBubble's own sender-based alignment/color tokens.

### ComboBox
An editable, searchable dropdown: a labeled trigger with a leading search icon and a text input that filters a floating panel of real SelectOption rows as you type.
Example: `<ComboBox label="Country" placeholder="Search country..." items={countries} value={country} onChange={setCountry} />`
- Don't use ComboBox for a handful of options — Select is the simpler control when there's nothing worth searching.
- Don't expect free-text values — onChange only ever fires with one of the items' values; text that matches nothing is discarded when the panel closes.
- Don't expect a drop shadow on the panel — Figma's Combo Box (like Select) has only a 1px border.

### Field
A labeled form-field wrapper around a real TextField instance, for standard form layouts.
Example: `<Field label="Email" placeholder="you@example.com" helperText="This field is required" error />`
- Don't set Field's own value/state independent of the nested TextField — there's no separate value axis at this level, per Figma's own note.

### Icon
Thin wrapper around lucide-react.
Example: `<Icon name="arrow-up" size="md" />`
- Don't pass a hardcoded width/height or fill color via style/className overrides — use the size prop and let color inherit via currentColor.
- Don't guess an icon name — check the Icons foundations page or STYLES.md-adjacent icon list; an unmatched name silently renders nothing (with a dev-mode console warning).

### MegaMenuItem
The atomic row used inside TopNav's Product and Download dropdown panels.
Example: `<MegaMenuItem layout="featured" icon={<Icon name="apple" />} title="Download for macOS" description="Recommended for most users" badgeLabel="New" />`
- Don't pass badgeLabel with layout="standard" and expect it to show — the Badge only renders when layout="featured".
