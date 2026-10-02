Every Latent component, what it's for, and the rules for using it. Props come from the TypeScript source. (MessageBubble–TopNav)

### MessageBubble
A single chat message.
Example: `<MessageBubble sender="assistant">How can I help?</MessageBubble>`
- Don't render MessageBubble outside ChatWindow's message slot — its row alignment (assistant left, user right) assumes ChatWindow's full-width flex container.

### MultiSelect
A labeled multi-value dropdown.
Example: `<MultiSelect label="Hobbies" placeholder="Select hobbies" items={hobbies} value={selected} onChange={setSelected} />`
- Don't expect a "N selected" count summary in the trigger — chips render inline, inside the bordered box itself, wrapping to multiple lines as needed.
- Don't expect the panel to close after picking an option — MultiSelect stays open across selections (the standard multi-pick UX pattern) and only closes on outside click, Escape, or re-clicking the trigger.
- Don't expect a checkbox next to each panel row — Style 1's real reference has none; a row's checked-ness is only visible via aria-selected and via whether its chip is currently showing in the trigger.

### NavDropdown
A real NavItem trigger paired with an indented list of real NavSubItem instances, for expandable nav groups.
Example: `<NavDropdown label="Resources" icon={<Icon name="boxes" />} expanded={open} onToggle={setOpen} subItems={[{ label: "Tutorials" }, { label: "Academy" }, { label: "Experts" }]} />`
- Don't manage the trigger's chevron direction yourself — it's derived automatically from `expanded` (chevron-down collapsed, chevron-up expanded).

### NavItem
The atomic row used inside Side Nav's expanded nav list and as Nav Dropdown's trigger.
Example: `<NavItem label="Dashboard" icon={<Icon name="layout-dashboard" />} selected onClick={handleClick} />`
- Don't set iconOnly without a meaningful `label` — with iconOnly there's no visible text, and label becomes the button's only accessible name (via aria-label).

### NavSubItem
The indented row used inside Nav Dropdown's expanded sub-list.
Example: `<NavSubItem label="Tutorials" onClick={handleClick} />`
- Don't try to swap the leading icon — it's fixed to corner-down-right by design, unlike NavItem.

### Panel
Generic elevated floating surface for popovers/dropdowns.
Example: `<Panel><Calendar /></Panel>`
- Don't put a border/shadow on the child you place inside Panel too — Panel already supplies the single visible edge.
- Don't hardcode a shadow value — add or reuse a --lat-elevation-* custom property instead.

### Search
Search field with an optional trailing clear button and an attached circular submit button reusing Button's primary color ramp.
Example: `<Search appearance="outline" value={query} onChange={setQuery} onSubmit={handleSearch} />`
- Don't expect a small/condensed size tier — built at one size (Density=Default) for v1, per Figma's own documented gap.
- Don't expect a leading icon inside the field — Figma's Search component has a leading-icon boolean property, but it's off in all 16 current variants, so it isn't built.

### Select
A labeled single-value dropdown: a bordered trigger showing the chosen value (or a placeholder) + chevron, opening a floating panel of real SelectOption rows.
Example: `<Select label="Hobby" placeholder="Select hobby" items={hobbies} value={hobby} onChange={setHobby} />`
- Don't expect selected values to render as chips in the trigger — that's MultiSelect's own pattern (multiple values), not this one (exactly one).
- Don't expect a full ARIA combobox/roving-tabindex listbox — options are individually Tab-reachable (with Arrow/Escape as keyboard conveniences), the same honest simplification NavDropdown's sub-list already documents.
- Don't expect the panel to have a drop shadow — the Style 1 reference this was rebuilt from has none, just a 1px border; adding one would be a real (if small) fidelity regression.

### SelectOption
A single row inside Select's or MultiSelect's floating panel — the shared building block both compose.
Example: `<SelectOption label="Hiking" selected={isSelected} onClick={handleToggle} />`
- Don't expect a persistent "selected" background/bold style on a chosen row — the Figma reference ("Dropdown Item") only has two states, default and hover, no third selected treatment.
- Don't use this outside a Select/MultiSelect panel expecting standalone listbox semantics — role="option" here assumes a role="listbox" ancestor, which only those two components provide.

### SideNav
A floating sidebar navigation panel.
Example: `<SideNav brand="Acme Inc." collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)}><NavItem label="Overview" selected /><NavDropdown label="Resources" expanded={open} onToggle={setOpen} subItems={subs} /></SideNav>`
- Don't build the nav list as a data-array prop — compose real NavItem/NavDropdown children directly, matching Figma's own instance-based structure.

### Stat
A compact highlight card for a single number or metric with a supporting label.
Example: `<Stat icon={<Icon name="users" />} value="2,400+" label="Teams building with Latent" />`
- Don't set showIcon without also passing `icon` — the icon badge only renders when both are true/present, so showIcon alone leaves an empty gap.

### SubscribeField
An email-capture row pairing a real TextField instance with a real Button instance, plus a terms disclaimer below.
Example: `<SubscribeField buttonPosition="side" value={email} onChange={setEmail} onSubmit={handleSubscribe} />`
- Don't drop the disclaimer text via a wrapper override — it's a fixed part of this component's structure, not optional per Figma.

### Switch
An on/off toggle for boolean settings.
Example: `<Switch pressed={enabled} onChange={setEnabled} supportingText="Enable notifications" />`
- Don't render a Switch with neither supportingText nor aria-label — screen readers announce it as an unnamed switch.
- Don't hardcode the thumb travel distance in a consumer override — it's derived from the track/thumb/padding sizes here; change those instead.

### Tabs
Toggle's 2-option segmented-control recipe generalized to N options (demonstrated with 5 in Figma).
Example: `<Tabs options={["Day", "Week", "Month", "Quarter", "Year"]} selectedIndex={1} onChange={setRange} />`
- Don't use Tabs for exactly 2 options — use Toggle instead (same recipe, narrower/simpler API).

### Testimonial
A quote card pairing a customer statement with a real Avatar instance, name, and role.
Example: `<Testimonial quote="Latent made it trivial to keep our design and code in sync." name="Jordan Reyes" role="Design Systems Lead" />`
- Don't reach for Testimonial if you need an icon or button instead of a quote+person — use Card, which has boolean properties for exactly that.

### TextArea
Multi-line text input.
Example: `<TextArea appearance="outline" value={value} onChange={(e) => setValue(e.target.value)} />`
- Don't resize below readable height — the 100px fixed height matches Figma; use CSS `resize` (already set to vertical) rather than a much shorter override.

### TextField
Single-line text input.
Example: `<TextField appearance="outline" value={value} onChange={(e) => setValue(e.target.value)} />`
- Don't hardcode the placeholder text via a className override — pass a `placeholder` prop like any native input.

### Toggle
A 2-option segmented control for mutually exclusive choices (e.g.
Example: `<Toggle options={["List", "Grid"]} selectedIndex={0} onChange={setView} />`
- Don't use Toggle for more than 2 options — use Tabs instead.

### TopNav
A floating glass top navigation bar with mega-menu dropdowns for Product and Download.
Example: `<TopNav menu={menu} onMenuChange={setMenu} productItems={products} downloadFeatured={macDownload} downloadItems={otherDownloads} />`
- Don't render Pricing with a chevron/menu — it's a plain link, unlike Product/Download.
