import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  memo,
  useLayoutEffect,
} from "react";
import {
  getIngredients,
  createIngredient,
} from "../services/ingredientService";
import { debounce } from "lodash-es";

const UNIT_OPTIONS = [
  "g",
  "kg",
  "ml",
  "l",
  "cup",
  "tbsp",
  "tsp",
  "pcs",
  "slice",
  "can",
  "oz",
  "lb",
  "pinch",
  "dash",
  "pack",
  "box",
];

const UNIT_CONVERSIONS = {
  gram: "g",
  grams: "g",
  gm: "g",
  gms: "g",
  gr: "g",
  grs: "g",

  kilogram: "kg",
  kilograms: "kg",
  kgs: "kg",
  kilo: "kg",
  kilos: "kg",

  milliliter: "ml",
  milliliters: "ml",
  millilitre: "ml",
  millilitres: "ml",
  mls: "ml",

  liter: "l",
  liters: "l",
  litre: "l",
  litres: "l",
  ltr: "l",
  ltrs: "l",

  cups: "cup",
  c: "cup",

  tablespoon: "tbsp",
  tablespoons: "tbsp",
  tbsps: "tbsp",
  tblsp: "tbsp",
  tblsps: "tbsp",
  table_spoon: "tbsp",
  table_spoons: "tbsp",

  teaspoon: "tsp",
  teaspoons: "tsp",
  tsps: "tsp",
  tea_spoon: "tsp",
  tea_spoons: "tsp",

  piece: "pcs",
  pieces: "pcs",
  pc: "pcs",
  "piece(s)": "pcs",
  nos: "pcs",
  "no.": "pcs",
  no: "pcs",
  number: "pcs",
  numbers: "pcs",

  slices: "slice",

  cans: "can",
  tin: "can",
  tins: "can",

  ounce: "oz",
  ounces: "oz",
  ozs: "oz",

  pound: "lb",
  pounds: "lb",
  lbs: "lb",
  "pound(s)": "lb",

  pinches: "pinch",
  dashes: "dash",

  package: "pack",
  packages: "pack",
  packet: "pack",
  packets: "pack",
  packs: "pack",
  pkg: "pack",
  pkgs: "pack",

  boxes: "box",
  bx: "box",
  bxs: "box",
};

function normalizeUnit(unit) {
  if (!unit) return null;
  const lowerUnit = unit.toLowerCase().trim();
  if (UNIT_OPTIONS.includes(lowerUnit)) return lowerUnit;
  if (UNIT_CONVERSIONS[lowerUnit]) return UNIT_CONVERSIONS[lowerUnit];
  return null;
}

const HEADER_PATTERNS = [
  /^ingredients\s*:?$/i,
  /^for\s*\d+\s*(st|nd|rd|th)?\s*marination\s*:?$/i,
  /^for\s*marination\s*paste\s*:?$/i,
  /^prepared\s*marination\s*paste\s*:?$/i,
  /^for\s*salad\s*:?$/i,
  /^for\s*rawa\s*fry\s*:?$/i,
  /^other\s*ingredients\s*:?$/i,
  /^for\s*garnish\s*:?$/i,
  // REMOVED: numbered list patterns - we now strip and parse these instead of ignoring
];

// English-only extraction: keep ASCII, prefer first comma-separated English segment
function extractEnglish(text) {
  if (!text) return "";
  const firstSegment = text.split(",")[0];
  const english = firstSegment.replace(/[^\x00-\x7F]+/g, "").trim();
  return english || text.replace(/[^\x00-\x7F]+/g, "").trim();
}

// Comprehensive Unicode vulgar fractions mapping with multiple representations
const UNICODE_FRACTIONS = {
  // Common fractions (multiple unicode representations)
  "¼": 0.25, // U+00BC
  "½": 0.5, // U+00BD
  "¾": 0.75, // U+00BE
  "⅐": 1 / 7, // U+2150
  "⅑": 1 / 9, // U+2151
  "⅒": 0.1, // U+2152
  "⅓": 1 / 3, // U+2153
  "⅔": 2 / 3, // U+2154
  "⅕": 0.2, // U+2155
  "⅖": 0.4, // U+2156
  "⅗": 0.6, // U+2157
  "⅘": 0.8, // U+2158
  "⅙": 1 / 6, // U+2159
  "⅚": 5 / 6, // U+215A
  "⅛": 0.125, // U+215B
  "⅜": 0.375, // U+215C
  "⅝": 0.625, // U+215D
  "⅞": 0.875, // U+215E
  "⅟": 1, // U+215F
};

// Build comprehensive regex pattern for all unicode fractions
const UNICODE_FRACTION_CHARS = Object.keys(UNICODE_FRACTIONS).join("");
const UNICODE_FRACTION_REGEX = new RegExp(
  `[${UNICODE_FRACTION_CHARS.replace(/[\[\]\\]/g, "\\$&")}]`
);

// Enhanced function to detect if a string contains or is a unicode fraction
function containsUnicodeFraction(text) {
  if (!text) return false;
  return UNICODE_FRACTION_REGEX.test(text);
}

// Enhanced function to extract unicode fraction value from text
function extractUnicodeFraction(text) {
  if (!text) return null;

  // First try exact match
  if (UNICODE_FRACTIONS.hasOwnProperty(text.trim())) {
    return UNICODE_FRACTIONS[text.trim()];
  }

  // Then try to find any unicode fraction character in the text
  for (const [fracChar, value] of Object.entries(UNICODE_FRACTIONS)) {
    if (text.includes(fracChar)) {
      return { char: fracChar, value: value, position: text.indexOf(fracChar) };
    }
  }

  return null;
}

// NEW: Function to strip leading numbered list prefixes
function stripLeadingNumberPrefix(line) {
  if (!line) return "";
  // Strip patterns like "1. ", "2. ", "10. ", etc.
  return line.replace(/^\s*\d+\.\s*/, "").trim();
}

// Normalize input line before parsing
function normalizeInputLine(rawLine) {
  if (!rawLine) return "";
  let s = rawLine;

  // NEW: Strip leading numbered list prefixes first
  s = stripLeadingNumberPrefix(s);

  // Normalize en/em dashes to hyphen for ranges
  s = s.replace(/[–—]/g, "-");

  // Insert space between digits and letters (500gm -> 500 gm)
  s = s.replace(/(\d)([a-zA-Z])/g, "$1 $2");

  // Insert space between unicode fraction and letters (2½tbsp -> 2½ tbsp)
  s = s.replace(
    new RegExp(`([${UNICODE_FRACTION_CHARS}])([a-zA-Z])`, "g"),
    "$1 $2"
  );

  // Collapse whitespace
  s = s.replace(/\s+/g, " ").trim();
  return s;
}

const AutocompleteInput = memo(
  ({
    row,
    idx,
    onInputChange,
    onIngredientSelect,
    onAddNewIngredient,
    allIngredients,
    activeMenu,
    setActiveMenu,
  }) => {
    const inputRef = useRef();
    const [cursorPosition, setCursorPosition] = useState(0);

    useLayoutEffect(() => {
      if (inputRef.current === document.activeElement && inputRef.current) {
        inputRef.current.setSelectionRange(cursorPosition, cursorPosition);
      }
    }, [row.inputValue, cursorPosition]);

    const handleInputChange = useCallback(
      (e) => {
        setCursorPosition(e.target.selectionStart);
        onInputChange(idx, e.target.value);
        setActiveMenu(idx);
      },
      [idx, onInputChange, setActiveMenu]
    );

    const handleFocus = useCallback(() => {
      setActiveMenu(idx);
    }, [idx, setActiveMenu]);

    const handleBlur = useCallback(() => {
      setTimeout(() => setActiveMenu(null), 150);
    }, [setActiveMenu]);

    const handleKeyDown = useCallback(
      (e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (!row.inputValue?.trim()) return;

          const exactMatch = allIngredients.find(
            (i) =>
              i.name.trim().toLowerCase() ===
              row.inputValue.trim().toLowerCase()
          );
          if (exactMatch) {
            onIngredientSelect(idx, exactMatch);
          } else {
            onAddNewIngredient(idx, row.inputValue);
          }
        }
      },
      [
        row.inputValue,
        idx,
        allIngredients,
        onIngredientSelect,
        onAddNewIngredient,
      ]
    );

    const handleSuggestionClick = useCallback(
      (ingredient) => {
        onIngredientSelect(idx, ingredient);
      },
      [idx, onIngredientSelect]
    );

    const handleAddNewClick = useCallback(() => {
      onAddNewIngredient(idx, row.inputValue);
    }, [idx, row.inputValue, onAddNewIngredient]);

    const lcInput = row.inputValue ? row.inputValue.toLowerCase() : "";
    const options = row.inputValue
      ? allIngredients.filter((i) => i.name.toLowerCase().includes(lcInput))
      : [];

    const exactMatch = allIngredients.some(
      (i) => i.name.trim().toLowerCase() === lcInput
    );

    return (
      <div style={{ position: "relative" }}>
        <input
          ref={inputRef}
          type="text"
          className="border border-gray-300 rounded px-2 py-1 w-32"
          value={row.inputValue}
          placeholder="Ingredient name"
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          spellCheck="false"
        />
        {activeMenu === idx && !!row.inputValue?.trim() && (
          <ul
            className="absolute z-10 bg-white shadow border border-gray-200 mt-1 rounded text-sm max-h-52 overflow-auto w-full"
            style={{ minWidth: "200px" }}
          >
            {options.map((opt) => (
              <li
                key={opt.id}
                className="px-3 py-1 hover:bg-blue-100 cursor-pointer"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(opt);
                }}
              >
                {opt.name}
              </li>
            ))}
            {!exactMatch && row.inputValue && (
              <li
                className="px-3 py-1 bg-green-50 hover:bg-green-100 cursor-pointer text-green-800"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAddNewClick();
                }}
              >
                Add new ingredient <b>{row.inputValue}</b>
              </li>
            )}
          </ul>
        )}
      </div>
    );
  }
);

export default function RecipeForm({ initialData, onSubmit, onCancel }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [servings, setServings] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [error, setError] = useState("");
  const [fetching, setFetching] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importText, setImportText] = useState("");
  const [importError, setImportError] = useState("");

  const originalIngredients = useRef([]);
  const originalServings = useRef(1);

  async function fetchIngredients() {
    setFetching(true);
    try {
      setAllIngredients(await getIngredients());
      setFetching(false);
    } catch {
      setError("Failed to load ingredients.");
      setFetching(false);
    }
  }

  useEffect(() => {
    fetchIngredients();
  }, []);

  useEffect(() => {
    if (initialData) {
      originalServings.current = initialData.servings || 1;
      originalIngredients.current = (initialData.ingredients || []).map(
        (ri) => ({
          quantity: Number(ri.quantity) || 0,
          unit: ri.unit || "",
          note: ri.note || "",
          id: ri.id || Math.random(),
          ingredient: ri.ingredient || null,
        })
      );

      setName(initialData.name);
      setDescription(initialData.description || "");
      setServings(String(initialData.servings));
      setIngredients(
        (initialData.ingredients || []).map((ri) => ({
          ingredientId: ri.ingredient ? ri.ingredient.id : "",
          ingredientName: ri.ingredient ? ri.ingredient.name : "",
          inputValue: ri.ingredient ? ri.ingredient.name : "",
          quantity: ri.quantity || "",
          unit: ri.unit || "",
          note: ri.note || "",
          id: ri.id || Math.random(),
        }))
      );
    } else {
      originalServings.current = 1;
      originalIngredients.current = [];
      setName("");
      setDescription("");
      setServings("");
      setIngredients([]);
    }
    setError("");
  }, [initialData]);

  function isHeaderLine(line) {
    const cleaned = line.replace(/\s+/g, " ").trim();
    return HEADER_PATTERNS.some((re) => re.test(cleaned));
  }

  function parseImportText(text) {
    if (!text.trim()) {
      throw new Error("Please enter recipe text to import");
    }

    const lines = text
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l);

    if (lines.length < 3) {
      throw new Error(
        "Recipe must have at least recipe name, servings, and one ingredient"
      );
    }

    const recipeName = lines[0].trim();
    if (!recipeName) {
      throw new Error("Recipe name is required");
    }

    const servingsLine = lines[1].trim();
    const servingsPatterns = [
      /(\d+)\s*servings?/i,
      /servings?\s*(\d+)/i,
      /(\d+)\s*serves?/i,
      /serves?\s*(\d+)/i,
    ];

    let parsedServings = null;
    for (const pattern of servingsPatterns) {
      const match = servingsLine.match(pattern);
      if (match) {
        parsedServings = parseInt(match[1], 10);
        break;
      }
    }

    if (!parsedServings || parsedServings < 1 || parsedServings > 100) {
      throw new Error(
        "Invalid servings format. Use format like '4 Servings' or 'Serves 4'"
      );
    }

    const parsedIngredients = [];
    const ingredientLines = lines.slice(2);

    for (let i = 0; i < ingredientLines.length; i++) {
      const rawLine = ingredientLines[i].trim();
      if (!rawLine) continue;
      if (isHeaderLine(rawLine)) continue;

      const line = normalizeInputLine(rawLine);
      const ingredient = parseIngredientLine(line);
      if (ingredient) {
        parsedIngredients.push({
          ...ingredient,
          id: Math.random(),
          ingredientId: "",
          inputValue: ingredient.ingredientName,
        });
      }
    }

    if (parsedIngredients.length === 0) {
      throw new Error("No valid ingredients found");
    }

    return {
      recipeName,
      servings: parsedServings,
      ingredients: parsedIngredients,
    };
  }

  // Parse ranges like "10-12" -> 12
  function parseRangeToMax(token) {
    const m = token.match(/^(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)$/);
    if (m) {
      const a = parseFloat(m[1]);
      const b = parseFloat(m[2]);
      if (isFinite(a) && isFinite(b)) return Math.max(a, b);
    }
    return null;
  }

  // Enhanced parseQuantity function with robust unicode fraction handling
  function parseQuantity(text) {
    if (!text || typeof text !== "string") return null;
    let t = text.trim();
    if (!t) return null;

    // PRIORITY 1: Check for exact unicode fraction match first
    const unicodeFractionValue = extractUnicodeFraction(t);
    if (unicodeFractionValue !== null) {
      // If it's just the unicode fraction character alone
      if (typeof unicodeFractionValue === "number") {
        return unicodeFractionValue;
      }
      // If it's a complex match with position info
      if (
        unicodeFractionValue.char &&
        unicodeFractionValue.value !== undefined
      ) {
        // Check if it's combined with a number (like "2½")
        const beforeFrac = t.substring(0, unicodeFractionValue.position).trim();
        const afterFrac = t.substring(unicodeFractionValue.position + 1).trim();

        if (beforeFrac && /^\d+$/.test(beforeFrac) && !afterFrac) {
          // Case like "2½"
          return parseFloat(beforeFrac) + unicodeFractionValue.value;
        } else if (!beforeFrac && !afterFrac) {
          // Case like standalone "½"
          return unicodeFractionValue.value;
        }
      }
    }

    // PRIORITY 2: Range like "10-12"
    const ranged = parseRangeToMax(t);
    if (ranged !== null) return ranged;

    // PRIORITY 3: Direct integer or decimal (e.g., "0.5", "2")
    if (/^\d*\.?\d+$/.test(t)) {
      const directNum = parseFloat(t);
      if (!isNaN(directNum) && isFinite(directNum)) return directNum;
    }

    // PRIORITY 4: Mixed ASCII fraction with space (handled at token level): "1 1/2", "2 3/4th"
    let m = t.match(/^(\d+)\s+(\d+)\/(\d+)(?:[a-zA-Z]+)?$/);
    if (m) {
      const whole = parseInt(m[1], 10);
      const num = parseInt(m[2], 10);
      const den = parseInt(m[3], 10);
      if (den) return whole + num / den;
    }

    // PRIORITY 5: Simple ASCII fraction with optional suffix letters: "1/4", "1/4th"
    m = t.match(/^(\d+)\/(\d+)(?:[a-zA-Z]+)?$/);
    if (m) {
      const num = parseInt(m[1], 10);
      const den = parseInt(m[2], 10);
      if (den) return num / den;
    }

    // PRIORITY 6: Common fraction words
    const fractionWords = {
      half: 0.5,
      quarter: 0.25,
      "one-third": 1 / 3,
      third: 1 / 3,
      "two-thirds": 2 / 3,
      "one-fourth": 0.25,
      "three-fourths": 0.75,
      "one-eighth": 0.125,
    };
    const lower = t.toLowerCase();
    if (fractionWords[lower] != null) return fractionWords[lower];

    return null;
  }

  // Enhanced function to detect consecutive quantity tokens and combine them into mixed fractions
  function parseConsecutiveQuantities(tokens, startIndex) {
    let totalQuantity = null;
    let consumedTokens = 0;

    // Parse first token
    const firstQty = parseQuantity(tokens[startIndex]);
    if (firstQty === null) return { quantity: null, consumedTokens: 0 };

    totalQuantity = firstQty;
    consumedTokens = 1;

    // Check if next token is also a quantity (for mixed fractions like "2 1/3")
    if (startIndex + 1 < tokens.length) {
      const nextToken = tokens[startIndex + 1];
      const nextQty = parseQuantity(nextToken);

      // If next token is a fraction (not a whole number), add it to make a mixed fraction
      if (nextQty !== null && nextQty < 1) {
        totalQuantity += nextQty;
        consumedTokens = 2;
      }
      // Handle unicode fractions directly (like "1 ⅓")
      else if (containsUnicodeFraction(nextToken)) {
        const unicodeValue = extractUnicodeFraction(nextToken);
        if (typeof unicodeValue === "number") {
          totalQuantity += unicodeValue;
          consumedTokens = 2;
        } else if (unicodeValue && unicodeValue.value !== undefined) {
          totalQuantity += unicodeValue.value;
          consumedTokens = 2;
        }
      }
    }

    return { quantity: totalQuantity, consumedTokens };
  }

  function joinNotes(a, b) {
    const parts = [a, b].map((p) => (p || "").trim()).filter((p) => p);
    return parts.join(", ");
  }

  function capitalizeWords(s) {
    return s
      .split(" ")
      .filter((p) => p)
      .map((w) => (w[0] ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  }

  function parseIngredientLine(line) {
    line = line.trim().replace(/[.;]+$/, "");

    // Extract parentheses notes FIRST before tokenizing
    const notes = [];
    let tmp = line.replace(/\(([^)]+)\)/g, (match, content) => {
      notes.push(content.trim());
      return "";
    });
    tmp = tmp.replace(/\s+/g, " ").trim();

    // Prefer English for main segment
    const primaryPart = extractEnglish(tmp);

    // Additional English notes after comma
    const commaParts = tmp
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p);
    let commaNote = "";
    if (commaParts.length > 1) {
      commaNote = commaParts
        .slice(1)
        .map((p) => p.replace(/[^\x00-\x7F]+/g, "").trim())
        .filter((p) => p)
        .join(", ");
    }

    const allNotes = [...notes, commaNote].filter((n) => n).join(", ");

    if (!primaryPart || isHeaderLine(primaryPart)) {
      return null;
    }

    let tokens = primaryPart.split(/\s+/).filter((t) => t);
    if (tokens.length === 0) return null;

    // Special: "A pinch of salt" (traditional format)
    if (
      tokens.length >= 3 &&
      tokens[0].toLowerCase() === "a" &&
      normalizeUnit(tokens[1])
    ) {
      const unit = normalizeUnit(tokens[1]);
      const startIdx = tokens[2].toLowerCase() === "of" ? 3 : 2;
      const ingName = tokens.slice(startIdx).join(" ");
      return {
        ingredientName: capitalizeWords(ingName),
        quantity: "",
        unit: unit || "",
        note: allNotes,
      };
    }

    // Special handling for "Salt A Pinch" pattern (reverse format)
    if (
      tokens.length >= 3 &&
      tokens[tokens.length - 2].toLowerCase() === "a" &&
      normalizeUnit(tokens[tokens.length - 1])
    ) {
      const unit = normalizeUnit(tokens[tokens.length - 1]);
      const ingName = tokens.slice(0, -2).join(" ");
      return {
        ingredientName: capitalizeWords(ingName),
        quantity: "",
        unit: unit || "",
        note: allNotes,
      };
    }

    // Special: "Salt to taste"
    if (
      tokens.length >= 3 &&
      tokens[tokens.length - 2].toLowerCase() === "to" &&
      tokens[tokens.length - 1].toLowerCase() === "taste"
    ) {
      const ingName = tokens.slice(0, -2).join(" ");
      return {
        ingredientName: capitalizeWords(ingName),
        quantity: "",
        unit: "",
        note: joinNotes("to taste", allNotes),
      };
    }

    // Special: "<name> for <note...>"
    const forIdx = tokens.findIndex((t) => t.toLowerCase() === "for");
    if (forIdx > 0) {
      const ingName = tokens.slice(0, forIdx).join(" ");
      const restNote = tokens.slice(forIdx).join(" ");
      return {
        ingredientName: capitalizeWords(ingName),
        quantity: "",
        unit: "",
        note: joinNotes(restNote, allNotes),
      };
    }

    // Special: "+" separated names without quantities -> choose last item
    if (
      !/\d/.test(primaryPart) &&
      !containsUnicodeFraction(primaryPart) &&
      primaryPart.includes("+")
    ) {
      const plusParts = primaryPart
        .split("+")
        .map((p) => p.trim())
        .filter((p) => p);
      const last = plusParts[plusParts.length - 1];
      const name = last.split(/\s+/).pop() || last;
      return {
        ingredientName: capitalizeWords(name),
        quantity: "",
        unit: "",
        note: allNotes,
      };
    }

    // ENHANCED quantity and unit detection - properly handles both "½ cup Onion" AND "Onion ½ cup"
    let quantity = null;
    let quantityIndices = [];
    let unit = null;
    let unitIndex = -1;

    // First pass: look for quantity/unit pairs in sequence
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];

      // Skip if we already processed this token as part of consecutive quantities
      if (quantityIndices.includes(i)) continue;

      // Handle stuck "500gm" or "12no."
      const stuck = token.match(/^(\d+(?:\.\d+)?)([a-zA-Z.]+)$/);
      if (stuck) {
        const q = parseFloat(stuck[1]);
        const u = normalizeUnit(stuck[2].replace(/\.$/, ""));
        if (!isNaN(q) && u) {
          quantity = q;
          quantityIndices = [i];
          unit = u;
          unitIndex = i;
          break;
        }
      }

      // Range "10-12"
      const rng = parseRangeToMax(token);
      if (rng !== null) {
        quantity = rng;
        quantityIndices = [i];
        if (i + 1 < tokens.length) {
          const candRaw = tokens[i + 1].replace(/\.$/, "");
          const cand = normalizeUnit(candRaw);
          if (cand) {
            unit = cand;
            unitIndex = i + 1;
          }
        }
        break;
      }

      // Try consecutive quantities (enhanced to handle mixed fractions like "2 1/3")
      const consecutiveResult = parseConsecutiveQuantities(tokens, i);
      if (consecutiveResult.quantity !== null) {
        quantity = consecutiveResult.quantity;
        quantityIndices = [];
        for (let j = 0; j < consecutiveResult.consumedTokens; j++) {
          quantityIndices.push(i + j);
        }

        // Look for unit after the consumed quantity tokens
        const nextTokenIndex = i + consecutiveResult.consumedTokens;
        if (nextTokenIndex < tokens.length) {
          const nextRaw = tokens[nextTokenIndex].replace(/\.$/, "");
          const u = normalizeUnit(nextRaw);
          if (u) {
            unit = u;
            unitIndex = nextTokenIndex;
          }
        }
        break;
      }
    }

    // If quantity found but no unit yet, scan ALL other tokens for unit (crucial for "Onion ½ cup" pattern)
    if (quantity !== null && unit === null) {
      for (let i = 0; i < tokens.length; i++) {
        if (quantityIndices.includes(i)) continue;
        const cand = normalizeUnit(tokens[i].replace(/\.$/, ""));
        if (cand) {
          unit = cand;
          unitIndex = i;
          break;
        }
      }
    }

    // Build ingredient name excluding ALL detected quantity and unit tokens
    const excludedIndices = new Set(
      [...quantityIndices, unitIndex].filter((idx) => idx !== -1)
    );
    const nameTokens = tokens.filter((_, i) => !excludedIndices.has(i));

    let ingredientName = nameTokens.join(" ").trim();

    // Remove leading "no." that might remain
    if (/^no\.?\s+/i.test(ingredientName)) {
      ingredientName = ingredientName.replace(/^no\.?\s+/i, "").trim();
    }

    // Move adjectives to notes for cases like "dry Kashmiri red chillies"
    const adjectivePrefixes = [
      "dry",
      "fresh",
      "tender",
      "roasted",
      "toasted",
      "ground",
      "whole",
      "finely",
      "coarsely",
      "lightly",
      "heavily",
      "grated",
      "sliced",
      "chopped",
      "diced",
      "minced",
      "crushed",
      "powdered",
      "blanched",
      "steamed",
      "baked",
      "fried",
      "boiled",
      "raw",
    ];
    const lowered = ingredientName.toLowerCase();
    for (const adj of adjectivePrefixes) {
      if (lowered.startsWith(adj + " ")) {
        const rest = ingredientName.slice(adj.length).trim();
        ingredientName = rest;
        const updatedNote = joinNotes(adj, allNotes);
        const finalName = extractEnglish(ingredientName);
        return {
          ingredientName: capitalizeWords(finalName),
          quantity: quantity !== null ? quantity.toString() : "",
          unit: unit || "",
          note: updatedNote,
        };
      }
    }

    // Final English-only cleanup for name
    ingredientName = extractEnglish(ingredientName);
    if (!ingredientName) return null;

    return {
      ingredientName: capitalizeWords(ingredientName),
      quantity: quantity !== null ? quantity.toString() : "",
      unit: unit || "",
      note: allNotes,
    };
  }

  function handleImportRecipe() {
    try {
      setImportError("");
      const parsed = parseImportText(importText);

      setName(parsed.recipeName);
      setServings(parsed.servings.toString());
      setIngredients(parsed.ingredients);

      setShowImportModal(false);
      setImportText("");

      setError("");
    } catch (err) {
      setImportError(err.message || "Failed to import recipe.");
    }
  }

  const handleAddIngredient = useCallback(() => {
    setIngredients((prev) => [
      ...prev,
      {
        ingredientId: "",
        ingredientName: "",
        inputValue: "",
        quantity: "",
        unit: "",
        note: "",
        id: Math.random(),
      },
    ]);
  }, []);

  const updateIngredientRow = useCallback((idx, newFields) => {
    setIngredients((rows) =>
      rows.map((row, i) => (i === idx ? { ...row, ...newFields } : row))
    );
  }, []);

  const handleRemoveIngredient = useCallback((idx) => {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const handleIngredientInputChange = useCallback(
    (idx, value) => {
      updateIngredientRow(idx, {
        inputValue: value,
        ingredientId: "",
        ingredientName: value,
      });
    },
    [updateIngredientRow]
  );

  const handleIngredientSelect = useCallback(
    (idx, ingredient) => {
      updateIngredientRow(idx, {
        ingredientId: ingredient.id,
        ingredientName: ingredient.name,
        inputValue: ingredient.name,
      });
      setActiveMenu(null);
    },
    [updateIngredientRow]
  );

  const handleAddNewIngredient = useCallback(
    async (idx, name) => {
      try {
        const created = await createIngredient({ name: name.trim() });
        await fetchIngredients();
        updateIngredientRow(idx, {
          ingredientId: created.id,
          ingredientName: created.name,
          inputValue: created.name,
        });
        setActiveMenu(null);
      } catch (e) {
        let msg = "Failed to add new ingredient.";
        if (e.response?.data) {
          msg =
            typeof e.response.data === "string"
              ? e.response.data
              : e.response.data.message || msg;
        }
        setError(msg);
      }
    },
    [updateIngredientRow]
  );

  const debouncedUpdateServings = useCallback(
    debounce((recipeId, newServings) => {
      // Optional backend update
    }, 2000),
    []
  );

  function handleServingsChange(e) {
    const newServings = e.target.value;
    setServings(newServings);

    if (initialData && initialData.id) {
      const factor =
        originalServings.current && Number(originalServings.current) > 0
          ? Number(newServings) / Number(originalServings.current)
          : 1;
      setIngredients(
        originalIngredients.current.map((orig) => ({
          ingredientId: orig.ingredient ? orig.ingredient.id : "",
          ingredientName: orig.ingredient ? orig.ingredient.name : "",
          inputValue: orig.ingredient ? orig.ingredient.name : "",
          quantity: isFinite(Number(orig.quantity * factor))
            ? Number(orig.quantity * factor).toFixed(2)
            : "",
          unit: orig.unit || "",
          note: orig.note || "",
          id: orig.id || Math.random(),
        }))
      );
      debouncedUpdateServings(initialData.id, newServings);
    }
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Recipe name is required.");
      return;
    }

    const servingsValue = parseInt(servings, 10) || 0;
    if (servingsValue < 1 || servingsValue > 100) {
      setError("Servings must be between 1 and 100.");
      return;
    }

    if (
      ingredients.length === 0 ||
      ingredients.some(
        (row) =>
          !(
            row.ingredientId ||
            (row.ingredientName && row.ingredientName.trim())
          )
      )
    ) {
      setError("All ingredient rows must have an ingredient name.");
      return;
    }

    const invalidRows = ingredients.filter((row) => {
      const hasQuantity =
        row.quantity &&
        String(row.quantity).trim() &&
        !isNaN(Number(row.quantity)) &&
        Number(row.quantity) > 0;
      const hasUnit = row.unit && row.unit.trim();
      return hasQuantity && !hasUnit;
    });

    if (invalidRows.length > 0) {
      setError("Ingredients with quantity must also have a unit.");
      return;
    }

    setError("");

    onSubmit({
      ...initialData,
      name: name.trim(),
      description: description.trim(),
      servings: servingsValue,
      ingredients: ingredients.map((row) => ({
        ingredient: allIngredients.find(
          (a) => String(a.id) === String(row.ingredientId)
        ) || {
          id: null,
          name: row.ingredientName,
        },
        quantity:
          row.quantity && String(row.quantity).trim()
            ? Number(row.quantity)
            : 0,
        unit: row.unit || "",
        note: row.note,
        id: row.id,
      })),
    });
  }

  return (
    <>
      <form
        className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6 max-w-2xl mx-auto flex flex-col gap-6"
        onSubmit={handleFormSubmit}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-blue-800">
            {initialData ? "Edit Recipe" : "Add Recipe"}
          </h3>
          <button
            type="button"
            className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            onClick={() => setShowImportModal(true)}
          >
            Import Recipe
          </button>
        </div>

        <div>
          <label className="block mb-1 font-semibold text-blue-700">
            Recipe Name
          </label>
          <input
            type="text"
            className="w-full border border-blue-300 rounded px-3 py-2"
            value={name}
            required
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div>
          <label className="block mb-1 font-semibold text-blue-700">
            Description
          </label>
          <textarea
            className="w-full border border-blue-300 rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="2"
          />
        </div>
        <div>
          <div>
            <label className="block mb-1 font-semibold text-blue-700">
              Servings
            </label>
            <input
              type="number"
              min="1"
              max="100"
              className="border border-blue-300 rounded px-3 py-2 w-24"
              value={servings}
              required
              onChange={handleServingsChange}
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-semibold text-blue-700">Ingredients</label>
              <button
                type="button"
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleAddIngredient}
              >
                Add Ingredient
              </button>
            </div>
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead>
                <tr>
                  <th className="px-2 py-1">Ingredient</th>
                  <th className="px-2 py-1">Quantity</th>
                  <th className="px-2 py-1">Unit</th>
                  <th className="px-2 py-1">Note</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {ingredients.map((row, idx) => (
                  <tr key={row.id}>
                    <td>
                      <AutocompleteInput
                        row={row}
                        idx={idx}
                        onInputChange={handleIngredientInputChange}
                        onIngredientSelect={handleIngredientSelect}
                        onAddNewIngredient={handleAddNewIngredient}
                        allIngredients={allIngredients}
                        activeMenu={activeMenu}
                        setActiveMenu={setActiveMenu}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        className="border border-gray-300 rounded px-2 py-1 w-20"
                        value={row.quantity}
                        onChange={(e) =>
                          updateIngredientRow(idx, { quantity: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <select
                        className="border border-gray-300 rounded px-2 py-1"
                        value={row.unit}
                        onChange={(e) =>
                          updateIngredientRow(idx, { unit: e.target.value })
                        }
                      >
                        <option value="">Select unit</option>
                        {UNIT_OPTIONS.map((unit) => (
                          <option key={unit} value={unit}>
                            {unit}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="border border-gray-300 rounded px-2 py-1"
                        value={row.note}
                        onChange={(e) =>
                          updateIngredientRow(idx, { note: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="text-red-600 px-2"
                        title="Remove"
                        onClick={() => handleRemoveIngredient(idx)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
                {error && (
                  <tr>
                    <td colSpan="5" className="text-red-600 text-sm">
                      {error}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="flex gap-4 justify-end items-center mt-6">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-700 text-white rounded"
            >
              Save Recipe
            </button>
          </div>
        </div>
      </form>

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Import Recipe</h3>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setShowImportModal(false);
                  setImportText("");
                  setImportError("");
                }}
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                Paste your recipe text; section headers are ignored
                automatically.
              </p>
              <div className="bg-gray-50 p-3 rounded text-xs font-mono">
                <div>Chicken Biryani</div>
                <div>4 Servings</div>
                <div>½ tsp Turmeric powder</div>
                <div>
                  10-12 no. dry Kashmiri red chillies, soaked, सुखी कश्मीरी लाल
                  मिर्च
                </div>
                <div>Chicken thigh 500 gm (boneless)</div>
                <div>Hung curd 1 1/4 cup</div>
                <div>Oil 2⅓ tbsp</div>
                <div>Live charcoal + ghee</div>
                <div>Oil for shallow frying</div>
                <div>⅓ cup Semolina</div>
                <div>1 ⅓ cup Stock</div>
                <div>2 1/3 tbsp Sugar</div>
                <div>Onion ½ cup (chopped)</div>
                <div>Salt A Pinch</div>
                <div>1. Anardana Powder</div>
                <div>2. Aamchur powder 1 tbsp</div>
                <div>3. Red chilli powder 1 tbsp</div>
                <div>4. Coriander powder 1 tbsp</div>
              </div>
            </div>

            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2 h-64"
              placeholder="Paste your recipe here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
            />

            {importError && (
              <div className="mt-2 text-red-600 text-sm">{importError}</div>
            )}

            <div className="flex gap-3 justify-end mt-4">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => {
                  setShowImportModal(false);
                  setImportText("");
                  setImportError("");
                }}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                onClick={handleImportRecipe}
                disabled={!importText.trim()}
              >
                Import Recipe
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
