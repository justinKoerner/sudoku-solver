const inputs = document.querySelectorAll("input");
const tds = document.querySelectorAll("td");
const table = document.querySelector("table");
const overlay = document.querySelector("#overlay");

const hintButton = document.querySelector("#hint")
const solutionButton = document.querySelector("#solution");
// const helpButton = document.querySelector("#help");
// const closeHelpButton = document.querySelector("#close-help");

const errorColour = 'rgb(255, 204, 204)'

let solved = false;
let display = false;
let solvedSudoku = null;

//create checker board effect
// for (let i = 0; i < inputs.length; i++) {
//     if (i % 2 === 0) {
//         inputs[i].style.backgroundColor = 'white';
//         tds[i].style.backgroundColor = 'white';
//     } else {
//         inputs[i].style.backgroundColor = '#d9d9d9';
//         tds[i].style.backgroundColor = '#d9d9d9';
//     }
// }

// Hanlde input changes
table.addEventListener('input', (e) => {
    let event = e.target;
    let numberInput = parseInt(event.value);

    // check if input is an integer
    if ((!Number.isInteger(numberInput)) && event.value !== '') {
        eventError(event);
        event.title = "Input has to be a digit between 1 and 9."
    } 
    // check if number is in range (1-9) and only 1 digit
    else if (numberInput < 1 || numberInput > 9 || event.value.length > 1) {
        eventError(event);
        event.title = "Input has to be a digit between 1 and 9."
    } 
    // otherwise the input is a valid number
    else {
        // if entry is set to empty, reset cell value to 0
        if (event.value === '') {
            numberInput = 0;
        }
        // if entry is not empty check if it does not conflict with other entries
        // entryValidation(row of entry, column of entry, value of entry)
        // if (event.value !== '') {
        entryValidation(parseInt(event.parentElement.parentElement.id), 
            parseInt(event.parentElement.id),
            numberInput)
                .then(isAllowed => {
                    if (!isAllowed) {
                        eventError(event)
                        event.title = 'This number is already present in the same row, column, and/or square.'
                    }
                })
        // } else {
        //     console.log(typeof event.value)
        // }
        
        // if there was an error with this entry previously but it has been resolved, reset color and button
        // will only get here if the error has been resolved
        if (event.style.backgroundColor == errorColour) {
            event.style.backgroundColor = 'white';
            hintButton.disabled = false;
            solutionButton.disabled = false;
        }    
    
        // event.style.backgroundColor = 'white';
        // button.disabled = false;
    }
   
    // if (!isAllowed) {
    //     event.style.backgroundColor = '#ffcccc'
    //     button.disabled = true;
    //     alert("This value is already present in the row, column and/or square");
    // }

})

// If hint button was clicked, hovering over a cell will turn the cell green 
table.addEventListener('mouseover', (e) => {
    e.preventDefault();
    if (solved && !display) {
        let event = e.target;
        // Only change the background color if the cell is empty and it is of type "INPUT"
        if (event.nodeName == 'INPUT'  && event.value === '') {
            event.style.backgroundColor = 'rgb(121, 187, 103)'
            event.parentElement.style.backgroundColor = 'rgb(121, 187, 103)'
        }  
    }
})

// If hint button was clicked, leaving the cell will turn the cell white again
table.addEventListener('mouseout', (e) => {
    e.preventDefault();
    if (solved && !display) {
        let event = e.target;
        if (event.nodeName == 'INPUT') {
            event.style.backgroundColor = 'white'
            event.parentElement.style.backgroundColor = 'white'
        }  
    }
})

table.addEventListener('click', (e) => {
    if (solved && !display) {
        let event = e.target;

        // Only dislay the value if the cell is empty
        if (event.value === '') {
            let row = parseInt(event.parentElement.id)
            let col = parseInt(event.parentElement.parentElement.id)
    
            let index = (col * 9) + row;  // index of the cell in "inputs"
            inputs[index].value = String(solvedSudoku.ender[index])
        }
        
    }
})

hintButton.addEventListener('click', (e) => {
    e.preventDefault();
    createJson()
        .then(() => {
            solved = true;
        })
})

solutionButton.addEventListener('click', (e) => {
    e.preventDefault();
    display = true;

    console.log("Solved: " + solved);
    if (!solved) {
        createJson()
            .then(() => {
                displaySolved();  
            })
    } else {
        displaySolved();
    }
})

// open the modal when clicking "help"
// helpButton.addEventListener('click', () => {
//     const modal = document.querySelector(helpButton.dataset.modalTarget); // selects the modal that is connected to the help button via 
//                                                                           // the data-modal-target selector id (the selector id of the button and id of the modal match)
//     openModal(modal);
// })

// // close modal when clicking the close button on the modal
// closeHelpButton.addEventListener('click', () => {
//     const modal = closeHelpButton.closest(".modal") // selects the closest parent element with the .modal class
//     closeModal(modal);
// })

// // close active modal when clicking anywhere on the overlay
// overlay.addEventListener('click', () => {
//     const modal = document.querySelector(".modal.active");
//     closeModal(modal);
// })

// adds "active" class so that modal and overlay appear on screen
// function openModal(modal) {
//     if (modal == null) return; // in case this was called without the modal
//     modal.classList.add("active");
//     overlay.classList.add("active");
// }

// // removes "active" class so that modal and overlay disappear from screen
// function closeModal(modal) {
//     if (modal == null) return; // in case this was called without the modal
//     modal.classList.remove("active");
//     overlay.classList.remove("active");
// }

function eventError(event) {
    event.style.backgroundColor = errorColour
    hintButton.disabled = true;
    solutionButton.disabled = true;
}

// create json object with list of inputs
async function createJson() {
    const sudokuStarter = [];
    for (let i = 0; i < inputs.length; i++) {
        sudokuStarter[i] = parseInt(inputs[i].value)
    }
    let starter = {starter: sudokuStarter};
    let starterJson = JSON.stringify(starter);
    // console.log(starterJson);
    let solution = await $.ajax({
        url: "/test",
        type: "POST",
        // contentType: "application/json",
        // data: JSON.stringify(starterJson)
    });

    solvedSudoku = JSON.parse(solution);

    // display = true when solution button has been activated
    // if (display) {
    //     displaySolved();
    // }
    
}

function displaySolved() {
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = String(solvedSudoku.ender[i]);
        inputs[i].disabled = true;
    }
    // console.log(solved);
    // console.log(typeof solved)
    console.log("made it to the end");
}

async function entryValidation(row, col, value) {
    let entryObj = {
        value: value,
        row: row,
        col: col 
    };

    let entryObjJson = JSON.stringify(entryObj);
    let validationObj = await $.ajax({
        url: "/check",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(entryObjJson)
    });

    // console.log(JSON.parse(validationObj).success);
    return JSON.parse(validationObj).success;
}