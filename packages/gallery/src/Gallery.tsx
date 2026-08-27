import React from "react";

import { AccordionItem } from "@latent/core/AccordionItem";
import { Alert } from "@latent/core/Alert";
import { AlertStack } from "@latent/core/AlertStack";
import { Avatar } from "@latent/core/Avatar";
import { AvatarGroup } from "@latent/core/AvatarGroup";
import { Badge } from "@latent/core/Badge";
import { BadgeGroup } from "@latent/core/BadgeGroup";
import { Button } from "@latent/core/Button";
import { Calendar } from "@latent/core/Calendar";
import { Card } from "@latent/core/Card";
import { ChatInput } from "@latent/core/ChatInput";
import { ChatWindow } from "@latent/core/ChatWindow";
import { Field } from "@latent/core/Field";
import { Icon } from "@latent/core/Icon";
import { MegaMenuItem } from "@latent/core/MegaMenuItem";
import { MessageBubble } from "@latent/core/MessageBubble";
import { MultiSelect } from "@latent/core/MultiSelect";
import { NavDropdown } from "@latent/core/NavDropdown";
import { NavItem } from "@latent/core/NavItem";
import { NavSubItem } from "@latent/core/NavSubItem";
import { Panel } from "@latent/core/Panel";
import { Search } from "@latent/core/Search";
import { Select } from "@latent/core/Select";
import { SelectOption } from "@latent/core/SelectOption";
import { SideNav } from "@latent/core/SideNav";
import { Stat } from "@latent/core/Stat";
import { SubscribeField } from "@latent/core/SubscribeField";
import { Switch } from "@latent/core/Switch";
import { Testimonial } from "@latent/core/Testimonial";
import { TextArea } from "@latent/core/TextArea";
import { TextField } from "@latent/core/TextField";
import { Toggle } from "@latent/core/Toggle";
import { ToggleMultiple } from "@latent/core/ToggleMultiple";
import { TopNav, type TopNavMenu } from "@latent/core/TopNav";
import { TopNavLink } from "@latent/core/TopNavLink";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="gallery__section">
      <h2 className="gallery__section-title">{title}</h2>
      <div className="gallery__grid">{children}</div>
    </section>
  );
}

function ComponentCard({
  name,
  wide,
  column,
  scrollX,
  children,
}: {
  name: string;
  wide?: boolean;
  column?: boolean;
  scrollX?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={["gallery__card", wide ? "gallery__card--wide" : ""].filter(Boolean).join(" ")}
      data-gallery-component={name}
    >
      <div className="gallery__card-name">{name}</div>
      <div
        className={[
          "gallery__card-body",
          column ? "gallery__card-body--column" : "",
          scrollX ? "gallery__card-body--scroll-x" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </div>
  );
}

export function Gallery() {
  // --- Interactive component state, one hook per stateful component below ---
  const [toggleIndex, setToggleIndex] = React.useState<0 | 1>(0);
  const [toggleMultiIndex, setToggleMultiIndex] = React.useState(1);
  const [switchOn, setSwitchOn] = React.useState(true);
  const [textFieldValue, setTextFieldValue] = React.useState("");
  const [textAreaValue, setTextAreaValue] = React.useState("");
  const [accordionOpen, setAccordionOpen] = React.useState(true);
  const [fieldValue, setFieldValue] = React.useState("");
  const [subscribeValue, setSubscribeValue] = React.useState("");
  const [searchValue, setSearchValue] = React.useState("");
  const [calMonth, setCalMonth] = React.useState(7);
  const [calYear, setCalYear] = React.useState(2026);
  const [calSelected, setCalSelected] = React.useState<number[]>([9, 13]);
  const [navDropdownOpen, setNavDropdownOpen] = React.useState(true);
  const [sideNavCollapsed, setSideNavCollapsed] = React.useState(false);
  const [topNavMenu, setTopNavMenu] = React.useState<TopNavMenu>("none");
  const [chatInputValue, setChatInputValue] = React.useState("");
  const [alertDismissed, setAlertDismissed] = React.useState(false);
  const [alertExpanded, setAlertExpanded] = React.useState(false);
  const [selectValue, setSelectValue] = React.useState<string | undefined>(undefined);
  const [multiSelectValue, setMultiSelectValue] = React.useState<string[]>(["hiking"]);
  const hobbyItems = [
    { value: "hiking", label: "Hiking" },
    { value: "fishing", label: "Fishing" },
    { value: "reading", label: "Reading" },
    { value: "gaming", label: "Playing games" },
  ];

  return (
    <div className="gallery">
      <header className="gallery__header">
        <h1 className="gallery__title">Latent Component Gallery</h1>
        <p className="gallery__subtitle">
          Every component in packages/core/src, rendered live from real source — local-only, not published. Run
          with `npm run dev` from packages/gallery.
        </p>
      </header>

      <Section title="Atoms">
        <ComponentCard name="Button">
          <Button variant="primary" size="md" onClick={() => {}}>
            Save
          </Button>
          <Button variant="secondary" size="md" onClick={() => {}}>
            Cancel
          </Button>
          <Button variant="ghost" iconOnly aria-label="More options" icon={<Icon name="ellipsis" size="xs" />} onClick={() => {}} />
          <Button variant="primary" size="md" isLoading onClick={() => {}}>
            Saving
          </Button>
        </ComponentCard>

        <ComponentCard name="Icon">
          <Icon name="arrow-up" size="md" />
          <Icon name="sparkles" size="md" />
          <Icon name="users" size="md" />
          <Icon name="chevron-right" size="md" />
        </ComponentCard>

        <ComponentCard name="Badge">
          <Badge variant="brand" size="medium" icon={<Icon name="sparkles" />}>
            New
          </Badge>
          <Badge variant="success" size="medium" icon={<Icon name="check" />}>
            Active
          </Badge>
          <Badge variant="warning" size="medium" icon={<Icon name="triangle-alert" />}>
            Pending
          </Badge>
          <Badge variant="danger" size="medium" icon={<Icon name="circle-alert" />} onDismiss={() => {}}>
            Error
          </Badge>
        </ComponentCard>

        <ComponentCard name="Avatar">
          <Avatar size="medium" shape="circle" initial="F" />
          <Avatar size="medium" shape="square" icon={<Icon name="user" />} />
        </ComponentCard>

        <ComponentCard name="Toggle">
          <Toggle options={["List", "Grid"]} selectedIndex={toggleIndex} onChange={setToggleIndex} />
        </ComponentCard>

        <ComponentCard name="ToggleMultiple" scrollX>
          <ToggleMultiple
            options={["Day", "Week", "Month", "Quarter", "Year"]}
            selectedIndex={toggleMultiIndex}
            onChange={setToggleMultiIndex}
          />
        </ComponentCard>

        <ComponentCard name="Switch">
          <Switch pressed={switchOn} onChange={setSwitchOn} supportingText="Enable notifications" />
        </ComponentCard>

        <ComponentCard name="TextField">
          <TextField
            appearance="outline"
            placeholder="you@example.com"
            value={textFieldValue}
            onChange={(e) => setTextFieldValue(e.target.value)}
          />
        </ComponentCard>

        <ComponentCard name="TextArea">
          <TextArea
            appearance="outline"
            placeholder="Enter text"
            value={textAreaValue}
            onChange={(e) => setTextAreaValue(e.target.value)}
          />
        </ComponentCard>
      </Section>

      <Section title="Composites">
        <ComponentCard name="AccordionItem" wide column>
          <AccordionItem title="What is Latent?" open={accordionOpen} onToggle={setAccordionOpen}>
            A proof-of-concept design system with an agent-facing CLI.
          </AccordionItem>
        </ComponentCard>

        <ComponentCard name="Card" wide>
          <Card
            layout="content"
            title="Ship faster"
            body="A design system that keeps Figma and code honestly in sync."
            ctaLabel="Learn more"
            icon={<Icon name="sparkles" />}
          />
        </ComponentCard>

        <ComponentCard name="Alert" wide column>
          {!alertDismissed ? (
            <Alert
              appearance="inverse"
              icon={<Icon name="megaphone" />}
              onDismiss={() => setAlertDismissed(true)}
            >
              New updates are available.
            </Alert>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => setAlertDismissed(false)}>
              Reset dismissed alert
            </Button>
          )}
          <Alert
            appearance="subtle"
            icon={<Icon name="megaphone" />}
            onExpand={() => setAlertExpanded((e) => !e)}
          >
            {alertExpanded ? "Expanded: here's more detail about the notice." : "New updates are available."}
          </Alert>
        </ComponentCard>

        <ComponentCard name="AlertStack" wide column>
          <AlertStack>
            <Alert appearance="inverse" icon={<Icon name="megaphone" />} onDismiss={() => {}}>
              First notice
            </Alert>
            <Alert appearance="inverse" icon={<Icon name="megaphone" />} onDismiss={() => {}}>
              Second notice
            </Alert>
            <Alert appearance="inverse" icon={<Icon name="megaphone" />} onDismiss={() => {}}>
              Third notice
            </Alert>
          </AlertStack>
        </ComponentCard>

        <ComponentCard name="SelectOption" wide column>
          <SelectOption label="Hiking" onClick={() => {}} />
          <SelectOption label="Fishing" selected onClick={() => {}} />
          <SelectOption label="Reading" onClick={() => {}} />
        </ComponentCard>

        <ComponentCard name="Select" wide>
          <Select label="Hobby" placeholder="Select hobby" items={hobbyItems} value={selectValue} onChange={setSelectValue} />
        </ComponentCard>

        <ComponentCard name="MultiSelect" wide>
          <MultiSelect
            label="Hobbies"
            placeholder="Select hobbies"
            items={hobbyItems}
            value={multiSelectValue}
            onChange={setMultiSelectValue}
          />
        </ComponentCard>

        <ComponentCard name="BadgeGroup">
          <BadgeGroup position="leading" badgeLabel="New" onClick={() => {}}>
            Latent 2.0 is here
          </BadgeGroup>
        </ComponentCard>

        <ComponentCard name="AvatarGroup">
          <AvatarGroup
            spacing="overlap"
            avatars={[{ initial: "F" }, { initial: "J" }, { icon: <Icon name="user" /> }]}
            overflowCount={2}
          />
        </ComponentCard>

        <ComponentCard name="Testimonial" wide>
          <Testimonial
            quote="Latent made it trivial to keep our design and code in sync."
            name="Jordan Reyes"
            role="Design Systems Lead"
          />
        </ComponentCard>

        <ComponentCard name="Field">
          <Field
            label="Email"
            placeholder="you@example.com"
            helperText="This field is required"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
          />
        </ComponentCard>

        <ComponentCard name="SubscribeField" wide>
          <SubscribeField
            buttonPosition="side"
            value={subscribeValue}
            onChange={setSubscribeValue}
            onSubmit={() => {}}
          />
        </ComponentCard>

        <ComponentCard name="Search">
          <Search appearance="outline" value={searchValue} onChange={setSearchValue} onSubmit={() => {}} />
        </ComponentCard>

        <ComponentCard name="Stat">
          <Stat icon={<Icon name="users" />} value="2,400+" label="Teams building with Latent" />
        </ComponentCard>

        <ComponentCard name="Calendar / Panel" wide>
          <Panel style={{ display: "inline-block" }}>
            <Calendar
              month={calMonth}
              year={calYear}
              selectedDays={calSelected}
              rangeDays={[10, 11, 12]}
              onSelectDay={(day) => setCalSelected([day])}
              onPrevMonth={() => setCalMonth((m) => (m === 0 ? 11 : m - 1))}
              onNextMonth={() => setCalMonth((m) => (m === 11 ? 0 : m + 1))}
              onMonthChange={setCalMonth}
              onYearChange={setCalYear}
            />
          </Panel>
        </ComponentCard>
      </Section>

      <Section title="Navigation">
        <ComponentCard name="NavItem">
          <NavItem label="Dashboard" icon={<Icon name="layout-dashboard" />} selected onClick={() => {}} />
          <NavItem label="Settings" icon={<Icon name="settings" />} onClick={() => {}} />
        </ComponentCard>

        <ComponentCard name="NavSubItem">
          <NavSubItem label="Tutorials" onClick={() => {}} />
        </ComponentCard>

        <ComponentCard name="NavDropdown">
          <NavDropdown
            label="Resources"
            icon={<Icon name="boxes" />}
            expanded={navDropdownOpen}
            onToggle={setNavDropdownOpen}
            subItems={[{ label: "Tutorials" }, { label: "Academy" }, { label: "Experts" }]}
          />
        </ComponentCard>

        <ComponentCard name="TopNavLink">
          <TopNavLink label="Product" active showChevron onClick={() => {}} />
          <TopNavLink label="Pricing" showChevron={false} onClick={() => {}} />
        </ComponentCard>

        <ComponentCard name="MegaMenuItem" wide>
          <MegaMenuItem
            layout="featured"
            icon={<Icon name="apple" />}
            title="Download for macOS"
            description="Recommended for most users"
            badgeLabel="New"
          />
        </ComponentCard>

        <ComponentCard name="SideNav" wide column>
          <SideNav
            brand="Acme Inc."
            collapsed={sideNavCollapsed}
            onToggleCollapse={() => setSideNavCollapsed((c) => !c)}
          >
            <NavItem label="Overview" icon={<Icon name="layout-dashboard" />} selected onClick={() => {}} />
            <NavDropdown
              label="Resources"
              icon={<Icon name="boxes" />}
              expanded={navDropdownOpen}
              onToggle={setNavDropdownOpen}
              subItems={[{ label: "Tutorials" }, { label: "Academy" }]}
            />
          </SideNav>
        </ComponentCard>

        <ComponentCard name="TopNav" wide column>
          <TopNav
            menu={topNavMenu}
            onMenuChange={setTopNavMenu}
            logo={<img src="/latent-logo-icon-default.svg" alt="Latent" width={24} height={24} />}
            ctaLabel="Free Trial"
            productItems={[
              { title: "Analytics", description: "Track usage", icon: <Icon name="chart-bar" /> },
              { title: "Automations", description: "Save time", icon: <Icon name="zap" /> },
            ]}
            downloadFeatured={{
              title: "Download for macOS",
              description: "Recommended for most users",
              icon: <Icon name="apple" />,
            }}
            downloadItems={[{ title: "Windows", description: "64-bit", icon: <Icon name="monitor" /> }]}
          />
        </ComponentCard>
      </Section>

      <Section title="Chat">
        <ComponentCard name="MessageBubble">
          <MessageBubble sender="assistant">How can I help?</MessageBubble>
          <MessageBubble sender="user">What variants does Button have?</MessageBubble>
        </ComponentCard>

        <ComponentCard name="ChatInput" wide>
          <ChatInput value={chatInputValue} onChange={setChatInputValue} onSubmit={() => {}} />
        </ComponentCard>

        <ComponentCard name="ChatWindow" wide column>
          <div style={{ height: 320 }}>
            <ChatWindow
              inputProps={{ value: chatInputValue, onChange: setChatInputValue, onSubmit: () => {} }}
            >
              <MessageBubble sender="assistant">Hi! Ask me anything about Latent.</MessageBubble>
              <MessageBubble sender="user">What variants does Button have?</MessageBubble>
              <MessageBubble sender="assistant">primary, secondary, and ghost.</MessageBubble>
            </ChatWindow>
          </div>
        </ComponentCard>
      </Section>
    </div>
  );
}
