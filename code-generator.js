function codeGenerator(ast) {
    function genExpr(node) {
        if (!node) return '';
        switch (node.type) {
            case 'BinaryExpression':
                return genExpr(node.left) + ' ' + node.operator + ' ' + genExpr(node.right);
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
                // If this is a top-level statement call, put a semicolon
                return genExpr(node) + ';';
            case 'IfStatement':
                return `if (${genExpr(node.test)}) ${gen(node.consequent)}`;
            case 'ForStatement':
                const init = node.init ? genExpr(node.init) : '';
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

module.exports = codeGenerator;