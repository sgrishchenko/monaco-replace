import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker';
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker';
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker';

import 'monaco-editor/esm/vs/editor/edcore.main.js'
import 'monaco-editor/esm/vs/basic-languages/python/python.contribution'
import 'monaco-editor/esm/vs/basic-languages/typescript/typescript.contribution'
import 'monaco-editor/esm/vs/language/typescript/monaco.contribution'
import * as monaco from 'monaco-editor/esm/vs/editor/editor.api';
import {languages, type Environment} from 'monaco-editor/esm/vs/editor/editor.api';

import { createHighlighter } from 'shiki'
import { shikiToMonaco } from '@shikijs/monaco'

import './index.css'
import App from './App.tsx'

const MonacoEnvironment: Environment = {
    getWorker(_, label) {
        if (label === 'json') {
            return new jsonWorker();
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return new cssWorker();
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return new htmlWorker();
        }
        if (label === 'typescript' || label === 'javascript') {
            return new tsWorker();
        }
        return new editorWorker();
    }
};

Object.assign(globalThis, {MonacoEnvironment});

languages.typescript.typescriptDefaults.setEagerModelSync(true);
languages.typescript.typescriptDefaults.setModeConfiguration({
    ...languages.typescript.typescriptDefaults.modeConfiguration,
    completionItems: false,
});

const highlighter = await createHighlighter({
    themes: [
        'github-dark-default',
        'github-light-default',
    ],
    langs: [
        'python',
        'typescript',
    ],
})

shikiToMonaco(highlighter, monaco)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
