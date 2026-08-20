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

// Alias values reference another variable by its dotted path, matching how
// semantic.json/density.json/breakpoint.json already write refs, e.g.
// "{color.blue.600}" — see generate-sample-fixture.mjs for a real example.
async function resolveVariableValue(raw, resolvedType) {
  if (raw && typeof raw === "object" && raw.type === "VARIABLE_ALIAS") {
    const target = await figma.variables.getVariableByIdAsync(raw.id);
    return target ? `{${target.name.replace(/\//g, ".")}}` : null;
  }
  if (resolvedType === "COLOR") return rgbaToHex(raw);
  return raw;
}

async function extractVariables() {
  const warnings = [];
  const result = { primitives: {}, semantic: {}, density: {}, breakpoint: {} };
  const collections = await figma.variables.getLocalVariableCollectionsAsync();

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
          modeMap[mode.name.trim().toLowerCase()] = await resolveVariableValue(raw, variable.resolvedType);
        }
        setNested(result[layer], pathParts, { value: modeMap });
      } else {
        const raw = variable.valuesByMode[modes[0].modeId];
        setNested(result[layer], pathParts, await resolveVariableValue(raw, variable.resolvedType));
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
      effects: await Promise.all(
        style.effects.map(async (e) => ({
          ...e,
          boundVariables: await resolveBoundVars(e.boundVariables),
        }))
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
