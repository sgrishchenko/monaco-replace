export const tsSource = `
const foobar = 100500

/**
* @param {string} bar
*/
function blabla(bar: string) {}

foobaz // some comment
blaboo
blabla()

function multiSignature(bar: number)
function multiSignature(bar: boolean)
function multiSignature(bar: number | boolean) {}

multiSignature()
`