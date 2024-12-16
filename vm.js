class ExecutionContext {
    constructor(parent = null) {
        this.variables = {};
        this.parent = parent;
    }

    // Retrieve variable value, searching parent contexts if necessary
    getVariable(name) {
        if (name in this.variables) {
            return this.variables[name];
        } else if (this.parent) {
            return this.parent.getVariable(name);
        } else {
            throw new ReferenceError(`Variable "${name}" is not defined`);
        }
    }

    // Define a new variable in the current context
    setVariable(name, value) {
        this.variables[name] = value;
    }

    // Update an existing variable, searching parent contexts if necessary
    updateVariable(name, value) {
        if (name in this.variables) {
            this.variables[name] = value;
        } else if (this.parent) {
            this.parent.updateVariable(name, value);
        } else {
            throw new ReferenceError(`Variable "${name}" is not defined`);
        }
    }
}

class VM {
    constructor(ast) {
        this.ast = ast;
        this.globalContext = new ExecutionContext();
        this.currentContext = this.globalContext;
        this.setupBuiltIns();
    }

    // Setup built-in functions and objects
    setupBuiltIns() {
        // 'yapping' as console.log
        this.globalContext.setVariable('yapping', (...args) => console.log(...args));

        // 'nerdShit' as Math (if needed)
        this.globalContext.setVariable('nerdShit', Math);
    }

    // Start execution
    run() {
        this.executeBlock(this.ast.body, this.globalContext);
    }

    // Execute a block of statements within a given context
    executeBlock(statements, context) {
        const previousContext = this.currentContext;
        this.currentContext = context;
        for (const stmt of statements) {
            const result = this.execute(stmt);
            // Handle return statements
            if (result && result.type === 'return') {
                this.currentContext = previousContext;
                // Throw an exception to unwind the call stack
                throw { type: 'return', value: result.value };
            }
            // Handle break and continue statements
            if (result && (result.type === 'break' || result.type === 'continue')) {
                this.currentContext = previousContext;
                return result;
            }
        }
        this.currentContext = previousContext;
    }

    // Execute a single statement
    execute(node) {
        switch (node.type) {
            case 'FunctionDeclaration':
                this.currentContext.setVariable(node.name, {
                    params: node.params,
                    body: node.body,
                    context: this.currentContext
                });
                break;
            case 'VariableDeclaration':
                {
                    const value = node.init ? this.evaluate(node.init) : undefined;
                    this.currentContext.setVariable(node.id, value);
                }
                break;
            case 'ExpressionStatement':
                this.evaluate(node.expression);
                break;
            case 'IfStatement':
                {
                    const test = this.evaluate(node.test);
                    if (test) {
                        return this.execute(node.consequent);
                    } else if (node.alternate) {
                        return this.execute(node.alternate);
                    }
                }
                break;
            case 'ForStatement':
                {
                    const loopContext = new ExecutionContext(this.currentContext);
                    
                    // Handle initializer
                    if (node.init) {
                        if (node.init.type === 'VariableDeclaration') {
                            const value = node.init.init ? this.evaluate(node.init.init) : undefined;
                            loopContext.setVariable(node.init.id, value);
                        } else {
                            this.evaluate(node.init);
                        }
                    }

                    // Save the previous context and set the current to loopContext
                    const previousContext = this.currentContext;
                    this.currentContext = loopContext;

                    // Execute loop
                    while (node.test ? this.evaluate(node.test) : true) {
                        const result = this.execute(node.body);
                        
                        if (result && result.type === 'break') break;
                        if (result && result.type === 'return') return result;
                        if (node.update) {
                            this.evaluate(node.update);
                        }
                    }

                    // Restore the previous context after the loop
                    this.currentContext = previousContext;
                }
                break;
            case 'WhileStatement': // Handle WhileStatement
                {
                    // Execute the loop until the condition is false
                    while (this.evaluate(node.test)) {
                        const result = this.execute(node.body);

                        // Handle 'break', 'continue', and 'return' statements
                        if (result) {
                            if (result.type === 'break') {
                                break;
                            }
                            if (result.type === 'continue') {
                                continue;
                            }
                            if (result.type === 'return') {
                                return result;
                            }
                        }
                    }
                }
                break;
            case 'BreakStatement': // Handle BreakStatement
                return { type: 'break' };
            case 'ContinueStatement': // Handle ContinueStatement
                return { type: 'continue' };
            case 'ReturnStatement':
                return { type: 'return', value: node.argument ? this.evaluate(node.argument) : undefined };
            case 'BlockStatement':
                // Execute block within a new context for proper scoping
                const blockContext = new ExecutionContext(this.currentContext);
                return this.executeBlock(node.body, blockContext);
            case 'CallExpression':
                return this.evaluate(node);
            default:
                throw new Error(`Unsupported statement type: ${node.type}`);
        }
    }

    // Evaluate expressions
    evaluate(node) {
        switch (node.type) {
            case 'Literal':
                return node.value;
            case 'StringLiteral':
                return node.value;
            case 'Identifier':
                return this.currentContext.getVariable(node.value);
            case 'BinaryExpression':
                return this.evaluateBinaryExpression(node);
            case 'LogicalExpression':
                return this.evaluateLogicalExpression(node);
            case 'AssignmentExpression':
                return this.evaluateAssignment(node);
            case 'CallExpression':
                return this.evaluateCall(node);
            case 'MemberExpression':
                return this.evaluateMember(node);
            case 'UnaryExpression':
                return this.evaluateUnary(node);
            case 'UpdateExpression':
                return this.evaluateUpdate(node);
            case 'ArrayExpression':
                return this.evaluateArray(node);
            default:
                throw new Error(`Unsupported expression type: ${node.type}`);
        }
    }

    evaluateBinaryExpression(node) {
        const left = this.evaluate(node.left);
        const right = this.evaluate(node.right);
        switch (node.operator) {
            case '+':
                return left + right;
            case '-':
                return left - right;
            case '*':
                return left * right;
            case '/':
                return left / right;
            case '%':
                return left % right;
            case '<':
                return left < right;
            case '>':
                return left > right;
            case '<=':
                return left <= right;
            case '>=':
                return left >= right;
            case '==':
                return left == right;
            case '===':
                return left === right;
            case '!=':
                return left != right;
            case '!==':
                return left !== right;
            default:
                throw new Error(`Unsupported binary operator: ${node.operator}`);
        }
    }

    evaluateLogicalExpression(node) {
        const left = this.evaluate(node.left);
        switch (node.operator) {
            case '&&':
                return left && this.evaluate(node.right);
            case '||':
                return left || this.evaluate(node.right);
            default:
                throw new Error(`Unsupported logical operator: ${node.operator}`);
        }
    }

    evaluateAssignment(node) {
        if (node.left.type !== 'Identifier') {
            throw new Error('Invalid left-hand side in assignment');
        }
        const value = this.evaluate(node.right);
        this.currentContext.updateVariable(node.left.value, value);
        return value;
    }

    evaluateCall(node) {
        let func;
        if (node.callee.type === 'MemberExpression') {
            const object = this.evaluate(node.callee.object);
            const property = node.callee.computed ? this.evaluate(node.callee.property) : node.callee.property.value;
            func = object[property];
            if (typeof func !== 'function') {
                throw new TypeError(`${property} is not a function`);
            }
        } else {
            func = this.evaluate(node.callee);
            if (typeof func === 'function') {
                // Built-in function
                const args = node.arguments.map(arg => this.evaluate(arg));
                return func(...args);
            } else if (typeof func === 'object' && func !== null && 'params' in func && 'body' in func) {
                // User-defined function
                return this.executeUserFunction(func, node.arguments);
            } else {
                throw new TypeError(`${node.callee.value} is not a function`);
            }
        }

        // For member expressions that are functions
        const args = node.arguments.map(arg => this.evaluate(arg));
        return func(...args);
    }

    evaluateMember(node) {
        const object = this.evaluate(node.object);
        const property = node.computed ? this.evaluate(node.property) : node.property.value;
        if (object === undefined || object === null) {
            throw new TypeError(`Cannot read property '${property}' of ${object}`);
        }
        return object[property];
    }

    evaluateUnary(node) {
        const arg = this.evaluate(node.argument);
        switch (node.operator) {
            case '!':
                return !arg;
            case '-':
                return -arg;
            case '+':
                return +arg;
            default:
                throw new Error(`Unsupported unary operator: ${node.operator}`);
        }
    }

    evaluateUpdate(node) {
        if (node.argument.type !== 'Identifier') {
            throw new Error('Invalid argument for update expression');
        }
        const varName = node.argument.value;
        let value = this.currentContext.getVariable(varName);
        switch (node.operator) {
            case '++':
                value += 1;
                break;
            case '--':
                value -= 1;
                break;
            default:
                throw new Error(`Unsupported update operator: ${node.operator}`);
        }
        this.currentContext.updateVariable(varName, value);
        return value;
    }

    evaluateArray(node) {
        return node.elements.map(element => this.evaluate(element));
    }

    executeUserFunction(func, args) {
        // Check if the number of arguments matches the number of parameters
        if (args.length !== func.params.length) {
            throw new Error(`Expected ${func.params.length} arguments but got ${args.length}`);
        }

        // Create a new execution context for the function
        const functionContext = new ExecutionContext(func.context);

        // Bind arguments to parameters
        for (let i = 0; i < func.params.length; i++) {
            const paramName = func.params[i];
            const argValue = this.evaluate(args[i]);
            functionContext.setVariable(paramName, argValue);
        }

        // Execute the function body within the new context
        const previousContext = this.currentContext;
        this.currentContext = functionContext;

        let returnValue;
        try {
            this.executeBlock(func.body.body, functionContext);
            // If no return statement is encountered, return undefined
            returnValue = undefined;
        } catch (e) {
            if (e.type === 'return') {
                returnValue = e.value;
            } else {
                throw e; // Re-throw unexpected errors
            }
        }

        // Restore the previous context
        this.currentContext = previousContext;

        return returnValue;
    }
}

module.exports = VM;