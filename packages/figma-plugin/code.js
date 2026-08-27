// Latent Sync — Figma plugin, main thread.
//
// Extracts local Variables and Text/Effect Styles into the exact JSON shapes
// packages/tokens/{figma-export.live.json,styles-export.live.json} already
// use (see CLAUDE.md's "sync figma" / "check-styles" sections and STYLES.md's
// documented boundVariables-resolution pattern, which this mirrors). The
// actual GitHub commit happens in ui.html — this thread only has figma.*
// access, not fetch with arbitrary headers, so extraction and network are
// split across the two contexts on purpose.

figma.showUI(__html__, { width: 440, height: 640 });

const LAYER_NAMES = ["primitives", "semantic", "density", "breakpoint"];

function matchLayer(collectionName) {
  const n = collectionName.trim().toLowerCase();
  return LAYER_NAMES.find((layer) => n === layer || n.includes(layer)) ?? null;
}

function setNested(root, pathParts, value) {
  let node = root;
  for (let i = 0; i < pathParts.length - 1; i++) {
    const key = pathParts[i];
    node[key] = node[key] && typeof node[key] === "object" ? node[key] : {};
    node = node[key];
  }
  node[pathParts[pathParts.length - 1]] = value;
}

function rgbaToHex({ r, g, b, a }) {
  const toHex = (c) => Math.round(Math.max(0, Math.min(1, c)) * 255).toString(16).padStart(2, "0");
  const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  return a < 1 ? `${hex}${toHex(a)}` : hex;
}

// Figma FLOATs round-trip through float32, so a hand-typed 0.05 comes back
// as 0.05000000074505806 — round it away rather than let it register as
// spurious drift against tokens.json's clean values.
function roundFloat(n) {
  return typeof n === "number" ? Math.round(n * 1e6) / 1e6 : n;
}

// Alias values reference another variable by its dotted path. References
// into primitives.json are bare ("{color.blue.600}", "{dimensions.0}") since
// it's the base layer; references into any other layer are qualified with
// that layer's name ("{density.spacing.0}") — see semantic.json's own
// "spacing" tokens for a real example of the qualified form.
async function resolveVariableValue(raw, resolvedType, collectionLayerById) {
  if (raw && typeof raw === "object" && raw.type === "VARIABLE_ALIAS") {
    const target = await figma.variables.getVariableByIdAsync(raw.id);
    if (!target) return null;
    const dottedName = target.name.replace(/\//g, ".");
    const targetLayer = collectionLayerById.get(target.variableCollectionId);
    return targetLayer && targetLayer !== "primitives" ? `{${targetLayer}.${dottedName}}` : `{${dottedName}}`;
  }
  if (resolvedType === "FLOAT") return roundFloat(raw);
  if (resolvedType === "COLOR") return rgbaToHex(raw);
  return raw;
}

async function extractVariables() {
  const warnings = [];
  const result = { primitives: {}, semantic: {}, density: {}, breakpoint: {} };
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

  const collectionLayerById = new Map();
  for (const collection of collections) {
    const layer = matchLayer(collection.name);
    if (layer) collectionLayerById.set(collection.id, layer);
  }

  for (const collection of collections) {
    const layer = matchLayer(collection.name);
    if (!layer) {
      warnings.push(
        `Skipped collection "${collection.name}" — name doesn't match a known layer (primitives/semantic/density/breakpoint).`
      );
      continue;
    }
    const modes = collection.modes; // [{ modeId, name }]
    const multiMode = modes.length > 1;

    for (const variableId of collection.variableIds) {
      const variable = await figma.variables.getVariableByIdAsync(variableId);
      if (!variable) continue;
      const pathParts = variable.name.split("/").map((p) => p.trim()).filter(Boolean);
      if (pathParts.length === 0) continue;

      if (multiMode) {
        const modeMap = {};
        for (const mode of modes) {
          const raw = variable.valuesByMode[mode.modeId];
          modeMap[mode.name.trim().toLowerCase()] = await resolveVariableValue(raw, variable.resolvedType, collectionLayerById);
        }
        setNested(result[layer], pathParts, { value: modeMap });
      } else {
        const raw = variable.valuesByMode[modes[0].modeId];
        setNested(result[layer], pathParts, await resolveVariableValue(raw, variable.resolvedType, collectionLayerById));
      }
    }
  }
  return { tokens: result, warnings };
}

// Same field->name resolution STYLES.md documents for the manual pull script.
async function resolveBoundVars(boundVariables) {
  const out = {};
  for (const [field, alias] of Object.entries(boundVariables || {})) {
    if (!alias?.id) continue;
    const v = await figma.variables.getVariableByIdAsync(alias.id);
    out[field] = v ? v.name : null;
  }
  return out;
}

async function extractStyles() {
  const text = {};
  for (const style of await figma.getLocalTextStylesAsync()) {
    text[style.name] = {
      fontName: style.fontName,
      lineHeight: style.lineHeight,
      letterSpacing: style.letterSpacing,
      textCase: style.textCase,
      boundVariables: await resolveBoundVars(style.boundVariables),
    };
  }

  const effect = {};
  for (const style of await figma.getLocalEffectStylesAsync()) {
    effect[style.name] = {
      // visible/showShadowBehindNode are real Figma effect fields, but
      // styles.json's schema never captured them (near-constant bookkeeping
      // flags, not design data) — dropping them keeps this matching the
      // established shape instead of manufacturing drift on every effect.
      effects: await Promise.all(
        style.effects.map(async (e) => {
          const { visible, showShadowBehindNode, ...rest } = e;
          return { ...rest, boundVariables: await resolveBoundVars(e.boundVariables) };
        })
      ),
    };
  }
  return { text, effect };
}

// --- Component bindings extraction (added 2026-08-26) ---
//
// Answers a different question than extractVariables/extractStyles above:
// not "does this token's VALUE match Figma" but "does this component's CSS
// actually use the token Figma really has bound here." Nothing else in this
// repo checks that — check-parity only verifies a component's CSS against
// its own .doc.mjs's figmaTokens claim, which is a self-consistency check,
// not a live-Figma one. Built after that exact gap let real drift sit
// undetected in Calendar (wrong nav-button border/radius, wrong select
// font token) and Button (wrong radius everywhere, wrong secondary colors
// everywhere) despite `verify` reporting clean the whole time — see
// CLAUDE.md's "Component bindings" section for the full story.
//
// Real component names in packages/core/src, matching each Figma
// component/component-set's name with spaces stripped (Title Case with
// spaces -> PascalCase — the same mechanical transform NAMING-CONVENTIONS.md
// documents for props, confirmed to hold for every one of these before
// writing this). Append-only, same discipline as LAYER_NAMES/ERROR_CODES —
// add an entry whenever a new primitive ships in packages/core/src. Icon
// isn't included: it's a thin lucide-react wrapper with no bound style
// properties of its own to verify.
//
// Alert, AlertStack, MultiSelect, Select, SelectOption added 2026-08-27
// (the original 29 above are unchanged) — a real gap found the hard way:
// these 5 components had already shipped in packages/core/src, but this
// list was never updated, so a real plugin sync run silently produced a
// component-bindings.live.json with no entries for any of them at all
// (confirmed directly — 29 keys, not 34, after a real sync). Every
// check-component-bindings pass against these 5 up to that point had only
// ever run against a hand-seeded local copy of this file, not real
// plugin output — worth remembering this file is the actual source of
// truth for what the plugin extracts, not whatever's sitting in a local
// component-bindings.live.json.
const COMPONENT_NAMES = [
  "AccordionItem", "Alert", "AlertStack", "Avatar", "AvatarGroup", "Badge",
  "BadgeGroup", "Button", "Calendar", "Card", "ChatInput", "ChatWindow",
  "Field", "MegaMenuItem", "MessageBubble", "MultiSelect", "NavDropdown",
  "NavItem", "NavSubItem", "Panel", "Search", "Select", "SelectOption",
  "SideNav", "Stat", "SubscribeField", "Switch", "Testimonial", "TextArea",
  "TextField", "Toggle", "ToggleMultiple", "TopNav", "TopNavLink",
];

// The Icons foundations page holds ~600 individual Lucide icon component
// sets — none are one of the 29 above, and walking it would make extraction
// slow for zero signal. Matched against the page name with any leading
// "↳"/whitespace/"❃" trimmed (this file's pages are indented under section
// headers like "❃ Components" in the layers panel).
const SKIP_PAGE_NAMES = new Set(["Icons"]);

// Flat set of every bound variable *name* found anywhere in a node's own
// style properties — fills/strokes (color) plus every field Figma exposes
// via node.boundVariables (padding, itemSpacing, corner radius, and for
// TEXT nodes fontSize/lineHeight/letterSpacing). Deliberately flat and
// per-component rather than per-property: matches how figmaTokens itself
// is structured (a flat "description -> token" map, not scoped to a
// specific variant/state), and keeps this resilient to internal Figma
// node renames instead of hard-coding an exact node path per property.
//
// Doesn't reuse resolveBoundVars above (that helper is for TextStyle/
// EffectStyle objects, a different Figma type from a scene node) — a real
// TEXT scene node's boundVariables.fontSize is an *array* of aliases (a
// text node can bind different ranges of its own characters to different
// variables), not the single {id} shape every other field here has.
// resolveBoundVars's `if (!alias?.id) continue` would silently treat that
// whole array as unbound and skip it — confirmed as a real bug by running
// this once and finding Calendar's own font-size/line-height tokens
// missing entirely from the result despite being genuinely bound in
// Figma. Handling both shapes uniformly below fixes that.
async function extractNodeBindings(node) {
  const names = new Set();
  if (node.boundVariables) {
    for (const value of Object.values(node.boundVariables)) {
      const aliases = Array.isArray(value) ? value : [value];
      for (const alias of aliases) {
        if (!alias?.id) continue;
        const v = await figma.variables.getVariableByIdAsync(alias.id);
        if (v) names.add(v.name);
      }
    }
  }
  if (Array.isArray(node.fills) && node.fills[0]?.boundVariables?.color) {
    const v = await figma.variables.getVariableByIdAsync(node.fills[0].boundVariables.color.id);
    if (v) names.add(v.name);
  }
  if (Array.isArray(node.strokes) && node.strokes[0]?.boundVariables?.color) {
    const v = await figma.variables.getVariableByIdAsync(node.strokes[0].boundVariables.color.id);
    if (v) names.add(v.name);
  }
  return names;
}

// Walks a component's full subtree (every variant, for a COMPONENT_SET —
// intentional: a claimed token in figmaTokens might only apply to one
// state/variant, e.g. Button secondary's hover-only color.border.focus,
// and should still be found). depth cap is a safety net against
// pathological nesting, not expected to ever bind in practice.
async function collectComponentTokens(node, tokenSet, depth) {
  if (depth > 10) return;
  for (const name of await extractNodeBindings(node)) tokenSet.add(name);
  if ("children" in node) {
    for (const child of node.children) {
      await collectComponentTokens(child, tokenSet, depth + 1);
    }
  }
}

async function extractComponentBindings() {
  await figma.loadAllPagesAsync(); // required for figma.root.children under documentAccess: "dynamic-page"
  const warnings = [];
  const matchedByName = new Map();

  for (const page of figma.root.children) {
    const pageName = page.name.replace(/^[\s↳❃]+/, "").trim();
    if (SKIP_PAGE_NAMES.has(pageName)) continue;
    const found = page.findAll((n) => n.type === "COMPONENT" || n.type === "COMPONENT_SET");
    for (const node of found) {
      const ourName = node.name.replace(/\s+/g, "");
      if (!COMPONENT_NAMES.includes(ourName)) continue;
      if (matchedByName.has(ourName)) {
        warnings.push(
          `Multiple Figma nodes matched component "${ourName}" — using the first found (page "${matchedByName.get(ourName).pageName}").`
        );
        continue;
      }
      matchedByName.set(ourName, { node, pageName });
    }
  }

  const bindings = {};
  for (const name of COMPONENT_NAMES) {
    const match = matchedByName.get(name);
    if (!match) {
      warnings.push(`No Figma component found matching "${name}" — skipped, not reported as an empty binding set.`);
      continue;
    }
    const tokenSet = new Set();
    await collectComponentTokens(match.node, tokenSet, 0);
    bindings[name] = [...tokenSet].sort();
  }
  return { bindings, warnings };
}

figma.ui.onmessage = async (msg) => {
  if (msg.type === "get-settings") {
    const settings = (await figma.clientStorage.getAsync("latent-sync-settings")) ?? {};
    figma.ui.postMessage({ type: "settings", settings });
    return;
  }

  if (msg.type === "save-settings") {
    await figma.clientStorage.setAsync("latent-sync-settings", msg.settings);
    return;
  }

  if (msg.type === "extract") {
    try {
      const [{ tokens, warnings: tokenWarnings }, styles, { bindings, warnings: bindingWarnings }] = await Promise.all([
        extractVariables(),
        extractStyles(),
        extractComponentBindings(),
      ]);
      figma.ui.postMessage({
        type: "extract-result",
        tokens,
        styles,
        componentBindings: bindings,
        warnings: [...tokenWarnings, ...bindingWarnings],
      });
    } catch (error) {
      figma.ui.postMessage({ type: "extract-error", message: String((error && error.message) || error) });
    }
  }
};
