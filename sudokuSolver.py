import numpy as np

class Solver:
    def __init__(self):
        self.size = 9                               # dimensions of the sudoku grid
        self.offset = int(np.sqrt(self.size))       # offset into 3x3 squares in sudoku grid

        # boolean masks keep track of what numbers are present in rows, columns and squares
        # masks are True at the index equal to the number-1 present (number-1 because indices start at 0)
        # E.g.: if row 0 contains numbers 1, 3, 4, then row_mask[0] = [True, False, True, True]
        self.row_mask = np.zeros((self.size, self.size), dtype="bool")
        self.column_mask = np.zeros((self.size, self.size), dtype="bool")
        self.square_mask = np.zeros((self.size, self.size), dtype="bool")

        # the sudoku grid, all entries initialized to 0
        self.grid = np.zeros((self.size, self.size), dtype="int")

  
    # sets up the initial grid and then solves the sudoku
    def solve_sudoku(self):
        # boolean masks and size and offset are globally accessible for simplification

        # size = 9                # sudoku grid dimension
        # offset = np.sqrt(size)  # offset within a square
        # offset = int(offset)    # convert to integer

        # intialize starter sudoku grid
        # base_entries = input.get("starter")                 # retrieve list of starter values from dict
        # grid = np.array(base_entries).reshape(self.size, self.size)   # reshape array to 9x9 dimensions
        # grid[grid == None] = 0                              # fill in missing entries with 0
        # grid = grid.astype(int)

        # initialize boolean masks for rows, columns and squares
        # row_mask = np.zeros((self.size, self.size), dtype="bool")
        # column_mask = np.zeros((self.size, self.size), dtype="bool")
        # square_mask = np.zeros((self.size, self.size), dtype="bool")  # a row in the square_mask grid represents one square (e.g., a 9x9 grid has 9 squares)
                                                            # columns are square entries (row major order)
        # self.setMasks(grid)   # set the flags in the boolean masks to match the starter sudoku
    
        # grid_copy = np.copy(grid)
        print(self.grid)
        error_check = self.solve(0, 0)  # initial call to solve() starts at grid position 0,0 

        return self.grid.flatten().tolist()


    def setMasks(self, grid):
        n, d = grid.shape
        for i in range(n):
                for j in range(d):
                    if grid[i, j] != 0:
                        self.row_mask[i, grid[i, j] - 1] = True      # grid[i, j] - 1: if let's say grid[1, 2] = 5, then 
                        self.column_mask[j, grid[i, j] - 1] = True   # the 4th entry (5-1) in the mask should be set to true

                        square_num = self.offset * (i // self.offset) + j // self.offset    # square number (ranging from top left (=0) to bottom right (=size))
                        self.square_mask[square_num, grid[i, j] - 1] = True

    # update masks (-1 to convert from value to index)
    def setEntry(self, row, col, square_num, value):
        self.grid[row, col] = value
        self.row_mask[row, value - 1]= True
        self.column_mask[col, value - 1]= True
        self.square_mask[square_num, value - 1] = True

    # resents entry value to 0 and resets appropriate mask entries to False
    def resetEntry(self, row, col, square_num, value):
        self.grid[row, col] = 0
        self.row_mask[row, value - 1]= False
        self.column_mask[col, value - 1]= False
        self.square_mask[square_num, value - 1] = False
        

    # recursively solve the sudoku by trying the first possible digit until encountering an error
    # backtrack to the source of the error and try the next possible digit
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
        # finds the indices in the row, column and square masks that are all False
        # i.e., these numbers are not present in the current row, column and square
        # recall that the indices in these masks correspond to entry value - 1
        else:
            square_num = self.offset * (row // self.offset) + col // self.offset
            matches = ~self.row_mask[row] & ~self.column_mask[col] & ~self.square_mask[square_num]     # matches contains all possible values for the current empty entry
                                                                                        # e.g. if the numbers 2 and 4 are not in the current entry's row, column or square, then match = [False, True, False, True]
                                                                                        # in this case, True = possible value, False = not a possible value

            if(np.count_nonzero(matches) == 0):     # No possible options (all entries in matches are False) indicates something went wrong
                return True                         # error encountered -> start backtracking

            num_options = np.nonzero(matches)[0]    # extract the possbile values from matches
            num = num_options[0] + 1                # chose the first option of possible values (+1 to convert index to entry value)

            # remove chosen value from options
            # updateOptions(num_options)
            if (len(num_options) > 1):
                num_options = num_options[1:]
            else:
                num_options = []    # if we tried the last possible value, then empty the list

            self.setEntry(row, col, square_num, num)             # update the entry
            error = self.solve(row_next, col_next)   # recursive call -> move onto next entry

            # if we got stuck somewhere, we backtrack to this part of the code
            # if we encounter an error, the recursive function call returns True (i.e error_check = True)
            if (error):
                self.resetEntry(row, col, square_num, num)  # Erase current entry

                # try all options until the error is resolved or we run out of options for the current entry
                # if all options eventually result in an error, the source of the error must be in an earlier entry
                # in that case we backtrack to the previous entry
                while(error and len(num_options) > 0):
                    num = num_options[0] + 1
                    self.setEntry(row, col, square_num, num)

                    if (len(num_options) > 1):
                        num_options = num_options[1:]
                    else:
                        num_options = []

                    error = self.solve(row_next, col_next) # move forward again until another error is encountered

                    # if we get another error then the option we chose is wrong
                    # erase the current entry and loop back to the start to move on to the next option
                    if(error):
                        self.resetEntry(row, col, square_num, num)

                return error

            return error

    
    # Client Helper Methods
    
    # Checks if entry value is allowed
    # Returns true if value is not present in row, col and square; returns false otherwise
    def checkEntry(self, row, col, value):
        square_num = self.offset * (row // self.offset) + col // self.offset
        return not (self.row_mask[row, value - 1] | self.column_mask[col, value - 1] | self.square_mask[square_num, value - 1])

    
    # Updates boolean masks when an entry is added/changed
    def setBooleanMasks(self, row, col, value):
        self.row_mask[row, value - 1] = True      # grid[i, j] - 1: if let's say grid[1, 2] = 5, then 
        self.column_mask[col, value - 1] = True   # the 4th entry (5-1) in the mask should be set to true

        square_num = self.offset * (row // self.offset) + col // self.offset    # square number (ranging from top left (=0) to bottom right (=size))
        self.square_mask[square_num, value - 1] = True
    
    # Resets masks when an entry is deleted/changed
    def resetMasks(self, row, col, value):
        self.row_mask[row, value - 1]= False
        self.column_mask[col, value - 1]= False

        square_num = self.offset * (row // self.offset) + col // self.offset
        self.square_mask[square_num, value - 1] = False

    # Adds value to the entry at grid[row, col]
    # Returns true if add was successful
    # Returns false if value conflicts with another value
    def addEntry(self, row, col, value):
        currentValue = self.grid[row, col]

        # if cell is empty, value is 0
        # in that case we don't need to check if the new value is allowed, we just reset the current value
        if value == 0:
            if currentValue != 0:
                self.resetMasks(row, col, self.grid[row, col])
            self.grid[row, col] = value
            isAllowed = True

        # if the value is the same, we don't need to change anything    
        elif value == currentValue:
            return True
        
        # if it is a new entry, check if there is a conflict
        # if no conflict, add the value to the grid at grid[row, col]
        else :
            isAllowed = self.checkEntry(row, col, value)

            if isAllowed:
                # currentValue = self.grid[row, col]
                if currentValue != 0:
                    self.resetMasks(row, col, currentValue)

                self.grid[row, col] = value
                self.setBooleanMasks(row, col, value)

        print(self.grid)
        return isAllowed


    # resets the grid and masks
    def clear(self):
        self.grid.fill(0)
        self.row_mask.fill(0)
        self.column_mask.fill(0)
        self.square_mask.fill(0)
    