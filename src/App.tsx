import {useEffect, useRef} from 'react'
import {editor as Editor, languages, Uri, KeyCode} from 'monaco-editor/esm/vs/editor/editor.api'
import {SuggestAdapter} from "./SuggestAdapter.ts"
import {tsSource} from "./tsSource.ts";
import {pySource} from "./pySourceBig.ts";

function App() {
    const tsRoot = useRef<HTMLDivElement>(null)
    const pyRoot = useRef<HTMLDivElement>(null)

    const currentEditor = useRef<Editor.IStandaloneCodeEditor>(null)

    useEffect(() => {
        const tsElement = tsRoot.current
        if (!tsElement) return
        const pyElement = pyRoot.current
        if (!pyElement) return

        const completionItemProviderRegistration = languages.registerCompletionItemProvider('typescript', new SuggestAdapter())

        const tsModel = Editor.createModel(
            tsSource,
            'typescript',
            Uri.parse('file:///main.ts')
        )

        const pyModel = Editor.createModel(
            pySource,
            'python',
            Uri.parse('file:///main.py')
        )

        const tsEditor = Editor.create(tsElement, {
            model: tsModel,
            language: 'typescript',

            theme: 'github-dark-default',
            automaticLayout: true,
            minimap: {enabled: false},

            hover: {enabled: true},
        })

        const pyEditor = Editor.create(pyElement, {
            model: pyModel,
            language: 'python',

            theme: 'github-dark-default',
            automaticLayout: true,
            minimap: {enabled: false},

            hover: {enabled: true},
        })

        Array.from([tsEditor, pyEditor]).forEach(editor => {
            editor.onDidFocusEditorText(() => {
                currentEditor.current = editor
            })

            editor.onDidBlurEditorText(() => {
                currentEditor.current = null
            })
        })

        const replaceSuggestionCommandRegistration = Editor.addCommand({
            id: 'replaceSuggestion',
            run: () => {
                const editor = currentEditor.current;
                if (!editor) return;

                editor.updateOptions({
                    suggest: {insertMode: 'replace'}
                })

                editor.trigger('keyboard', 'acceptSelectedSuggestion', {})

                editor.updateOptions({
                    suggest: {insertMode: 'insert'}
                })
            }
        })

        const replaceSuggestionKeybindingRegistration = Editor.addKeybindingRule({
            keybinding: KeyCode.Tab,
            command: 'replaceSuggestion',
            when: 'suggestWidgetVisible',
        })

        const parenthesisCommandRegistration = Editor.addCommand({
            id: 'typeParenthesisAndTriggerParameterHints',
            run: () => {
                const editor = currentEditor.current;
                if (!editor) return;
                const model = editor.getModel();
                if (!model) return;
                const position = editor.getPosition();
                if (!position) return;

                const charAtCursor = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column + 1,
                });

                const nextCharAtCursor = model.getValueInRange({
                    startLineNumber: position.lineNumber,
                    startColumn: position.column + 1,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column + 2,
                });

                const hasParameters = false

                if (hasParameters) {
                    if (charAtCursor === '(') {
                        editor.trigger('source', 'cursorMove', {
                            to: 'right',
                            by: 'character',
                            value: 1,
                            select: false
                        });
                    } else {
                        editor.trigger('keyboard', 'type', {text: '('})
                    }

                    editor.trigger('keyboard', 'editor.action.triggerParameterHints', {})
                } else {
                    if (charAtCursor === '(') {
                        editor.trigger('source', 'cursorMove', {
                            to: 'right',
                            by: 'character',
                        });

                        if (nextCharAtCursor === ')') {
                            editor.trigger('source', 'cursorMove', {
                                to: 'right',
                                by: 'character',
                            })
                        }
                    } else {
                        editor.trigger('keyboard', 'type', {text: '()'})
                    }
                }
            }
        })

        const themeTimeout = setTimeout(() => {
            // tsEditor.updateOptions({theme: 'github-light-default'})
            // pyEditor.updateOptions({theme: 'github-light-default'})
        }, 10_000)

        return () => {
            tsEditor.dispose()
            pyEditor.dispose()
            tsModel.dispose()
            pyModel.dispose()

            parenthesisCommandRegistration.dispose()
            replaceSuggestionCommandRegistration.dispose()
            replaceSuggestionKeybindingRegistration.dispose()

            completionItemProviderRegistration.dispose()

            clearTimeout(themeTimeout)
        }
    }, [])

    return (
        <div style={{display: 'flex', height: '100%'}}>
            <div ref={tsRoot} style={{flex: 1, height: '100%'}}/>
            <div ref={pyRoot} style={{flex: 1, height: '100%'}}/>
        </div>
    )
}

export default App
