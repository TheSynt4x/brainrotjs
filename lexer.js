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

    const regex = /(".*?"|hop\s+on|\+\+|\-\-|[a-zA-Z_][a-zA-Z0-9_]*|\d+|[\(\)\{\}\;\,\=<>!+\-\*\/])/g;
    const words = input.match(regex) || [];

    const tokens = [];
    for (const word of words) {
        if (keywords[word]) {
            tokens.push({ type: 'keyword', value: keywords[word] });
        } else if (!isNaN(parseFloat(word))) {
            tokens.push({ type: 'number', value: word });
        } else if (word.startsWith('"') && word.endsWith('"')) {
            tokens.push({ type: 'string', value: word });
        } else if (["(", ")", "{", "}", ";", ",", "=", "<", ">", "!", "+", "-", "*", "/", "++", "--"].includes(word)) {
            tokens.push({ type: 'punctuation', value: word });
        } else {
            tokens.push({ type: 'identifier', value: word });
        }
    }

    return tokens;
}

module.exports = lexer;