const inputs = document.querySelectorAll("input");
const tds = document.querySelectorAll("td");
const table = document.querySelector("table");
const overlay = document.querySelector("#overlay");

const hintButton = document.querySelector("#hint")
const solutionButton = document.querySelector("#solution");

const errorColour = 'rgb(255, 204, 204)'

let solved = false;
let display = false;
let solvedSudoku = null;

// Hanlde input changes
table.addEventListener('input', (e) => {
    let event = e.target;
    let numberInput = parseInt(event.value);

    // check if input is an integer
    // title is set to appropriate message if constraint is broken
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
        entryValidation(parseInt(event.parentElement.parentElement.id), 
            parseInt(event.parentElement.id),
            numberInput)
                .then(isAllowed => {
                    if (!isAllowed) {
                        eventError(event)
                        event.title = 'This number is already present in the same row, column, and/or square.'
                        console.log("Conflict");
                    }
                })
        
        // if there was an error with this entry previously but it has been resolved, reset color, title and buttons
        // will only get here if the error has been resolved
        if (event.style.backgroundColor == errorColour) {
            event.style.backgroundColor = 'white';
            event.title = '';
            hintButton.disabled = false;
            solutionButton.disabled = false;
        }    
    }
})

// If hint button was clicked, hovering over a cell will turn the cell green 
table.addEventListener('mouseover', (e) => {
    e.preventDefault();
    if (solved && !display) {
        let event = e.target;
        // Only change the background color if the cell is empty and it is of type "INPUT"
        if (event.nodeName == 'INPUT'  && event.value === '') {
            event.style.backgroundColor = 'rgb(121, 187, 103)'
            event.parentElement.style.backgroundColor = 'rgb(121, 187, 103)' // color of the TD which holds the input
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

// If hint button was clicked, clicking on an empty cell reveals its number
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

// Hint button event handler
// "solved" is true but "display" remains false
hintButton.addEventListener('click', (e) => {
    e.preventDefault();
    solve()
        .then(() => {
            solved = true;
        })
})

// Solution button event handler
// Display is set to true and the entire solution is displaued
solutionButton.addEventListener('click', (e) => {
    e.preventDefault();
    display = true;

    // console.log("Solved: " + solved);

    // If the hint button was NOT clicked beforehand, need to solve the Sudoku before displaying it
    if (!solved) {
        solve()
            .then(() => {
                displaySolved();  
            })
    } 
    // If the hint button was clicked beforehand, the Sudoku us already solved
    // Only need to display it
    else {
        displaySolved();
    }
})


// If user input is erroneous, this function is called
function eventError(event) {
    event.style.backgroundColor = errorColour   // Sets background of affected cell to error colour
    hintButton.disabled = true;                 // Buttons are disabled until the error is resolved
    solutionButton.disabled = true;
}

// Connects with server which solves the Sudoku puzzle
async function solve() {
    // const sudokuStarter = [];
    // for (let i = 0; i < inputs.length; i++) {
    //     sudokuStarter[i] = parseInt(inputs[i].value)
    // }
    // let starter = {starter: sudokuStarter};
    // let starterJson = JSON.stringify(starter);

    let solution = await $.ajax({
        url: "/test",
        type: "POST",
        // contentType: "application/json",
        // data: JSON.stringify(starterJson)
    });

    solvedSudoku = JSON.parse(solution);    // solution converted to JSON
    
}

// Displays the full solution
function displaySolved() {
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = String(solvedSudoku.ender[i]);
        inputs[i].disabled = true;          // inputs are disabled when the solution is displayed
    }
}

// Validates user input againt Sudoku rules
// Ensures that the value entered does not conflict with another value according to Sudoku rules
// If value is valid, it will be entered into the Sudoku grid on the server side
// Returns true if valid, false if invalid
async function entryValidation(row, col, value) {
    let entryObj = {
        value: value,
        row: row,
        col: col 
    };
    
    let entryObjJson = JSON.stringify(entryObj);    // turn object into JSON format
    
    // Send JSON object to server
    let validationObj = await $.ajax({
        url: "/check",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(entryObjJson)
    });

    return JSON.parse(validationObj).success;
}