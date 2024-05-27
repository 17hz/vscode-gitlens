import { css, html, LitElement } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { until } from 'lit/directives/until.js';
import { marked } from 'marked';

@customElement('gl-markdown')
export class GLMarkdown extends LitElement {
	static override styles = css`
		a {
		}
		a:hover:not(.disabled) {
			cursor: pointer;
		}

		.hover-contents:not(.html-hover-contents) {
			padding: 4px 8px;
		}

		.markdown-hover > .hover-contents:not(.code-hover-contents) {
			max-width: var(--vscode-hover-maxWidth, 500px);
			word-wrap: break-word;
		}

		.markdown-hover > .hover-contents:not(.code-hover-contents) hr {
			min-width: 100%;
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
			font-family: var(--monaco-monospace-font);
		}

		hr {
			box-sizing: border-box;
			border-left: 0px;
			border-right: 0px;
			margin-top: 4px;
			margin-bottom: -4px;
			margin-left: -8px;
			margin-right: -8px;
			height: 1px;
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

		code {
			border-radius: 3px;
			padding: 0 0.4em;
		}

		.monaco-tokenized-source {
			white-space: var(--vscode-hover-sourceWhiteSpace, pre-wrap);
		}

		.markdown-hover .hover-contents .codicon {
			color: inherit;
			font-size: inherit;
			vertical-align: middle;
		}

		.hover-contents a.code-link:hover,
		.hover-contents a.code-link {
			color: inherit;
		}

		.hover-contents a.code-link:before {
			content: '(';
		}

		.hover-contents a.code-link:after {
			content: ')';
		}

		a {
			text-decoration: underline;
			color: var(--vscode-textLink-foreground);
		}

		a:hover {
			color: var(--vscode-textLink-activeForeground);
		}

		a code {
			text-decoration: underline;
			/** Hack to force underline to show **/
			border-bottom: 1px solid transparent;
			text-underline-position: under;
			color: var(--vscode-textLink-foreground);
		}

		a:hover code {
			color: var(--vscode-textLink-activeForeground);
		}

		/** Spans in markdown hovers need a margin-bottom to avoid looking cramped: https://github.com/microsoft/vscode/issues/101496 **/
		.markdown-hover .hover-contents:not(.code-hover-contents):not(.html-hover-contents) span {
			margin-bottom: 4px;
			display: inline-block;
		}
	`;

	@property({ type: String })
	private markdown = '';

	// protected override createRenderRoot(): HTMLElement | DocumentFragment {
	// 	return this;
	// }

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

		const rendered = await marked.parse(markdown);
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
