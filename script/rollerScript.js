const maxDice = 12;
let diceList = [];

function createElementWithClass(elementType, className) {
    const element = document.createElement(elementType);
    element.className = className;
    return element;
}

function createIconWithHtml(tagName, className) {
        const element = document.createElement(tagName);
        element.className = className;
        return element;
    }

function toggleClass(el, class1, class2) {
    el.classList.toggle(class1);
    el.classList.toggle(class2);
}

function addDice() {
    if (diceList.length >= maxDice) {
        alert("You've reached the maximum number of dice!");
        return;
    }
    const dice = createDice();
    diceList.push(dice);
    dice.addEventListener('click', (e) => {
        const isSettingsButton = e.target.classList.contains('dice-button') || e.target.closest('.dice-button');
        if (isSettingsButton) {
            return;
        }

        const settingsOpen = Array.from(document.querySelectorAll('.settings-container')).some(container => container.style.display === 'grid');
        const colorPickerOpen = Array.from(document.querySelectorAll('.color-picker')).some(picker => picker.style.display === 'grid');

        if (settingsOpen || colorPickerOpen) {
            closeSettings();
            return;
        }

        const holdIconContainer = dice.querySelector('.hold-icon-container');
        const holdIconElement = holdIconContainer.querySelector('.icon i');
        const isHeld = dice.classList.contains('dice-held');

        toggleClass(dice, 'dice-held', !isHeld);
        toggleClass(holdIconElement, 'fa-lock', 'fa-unlock');
        holdIconContainer.style.display = isHeld ? 'none' : 'block';

        updateHoldStatus();
    });
    document.getElementById('dice-container').appendChild(dice);
    updateDiceSize();
}

function removeDice(dice) {
    const index = diceList.indexOf(dice);
    if (index !== -1) {
        diceList.splice(index, 1);
    }
    dice.parentNode.removeChild(dice);
    updateHoldStatus()
    updateDiceSize();
}

function createColorPicker(colors) {
        const colorPicker = document.createElement('div');
        colorPicker.className = 'color-picker';
        colorPicker.style.display = 'none';

        colors.forEach((color) => {
                const swatch = document.createElement('div');
                swatch.className = 'color-swatch';
                swatch.style.backgroundColor = color;
                swatch.addEventListener('click', (e) => {
                        const dice = e.target.closest('.dice');
                        const number = dice.querySelector('.number');
                        const actionContainer = dice.querySelector('.dice-action-container');
                        const settingsContainer = dice.querySelector('.settings-container');
                        const removeButton = dice.querySelector('.dice-button.remove');

                        dice.style.backgroundColor = color;
                        number.style.color = (color === '#E9EAEC' || color === '#FBFB3C') ? 'black' : 'white';
                        colorPicker.style.display = 'none';

                        // Hide the settings container and remove button
                        settingsContainer.style.display = 'none';
                        removeButton.style.display = 'none';

                        // Show the action container
                        actionContainer.style.display = 'grid';
                });
                colorPicker.appendChild(swatch);
        });

        return colorPicker;
}

function createDice(numberValue = 1, faces = 6, customFaces = [], color = '#E9EAEC') {
        const dice = createElementWithClass('div', 'dice');
    
        const number = createElementWithClass('div', 'number');
        number.style.color = 'black';
        number.textContent = numberValue;
        dice.appendChild(number);
    
        dice.style.backgroundColor = color;
        dice.customFaces = customFaces;
    
        const actionContainer = createElementWithClass('div', 'dice-action-container');
        dice.appendChild(actionContainer);
    
        const holdIconContainer = createElementWithClass('div', 'hold-icon-container');
        holdIconContainer.style.display = 'none';
        actionContainer.appendChild(holdIconContainer);
    
        const holdIcon = createIconWithHtml('div', 'fa-solid fa-unlock');
        holdIconContainer.appendChild(holdIcon);
    
        const settingsButton = createElementWithClass('button', 'button dice-button settings');
        settingsButton.addEventListener('click', () => {
            toggleContainers(actionContainer, removeButton, settingsContainer);
        });
        actionContainer.appendChild(settingsButton);
    
        const configureIcon = createIconWithHtml('div', 'fas fa-cog');
        settingsButton.appendChild(configureIcon);
    
        // Remove Button
        const removeButton = createElementWithClass('button', 'button dice-button remove');
        removeButton.style.display = 'none';
        removeButton.addEventListener('click', () => {
            removeDice(dice);
        });
        dice.appendChild(removeButton);
    
        const removeIcon = createIconWithHtml('div', 'fa-solid fa-xmark');
        removeButton.appendChild(removeIcon);
    
        // Settings Container
        const settingsContainer = createElementWithClass('div', 'settings-container');
        settingsContainer.style.display = 'none';
        dice.appendChild(settingsContainer);


        // Custom Faces Button
        const customFacesButton = createElementWithClass('button', 'button dice-button custom-faces');
        const customFacesIcon = createIconWithHtml('div', 'fas fa-star');
        customFacesButton.appendChild(customFacesIcon);
        settingsContainer.appendChild(customFacesButton);
        dice.customFaces = [];
        customFacesButton.addEventListener('click', () => {
                // Prepare the current custom faces message
                const currentFacesMessage = dice.customFaces.length > 0
                        ? `${dice.customFaces.join(', ')}\n\n`
                        : '';

                // Prompt the user to enter custom faces
                const input = prompt(`Enter new custom faces, separated by commas:`, currentFacesMessage);
                if (input !== null) {
                        dice.customFaces = input.split(',').map(face => face.trim());
                        // Roll the dice with the new custom faces
                        dice.querySelector('.number').textContent = dice.customFaces[getRandomNumber(0, dice.customFaces.length - 1)];

                        // Update the font size
                        updateFontSize(dice);
                }
        });




        // Number Faces Button
        const facesButton = createElementWithClass('button', 'button dice-button');
        settingsContainer.appendChild(facesButton);
        const facesIcon = createIconWithHtml('div', 'fas fa-hashtag');
        facesButton.appendChild(facesIcon);

        facesButton.addEventListener('click', () => {
                const input = prompt('Enter the number of faces (1-100):', facesInput.value);
                if (input !== null && !isNaN(input) && input >= 1 && input <= 100) {
                    facesInput.value = input;
                    dice.customFaces = []; // Clear out custom faces
                    // Roll the dice with the new number of faces
                    dice.querySelector(".number").textContent = getRandomNumber(1, parseInt(facesInput.value, 10));
                } else {
                    alert('Please enter a valid whole number between 1 and 100.');
                }
            });


        // Color Button
        const colorButton = createElementWithClass('button', 'button dice-button color');
    const colorIcon = createIconWithHtml('div', 'fas fa-paint-brush');
    colorButton.appendChild(colorIcon);
    settingsContainer.appendChild(colorButton);
        colorButton.addEventListener('click', () => {
                // Show/hide the color picker
                const colorPicker = dice.querySelector('.color-picker');
                if (colorPicker.style.display === 'none') {
                        colorPicker.style.display = 'grid';
                } else {
                        colorPicker.style.display = 'none';
                }
        });

        // Dice Color
        const diceColor = document.createElement('input');
        diceColor.type = 'hidden';
        diceColor.className = 'dice-color';
        diceColor.value = '#000000';
        settingsContainer.appendChild(diceColor);

        // Add the color picker
        const colorPicker = createColorPicker([
                "#E9EAEC", // white
                "#C0C0C0", // gray
                "#000000", // black
                "#E32227", // red
                "#0000FF", // blue
                "#FBFB3C", // yellow
                "#228B22", // green
                "#B24BF3", // purple
                "#F28500", // orange
                "#FF69B4", // pink
                "#AA5518", // brown
                "#EEB58B"  // tan
        ]);
        dice.appendChild(colorPicker);


        // Confirm Button
        const confirmButton = createElementWithClass('button', 'button dice-button confirm');
        confirmButton.addEventListener('click', () => {
            toggleContainers(actionContainer, removeButton, settingsContainer);
        });
        settingsContainer.appendChild(confirmButton);

      // Confirm Icon
    const confirmIcon = createIconWithHtml('div', 'fa-regular fa-square-check');
    confirmButton.appendChild(confirmIcon);

    updateHoldStatus();
    return dice;
}

function updateHoldStatus() {
        const allDice = document.querySelectorAll('.dice');
        const allDiceStatusButton = document.getElementById('all-dice-status');
        const anyHeld = Array.from(allDice).some(die => die.classList.contains('dice-held'));

        if (anyHeld) {
                allDiceStatusButton.innerHTML = '<div class="icon"><i class="fa-solid fa-unlock"></i></div>';
        } else {
                allDiceStatusButton.innerHTML = '<div class="icon"><i class="fa-solid fa-lock"></i></div>';
        }
}

function toggleHoldAllDice() {
        const allDice = document.querySelectorAll('.dice');
        const anyHeld = Array.from(allDice).some(die => die.classList.contains('dice-held'));

        allDice.forEach((die) => {
                const holdIconContainer = die.querySelector('.hold-icon-container');
                const holdIconElement = holdIconContainer.querySelector('.icon i');

                if (anyHeld && die.classList.contains('dice-held')) {
                        die.classList.remove('dice-held');
                        holdIconElement.classList.remove('fa-lock');
                        holdIconElement.classList.add('fa-unlock');
                        holdIconContainer.style.display = 'none';
                } else if (!anyHeld) {
                        die.classList.add('dice-held');
                        holdIconElement.classList.remove('fa-unlock');
                        holdIconElement.classList.add('fa-lock');
                        holdIconContainer.style.display = 'block';
                }
        });

        updateHoldStatus();
}

function closeSettings() {
        const settingsContainers = document.querySelectorAll('.settings-container');
        settingsContainers.forEach(settingsContainer => {
                settingsContainer.style.display = 'none';
        });

        const removeButtons = document.querySelectorAll('.dice-button.remove');
        removeButtons.forEach(removeButton => {
                removeButton.style.display = 'none';
        });

        const actionContainers = document.querySelectorAll('.dice-action-container');
        actionContainers.forEach(actionContainer => {
                actionContainer.style.display = 'grid';
        });
}

function toggleContainers(actionContainer, removeButton, settingsContainer) {
        if (settingsContainer.style.display === 'grid') {
                // Hide the settings container and remove button
                settingsContainer.style.display = 'none';
                removeButton.style.display = 'none';

                // Show the action container
                actionContainer.style.display = 'grid';
        } else {
                // Show the settings container and remove button
                settingsContainer.style.display = 'grid';
                removeButton.style.display = 'flex';

                // Hide the action container
                actionContainer.style.display = 'none';
        }
}

function getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollDice() {
        const animationDuration = 500; // Define the animation duration in milliseconds
        const diceToRoll = diceList.filter(dice => !dice.classList.contains("dice-held"));

        if (diceToRoll.length === 0) {
                alert("All dice are held!");
                return;
        }

        let rollTotal = 0; // Add a variable to keep track of the roll total

        diceToRoll.forEach((dice, index) => {
                const number = dice.querySelector(".number");
                const facesInput = dice.querySelector("input[type='hidden'].faces");
                if (!facesInput) {
                        console.error("Dice is missing faces input:", dice);
                        return;
                }

                if (!dice.classList.contains("dice-held")) {
                        // Add shake animation class
                        dice.classList.add("shake");
                        // Remove shake animation class after animation completes
                        setTimeout(() => {
                                dice.classList.remove("shake");
                        }, animationDuration);

                        // Update the dice value after the shake animation has completed
                        setTimeout(() => {
                                let newValue;
                                if (dice.customFaces.length > 1) {
                                        newValue = dice.customFaces[getRandomNumber(0, dice.customFaces.length - 1)];
                                } else {
                                        newValue = getRandomNumber(1, facesInput.value);
                                }
                                number.textContent = newValue;
                                console.log(`Dice ${index + 1} roll: ${newValue}`); // Log each dice roll
                        }, animationDuration);
                }
        });

        // Calculate roll total and display it after the shake animation has completed
        setTimeout(() => {
                // Calculate roll total for all dice, including held ones
                diceList.forEach(dice => {
                        const number = dice.querySelector(".number");
                        const rollValue = parseInt(number.textContent);
                        // Check if the roll value is a number before adding it to the roll total
                        if (!isNaN(rollValue)) {
                                rollTotal += rollValue;
                        }
                });

                // Display the roll total
                const rollLabel = document.querySelector(".roll-button .roll-label");
                rollLabel.textContent = `${rollTotal}`;

                console.log(`Total roll: ${rollTotal}`); // Log the total roll
        }, animationDuration);
}


function updateFontSize(dice) {
        const number = dice.querySelector('.number');
        const longestFace = Math.max(...dice.customFaces.map(face => face.length));

        // Calculate the font size based on the width of the dice and the length of the longest custom face string
        const fontSizePx = Math.floor(dice.clientWidth / longestFace);

        // Convert the font size to vmin by dividing it by the minimum of the viewport width and height, and then multiplying by 100
        const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
        const minViewportDimension = Math.min(viewportWidth, viewportHeight);
        const fontSizeVmin = (fontSizePx / minViewportDimension) * 180;

        number.style.fontSize = `${fontSizeVmin}vmin`;
}

function updateDiceSize() {
        const diceElements = document.querySelectorAll(".dice");
        const numberOfDice = diceElements.length;
        let newSize;

        if (numberOfDice <= 2) {
                newSize = "55vmin";
        } else if (numberOfDice <= 6) {
                newSize = "38vmin";
        } else {
                newSize = "28vmin";
        }

        document.documentElement.style.setProperty("--dice-size", newSize);
}


function updateNumberColor(dice) {
        const color = dice.style.backgroundColor;
        const number = dice.querySelector('.number');
        number.style.color = (color === '#E9EAEC' || color === '#FBFB3C') ? 'black' : 'white';
}




document.getElementById('all-dice-status').addEventListener('click', toggleHoldAllDice);


document.querySelectorAll(".button[data-tooltip]").forEach((button) => {
        const tooltipText = button.getAttribute("data-tooltip");
        const tooltip = document.createElement("span");
        tooltip.classList.add("tooltip");
        tooltip.textContent = tooltipText;
        button.appendChild(tooltip);
        button.style.position = "relative";
});