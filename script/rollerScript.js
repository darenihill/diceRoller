const maxDice = 10;
let diceList = [];

function addDice() {
        if (diceList.length >= maxDice) {
                alert("You've reached the maximum number of dice!");
                return;
        }
        const dice = createDice();
        diceList.push(dice);
        document.getElementById('dice-container').appendChild(dice);
        updateHoldStatus(); 
}

function removeDice(dice) {
        const index = diceList.indexOf(dice);
        if (index !== -1) {
                diceList.splice(index, 1);
        }
        dice.parentNode.removeChild(dice);
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
                        number.style.color = color === '#E9EAEC' ? 'black' : 'white';
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

// Hold Button
const holdButton = document.createElement('button');
holdButton.className = 'button dice-button hold';
holdButton.addEventListener('click', () => {
    const holdIconElement = holdButton.querySelector('.icon i');
    if (dice && !dice.classList.contains('dice-held')) {
        dice.classList.add('dice-held');
        holdIconElement.classList.remove('fa-unlock');
        holdIconElement.classList.add('fa-lock');
    } else {
        dice.classList.remove('dice-held');
        holdIconElement.classList.remove('fa-lock');
        holdIconElement.classList.add('fa-unlock');
    }
});            
     
        const holdIcon = document.createElement('div');
        holdIcon.className = 'icon';
        holdIcon.innerHTML = '<i class="fa-solid fa-unlock"></i>';
        holdButton.appendChild(holdIcon);
        actionContainer.appendChild(holdButton);

        // Settings Button
        const settingsButton = document.createElement('button');
        settingsButton.className = 'button dice-button settings';
        settingsButton.addEventListener('click', () => {
                // Toggle display of the settings container
                actionContainer.style.display = 'none'; //hide the action container
                removeButton.style.display = 'flex'; // show the remove button
                settingsContainer.style.display = 'grid'; // Show the settings container

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
                const input = prompt('Enter custom faces, separated by commas:');
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
        facesButton.className = 'button dice-button faces'; // Add class to style the button
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
                removeButton.style.display = 'none'; // hide the remove button
                settingsContainer.style.display = 'none'; // hide the settings container
                actionContainer.style.display = 'grid'; //show the action container
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

        return dice;
}

function getRandomNumber(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
}

function rollDice() {
        const diceToRoll = diceList.filter(dice => !dice.classList.contains("dice-held"));

        if (diceToRoll.length === 0) {
                alert("All dice are held!");
                return;
        }

        diceToRoll.forEach(dice => {
                const number = dice.querySelector(".number");
                const facesInput = dice.querySelector("input[type='hidden'].faces");
                if (!facesInput) {
                        console.error("Dice is missing faces input:", dice);
                        return;
                }
                if (dice.customFaces.length > 1) {
                        number.textContent = dice.customFaces[getRandomNumber(0, dice.customFaces.length - 1)];
                } else {
                        const newValue = getRandomNumber(1, facesInput.value);
                        number.textContent = newValue;
                }

                if (!dice.classList.contains("dice-held")) {
                        // Add shake animation class
                        dice.classList.add("shake");
                        // Remove shake animation class after animation completes
                        setTimeout(() => {
                                dice.classList.remove("shake");
                        }, 500);
                }
        });
}

function updateHoldStatus() {
        const diceList = document.querySelectorAll('.dice');
        for (let i = 0; i < diceList.length; i++) {
          const dice = diceList[i];
          const holdButton = dice.querySelector('.hold');
          const holdIconElement = holdButton.querySelector('.icon i');
          if (dice.classList.contains('dice-held')) {
            holdIconElement.classList.remove('fa-unlock');
            holdIconElement.classList.add('fa-lock');
          } else {
            holdIconElement.classList.remove('fa-lock');
            holdIconElement.classList.add('fa-unlock');
          }
        }
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


document.querySelectorAll(".button[data-tooltip]").forEach((button) => {
        const tooltipText = button.getAttribute("data-tooltip");
        const tooltip = document.createElement("span");
        tooltip.classList.add("tooltip");
        tooltip.textContent = tooltipText;
        button.appendChild(tooltip);
        button.style.position = "relative";
});