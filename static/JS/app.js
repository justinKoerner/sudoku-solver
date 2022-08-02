const inputs = document.querySelectorAll("input");
const tds = document.querySelectorAll("td");
const table = document.querySelector("table");
const overlay = document.querySelector("#overlay");

const hintButton = document.querySelector("#hint")
const solutionButton = document.querySelector("#solution");

const errorColour = 'rgb(238, 111, 111)'

let solved = false;
let display = false;
let solvedSudoku = null;

// Sudoku grid dimensions
const size = 9;
const offset = Math.sqrt(size);

// 9x9 arrays with all elements initialized to 0s
const grid = Array(9).fill().map(() => Array(9).fill(0));         // grid of Sudoku grid rows and columns    
const blocks = Array(9).fill().map(() => Array(9).fill(0));       // each row of blocks is a 3x3 block

const conflicts = new Set();        // set containing indeces of entries that are in conflict with other entries

// error handling constants
const MIN_VALUE = 1;
const MAX_VALUE = 9;

// Hanlde input changes
table.addEventListener('input', (e) => {
    const element = e.target;
    let numberInput = parseInt(element.value);

    // check if input is an integer
    // title is set to appropriate message if constraint is broken
    // if ((!Number.isInteger(numberInput)) && element.value !== '') {
    //     elementError(element);
    //     element.title = "Input has to be a number"
    // } 
    // // check if number is in range (1-9) and only 1 digit
    // else if (numberInput < 1 || numberInput > 9 || element.value.length > 1) {
    //     elementError(element);
    //     // event.title = '';
    //     element.title = "Input has to be a digit between 1 and 9"
    // } 
    // otherwise the input is a valid number
    // else {
        // ALTERNATIVE VALIDATION CHECK
        // if entry is not empty check if it does not conflict with other entries
        // entryValidation(row of entry, column of entry, value of entry)
        // entryValidation(parseInt(event.parentElement.parentElement.id), 
        //     parseInt(event.parentElement.id),
        //     numberInput)
        //         .then(isAllowed => {
        //             if (!isAllowed) {
        //                 eventError(event)
        //                 event.title = 'This number is already present in the same row, column, and/or square.'
        //                 console.log("Conflict");
        //             }    
        //         })

    // Entry's indices in the 2D grid
    let row = parseInt(element.parentElement.parentElement.id);
    let col = parseInt(element.parentElement.id)
    // Entry's indices in terms of its block position
    let blockNum = offset * (Math.floor(row / offset)) + Math.floor(col / offset);  // block the entry belongs to
    let blockIndex = offset * (row % offset) + col % offset;                        // entry's index in its block  

    // Input is invalid if it is not an integer (with the exception of an empty string)
    if (!Number.isInteger(numberInput) && element.value !== '') {
        conflicts.add(rowColToIndex(row, col))
        elementError(element, "Input has to be a number");
    }
    // Input is invalid if it false outside the allowed range (1-9)
    else if (numberInput < MIN_VALUE || numberInput > MAX_VALUE) {
        conflicts.add(rowColToIndex(row, col))
        elementError(element, "Input has to be a digit between 1 and 9");

        // input will be added to arrays as long as it is a number
        grid[row][col] = numberInput;
        blocks[blockNum][blockIndex] = numberInput;
    }
    // At this point, the input is a valid digit
    else {
        // If entry is set to empty, reset cell value to 0
        if (element.value === '') {
            numberInput = 0;
        }

        // Update the arrays with the new number input
        grid[row][col] = numberInput;
        blocks[blockNum][blockIndex] = numberInput;

        // Check for duplication conflicts if input value is not empty
        if (numberInput !== 0) {
            let error = checkConflict(row, col, blockNum, blockIndex, numberInput);
            if (error) {
                elementError(element, "This number is already present in the same row, column, and/or square");
            }
        
        }
        // If no error, do nothing
        // If error is resolved, delete entry from error set
        else {
            if (conflicts.has(rowColToIndex(row, col))) {
                conflicts.delete(rowColToIndex(row, col));
                elementReset(element);
            }
        }
    }

    // Iterate through all conflicts. 
    // If a cell is no longer in conflict, remove it from the set
    // If a new cell is in conflict, change its style to error properties
    for (conflictIndex of conflicts) {
        const conflictElement = inputs[conflictIndex];
        const inputValue = parseInt(conflictElement.value);

        // Skip the errors that are not integers or outside the appropriate range
        if (!Number.isInteger(inputValue) || inputValue < MIN_VALUE || inputValue > MAX_VALUE) { continue; }

        let conflictRowCol = indexToRowCol(conflictIndex);
        let conflictBlock = rowColToBlock(conflictRowCol);

        // Check for duplication conflict
        // Parameters: row, col, block number, block index, value
        let error = checkConflict(conflictRowCol[0], conflictRowCol[1], 
                                    conflictBlock[0], conflictBlock[1], inputValue); 
        
        // This branch executes if the error still persists                       
        if (error) {
            // If input style has not been changed to error style already, do so now
            if (!(conflictElement.style.backgroundColor == errorColour)) {
                elementError(conflictElement, "This number is already present in the same row, column, and/or square.");
            }
        }
        // If there is no longer a conflict, remove the cell from conflicts and change back to default style
        if (!error) {
            conflicts.delete(conflictIndex);
            elementReset(conflictElement);
        }  
    }

    // If all conflicts are resolved, enable button
    if ((conflicts.size === 0 && (hintButton.disabled || solutionButton.disabled))) {
        // element.style.backgroundColor = 'white';
        // element.parentElement.style.backgroundColor = 'white';
        // element.title = '';
        hintButton.disabled = false;
        solutionButton.disabled = false;
    }

        // if (event.style.backgroundColor == errorColour) {
        //     event.style.backgroundColor = 'white';
        //     event.title = '';
        // }
        // if there was an error with this entry previously but it has been resolved, reset color, title and buttons
        // will only get here if the error has been resolved
        // if (event.style.backgroundColor == errorColour) {
        //     event.style.backgroundColor = 'white';
        //     event.title = '';
        //     hintButton.disabled = false;
        //     solutionButton.disabled = false;
        // }    
    // }
})

// If hint button was clicked, hovering over a cell will turn the cell green 
table.addEventListener('mouseover', (e) => {
    e.preventDefault();
    const element = e.target;

    // Only change cell colour if solution is not already displayed
    if (solved && !display) {
        // let event = e.target;
        // Only change the background color if the cell is empty and it is of type "INPUT"
        if (element.nodeName == 'INPUT'  && element.value === '') {
            element.style.backgroundColor = 'rgb(121, 187, 103)'
            element.parentElement.style.backgroundColor = 'rgb(121, 187, 103)' // color of the TD which holds the input
        }  
    } 
})

// If hint button was clicked, leaving the cell will turn the cell white again
table.addEventListener('mouseout', (e) => {
    e.preventDefault();
    if (solved && !display) {
        const element = e.target;
        if (element.nodeName == 'INPUT') {
            element.style.backgroundColor = 'white'
            element.parentElement.style.backgroundColor = 'white'
        }  
    }
})

// If hint button was clicked, clicking on an empty cell reveals its number
table.addEventListener('click', (e) => {
    if (solved && !display) {
        const element = e.target;

        // Only dislay the value if the cell is empty
        if (element.value === '') {
            let row = parseInt(element.parentElement.id)
            let col = parseInt(element.parentElement.parentElement.id)
    
            let index = (col * 9) + row;  // index of the cell in "inputs"
            inputs[index].value = String(solvedSudoku.ender[index])
        }
    }
})

// Hint button event handler
// "solved" is true but "display" remains false
hintButton.addEventListener('click', (e) => {
    e.preventDefault();

    // If sudoku has already been solved, do nothing
    if (!solved) {
        solve()
        // .then(() => {
        //     solved = true;
            
        // })
    }
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

// Converts 1D index of entry to 2D index
// Returns list with row index and column index
function indexToRowCol(index) {
    return [Math.floor(index / size), index % size];
}

// Converts 2D index of entry to 1D index
function rowColToIndex(row, col) {
    return size * row + col;
}

// Converts from 2D indices to block indices
// Parameter is a list containing the row and column of the entry
function rowColToBlock(indices) {
    let row = indices[0];
    let col = indices[1];
    let blockNum = offset * (Math.floor(row / offset)) + Math.floor(col / offset);  // block the entry belongs to
    let blockIndex = offset * (row % offset) + col % offset;  

    return [blockNum, blockIndex]
}

// Loop through the current entry's row, column, and block to check for duplicate numbers 
// If duplicates are present, add the indices of the duplicate entries to the conflicts set
function checkConflict(row, col, block, blockIndex, value) {
    let error = false
    let column = grid.map((x) => x[col]);       // extract the entry's column from the grid array

    // Iterate through the row, column and block to check for duplicate entries
    for (let i = 0; i < size; i++) {
        // Only add conflict if the duplicate entry is not the entry itself
        if ((grid[row][i] === value) && (i !== col)) { 
            conflicts.add(size * row + i);
            error = true;
        }
        if ((column[i] === value) && (i !== row)) { 
            conflicts.add(size * i + col);
            error = true;
        }
        if ((blocks[block][i] === value) && (i !== blockIndex)) {
            // some math magic to convert the block number and block index into the entry index
            let index = size * (Math.floor(block / offset) * offset) 
                        + (block % offset) * offset 
                        + size * (Math.floor(i / offset))
                        + i % offset;
            conflicts.add(index);
            error = true
        }
    }
    if (error) { conflicts.add(size * row + col) }  // add current entry if there was a conflict

    return error;
}

// If user input is erroneous, this function is called
function elementError(element, titleMsg) {
    element.style.setProperty('background-color', errorColour, 'important') // sets background color to error colour with !important tag
    element.parentElement.style.backgroundColor = errorColour;
    element.title = titleMsg;

    hintButton.disabled = true;         // Buttons are disabled until the error is resolved
    solutionButton.disabled = true;
}

function elementReset(element) {
    element.style.backgroundColor = 'white'
    element.parentElement.style.backgroundColor = 'white';
    element.title = '';
}

// Sends array of input values to server to solve the Sudoku
async function solve() {
    const sudokuStarter = [].concat(...grid);       // 2D array into 1D array
    // for (let i = 0; i < inputs.length; i++) {
    //     sudokuStarter[i] = parseInt(inputs[i].value)
    // }
    let starter = {starter: sudokuStarter};
    let starterJson = JSON.stringify(starter);

    // Send data to server
    let solution = await $.ajax({
        url: "/test",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(starterJson)
    });

    solvedSudoku = JSON.parse(solution);    // solution converted to JSON

    // If an error was encountered while solving, there is no solution to the Sudoku
    // This should not happen since every valid Sudoku input should have at least one solution
    if (solvedSudoku.error === true) {
        alert("Something went wrong! This Sudoku has no solution!")
        solved = false;
    } else {
        solved = true;
    }   
}

// Displays the full solution
function displaySolved() {
    for (let i = 0; i < inputs.length; i++) {
        inputs[i].value = String(solvedSudoku.ender[i]);
        inputs[i].disabled = true;          // inputs are disabled when the solution is displayed
    }
}


// ALTERNATIVE ENTRY VALIDATION
// Validates user input againt Sudoku rules
// Ensures that the value entered does not conflict with another value according to Sudoku rules
// If value is valid, it will be entered into the Sudoku grid on the server side
// Returns true if valid, false if invalid
// async function entryValidation(row, col, value) {
//     let entryObj = {
//         value: value,
//         row: row,
//         col: col 
//     };
    
//     let entryObjJson = JSON.stringify(entryObj);    // turn object into JSON format
    
//     // Send JSON object to server
//     let validationObj = await $.ajax({
//         url: "/check",
//         type: "POST",
//         contentType: "application/json",
//         data: JSON.stringify(entryObjJson)
//     });

//     return JSON.parse(validationObj).success;
// }