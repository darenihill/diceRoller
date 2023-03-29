const maxDice = 12;
let diceList = [];

function addDice() {
        if (diceList.length >= maxDice) {
                alert("You've reached the maximum number of dice!");
                return;
        }
        const dice = createDice();
        diceList.push(dice);
        dice.addEventListener('click', (e) => {
                // Check if the event target is the settings button or its children
                const isSettingsButton = e.target.classList.contains('dice-button') || e.target.closest('.dice-button');
                if (isSettingsButton) {
                        return;
                }

                // Check if any settings menu or color picker is open
                const settingsOpen = Array.from(document.querySelectorAll('.settings-container')).some(container => container.style.display === 'grid');
                const colorPickerOpen = Array.from(document.querySelectorAll('.color-picker')).some(picker => picker.style.display === 'grid');

                // Close the settings menu and color picker if either is open
                if (settingsOpen || colorPickerOpen) {
                        closeSettings();
                        return; // Don't toggle dice held
                }

                const holdIconContainer = dice.querySelector('.hold-icon-container');
                const holdIconElement = holdIconContainer.querySelector('.icon i');

                if (dice && !dice.classList.contains('dice-held')) {
                        dice.classList.add('dice-held');
                        holdIconElement.classList.remove('fa-unlock');
                        holdIconElement.classList.add('fa-lock');
                        holdIconContainer.style.display = 'block'; // Show the hold icon
                } else {
                        dice.classList.remove('dice-held');
                        holdIconElement.classList.remove('fa-lock');
                        holdIconElement.classList.add('fa-unlock');
                        holdIconContainer.style.display = 'none'; // Hide the hold icon
                }
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

function createDice() {
        const dice = document.createElement('div');
        dice.className = 'dice';

        //#region Action Container
        // Action Container
        const actionContainer = document.createElement('div');
        actionContainer.className = 'dice-action-container';
        dice.appendChild(actionContainer);

        // Hold Icon Container
        const holdIconContainer = document.createElement('div');
        holdIconContainer.className = 'hold-icon-container';
        holdIconContainer.style.display = 'none'; // Hide the hold icon container initially

        const holdIcon = document.createElement('div');
        holdIcon.className = 'icon';
        holdIcon.innerHTML = '<i class="fa-solid fa-unlock"></i>';
        holdIconContainer.appendChild(holdIcon);
        actionContainer.appendChild(holdIconContainer);

        // Settings Button
        const settingsButton = document.createElement('button');
        settingsButton.className = 'button dice-button settings';
        settingsButton.addEventListener('click', () => {
                toggleContainers(actionContainer, removeButton, settingsContainer);
        });

        const configureIcon = document.createElement('div');
        configureIcon.className = 'icon';
        configureIcon.innerHTML = '<i class="fas fa-cog"></i>';
        settingsButton.appendChild(configureIcon);
        actionContainer.appendChild(settingsButton);
        //#endregion


        //#region SettingsContainer
        // Remove Button
        const removeButton = document.createElement('button');
        removeButton.className = 'button dice-button remove';
        removeButton.style.display = 'none'; // Hide the remove button by default
        removeButton.addEventListener('click', () => {
                removeDice(dice);
        });
        const removeIcon = document.createElement('div');
        removeIcon.className = 'icon';
        removeIcon.innerHTML = '<i class="fa-solid fa-xmark"></i>';
        removeButton.appendChild(removeIcon);
        dice.appendChild(removeButton);

        //Settings Menu
        const settingsContainer = document.createElement('div');
        settingsContainer.className = 'settings-container';
        settingsContainer.style.display = 'none'; // Hide the settings container by default
        dice.appendChild(settingsContainer);


        // Custom Faces Button
        const customFacesButton = document.createElement('button');
        customFacesButton.className = 'button dice-button custom-faces';
        const customFacesIcon = document.createElement('div');
        customFacesIcon.className = 'icon';
        customFacesIcon.innerHTML = '<i class="fas fa-star"></i>'; // Use the Font Awesome star icon
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
        const facesButton = document.createElement('button');
        facesButton.className = 'button dice-button'; // Add class to style the button
        settingsContainer.appendChild(facesButton);
        const facesIcon = document.createElement('div');
        facesIcon.className = 'icon';
        facesIcon.innerHTML = '<i class="fas fa-hashtag"></i>'; // Use the Font Awesome hashtag icon
        facesButton.appendChild(facesIcon);
        const facesInput = document.createElement('input');
        facesInput.type = 'hidden'; // Change to hidden input type
        facesInput.className = 'faces'; // set class to 'faces'
        facesInput.min = 1;
        facesInput.max = 100;
        facesInput.value = 6;
        settingsContainer.appendChild(facesInput);

        facesButton.addEventListener('click', () => {
                const input = prompt('Enter the number of faces (1-100):', facesInput.value);
                if (input !== null && !isNaN(input) && input >= 1 && input <= 100) {
                        facesInput.value = input;
                        dice.customFaces = []; // Clear out custom faces
                        // Roll the dice with the new number of faces
                        dice.querySelector(".number").textContent = getRandomNumber(1, facesInput.value);
                } else {
                        alert('Please enter a valid whole number between 1 and 100.');
                }
        });


        // Color Button
        const colorButton = document.createElement('button');
        colorButton.className = 'button dice-button color'; // Fix class name
        const colorIcon = document.createElement('div');
        colorIcon.className = 'icon';
        colorIcon.innerHTML = '<i class="fas fa-paint-brush"></i>';
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
        const confirmButton = document.createElement('button');
        confirmButton.className = 'button dice-button confirm';
        confirmButton.addEventListener('click', () => {
                toggleContainers(actionContainer, removeButton, settingsContainer);
        });
        settingsContainer.appendChild(confirmButton);

        // Confirm Icon
        const confirmIcon = document.createElement('div');
        confirmIcon.className = 'icon';
        confirmIcon.innerHTML = '<i class="fa-regular fa-square-check"></i>';
        confirmButton.appendChild(confirmIcon);
        //#endregion


        const number = document.createElement('div');
        number.className = 'number';
        number.style.color = 'black'; // Set the number color to black
        number.textContent = getRandomNumber(1, +facesInput.value);
        dice.appendChild(number);
        updateHoldStatus()
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
                const rollTotalContainer = document.querySelector(".roll-total-container");
                const rollTotalElement = rollTotalContainer.querySelector(".roll-total-text"); // Change the selector to ".roll-total-text"
                rollTotalElement.textContent = `Total: ${rollTotal}`;
                rollTotalContainer.style.display = "flex";

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


window.addEventListener('beforeunload', () => {
        const savedDice = diceList.map(dice => {
                const number = dice.querySelector('.number').textContent;
                const faces = dice.querySelector('input[type="number"]').value;
                const color = dice.querySelector('select').value;
                const held = dice.classList.contains('dice-held');
                return {
                        number,
                        faces,
                        color,
                        held
                };
        });
        localStorage.setItem('savedDice', JSON.stringify(savedDice));
});

window.addEventListener('load', () => {
        const savedDice = JSON.parse(localStorage.getItem('savedDice'));
        if (savedDice && Array.isArray(savedDice)) {
                savedDice.forEach(dice => {
                        const {
                                number,
                                faces,
                                color,
                                held
                        } = dice;
                        const newDice = createDice();
                        const numberElem = newDice.querySelector('.number');
                        numberElem.textContent = number;
                        const facesInput = newDice.querySelector('input[type="number"]');
                        facesInput.value = faces;
                        // Add line break element



                        const colorInput = newDice.querySelector('select');
                        colorInput.value = color;
                        newDice.style.backgroundColor = color;
                        if (held) {
                                const holdButton = newDice.querySelector('button');
                                holdButton.click();
                        }
                        diceList.push(newDice);
                        document.getElementById('dice-container').appendChild(newDice);
                });
        }
});

document.getElementById('all-dice-status').addEventListener('click', toggleHoldAllDice);


document.querySelectorAll(".button[data-tooltip]").forEach((button) => {
        const tooltipText = button.getAttribute("data-tooltip");
        const tooltip = document.createElement("span");
        tooltip.classList.add("tooltip");
        tooltip.textContent = tooltipText;
        button.appendChild(tooltip);
        button.style.position = "relative";
});