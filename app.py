import json
import sudokuSolver as sudokuSolver
from flask import request
from flask import Flask, render_template

app = Flask(__name__)

solver = None

# render home page
@app.route('/')
def index():
    global solver
    solver = sudokuSolver.Solver()
    print("reloaded")
    return render_template('index.html')

# check if value inputted by client conflicts with another value
@app.route('/check', methods=['POST'])
def check():
    global solver
    inputVal = request.get_json()
    entryObj = json.loads(inputVal)

    success = solver.addEntry(entryObj.get("row"), entryObj.get("col"), entryObj.get("value"))

    validationDict = {"success": success}
    return json.dumps(validationDict, indent=4)

# retrieve sudoku input from /test
@app.route('/test', methods=['POST'])
def test():
    global solver
    # output = request.get_json()     # get the json from client
    # result = json.loads(output)     # this converts the json output to a python dictionary
    
    # solver = sudokuSolver.Solver()
    solution = solver.solve_sudoku()   # return value is the solution
    solved_dict = {"ender": solution}
    return json.dumps(solved_dict, indent=4)   # return json-ified dictionary with solution

# cut sudoku_solver() from here


if (__name__ == "__main__"):
    app.run(debug=True)

