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
      const [{ tokens, warnings }, styles] = await Promise.all([extractVariables(), extractStyles()]);
      figma.ui.postMessage({ type: "extract-result", tokens, styles, warnings });
    } catch (error) {
      figma.ui.postMessage({ type: "extract-error", message: String((error && error.message) || error) });
    }
  }
};
