import json
import sudokuSolver as sudokuSolver
from flask import request
from flask import Flask, render_template

app = Flask(__name__)

solver = sudokuSolver.Solver()

# Render home page and clear Sudoku grid on reload
@app.route('/')
def index():
    solver.clear()
    print("reloaded")
    return render_template('index.html')

# Check if value inputted by client conflicts with another value
# Returns success flag (true of add is successful, false otherwise)
@app.route('/check', methods=['POST'])
def check():
    inputVal = request.get_json()       # retreive json from client
    entryObj = json.loads(inputVal)     # ceonvert json to dictionary

    success = solver.addEntry(entryObj.get("row"), entryObj.get("col"), entryObj.get("value"))

    validationDict = {"success": success}
    return json.dumps(validationDict, indent=4)

# Retrieves Sudoku solution and sends it to client
@app.route('/test', methods=['POST'])
def test():
    # output = request.get_json()     # get the json from client
    # result = json.loads(output)     # this converts the json output to a python dictionary
    # solver = sudokuSolver.Solver()
    
    solution = solver.solve_sudoku()           # return value is the solution
    solved_dict = {"ender": solution}
    return json.dumps(solved_dict, indent=4)   # return json-ified dictionary with solution


if (__name__ == "__main__"):
    app.run(debug=True)

