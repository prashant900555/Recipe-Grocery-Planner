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

const UNIT_OPTIONS = [
  "g",
  "kg",
  "ml",
  "l",
  "cup",
  "tbsp",
  "tsp",
  "piece",
  "slice",
  "can",
  "oz",
];

// Memoized AutocompleteInput component to prevent unnecessary re-renders
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

    // Preserve cursor position
    useLayoutEffect(() => {
      if (inputRef.current && document.activeElement === inputRef.current) {
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
          spellCheck={false}
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
                + Add new ingredient: <b>{row.inputValue}</b>
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
  const [ingredients, setIngredients] = useState([]);
  const [allIngredients, setAllIngredients] = useState([]);
  const [error, setError] = useState();
  const [fetching, setFetching] = useState(false);
  const [activeMenu, setActiveMenu] = useState(null);

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
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setIngredients(
        (initialData.ingredients || []).map((ri) => ({
          ingredientId: ri.ingredient ? ri.ingredient.id : "",
          ingredientName: ri.ingredient ? ri.ingredient.name : "",
          inputValue: ri.ingredient ? ri.ingredient.name : "",
          quantity: ri.quantity || "",
          unit: ri.unit || UNIT_OPTIONS[0],
          note: ri.note || "",
          id: ri.id || Math.random(),
        }))
      );
    } else {
      setName("");
      setDescription("");
      setIngredients([]);
    }
    setError();
  }, [initialData]);

  const handleAddIngredient = useCallback(() => {
    setIngredients((prev) => [
      ...prev,
      {
        ingredientId: "",
        ingredientName: "",
        inputValue: "",
        quantity: "",
        unit: UNIT_OPTIONS[0],
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

  function handleFormSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Recipe name is required.");
      return;
    }
    if (
      ingredients.length === 0 ||
      ingredients.some(
        (row) =>
          !row.ingredientId ||
          !row.unit ||
          !row.quantity ||
          isNaN(Number(row.quantity)) ||
          Number(row.quantity) <= 0
      )
    ) {
      setError(
        "All ingredient rows must have an ingredient, unit, and a positive quantity."
      );
      return;
    }
    setError();

    onSubmit({
      ...initialData,
      name: name.trim(),
      description: description.trim(),
      ingredients: ingredients.map((row) => ({
        ingredient: allIngredients.find(
          (a) => String(a.id) === String(row.ingredientId)
        ),
        quantity: Number(row.quantity),
        unit: row.unit,
        note: row.note,
        id: row.id,
      })),
    });
  }

  return (
    <form
      className="bg-blue-50 border border-blue-200 rounded-lg shadow p-6 max-w-2xl mx-auto flex flex-col gap-6"
      onSubmit={handleFormSubmit}
    >
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
          rows={2}
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
              <th />
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
                    required
                    className="border border-gray-300 rounded px-2 py-1 w-20"
                    value={row.quantity}
                    onChange={(e) =>
                      updateIngredientRow(idx, { quantity: e.target.value })
                    }
                  />
                </td>
                <td>
                  <select
                    required
                    className="border border-gray-300 rounded px-2 py-1"
                    value={row.unit}
                    onChange={(e) =>
                      updateIngredientRow(idx, { unit: e.target.value })
                    }
                  >
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
                <td colSpan={5} className="text-red-600 text-sm">
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
    </form>
  );
}
