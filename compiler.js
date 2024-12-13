const lexer = require('./lexer');
const parser = require('./parser');
const codeGenerator = require('./code-generator');


function compileAndRun(input) {
    const tokens = lexer(input);
    const ast = parser(tokens);
    const jsCode = codeGenerator(ast);
    try {
        eval(jsCode);
    } catch (error) {
        console.error('Error during execution:', error);
    }
}

module.exports = compileAndRun;