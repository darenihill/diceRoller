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
                // Check if the event target is the settings button, its children, or within the color picker
                const isSettingsButton = e.target.classList.contains('dice-button') || e.target.closest('.dice-button');
                const isColorPicker = e.target.closest('.color-picker');
                if (isSettingsButton || isColorPicker) {
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

                        toggleContainers(actionContainer, removeButton, settingsContainer);

                        // Show the action container
                        actionContainer.style.display = 'grid';
                });
                colorPicker.appendChild(swatch);
        });

        return colorPicker;
}

function createDice(numberValue = 1, faces = 6, customFaces = [], color = '#E9EAEC') {
        const dice = document.createElement('div');
        dice.className = 'dice';

        const number = document.createElement('div');
        number.className = 'number';
        number.style.color = 'black';
        number.textContent = numberValue;
        dice.appendChild(number);

        // Update dice properties with provided values
        dice.style.backgroundColor = color;
        dice.customFaces = customFaces;

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
                const input = prompt(`Enter custom faces, separated by commas: (Red, Yellow, Blue)`, currentFacesMessage);
                if (input !== null) {
                        dice.customFaces = input.split(',').map(face => face.trim());
                        // Roll the dice with the new custom faces
                        dice.querySelector('.number').textContent = dice.customFaces[getRandomNumber(0, dice.customFaces.length - 1)];
                        // Update the font size
                        updateFontSize(dice);
                        toggleContainers(actionContainer, removeButton, settingsContainer);
                }
        });




        // Number Faces Button
        const facesButton = document.createElement('button');
        facesButton.className = 'button dice-button';
        settingsContainer.appendChild(facesButton);
        const facesIcon = document.createElement('div');
        facesIcon.className = 'icon';
        facesIcon.innerHTML = '<i class="fas fa-hashtag"></i>';
        facesButton.appendChild(facesIcon);
        const facesInput = document.createElement('input');
        facesInput.type = 'hidden';
        facesInput.className = 'faces';
        facesInput.min = 1;
        facesInput.max = 100;
        facesInput.value = faces;
        settingsContainer.appendChild(facesInput);

        facesButton.addEventListener('click', () => {
                const input = prompt('Enter a number (1-100):', facesInput.value);

                // If the input is null (user clicked cancel), return early
                if (input === null) {
                        return;
                }

                if (!isNaN(input) && input >= 1 && input <= 100) {
                        facesInput.value = input;
                        dice.customFaces = []; // Clear out custom faces
                        // Roll the dice with the new number of faces
                        dice.querySelector(".number").textContent = getRandomNumber(1, facesInput.value);
                        toggleContainers(actionContainer, removeButton, settingsContainer);
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
        confirmIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
        confirmButton.appendChild(confirmIcon);
        //#endregion

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

/* function saveDiceData() {
        const diceData = diceList.map(dice => ({
            numberValue: dice.querySelector('.number').textContent,
            faces: dice.querySelector('.faces').value,
            customFaces: dice.customFaces,
            color: dice.style.backgroundColor
        }));
    
        localStorage.setItem('diceData', JSON.stringify(diceData));
    }

    function loadDiceData() {
        const savedDiceData = localStorage.getItem('diceData');
    
        if (savedDiceData) {
            const diceDataList = JSON.parse(savedDiceData);
            diceDataList.forEach(diceData => {
                const { numberValue, faces, customFaces, color } = diceData;
                const dice = createDice(numberValue, faces, customFaces, color);
                diceList.push(dice);
                document.getElementById('dice-container').appendChild(dice);
            });
            updateDiceSize();
        }
    }
    
    // Call the loadDiceData function when the page is loaded
    document.addEventListener('DOMContentLoaded', loadDiceData); */



/* window.addEventListener('beforeunload', () => {
        console.log('Saving dice data...');
        const savedDice = diceList.map(dice => {
                const number = dice.querySelector('.number').textContent;
                const faces = dice.querySelector('.faces').value;
                const customFaces = dice.customFaces;
                const color = dice.style.backgroundColor;
                return {
                        number,
                        faces,
                        customFaces,
                        color
                };
        });
        localStorage.setItem('savedDice', JSON.stringify(savedDice));
        localStorage.setItem('updateNumberColor', updateNumberColor.toString());
});

window.addEventListener('load', () => {
        const savedDice = JSON.parse(localStorage.getItem('savedDice'));
        console.log('savedDice:', savedDice);
        if (savedDice && Array.isArray(savedDice)) {
            console.log('Loading dice data...');
            savedDice.forEach((diceData, index) => {
                const {
                    number,
                    faces,
                    customFaces,
                    color
                } = diceData;
    
                const newDice = createDice(number, faces, customFaces, color);
                diceList.push(newDice);
                document.getElementById('dice-container').appendChild(newDice);
    
                updateNumberColor(newDice); // Call updateNumberColor with newDice parameter
                updateFontSize(newDice); // Call updateFontSize with newDice parameter
                updateHoldStatus(newDice); // Call updateHoldStatus with newDice parameter
            });
            updateDiceSize(); // Call updateDiceSize on page load
        }
    }); */


//#region Left Menu Container
document.addEventListener('DOMContentLoaded', function () {
        initializeLeftMenuToggle();
});

function initializeLeftMenuToggle() {
        const toggleMenuButton = document.getElementById('toggle-menu');
        const leftMenu = document.querySelector('.left-menu');
        const chevronIcon = toggleMenuButton.querySelector('i');
        let menuIsOpen = false;

        toggleMenuButton.addEventListener('click', function () {
                menuIsOpen = !menuIsOpen;
                leftMenu.style.display = menuIsOpen ? 'grid' : 'none';
                chevronIcon.classList.toggle('fa-chevron-down', menuIsOpen);
                chevronIcon.classList.toggle('fa-chevron-up', !menuIsOpen);
        });
}

document.getElementById('donate').addEventListener('click', () => {
        window.location.href = 'donate.html'; // Link to a dummy donate page
    });
    
    document.getElementById('suggestions-btn').addEventListener('click', () => {
        window.location.href = 'https://docs.google.com/forms/d/1MurbBtETb6e9JmkThO_Apuc9lowJcDPHpCcPNIhbPpg/prefill'; // Link to a dummy suggestions page
    });
    
    document.getElementById('help-btn').addEventListener('click', () => {
        // Create a popup menu for help
        let helpPopup = document.createElement('div');
        helpPopup.id = 'help-popup';
        helpPopup.innerHTML = `
            <h2>Help</h2>
            <p>Here is some help text...</p>
            <button type="button" id="close-help-popup">Close</button>
        `;
        helpPopup.style.position = 'fixed';
        helpPopup.style.top = '50%';
        helpPopup.style.left = '50%';
        helpPopup.style.transform = 'translate(-50%, -50%)';
        helpPopup.style.backgroundColor = 'white';
        helpPopup.style.padding = '20px';
        helpPopup.style.border = '1px solid black';
        helpPopup.style.zIndex = '999';
        document.body.appendChild(helpPopup);
    
        document.getElementById('close-help-popup').addEventListener('click', () => {
            document.body.removeChild(helpPopup);
        });
    });
    
    document.getElementById('delete-all-btn').addEventListener('click', () => {
        // Remove all dice
        let diceElements = document.querySelectorAll('.dice');
        diceElements.forEach((dice) => {
            removeDice(dice);
        });
    });

//#endregion


document.getElementById('all-dice-status').addEventListener('click', toggleHoldAllDice);


document.querySelectorAll(".button[data-tooltip]").forEach((button) => {
        const tooltipText = button.getAttribute("data-tooltip");
        const tooltip = document.createElement("span");
        tooltip.classList.add("tooltip");
        tooltip.textContent = tooltipText;
        button.appendChild(tooltip);
        button.style.position = "relative";
});