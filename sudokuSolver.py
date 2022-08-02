import numpy as np

class Solver:
    def __init__(self):
        self.size = 9                               # dimensions of the Sudoku grid
        self.offset = int(np.sqrt(self.size))       # offset within a 3x3 block in the Sudoku grid

        # boolean masks keep track of what numbers are present in rows, columns and blocks
        # masks are True at the index equal to the number-1 present (number-1 because indices start at 0)
        # E.g.: if row 0 contains numbers 1, 3, 4, then row_mask[0] = [True, False, True, True]
        self.row_mask = np.zeros((self.size, self.size), dtype="bool")
        self.column_mask = np.zeros((self.size, self.size), dtype="bool")
        self.block_mask = np.zeros((self.size, self.size), dtype="bool")    # a row in the block_mask grid represents one block (e.g., a 9x9 grid has 9 blocks)
                                                                            # columns are block entries (row major order)
        # the sudoku grid, all entries initialized to 0
        self.grid = np.zeros((self.size, self.size), dtype="int")

  
    # Initiates the solving process
    def solve_sudoku(self, input):
        # boolean masks and size and offset are globally accessible for simplification

        # size = 9                # sudoku grid dimension
        # offset = np.sqrt(size)  # offset within a block
        # offset = int(offset)    # convert to integer

        # intialize starter sudoku grid
        base_entries = input.get("starter")                 # retrieve list of starter values from dict
        self.grid = np.array(base_entries).reshape(self.size, self.size)   # reshape array to 9x9 dimensions
        # grid[grid == None] = 0                              # fill in missing entries with 0
        self.grid = self.grid.astype(int)

        # initialize boolean masks for rows, columns and blocks
        # row_mask = np.zeros((self.size, self.size), dtype="bool")
        # column_mask = np.zeros((self.size, self.size), dtype="bool")
        # block_mask = np.zeros((self.size, self.size), dtype="bool")  # a row in the block_mask grid represents one block (e.g., a 9x9 grid has 9 blocks)
                                                            # columns are block entries (row major order)
        self.setMasks()   # set the flags in the boolean masks to match the starter sudoku
    
        # print(self.grid)
        error = self.solve(0, 0)  # initial call to solve() starts at grid position 0,0 
        # print(self.grid)
        # print(error)

        return self.grid.flatten().tolist(), error

    # Set masks according to starter grid that was sent by the client
    def setMasks(self):
        self.resetMasks()   # reset masks to ensure no remnants of previous solving attempt create an error
                            # (could occur if hint/solution button is re-clicked after input is edited)
        n, d = self.grid.shape
        for i in range(n):
                for j in range(d):
                    if self.grid[i, j] != 0:
                        self.row_mask[i, self.grid[i, j] - 1] = True      # grid[i, j] - 1: if let's say grid[1, 2] = 5, then 
                        self.column_mask[j, self.grid[i, j] - 1] = True   # the 4th entry (5-1) in the mask should be set to true

                        block_num = self.offset * (i // self.offset) + j // self.offset    # block number (ranging from top left (=0) to bottom right (=size))
                        self.block_mask[block_num, self.grid[i, j] - 1] = True    
    
    # Recursively solve the sudoku by trying the first possible digit until encountering an error
    # Backtrack to the source of the error and try the next possible digit
    def solve(self, row, col):
        # reached the end of the sudoku (counter should be 0)
        if(row >= self.size):
            return False

        # get ready for next entry
        col_next = col
        row_next = row
        
        if(col < self.size-1):     # iterate to the next column entry until reaching the end of a row
            col_next += 1
        else:                 # if the end of a row is reached, continue onto the first entry in the next row
            row_next += 1
            col_next = 0

        # initialize error (False = no error, True = error)
        error = False

        # move to next entry if current entry is filled in (i.e., is not 0)
        # prevents starter values from being changed
        if (self.grid[row, col] != 0):
            error = self.solve(row_next, col_next)   # recursive call to solve() with the next entry in the grid
            return error                              # if we get here during backtracking just propogate to the previous call 
                                                            # (ensures starter values aren't changed)

        # finds possible values for current empty entry
        # finds the indices in the row, column and block masks that are all False
        # i.e., these numbers are not present in the current row, column and block
        # recall that the indices in these masks correspond to entry value - 1
        else:
            block_num = self.offset * (row // self.offset) + col // self.offset
            matches = ~self.row_mask[row] & ~self.column_mask[col] & ~self.block_mask[block_num]     # matches contains all possible values for the current empty entry
                                                                                        # e.g. if the numbers 2 and 4 are not in the current entry's row, column or block, then match = [False, True, False, True]
                                                                                        # in this case, True = possible value, False = not a possible value

            if(np.count_nonzero(matches) == 0):     # no possible options (all entries in matches are False) indicates something went wrong
                return True                         # error encountered -> start backtracking

            num_options = np.nonzero(matches)[0]    # extract the possbile values from matches
            num = num_options[0] + 1                # chose the first option of possible values (+1 to convert index to entry value)

            # Remove chosen value from options
            if (len(num_options) > 1):
                num_options = num_options[1:]
            else:
                num_options = []                      # if we tried the last possible value, then empty the list

            self.setEntry(row, col, block_num, num)  # update the entry
            error = self.solve(row_next, col_next)    # recursive call -> move onto next entry

            # If we got stuck somewhere, we backtrack to this part of the code
            # If we encounter an error, the recursive function call returns True (i.e error_check = True)
            if (error):
                self.resetEntry(row, col, block_num, num)  # Erase current entry

                # Try all options until the error is resolved or we run out of options for the current entry
                # Of all options eventually result in an error, the source of the error must be in an earlier entry
                # In that case we backtrack to the previous entry
                while(error and len(num_options) > 0):
                    num = num_options[0] + 1
                    self.setEntry(row, col, block_num, num)

                    if (len(num_options) > 1):
                        num_options = num_options[1:]
                    else:
                        num_options = []

                    error = self.solve(row_next, col_next) # move forward again until another error is encountered

                    # If we get another error then the option we chose is wrong
                    # Erase the current entry and loop back to the start to move on to the next option
                    if(error):
                        self.resetEntry(row, col, block_num, num)

                return error

            return error
    
    # Updates boolean masks when an entry is added/changed
    def setEntry(self, row, col, block_num, value):
        self.grid[row, col] = value
        self.row_mask[row, value - 1]= True                 # grid[i, j] - 1: if let's say grid[1, 2] = 5, then 
        self.column_mask[col, value - 1]= True              # mask[5 - 1] will be changed -> the appropritate mask index is value - 1
        self.block_mask[block_num, value - 1] = True        # block number (ranging from top left (=0) to bottom right (=size))
    
    # Resets masks when an entry is deleted/changed
    def resetEntry(self, row, col, block_num, value):
        self.grid[row, col] = 0
        self.row_mask[row, value - 1] = False
        self.column_mask[col, value - 1] = False
        self.block_mask[block_num, value - 1] = False


    # Helper Methods

    # Adds value to the entry at grid[row, col]
    # Returns true if add was successful
    # Returns false if value conflicts with another value
    def addEntry(self, row, col, value):
        currentValue = self.grid[row, col]
        block_num = self.offset * (row // self.offset) + col // self.offset

        # If cell is empty, value is 0
        # In that case we don't need to check if the new value is allowed, we just reset the current value
        if value == 0:
            if currentValue != 0:
                self.resetEntry(row, col, block_num, currentValue)

            self.grid[row, col] = 0
            isAllowed = True

        # If the value is the same, we don't need to change anything    
        elif value == currentValue:
            return True
        
        # If it is a new entry, check if there is a conflict
        # If no conflict, add the value to the grid at grid[row, col]
        else :
            isAllowed = self.checkEntry(row, col, block_num, value)

            if isAllowed:
                # CurrentValue = self.grid[row, col]
                if currentValue != 0:
                    self.resetEntry(row, col, block_num, currentValue)

                self.setEntry(row, col, block_num, value)

        return isAllowed

    # Checks if entry value is allowed
    # Returns true if value is not present in row, col and block; returns false otherwise
    def checkEntry(self, row, col, block_num, value):
        return not (self.row_mask[row, value - 1] | self.column_mask[col, value - 1] | self.block_mask[block_num, value - 1])
    
    # Resets the grid and masks
    def clear(self):
        self.grid.fill(0)
        self.row_mask.fill(0)
        self.column_mask.fill(0)
        self.block_mask.fill(0)
    
    def resetMasks(self):
        self.row_mask.fill(0)
        self.column_mask.fill(0)
        self.block_mask.fill(0)