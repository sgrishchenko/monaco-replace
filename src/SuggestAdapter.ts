import {
	editor as Editor,
	Range,
	type Position,
	type CancellationToken,
	type Uri,
	type IRange,
	languages,
} from 'monaco-editor/esm/vs/editor/editor.api'
import type {CompletionEntryDetails, SymbolDisplayPart, JSDocTagInfo, CompletionInfo} from 'typescript'

export class Kind {
	public static unknown: string = '';
	public static keyword: string = 'keyword';
	public static script: string = 'script';
	public static module: string = 'module';
	public static class: string = 'class';
	public static interface: string = 'interface';
	public static type: string = 'type';
	public static enum: string = 'enum';
	public static variable: string = 'var';
	public static localVariable: string = 'local var';
	public static function: string = 'function';
	public static localFunction: string = 'local function';
	public static memberFunction: string = 'method';
	public static memberGetAccessor: string = 'getter';
	public static memberSetAccessor: string = 'setter';
	public static memberVariable: string = 'property';
	public static constructorImplementation: string = 'constructor';
	public static callSignature: string = 'call';
	public static indexSignature: string = 'index';
	public static constructSignature: string = 'construct';
	public static parameter: string = 'parameter';
	public static typeParameter: string = 'type parameter';
	public static primitiveType: string = 'primitive type';
	public static label: string = 'label';
	public static alias: string = 'alias';
	public static const: string = 'const';
	public static let: string = 'let';
	public static warning: string = 'warning';
}

interface ExtendedCompletionItem extends languages.CompletionItem {
	label: string;
	uri: Uri;
	position: Position;
	offset: number;
}

export class SuggestAdapter implements languages.CompletionItemProvider {
	public get triggerCharacters(): string[] {
		return ['.'];
	}

	public async provideCompletionItems(
		model: Editor.ITextModel,
		position: Position,
		_context: languages.CompletionContext,
		_token: CancellationToken
	): Promise<languages.CompletionList | undefined> {
		const wordUntilPosition = model.getWordUntilPosition(position)
		const wordAtPosition = model.getWordAtPosition(position)

		const insertRange = new Range(
			position.lineNumber,
			wordUntilPosition.startColumn,
			position.lineNumber,
			wordUntilPosition.endColumn
		);

		const replaceRange = wordAtPosition ? new Range(
			position.lineNumber,
			wordAtPosition.startColumn,
			position.lineNumber,
			wordAtPosition.endColumn,
		) : insertRange

		const wordRange = {insert: insertRange, replace: replaceRange}

		const resource = model.uri;
		const offset = model.getOffsetAt(position);

		const workerProvider = await languages.typescript.getTypeScriptWorker()
		const worker = await workerProvider(resource)

		if (model.isDisposed()) {
			return;
		}

		const info = await worker.getCompletionsAtPosition(resource.toString(), offset);

		if (!info || model.isDisposed()) {
			return;
		}

		const suggestions: ExtendedCompletionItem[] = (info as CompletionInfo).entries.map(entry => {
			let range: IRange | languages.CompletionItemRanges = wordRange;

			if (entry.replacementSpan) {
				const p1 = model.getPositionAt(entry.replacementSpan.start);
				const p2 = model.getPositionAt(entry.replacementSpan.start + entry.replacementSpan.length);
				range = new Range(p1.lineNumber, p1.column, p2.lineNumber, p2.column);
			}

			const tags: languages.CompletionItemTag[] = [];
			if (entry.kindModifiers !== undefined && entry.kindModifiers.indexOf('deprecated') !== -1) {
				tags.push(languages.CompletionItemTag.Deprecated);
			}

			return {
				uri: resource,
				position: position,
				offset: offset,
				range: range,
				label: entry.name,
				insertText: entry.name,
				sortText: entry.sortText,
				kind: SuggestAdapter.convertKind(entry.kind),
				// TODO: auto-imports
				// additionalTextEdits: [{
				// 	range: new Range(0, 0, 0, 0),
				// 	text: `import * as fs from 'fs'\n`
				// }],
				// TODO: parenthesis
				command: {
					id: 'typeParenthesisAndTriggerParameterHints',
					title: 'Type Parenthesis',
				},
				tags
			};
		});

		return {
			suggestions
		};
	}

	public async resolveCompletionItem(
		item: languages.CompletionItem,
		_token: CancellationToken
	): Promise<languages.CompletionItem> {
		const myItem = item as ExtendedCompletionItem;
		const resource = myItem.uri;
		const offset = myItem.offset;

		const workerProvider = await languages.typescript.getTypeScriptWorker()
		const worker = await workerProvider(resource)
		const details = await worker.getCompletionEntryDetails(
			resource.toString(),
			offset,
			myItem.label
		);
		if (!details) {
			return myItem;
		}

		return {
			...myItem,

			label: details.name,
			kind: SuggestAdapter.convertKind(details.kind),
			detail: SuggestAdapter.displayPartsToString(details.displayParts),
			documentation: {
				value: SuggestAdapter.createDocumentationString(details)
			}
		}
	}

	private static convertKind(kind: string): languages.CompletionItemKind {
		switch (kind) {
			case Kind.primitiveType:
			case Kind.keyword:
				return languages.CompletionItemKind.Keyword;
			case Kind.variable:
			case Kind.localVariable:
				return languages.CompletionItemKind.Variable;
			case Kind.memberVariable:
			case Kind.memberGetAccessor:
			case Kind.memberSetAccessor:
				return languages.CompletionItemKind.Field;
			case Kind.function:
			case Kind.memberFunction:
			case Kind.constructSignature:
			case Kind.callSignature:
			case Kind.indexSignature:
				return languages.CompletionItemKind.Function;
			case Kind.enum:
				return languages.CompletionItemKind.Enum;
			case Kind.module:
				return languages.CompletionItemKind.Module;
			case Kind.class:
				return languages.CompletionItemKind.Class;
			case Kind.interface:
				return languages.CompletionItemKind.Interface;
			case Kind.warning:
				return languages.CompletionItemKind.File;
		}

		return languages.CompletionItemKind.Property;
	}

	private static createDocumentationString(details: CompletionEntryDetails): string {
		let documentationString = SuggestAdapter.displayPartsToString(details.documentation);
		if (details.tags) {
			for (const tag of details.tags) {
				documentationString += `\n\n${SuggestAdapter.tagToString(tag)}`;
			}
		}
		return documentationString;
	}

	private static displayPartsToString(displayParts: SymbolDisplayPart[] | undefined): string {
		if (displayParts) {
			return displayParts.map((displayPart) => displayPart.text).join('');
		}
		return '';
	}

	private static tagToString(tag: JSDocTagInfo): string {
		let tagLabel = `*@${tag.name}*`;
		if (tag.name === 'param' && tag.text) {
			const [paramName, ...rest] = tag.text;
			tagLabel += `\`${paramName.text}\``;
			if (rest.length > 0) tagLabel += ` — ${rest.map((r) => r.text).join(' ')}`;
		} else if (Array.isArray(tag.text)) {
			tagLabel += ` — ${tag.text.map((r) => r.text).join(' ')}`;
		} else if (tag.text) {
			tagLabel += ` — ${tag.text}`;
		}
		return tagLabel;
	}
}