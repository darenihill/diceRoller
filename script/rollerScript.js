//#region Constants
const maxDice = 12;
let diceList = [];
let rollHistory = [];
const COLORS = [
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
];
const dicePresets = [
        {
                name: "Yatzee",
                dice: [
                        { numberValue: 1, faces: 6, customFaces: [], color: "#E9EAEC" },
                        { numberValue: 2, faces: 6, customFaces: [], color: "#E9EAEC" },
                        { numberValue: 3, faces: 6, customFaces: [], color: "#E9EAEC" },
                        { numberValue: 4, faces: 6, customFaces: [], color: "#E9EAEC" },
                        { numberValue: 5, faces: 6, customFaces: [], color: "#E9EAEC" }
                ],
        },
        {
                name: "Cities & Knights",
                dice: [
                        { numberValue: 1, faces: 6, customFaces: [], color: "#E9EAEC" },
                        { numberValue: 2, faces: 6, customFaces: [], color: "#E32227" },
                        { numberValue: 3, faces: 6, customFaces: ["Barbarian", "Barbarian", "Barbarian", "Blue", "Yellow", "Green"], color: "#C0C0C0" }
                ],
        },
        {
                name: "That's Pretty Clever",
                dice: [
                        { numberValue: 1, faces: 6, customFaces: [], color: "#E9EAEC" },
                        { numberValue: 2, faces: 6, customFaces: [], color: "#0000FF" },
                        { numberValue: 3, faces: 6, customFaces: [], color: "#FBFB3C" },
                        { numberValue: 4, faces: 6, customFaces: [], color: "#228B22" },
                        { numberValue: 5, faces: 6, customFaces: [], color: "#F28500" },
                        { numberValue: 6, faces: 6, customFaces: [], color: "#B24BF3" }
                ],
        }
];

//#endregion

//#region Create Dice
function createDice(numberValue = 1, faces = 6, customFaces = [], color = '#E9EAEC') {
        const dice = document.createElement('div');
        dice.className = 'dice';

        const number = document.createElement('div');
        number.classList.add('number');

        // Set the textContent of the number for custom-faced dice
        if (customFaces && customFaces.length > 0) {
                number.textContent = customFaces[0];
        } else {
                number.textContent = numberValue;
        }
        number.textContent = numberValue;
        dice.appendChild(number);

        updateDiceColor(dice, color);
        dice.customFaces = customFaces;

        const removeButton = createRemoveButton(dice);
        dice.appendChild(removeButton);

        const settingsContainer = createSettingsContainer(dice, removeButton, faces);
        dice.appendChild(settingsContainer);

        const actionContainer = createActionContainer(dice, removeButton, settingsContainer);
        dice.appendChild(actionContainer);

        appendColorPicker(dice);

        updateHoldStatus();

        return dice;
}

function createActionContainer(dice, removeButton, settingsContainer) {
        const actionContainer = document.createElement('div');
        actionContainer.className = 'dice-action-container';

        const holdIconContainer = createHoldIconContainer();
        actionContainer.appendChild(holdIconContainer);

        const settingsButton = createSettingsButton(dice, actionContainer, removeButton, settingsContainer);
        actionContainer.appendChild(settingsButton);

        return actionContainer;
}

function createHoldIconContainer() {
        const holdIconContainer = document.createElement('div');
        holdIconContainer.className = 'hold-icon-container';
        holdIconContainer.style.display = 'none';

        const holdIcon = document.createElement('div');
        holdIcon.className = 'icon';
        holdIcon.innerHTML = '<i class="fa-solid fa-unlock"></i>';
        holdIconContainer.appendChild(holdIcon);

        return holdIconContainer;
}

function createSettingsButton(dice, actionContainer, removeButton, settingsContainer) {
        const settingsButton = document.createElement('button');
        settingsButton.className = 'button dice-button settings';
        settingsButton.addEventListener('click', () => {
                const number = dice.querySelector('.number');
                const facesInput = settingsContainer.querySelector('.faces');
                const diceColor = settingsContainer.querySelector('.dice-color');
                console.log({
                        number: number.textContent,
                        faces: facesInput.value,
                        customFaces: dice.customFaces,
                        color: dice.style.backgroundColor
                });

                toggleContainers(actionContainer, removeButton, settingsContainer);
        });

        const configureIcon = document.createElement('div');
        configureIcon.className = 'icon';
        configureIcon.innerHTML = '<i class="fas fa-cog"></i>';
        settingsButton.appendChild(configureIcon);

        return settingsButton;
}

function createSettingsContainer(dice, removeButton, faces = 6) {
        const settingsContainer = document.createElement('div');
        settingsContainer.className = 'settings-container';
        settingsContainer.style.display = 'none';

        const customFacesButton = createCustomFacesButton(dice);
        settingsContainer.appendChild(customFacesButton);

        settingsContainer.appendChild(createFacesButton(dice, settingsContainer, faces));

        const colorButton = createColorButton(dice);
        settingsContainer.appendChild(colorButton);

        const confirmButton = createConfirmButton(dice, removeButton, settingsContainer);
        settingsContainer.appendChild(confirmButton);

        return settingsContainer;
}

function createCustomFacesButton(dice) {
        const customFacesButton = document.createElement('button');
        customFacesButton.className = 'button dice-button custom-faces';
        const customFacesIcon = document.createElement('div');
        customFacesIcon.className = 'icon';
        customFacesIcon.innerHTML = '<i class="fas fa-star"></i>';
        customFacesButton.appendChild(customFacesIcon);

        customFacesButton.addEventListener('click', () => {
                const currentFacesMessage = dice.customFaces.length > 0 ? `${dice.customFaces.join(', ')}\n\n` : '';

                Swal.fire({
                        title: 'Enter custom faces, separated by commas:',
                        input: 'text',
                        inputValue: currentFacesMessage,
                        showCancelButton: true,
                        confirmButtonText: 'OK',
                }).then(result => {
                        if (result.isConfirmed) {
                                dice.customFaces = result.value.split(',').map(face => face.trim());
                                dice.querySelector('.number').textContent = dice.customFaces[getRandomNumber(0, dice.customFaces.length - 1)];
                                updateFontSize(dice);
                        }
                });
        });

        return customFacesButton;
}

function createRemoveButton(dice) {
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

        return removeButton;
}

function createFacesButton(dice, settingsContainer, faces = 6) {
        const facesButton = document.createElement('button');
        facesButton.className = 'button dice-button';
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
                Swal.fire({
                        title: 'Enter a number (1-100):',
                        input: 'number',
                        inputAttributes: {
                                min: 1,
                                max: 100,
                        },
                        inputValue: facesInput.value,
                        showCancelButton: true,
                        confirmButtonText: 'OK',
                }).then(result => {
                        if (result.isConfirmed) {
                                facesInput.value = result.value;
                                dice.customFaces = []; // Clear out custom faces
                                dice.querySelector(".number").textContent = getRandomNumber(1, facesInput.value);
                        }
                }).catch(error => {
                        if (error && error.message !== 'Swal.close()') {
                                Swal.fire({
                                        title: 'Error',
                                        text: 'Please enter a valid whole number between 1 and 100.',
                                        icon: 'error',
                                });
                        }
                });
        });

        return facesButton;
}

function createColorButton(dice) {
        const colorButton = document.createElement('button');
        colorButton.className = 'button dice-button color';
        const colorIcon = document.createElement('div');
        colorIcon.className = 'icon';
        colorIcon.innerHTML = '<i class="fas fa-paint-brush"></i>';
        colorButton.appendChild(colorIcon);

        colorButton.addEventListener('click', () => {
                const colorPicker = dice.querySelector('.color-picker');
                colorPicker.style.display = colorPicker.style.display === 'none' ? 'grid' : 'none';
        });


        return colorButton;
}

function createConfirmButton(dice, removeButton, settingsContainer) {
        const confirmButton = document.createElement('button');
        confirmButton.className = 'button dice-button confirm';

        confirmButton.addEventListener('click', () => {
                const actionContainer = dice.querySelector('.dice-action-container');
                toggleContainers(actionContainer, removeButton, settingsContainer);
        });

        const confirmIcon = document.createElement('div');
        confirmIcon.className = 'icon';
        confirmIcon.innerHTML = '<i class="fa-solid fa-check"></i>';
        confirmButton.appendChild(confirmIcon);

        return confirmButton;
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
                        const actionContainer = dice.querySelector('.dice-action-container');
                        const settingsContainer = dice.querySelector('.settings-container');
                        const removeButton = dice.querySelector('.dice-button.remove');


                        updateDiceColor(dice, color);

                        colorPicker.style.display = 'none';

                        toggleContainers(actionContainer, removeButton, settingsContainer);

                        // Show the action container
                        actionContainer.style.display = 'grid';
                });
                colorPicker.appendChild(swatch);
        });

        return colorPicker;
}

function appendColorPicker(dice) {
        const colorPicker = createColorPicker(COLORS);
        dice.appendChild(colorPicker);
}

//#endregion

//#region Create Menu Container
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
        helpPopup.className = 'help-popup';
        helpPopup.innerHTML = `
            <h2>Help</h2>
            <ul>
                <li><strong>Donate:</strong> Support our project by making a donation. Clicking this button will take you to a donation page.</li>
                <li><strong>Feedback:</strong> Share your suggestions or report any issues you've encountered. Clicking this button will take you to a feedback form.</li>
                <li><strong>Help:</strong> Opens this help popup with explanations for each button on the page.</li>
                <li><strong>Delete All:</strong> Removes all dice from the screen. Use with caution, as this action cannot be undone.</li>
                <li><strong>Roll History:</strong> Shows a list of your previous dice rolls.</li>
                <li><strong>Presets:</strong> Allows you to save and load custom dice configurations for quick access.</li>
                <li><strong>Save:</strong> Saves the current dice configuration to your local storage or a file.</li>
                <li><strong>Load:</strong> Loads a previously saved dice configuration from your local storage or a file.</li>
            </ul>
            <button type="button" id="close-help-popup">Close</button>
            `;
        document.body.appendChild(helpPopup);

        document.getElementById('close-help-popup').addEventListener('click', () => {
                document.body.removeChild(helpPopup);
        });
});

document.getElementById('delete-all-btn').addEventListener('click', () => {
        Swal.fire({
                title: 'Are you sure you want to delete all your dice?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes',
                cancelButtonText: 'No',
                reverseButtons: true
        }).then((result) => {
                if (result.isConfirmed) {
                        // Remove all dice
                        let diceElements = document.querySelectorAll('.dice');
                        diceElements.forEach((dice) => {
                                removeDice(dice);
                        });
                }
        });
});


//#endregion

//#region Primary Button Functions
function addDice() {
        if (diceList.length >= maxDice) {
                alert("You've reached the maximum number of dice!");
                return;
        }
        const dice = createDice();
        diceList.push(dice);
        dice.addEventListener('click', handleDiceClick);
        document.getElementById('dice-container').appendChild(dice);
        updateDiceSize();
}

function rollDice() {
        const animationDuration = 500;
        const diceToRoll = diceList.filter(dice => !dice.classList.contains("dice-held"));

        if (diceToRoll.length === 0) {
                Swal.fire({
                        title: 'All dice are held',
                        icon: 'info',
                        showConfirmButton: false,
                        timer: 1000,
                        timerProgressBar: true
                });
                return;
        }

        let rollTotal = 0;
        let rollDetails = [];

        diceToRoll.forEach((dice, index) => {
                const number = dice.querySelector(".number");
                const facesInput = dice.querySelector("input[type='hidden'].faces");
                if (!facesInput) {
                        console.error("Dice is missing faces input:", dice);
                        return;
                }

                if (!dice.classList.contains("dice-held")) {
                        dice.classList.add("shake");
                        setTimeout(() => {
                                dice.classList.remove("shake");
                        }, animationDuration);

                        setTimeout(() => {
                                let newValue;
                                if (dice.customFaces.length > 1) {
                                        newValue = dice.customFaces[getRandomNumber(0, dice.customFaces.length - 1)];
                                } else {
                                        newValue = getRandomNumber(1, facesInput.value);
                                }
                                number.textContent = newValue;
                        }, animationDuration);
                }
                rollDetails.push(`${number.textContent}`);
        });

        setTimeout(() => {
                let rollDetails = [];

                diceList.forEach(dice => {
                        const number = dice.querySelector(".number");
                        const rollValue = parseInt(number.textContent);
                        if (!isNaN(rollValue)) {
                                rollTotal += rollValue;
                        }
                        rollDetails.push(`${number.textContent}`);
                });

                rollDetails.push(`Total: ${rollTotal}`);
                rollHistory.unshift(rollDetails);

                const rollLabel = document.querySelector(".roll-button .roll-label");
                rollLabel.textContent = `${rollTotal}`;
        }, animationDuration);
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

document.getElementById('all-dice-status').addEventListener('click', toggleHoldAllDice);
//#endregion

//#region Dice Functions
function handleDiceClick(e) {
        const dice = e.currentTarget;

        const isSettingsButton = e.target.classList.contains('dice-button') || e.target.closest('.dice-button');
        const isColorPicker = e.target.closest('.color-picker');
        if (isSettingsButton || isColorPicker) {
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

        if (dice && !dice.classList.contains('dice-held')) {
                dice.classList.add('dice-held');
                holdIconElement.classList.remove('fa-unlock');
                holdIconElement.classList.add('fa-lock');
                holdIconContainer.style.display = 'block';
        } else {
                dice.classList.remove('dice-held');
                holdIconElement.classList.remove('fa-lock');
                holdIconElement.classList.add('fa-unlock');
                holdIconContainer.style.display = 'none';
        }
        updateHoldStatus();
}

function addDice() {
        if (diceList.length >= maxDice) {
                alert("You've reached the maximum number of dice!");
                return;
        }
        const dice = createDice();
        diceList.push(dice);
        dice.addEventListener('click', handleDiceClick);
        document.getElementById('dice-container').appendChild(dice);
        updateDiceSize();
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

function removeDice(dice) {
        const index = diceList.indexOf(dice);
        if (index !== -1) {
                diceList.splice(index, 1);
        }
        dice.parentNode.removeChild(dice);
        updateHoldStatus()
        updateDiceSize();
}

function updateFontSize(dice) {
        console.log('Update Font Size Called');
    
        requestAnimationFrame(() => {
            const number = dice.querySelector('.number');
            const longestFace = Math.max(...dice.customFaces.map(face => face.length));
    
            // Calculate the font size based on the width of the dice and the length of the longest custom face string
            const fontSizePx = Math.floor(dice.clientWidth / longestFace);
    
            // Convert the font size to vmin by dividing it by the minimum of the viewport width and height, and then multiplying by 100
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            const minViewportDimension = Math.min(viewportWidth, viewportHeight);
            const fontSizeVmin = (fontSizePx / minViewportDimension) * 180;
            console.log('Font size set to: ', fontSizeVmin);
            number.style.fontSize = `${fontSizeVmin}vmin`;
        });
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

function updateDiceColor(dice, color) {
        dice.style.backgroundColor = color;
        updateNumberColor(dice);
}

function updateNumberColor(dice) {
        const color = rgbToHex(dice.style.backgroundColor);
        const number = dice.querySelector('.number');

        number.style.color = (color === '#E9EAEC' || color === '#FBFB3C') ? 'black' : 'white';
}


function getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rgbToHex(rgb) {
        const regex = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/;
        const match = rgb.match(regex);

        if (!match) {
                return rgb;
        }

        function componentToHex(c) {
                const hex = parseInt(c).toString(16).toUpperCase();;
                return hex.length === 1 ? '0' + hex : hex;
        }

        return `#${componentToHex(match[1])}${componentToHex(match[2])}${componentToHex(match[3])}`;
}

//#endregion

//#region Menu functions
function showRollHistory() {
        let rollHistoryText = rollHistory.map((roll, index) => `Roll ${rollHistory.length - index}: ${roll.join(", ")}`).join("<br>");
        Swal.fire({
                title: 'Roll History',
                html: rollHistoryText,
        });
}

function promptForSave() {
        Swal.fire({
            title: 'Enter a name for this configuration:',
            input: 'text',
            showCancelButton: true,
            confirmButtonText: 'Save'
        }).then(result => {
            if (result.isConfirmed) {
                const configName = result.value.trim();
                if (configName) {
                    saveDice(configName);
                    Swal.fire('Configuration saved!');
                } else {
                    Swal.fire({
                        title: 'Please enter a valid name',
                        icon: 'error',
                        timer: 1500,
                        showConfirmButton: false,
                        timerProgressBar: true
                    }).then(() => {
                        promptForSave();
                    });
                }
            }
        });
    }
    
    

function saveDice(configName) {
        const diceConfigs = diceList.map(dice => {
                const number = dice.querySelector('.number');
                const facesInput = dice.querySelector('.faces');
                const diceColor = dice.querySelector('.dice-color');
                const holdIcon = dice.querySelector('.hold-icon-container');

                return {
                        numberValue: parseInt(number.textContent),
                        faces: parseInt(facesInput.value),
                        customFaces: dice.customFaces,
                        color: dice.style.backgroundColor,
                        held: holdIcon.style.display === 'block',
                        numberColor: number.style.color
                };
        });

        const savedConfigs = JSON.parse(localStorage.getItem('diceConfigs') || '{}');
        savedConfigs[configName] = { name: configName, config: diceConfigs };
        localStorage.setItem('diceConfigs', JSON.stringify(savedConfigs));
}

async function promptForLoad() {
        const savedConfigs = JSON.parse(localStorage.getItem('diceConfigs') || '{}');

        if (Object.keys(savedConfigs).length > 0) {
                const inputOptions = Object.keys(savedConfigs).reduce((options, configName) => {
                        options[configName] = configName;
                        return options;
                }, {});

                const { value: selectedConfigName, dismiss } = await Swal.fire({
                        input: 'select',
                        inputOptions: inputOptions,
                        inputPlaceholder: 'Select a save',
                        showCancelButton: true,
                        confirmButtonText: 'Load',
                        cancelButtonText: 'Cancel',
                        showCloseButton: true,
                        showLoaderOnConfirm: true,
                        buttonsStyling: false,
                        customClass: {
                                confirmButton: 'double-wide-button',
                                cancelButton: 'double-wide-button',
                                footer: 'swal2-delete-container',
                                closeButton: 'custom-close-button',
                        },
                        preConfirm: (selectedConfigName) => {
                                return new Promise((resolve) => {
                                        setTimeout(() => {
                                                resolve();
                                        }, 100);
                                });
                        },
                        footer: '<button id="swal2-delete" class="double-wide-button">Delete</button>',
                        didOpen: () => {
                                const deleteButton = document.getElementById('swal2-delete');
                                deleteButton.addEventListener('click', () => {
                                        const selectedConfigName = Swal.getInput().value;
                                        if (selectedConfigName && savedConfigs[selectedConfigName]) {
                                                delete savedConfigs[selectedConfigName];
                                                localStorage.setItem('diceConfigs', JSON.stringify(savedConfigs));
                                                Swal.fire('Configuration deleted!');
                                        } else {
                                                Swal.fire('No configuration selected');
                                        }
                                });
                        },
                });

                if (!dismiss && selectedConfigName) {
                        const diceConfig = savedConfigs[selectedConfigName];
                        loadDice(diceConfig);
                } else if (dismiss !== 'close') {
                        Swal.fire('No configuration selected');
                }
        } else {
                Swal.fire('No saved dice configurations found.');
        }
}

async function loadPreset() {
        const inputOptions = dicePresets.reduce((options, preset) => {
                options[preset.name] = preset.name;
                return options;
        }, {});

        const { value: selectedPresetName, dismiss } = await Swal.fire({
                input: 'select',
                inputOptions: inputOptions,
                inputPlaceholder: 'Games',
                showCancelButton: true,
                showCloseButton: true,
                confirmButtonText: 'Load',
                cancelButtonText: 'Cancel',
                buttonsStyling: false,
                customClass: {
                        confirmButton: 'double-wide-button',
                        cancelButton: 'double-wide-button',
                        closeButton: 'custom-close-button',
                },
        });

        if (!dismiss && selectedPresetName) {
                const selectedPreset = dicePresets.find(preset => preset.name === selectedPresetName);
                if (selectedPreset) {
                        const diceConfig = {
                                config: selectedPreset.dice,
                                name: selectedPreset.name
                        };
                        loadDice(diceConfig);
                } else {
                        Swal.fire('No preset configuration selected');
                }
        } else if (dismiss !== 'close') {
                Swal.fire('No preset selected');
        }

}

async function loadDice(diceConfig) {
        // Remove existing dice
        diceList.forEach(dice => {
                dice.parentNode.removeChild(dice);
        });

        diceList = [];

        // Add loaded dice


        
        const diceContainer = document.getElementById('dice-container');
        diceConfig.config.forEach(config => {
                const dice = createDice(config.numberValue, config.faces, config.customFaces);
                const holdIcon = dice.querySelector('.hold-icon-container');
                const number = dice.querySelector('.number');

                // Set the dice color
                updateDiceColor(dice, config.color);

                // Set the hold icon
                if (config.held) {
                        holdIcon.style.display = 'block';
                        dice.classList.add('dice-held');
                }

                // Add the click event listener
                dice.addEventListener('click', handleDiceClick);

                diceList.push(dice);
                diceContainer.appendChild(dice);

                // Update font size only for dice with custom faces
                if (config.customFaces && config.customFaces.length > 0) {
                        number.textContent = config.customFaces[0];
                        updateFontSize(dice);
                }
        });

        updateDiceSize();

        if (diceConfig.name === 'systemAutosave') {
                const savedConfigs = JSON.parse(localStorage.getItem('diceConfigs') || '{}');
                delete savedConfigs['systemAutosave'];
                localStorage.setItem('diceConfigs', JSON.stringify(savedConfigs));
        } else {
                Swal.fire({
                        title: 'Loaded!',
                        icon: 'success',
                        showConfirmButton: false,
                        timer: 800,
                });
        }
}

document.addEventListener('DOMContentLoaded', () => {
        const savedConfigs = JSON.parse(localStorage.getItem('diceConfigs') || '{}');
        const systemAutosaveConfig = savedConfigs['systemAutosave'];
        if (systemAutosaveConfig) {
                loadDice(systemAutosaveConfig);
        }
});
//#endregion

//#region Event Listeners
document.getElementById('roll-history-btn').addEventListener('click', showRollHistory);
window.addEventListener('beforeunload', () => {
        const diceConfigs = diceList.map(dice => {
                saveDice('systemAutosave');
        });
});
document.getElementById('save-btn').addEventListener('click', promptForSave);
document.getElementById('load-btn').addEventListener('click', promptForLoad);
document.getElementById('presets-btn').addEventListener('click', loadPreset);
//#endregion
