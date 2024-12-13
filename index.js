// Lexer: Tokenizes the input code
function lexer(input) {
    const keywords = {
        'skibidi': 'function',
        'rizz': 'let',
        'cap': 'Boolean',
        'cooked': 'let',
        'flex': 'for',
        'bussin': 'return',
        'edging': 'if',
        'amogus': 'else',
        'goon': 'while',
        'bruh': 'break',
        'grind': 'continue',
        'chad': 'Number',
        'gigachad': 'Number',
        'yap': 'String',
        'grimace': 'const',
        'sigma': 'case',
        'based': 'default',
        'mewing': 'do',
        'giga': 'BigInt',
        'salty': 'static',
        'gang': 'class',
        'ohio': 'switch',
        'yeet': 'throw',
        'oopsie': 'Error',
        'hop on': 'call',
        'yapping': 'yapping' // Special keyword for console.log
    };

    // Include && and || in the regex
    const regex = /(".*?"|hop\s+on|\+\+|\-\-|&&|\|\||[a-zA-Z_][a-zA-Z0-9_]*|\d+|===|!==|<=|>=|==|!=|[\(\)\{\}\;\,\=<>!+\-\*\/%])/g;
    const words = input.match(regex) || [];

    const tokens = [];
    for (const word of words) {
        if (keywords[word]) {
            tokens.push({ type: 'keyword', value: keywords[word] });
        } else if (!isNaN(parseFloat(word))) {
            tokens.push({ type: 'number', value: word });
        } else if (word.startsWith('"') && word.endsWith('"')) {
            tokens.push({ type: 'string', value: word });
        } else if ([
            "(", ")", "{", "}", ";", ",", "=", "<", ">", "!", "+", "-", "*", "/", "%", "++", "--",
            "<=", ">=", "==", "!=", "===", "!==", "&&", "||"
        ].includes(word)) {
            tokens.push({ type: 'punctuation', value: word });
        } else {
            tokens.push({ type: 'identifier', value: word });
        }
    }

    return tokens;
}

function expect(tokens, type, value) {
    const token = tokens.shift();
    if (!token || token.type !== type || (value && token.value !== value)) {
        throw new Error(`Expected ${value || type} but got ${token ? JSON.stringify(token) : 'EOF'}`);
    }
    return token;
}

function peek(tokens) {
    return tokens[0];
}

// === Expression Parsing ===
//
// Expression -> AssignmentExpression
// AssignmentExpression -> LogicalORExpression ( '=' AssignmentExpression )?
// LogicalORExpression -> LogicalANDExpression ( '||' LogicalANDExpression )*
// LogicalANDExpression -> EqualityExpression ( '&&' EqualityExpression )*
// EqualityExpression -> RelationalExpression (('==' | '===' | '!=' | '!==') RelationalExpression)*
// RelationalExpression -> AdditiveExpression (('<' | '>' | '<=' | '>=') AdditiveExpression)*
// AdditiveExpression -> MultiplicativeExpression (('+' | '-') MultiplicativeExpression)*
// MultiplicativeExpression -> PostfixExpression (('*' | '/' | '%') PostfixExpression)*
// PostfixExpression -> Primary (('++' | '--')?)
// Primary -> Number | String | Identifier | '(' Expression ')' | Call

function parseExpression(tokens, stopValues = []) {
    return parseAssignmentExpression(tokens, stopValues);
}

function parseAssignmentExpression(tokens, stopValues) {
    let node = parseLogicalORExpression(tokens, stopValues);
    // Check for assignment operator '='
    while (peek(tokens) && peek(tokens).type === 'punctuation' && peek(tokens).value === '=' && !stopValues.includes(peek(tokens).value)) {
        tokens.shift(); // consume '='
        const right = parseAssignmentExpression(tokens, stopValues);
        node = {
            type: 'AssignmentExpression',
            operator: '=',
            left: node,
            right: right
        };
    }
    return node;
}

function parseLogicalORExpression(tokens, stopValues) {
    let node = parseLogicalANDExpression(tokens, stopValues);
    while (peek(tokens) && peek(tokens).type === 'punctuation' && peek(tokens).value === '||' && !stopValues.includes(peek(tokens).value)) {
        const op = tokens.shift().value; // '||'
        const right = parseLogicalANDExpression(tokens, stopValues);
        node = {
            type: 'LogicalExpression',
            operator: op,
            left: node,
            right: right
        };
    }
    return node;
}

function parseLogicalANDExpression(tokens, stopValues) {
    let node = parseEqualityExpression(tokens, stopValues);
    while (peek(tokens) && peek(tokens).type === 'punctuation' && peek(tokens).value === '&&' && !stopValues.includes(peek(tokens).value)) {
        const op = tokens.shift().value; // '&&'
        const right = parseEqualityExpression(tokens, stopValues);
        node = {
            type: 'LogicalExpression',
            operator: op,
            left: node,
            right: right
        };
    }
    return node;
}

function parseEqualityExpression(tokens, stopValues) {
    let node = parseRelationalExpression(tokens, stopValues);
    const equalityOps = ['==', '===', '!=', '!=='];
    while (peek(tokens) && peek(tokens).type === 'punctuation' && equalityOps.includes(peek(tokens).value) && !stopValues.includes(peek(tokens).value)) {
        const op = tokens.shift().value;
        const right = parseRelationalExpression(tokens, stopValues);
        node = {
            type: 'BinaryExpression',
            operator: op,
            left: node,
            right: right
        };
    }
    return node;
}

function parseRelationalExpression(tokens, stopValues) {
    let node = parseAdditiveExpression(tokens, stopValues);
    const relationalOps = ['<', '>', '<=', '>='];
    while (
        peek(tokens) &&
        peek(tokens).type === 'punctuation' &&
        relationalOps.includes(peek(tokens).value) &&
        !stopValues.includes(peek(tokens).value)
    ) {
        const op = tokens.shift().value; // relational operator
        const right = parseAdditiveExpression(tokens, stopValues);
        node = {
            type: 'BinaryExpression',
            operator: op,
            left: node,
            right: right
        };
    }
    return node;
}

function parseAdditiveExpression(tokens, stopValues) {
    let node = parseMultiplicativeExpression(tokens, stopValues);
    while (peek(tokens) && peek(tokens).type === 'punctuation' && (peek(tokens).value === '+' || peek(tokens).value === '-') && !stopValues.includes(peek(tokens).value)) {
        const op = tokens.shift().value; // '+' or '-'
        const right = parseMultiplicativeExpression(tokens, stopValues);
        node = {
            type: 'BinaryExpression',
            operator: op,
            left: node,
            right: right
        };
    }
    return node;
}

function parseMultiplicativeExpression(tokens, stopValues) {
    let node = parsePostfixExpression(tokens, stopValues);
    const multiplicativeOps = ['*', '/', '%'];
    while (peek(tokens) && peek(tokens).type === 'punctuation' && multiplicativeOps.includes(peek(tokens).value) && !stopValues.includes(peek(tokens).value)) {
        const op = tokens.shift().value; // '*', '/', '%'
        const right = parsePostfixExpression(tokens, stopValues);
        node = {
            type: 'BinaryExpression',
            operator: op,
            left: node,
            right: right
        };
    }
    return node;
}

// parsePostfixExpression to handle i++, i--
function parsePostfixExpression(tokens, stopValues) {
    let node = parsePrimary(tokens, stopValues);
    while (peek(tokens) && peek(tokens).type === 'punctuation' && (peek(tokens).value === '++' || peek(tokens).value === '--') && !stopValues.includes(peek(tokens).value)) {
        const op = tokens.shift().value;
        node = {
            type: 'UpdateExpression',
            operator: op,
            argument: node,
            prefix: false
        };
    }
    return node;
}

function parsePrimary(tokens, stopValues) {
    const t = peek(tokens);
    if (!t) throw new Error('Unexpected end of tokens in parsePrimary');

    if (t.type === 'number') {
        tokens.shift();
        return { type: 'Literal', value: parseFloat(t.value) };
    }

    if (t.type === 'string') {
        tokens.shift();
        return { type: 'StringLiteral', value: t.value };
    }

    if (t.type === 'identifier') {
        tokens.shift();
        return { type: 'Identifier', value: t.value };
    }

    // If we have a 'call' keyword here, parse a call expression as a primary
    if (t.type === 'keyword' && t.value === 'call') {
        tokens.shift(); // consume 'call'
        return parseCall(tokens);
    }

    if (t.type === 'punctuation' && t.value === '(') {
        tokens.shift(); // consume '('
        const expr = parseExpression(tokens, [')']);
        expect(tokens, 'punctuation', ')');
        return expr;
    }

    // If we encounter a stop value, return null
    if (t.type === 'punctuation' && stopValues.includes(t.value)) {
        return null;
    }

    throw new Error(`Unexpected token in parsePrimary: ${JSON.stringify(t)}`);
}

// Parse a call expression (after we've handled the 'call' keyword)
function parseCall(tokens) {
    const funcName = expect(tokens, 'identifier');
    expect(tokens, 'punctuation', '(');
    const args = [];
    while (!(peek(tokens).type === 'punctuation' && peek(tokens).value === ')')) {
        if (peek(tokens).type === 'punctuation' && peek(tokens).value === ',') {
            tokens.shift();
            continue;
        }
        const arg = parseExpression(tokens, [',', ')']);
        args.push(arg);
    }
    expect(tokens, 'punctuation', ')');
    return {
        type: 'CallExpression',
        name: funcName.value,
        arguments: args
    };
}

// Parse a yapping call: yapping(...)
function parseYappingCall(tokens) {
    expect(tokens, 'punctuation', '(');
    const args = [];
    while (!(peek(tokens).type === 'punctuation' && peek(tokens).value === ')')) {
        if (peek(tokens).type === 'punctuation' && peek(tokens).value === ',') {
            tokens.shift();
            continue;
        }
        const arg = parseExpression(tokens, [',', ')']);
        args.push(arg);
    }
    expect(tokens, 'punctuation', ')');
    if (peek(tokens) && peek(tokens).type === 'punctuation' && peek(tokens).value === ';') {
        tokens.shift();
    }
    return {
        type: 'CallExpression',
        name: 'yapping',
        arguments: args
    };
}

// Parse a block { ... }
function parseBlock(tokens) {
    expect(tokens, 'punctuation', '{');
    const block = { type: 'BlockStatement', body: [] };
    while (tokens.length > 0 && !(peek(tokens) && peek(tokens).type === 'punctuation' && peek(tokens).value === '}')) {
        block.body.push(parseStatement(tokens));
    }
    expect(tokens, 'punctuation', '}');
    return block;
}

// Parse variable declaration: let x = 5;
function parseVariableDeclaration(tokens) {
    const nameTok = expect(tokens, 'identifier');
    let init = null;
    if (peek(tokens) && peek(tokens).type === 'punctuation' && peek(tokens).value === '=') {
        tokens.shift(); // consume '='
        const expr = parseExpression(tokens, [';']);
        init = expr;
    }
    expect(tokens, 'punctuation', ';');
    return {
        type: 'VariableDeclaration',
        kind: 'let',
        id: nameTok.value,
        init: init
    };
}

// Parse return statement: return expr;
function parseReturnStatement(tokens) {
    const expr = parseExpression(tokens, [';']);
    expect(tokens, 'punctuation', ';');
    return { type: 'ReturnStatement', argument: expr };
}

// Parse if statement: if (condition) { ... } else if { ... } else { ... }
function parseIfStatement(tokens) {
    expect(tokens, 'punctuation', '(');
    const condition = parseExpression(tokens, [')']);
    expect(tokens, 'punctuation', ')');
    const consequent = parseBlock(tokens);
    let alternate = null;

    // Check for else
    if (peek(tokens) && peek(tokens).type === 'keyword' && peek(tokens).value === 'else') {
        tokens.shift(); // consume else
        if (peek(tokens) && peek(tokens).type === 'keyword' && peek(tokens).value === 'if') {
            tokens.shift(); // consume if (else-if chain)
            alternate = parseIfStatement(tokens);
        } else {
            alternate = parseBlock(tokens);
        }
    }

    return { type: 'IfStatement', test: condition, consequent: consequent, alternate: alternate };
}

// Parse for statement: for (init; test; update) { ... }
function parseForStatement(tokens) {
    expect(tokens, 'punctuation', '(');
    let init = null;
    if (!(peek(tokens).type === 'punctuation' && peek(tokens).value === ';')) {
        // If the next token is "let", parse a variable declaration for the init
        if (peek(tokens).type === 'keyword' && peek(tokens).value === 'let') {
            tokens.shift(); // consume 'let'
            const nameTok = expect(tokens, 'identifier');
            let initExpr = null;
            if (peek(tokens) && peek(tokens).type === 'punctuation' && peek(tokens).value === '=') {
                tokens.shift(); // consume '='
                initExpr = parseExpression(tokens, [';']);
            }
            init = {
                type: 'VariableDeclaration',
                kind: 'let',
                id: nameTok.value,
                init: initExpr
            };
        } else {
            init = parseExpression(tokens, [';']);
        }
    }
    expect(tokens, 'punctuation', ';');

    let test = null;
    if (!(peek(tokens).type === 'punctuation' && peek(tokens).value === ';')) {
        test = parseExpression(tokens, [';']);
    }
    expect(tokens, 'punctuation', ';');

    let update = null;
    if (!(peek(tokens).type === 'punctuation' && peek(tokens).value === ')')) {
        update = parseExpression(tokens, [')']);
    }
    expect(tokens, 'punctuation', ')');

    const body = parseBlock(tokens);
    return {
        type: 'ForStatement',
        init: init,
        test: test,
        update: update,
        body: body
    };
}

// Parse function declaration: function name(params) { ... }
function parseFunctionDeclaration(tokens) {
    const name = expect(tokens, 'identifier');
    expect(tokens, 'punctuation', '(');
    const params = [];
    while (!(peek(tokens).type === 'punctuation' && peek(tokens).value === ')')) {
        if (peek(tokens).type === 'punctuation' && peek(tokens).value === ',') {
            tokens.shift();
            continue;
        }
        const p = expect(tokens, 'identifier');
        params.push(p.value);
    }
    expect(tokens, 'punctuation', ')');
    const body = parseBlock(tokens);
    return {
        type: 'FunctionDeclaration',
        name: name.value,
        params: params,
        body: body
    };
}

// Parse a single statement
function parseStatement(tokens) {
    const t = peek(tokens);
    if (!t) return null;

    if (t.type === 'keyword' && t.value === 'function') {
        tokens.shift();
        return parseFunctionDeclaration(tokens);
    }

    if (t.type === 'keyword' && t.value === 'if') {
        tokens.shift();
        return parseIfStatement(tokens);
    }

    if (t.type === 'keyword' && t.value === 'for') {
        tokens.shift();
        return parseForStatement(tokens);
    }

    if (t.type === 'keyword' && t.value === 'return') {
        tokens.shift();
        return parseReturnStatement(tokens);
    }

    if (t.type === 'keyword' && t.value === 'let') {
        tokens.shift();
        return parseVariableDeclaration(tokens);
    }

    if (t.type === 'keyword' && t.value === 'yapping') {
        tokens.shift();
        return parseYappingCall(tokens);
    }

    // If a statement starts with 'call', handle it as a standalone call statement
    if (t.type === 'keyword' && t.value === 'call') {
        tokens.shift();
        const callNode = parseCall(tokens);
        return callNode;
    }

    if (t.type === 'identifier') {
        // Could be an assignment or a standalone identifier
        const ident = tokens.shift();
        if (peek(tokens) && peek(tokens).type === 'punctuation' && peek(tokens).value === '=') {
            tokens.shift(); // consume '='
            const expr = parseExpression(tokens, [';']);
            expect(tokens, 'punctuation', ';');
            return {
                type: 'AssignmentExpression',
                operator: '=',
                left: { type: 'Identifier', value: ident.value },
                right: expr
            };
        } else {
            if (peek(tokens) && peek(tokens).type === 'punctuation' && peek(tokens).value === ';') {
                tokens.shift();
            }
            return { type: 'Identifier', value: ident.value };
        }
    }

    if (t.type === 'string') {
        const str = tokens.shift();
        if (peek(tokens) && peek(tokens).type === 'punctuation' && peek(tokens).value === ';') tokens.shift();
        return { type: 'StringLiteral', value: str.value };
    }

    if (t.type === 'number') {
        const num = tokens.shift();
        if (peek(tokens) && peek(tokens).type === 'punctuation' && peek(tokens).value === ';') tokens.shift();
        return { type: 'Literal', value: parseFloat(num.value) };
    }

    if (t.type === 'punctuation') {
        tokens.shift();
        return { type: 'EmptyStatement' };
    }

    throw new Error(`Unexpected token in statement: ${JSON.stringify(t)}`);
}

// Parse the whole program
function parser(tokens) {
    const ast = { type: 'Program', body: [] };
    while (tokens.length > 0) {
        const stmt = parseStatement(tokens);
        if (stmt) ast.body.push(stmt);
    }
    return ast;
}

// Code Generator
function codeGenerator(ast) {
    function genExpr(node) {
        if (!node) return '';
        switch (node.type) {
            case 'BinaryExpression':
            case 'LogicalExpression':
                return `${genExpr(node.left)} ${node.operator} ${genExpr(node.right)}`;
            case 'StringLiteral':
                return node.value;
            case 'Literal':
                return node.value;
            case 'Identifier':
                return node.value;
            case 'CallExpression':
                let funcName = node.name;
                // Translate yapping to console.log
                if (funcName === 'yapping') {
                    funcName = 'console.log';
                }
                const args = node.arguments.map(a => genExpr(a)).join(', ');
                return `${funcName}(${args})`;
            case 'UpdateExpression':
                return genExpr(node.argument) + node.operator;
            case 'AssignmentExpression':
                return `${genExpr(node.left)} = ${genExpr(node.right)}`;
            default:
                throw new Error(`Unknown expression node type: ${node.type}`);
        }
    }

    function gen(node) {
        switch (node.type) {
            case 'Program':
                return node.body.map(gen).join('\n');
            case 'FunctionDeclaration':
                return `function ${node.name}(${node.params.join(', ')}) ${gen(node.body)}\n`;
            case 'BlockStatement':
                return `{\n${node.body.map(gen).join('\n')}\n}`;
            case 'VariableDeclaration':
                return `let ${node.id}${node.init ? ' = ' + genExpr(node.init) : ''};`;
            case 'StringLiteral':
                return `${node.value};`;
            case 'Literal':
                return `${node.value};`;
            case 'Identifier':
                return `${node.value};`;
            case 'CallExpression':
                return genExpr(node) + ';';
            case 'IfStatement':
                const alt = node.alternate ? ` else ${gen(node.alternate)}` : '';
                return `if (${genExpr(node.test)}) ${gen(node.consequent)}${alt}`;
            case 'ForStatement':
                const init = node.init
                    ? (node.init.type === 'VariableDeclaration'
                        ? `let ${node.init.id}${node.init.init ? ' = ' + genExpr(node.init.init) : ''}`
                        : genExpr(node.init))
                    : '';
                const test = node.test ? genExpr(node.test) : '';
                const update = node.update ? genExpr(node.update) : '';
                return `for (${init}; ${test}; ${update}) ${gen(node.body)}`;
            case 'AssignmentExpression':
                return `${genExpr(node.left)} = ${genExpr(node.right)};`;
            case 'ReturnStatement':
                return `return ${genExpr(node.argument)};`;
            case 'EmptyStatement':
                return '';
            default:
                throw new Error(`Unknown node type: ${node.type}`);
        }
    }

    return gen(ast);
}

// Compiler: Combines lexer, parser, and code generator, then evaluates the result
function compileAndRun(input) {
    const tokens = lexer(input);
    console.log('Tokens:', JSON.stringify(tokens, null, 4));

    const ast = parser(tokens);
    console.log('AST:', JSON.stringify(ast, null, 2));

    const jsCode = codeGenerator(ast);
    console.log('Generated JavaScript Code:\n', jsCode);

    try {
        eval(jsCode);
    } catch (error) {
        console.error('Error during execution:', error);
    }
}

// Test with the fizzbuzz example again
compileAndRun(`
skibidi fizzbuzz(n) {
    flex (rizz i = 1; i <= n; i++) {
        edging (i % 3 == 0 && i % 5 == 0) {
            yapping("FizzBuzz");
        } amogus edging (i % 3 == 0) {
            yapping("Fizz");
        } amogus edging (i % 5 == 0) {
            yapping("Buzz");
        } amogus {
            yapping(i);
        }
    }
}
rizz n = 15;
hop on fizzbuzz(n);

skibidi add(a, b) {
    bussin a + b;
}

rizz sum = hop on add(5, 10);
yapping("sum" + sum);

flex (rizz i = 0; i < 10; i++) {
    yapping(i);
}
`);
