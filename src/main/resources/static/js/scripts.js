// scripts.js

console.log("Scripts loaded");

function addIngredientRow() {
    const container = document.getElementById('ingredients-container');
    const index = container.children.length;

    // Create container div for the new ingredient row
    const wrapper = document.createElement('div');
    wrapper.className = 'ingredient-row';

    // Clone ingredient options from hidden select
    const optionsHtml = document.getElementById('ingredient-options-template').innerHTML;

    wrapper.innerHTML = `
        <select name="ingredients[${index}].ingredient.id" required class="select-field">
            ${optionsHtml}
        </select>

        <label>Quantity:</label>
        <input type="number" name="ingredients[${index}].quantity" step="0.01" min="0" required class="input-field" />

        <label>Note:</label>
        <input type="text" name="ingredients[${index}].note" class="input-field" />

        <button type="button" class="button small danger" onclick="removeIngredientRow(this)">Remove</button>
    `;

    container.appendChild(wrapper);
}

function removeIngredientRow(button) {
    button.parentElement.remove();
}

// scripts.js

// Generates day blocks and recipe dropdown menus based on user input.
// If 'isEdit' is true, pre-select existing recipes in edit mode.
// scripts.js

// Generates day blocks and recipe dropdown menus based on user input.
// If 'isEdit' is true, pre-select existing recipes in edit mode.
function generateDayBlocks(isEdit = false) {
    const container = document.getElementById('mealplan-entries');
    container.innerHTML = '';

    const numDaysInput = document.getElementById('numDays');
    const recipesPerDayInput = document.getElementById('recipesPerDay');

    if (!numDaysInput || !recipesPerDayInput) {
        alert('Missing Days/Recipes input');
        return;
    }

    let numDays = parseInt(numDaysInput.value);
    let recipesPerDay = parseInt(recipesPerDayInput.value);

    if (!(numDays > 0) || !(recipesPerDay > 0)) {
        alert('Please enter positive numbers for days and recipes per day.');
        return;
    }

    const allRecipes = window.allRecipes || [];
    const initialItems = window.initialItems || [];
    const mealPlanDates = window.mealPlanDates || [];

    function getSelectedRecipeId(dayIndex, recipeIndex) {
        if (!isEdit) return '';
        if (dayIndex >= mealPlanDates.length) return '';
        const targetDateStr = mealPlanDates[dayIndex];
        const dayItems = initialItems.filter(item => item.date === targetDateStr);
        if (dayItems.length && recipeIndex < dayItems.length) {
            const recipe = dayItems[recipeIndex].recipe;
            return recipe ? recipe.id : '';
        }
        return '';
    }

    for (let dayIndex = 0; dayIndex < numDays; dayIndex++) {
        const dayDiv = document.createElement('div');
        dayDiv.style.marginBottom = '20px';
        dayDiv.style.border = '1px solid #ccc';
        dayDiv.style.padding = '10px';
        dayDiv.style.borderRadius = '6px';

        let dayLabel = `Day ${dayIndex + 1}`;
        if (mealPlanDates[dayIndex]) {
            const dt = new Date(mealPlanDates[dayIndex]);
            dayLabel = dt.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
        }
        const heading = document.createElement('h3');
        heading.textContent = dayLabel;
        dayDiv.appendChild(heading);

        for (let recipeIndex = 0; recipeIndex < recipesPerDay; recipeIndex++) {
            const label = document.createElement('label');
            label.textContent = `Recipe ${recipeIndex + 1}: `;
            dayDiv.appendChild(label);

            const select = document.createElement('select');
            select.name = 'recipeIds';
            select.required = true;
            select.style.marginRight = '10px';

            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '-- Select Recipe --';
            defaultOption.disabled = true;
            defaultOption.selected = true;
            select.appendChild(defaultOption);

            allRecipes.forEach(recipe => {
                const option = document.createElement('option');
                option.value = recipe.id;
                option.textContent = recipe.name;
                select.appendChild(option);
            });

            const selectedId = getSelectedRecipeId(dayIndex, recipeIndex);
            if (selectedId) {
                select.value = selectedId;
            }

            dayDiv.appendChild(select);

            const inputDate = document.createElement('input');
            inputDate.type = 'hidden';
            inputDate.name = 'dates';

            if (mealPlanDates[dayIndex]) {
                inputDate.value = mealPlanDates[dayIndex];
            } else {
                const d = new Date();
                d.setDate(d.getDate() + dayIndex);
                inputDate.value = d.toISOString().substring(0, 10);
            }
            dayDiv.appendChild(inputDate);

            dayDiv.appendChild(document.createElement('br'));
        }

        container.appendChild(dayDiv);
    }
}

