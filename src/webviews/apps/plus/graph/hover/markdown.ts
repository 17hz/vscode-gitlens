import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { until } from 'lit/directives/until.js';
import { marked } from 'marked';
import type { ThemeIcon } from 'vscode';

@customElement('gl-markdown')
export class GLMarkdown extends LitElement {
	static override styles = css`
		a,
		a code {
			text-decoration: none;
			color: var(--vscode-textLink-foreground);
		}

		a:hover,
		a:hover code {
			color: var(--vscode-textLink-activeForeground);
		}

		a:hover:not(.disabled) {
			cursor: pointer;
		}

		p,
		.code,
		ul,
		h1,
		h2,
		h3,
		h4,
		h5,
		h6 {
			margin: 8px 0;
		}

		h1,
		h2,
		h3,
		h4,
		h5,
		h6 {
			line-height: 1.1;
		}

		code {
			background: var(--vscode-textCodeBlock-background);
			border-radius: 3px;
			padding: 0px 4px 2px 4px;
			font-family: var(--vscode-editor-font-family);
		}

		code code-icon {
			color: inherit;
			font-size: inherit;
			vertical-align: middle;
		}

		hr {
			border: none;
			border-top: 1px solid var(--color-foreground--25);
		}

		p:first-child,
		.code:first-child,
		ul:first-child {
			margin-top: 0;
		}

		p:last-child,
		.code:last-child,
		ul:last-child {
			margin-bottom: 0;
		}

		/* MarkupContent Layout */
		ul {
			padding-left: 20px;
		}
		ol {
			padding-left: 20px;
		}

		li > p {
			margin-bottom: 0;
		}

		li > ul {
			margin-top: 0;
		}
	`;

	@property({ type: String })
	private markdown = '';

	override render() {
		return html`${this.markdown ? until(this.renderMarkdown(this.markdown), 'Loading...') : ''}`;
	}

	private async renderMarkdown(markdown: string) {
		marked.setOptions({
			gfm: true,
			// smartypants: true,
			// langPrefix: 'language-',
		});

		marked.use({ renderer: getMarkdownRenderer() });

		let rendered = await marked.parse(markdownEscapeEscapedIcons(markdown));
		rendered = renderThemeIconsWithinText(rendered);
		return unsafeHTML(rendered);
	}
}

function getMarkdownRenderer() {
	return {
		// heading: function (text: string, level: number, raw: string, slugger: any): string {
		// 	level = Math.min(6, level);
		// 	const id = slugger.slug(text);
		// 	const hlinks = null;

		// 	let content;

		// 	if (hlinks === null) {
		// 		// No heading links
		// 		content = text;
		// 	} else {
		// 		content = `<a href="#${id}" class="anchor">`;

		// 		if (hlinks === '') {
		// 			// Heading content is the link
		// 			content += `${text}</a>`;
		// 		} else {
		// 			// Headings are prepended with a linked symbol
		// 			content += `${hlinks}</a>${text}`;
		// 		}
		// 	}

		// 	return `
		// 		<h${level} id="${id}">
		// 			${content}
		// 		</h${level}>`;
		// },
		code: function (code: string, infostring: string | undefined, _escaped: boolean): string {
			// Remote code may include characters that need to be escaped to be visible in HTML
			code = code.replace(/</g, '&lt;');
			return `<pre class="language-${infostring}"><code>${code}</code></pre>`;
		},
		codespan: function (code: string): string {
			// Remote code may include characters that need to be escaped to be visible in HTML
			code = code.replace(/</g, '&lt;');
			return `<code>${code}</code>`;
		},
	};
}

const themeIconNameExpression = '[A-Za-z0-9-]+';
const themeIconModifierExpression = '~[A-Za-z]+';
const themeIconIdRegex = new RegExp(`^(${themeIconNameExpression})(${themeIconModifierExpression})?$`);
const themeIconsRegex = new RegExp(`\\$\\(${themeIconNameExpression}(?:${themeIconModifierExpression})?\\)`, 'g');
const themeIconsMarkdownEscapedRegex = new RegExp(`\\\\${themeIconsRegex.source}`, 'g');
const themeIconsWithinTextRegex = new RegExp(
	`(\\\\)?\\$\\((${themeIconNameExpression}(?:${themeIconModifierExpression})?)\\)`,
	'g',
);

export function markdownEscapeEscapedIcons(text: string): string {
	// Need to add an extra \ for escaping in markdown
	return text.replace(themeIconsMarkdownEscapedRegex, match => `\\${match}`);
}

export function renderThemeIconsWithinText(text: string): string {
	const elements: string[] = [];
	let match: RegExpExecArray | null;

	let textStart = 0;
	let textStop = 0;
	while ((match = themeIconsWithinTextRegex.exec(text)) !== null) {
		textStop = match.index || 0;
		if (textStart < textStop) {
			elements.push(text.substring(textStart, textStop));
		}
		textStart = (match.index || 0) + match[0].length;

		const [, escaped, codicon] = match;
		elements.push(escaped ? `$(${codicon})` : renderThemeIcon({ id: codicon }));
	}

	if (textStart < text.length) {
		elements.push(text.substring(textStart));
	}
	return elements.join('');
}

export function renderThemeIcon(icon: ThemeIcon): string {
	const match = themeIconIdRegex.exec(icon.id);
	const [, id, modifier] = match ?? [undefined, 'error', undefined];
	return /*html*/ `<code-icon icon="${id}"${modifier ? ` modifier="$.modifier}"` : ''}></code-icon>`;
}
