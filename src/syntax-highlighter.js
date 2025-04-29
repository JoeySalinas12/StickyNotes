/**
 * Simple syntax highlighter for code blocks
 * This is a lightweight alternative to libraries like Prism.js or highlight.js
 */
export function applySyntaxHighlighting(codeElement) {
  if (!codeElement || codeElement.tagName !== 'CODE') return;
  
  // Check if code element has a language class
  const languageClass = Array.from(codeElement.classList).find(cls => cls.startsWith('language-'));
  if (!languageClass) return;
  
  const language = languageClass.replace('language-', '');
  const code = codeElement.textContent;
  
  // Apply basic syntax highlighting based on language
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'js':
      highlightJavaScript(codeElement, code);
      break;
    case 'html':
      highlightHTML(codeElement, code);
      break;
    case 'css':
      highlightCSS(codeElement, code);
      break;
    case 'python':
      highlightPython(codeElement, code);
      break;
    case 'markdown':
    case 'md':
      highlightMarkdown(codeElement, code);
      break;
    default:
      // For other languages, at least do basic string and comment highlighting
      genericHighlight(codeElement, code);
  }
}

/**
 * JavaScript syntax highlighting
 */
function highlightJavaScript(element, code) {
  // Define regex patterns for different token types
  const patterns = [
    // Keywords
    {
      pattern: /\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|typeof|instanceof|try|catch|throw|finally|class|extends|import|export|from|as|async|await|yield|true|false|null|undefined)\b/g,
      className: 'keyword'
    },
    // Strings - handles both single and double quotes
    {
      pattern: /(["'`])((?:\\\1|(?!\1).)*?)\1/g,
      className: 'string'
    },
    // Comments - single line
    {
      pattern: /\/\/.*$/gm,
      className: 'comment'
    },
    // Comments - multi line
    {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment'
    },
    // Numbers
    {
      pattern: /\b(\d+(?:\.\d+)?)\b/g,
      className: 'number'
    },
    // Function names
    {
      pattern: /\b([a-zA-Z_$][\w$]*)\s*\(/g,
      className: 'function'
    }
  ];
  
  applyHighlighting(element, code, patterns);
}

/**
 * HTML syntax highlighting
 */
function highlightHTML(element, code) {
  const patterns = [
    // Tags
    {
      pattern: /(&lt;\/?[a-zA-Z0-9\-]+)(?=\s|&gt;)/g,
      className: 'keyword'
    },
    // Attributes
    {
      pattern: /\s([a-zA-Z0-9\-]+)(?=\=")/g,
      className: 'attribute'
    },
    // Attribute values
    {
      pattern: /(["'])((?:\\\1|(?!\1).)*?)\1/g,
      className: 'string'
    },
    // HTML comments
    {
      pattern: /&lt;!--[\s\S]*?--&gt;/g,
      className: 'comment'
    }
  ];
  
  applyHighlighting(element, code, patterns);
}

/**
 * CSS syntax highlighting
 */
function highlightCSS(element, code) {
  const patterns = [
    // Selectors
    {
      pattern: /([a-zA-Z0-9_\-\.\#\:]+)\s*(?={)/g,
      className: 'selector'
    },
    // Properties
    {
      pattern: /(\s*)([a-zA-Z\-]+)(?=\s*:)/g,
      className: 'property'
    },
    // Values
    {
      pattern: /:\s*([^;]+)(?=;)/g,
      className: 'value'
    },
    // Comments
    {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment'
    }
  ];
  
  applyHighlighting(element, code, patterns);
}

/**
 * Python syntax highlighting
 */
function highlightPython(element, code) {
  const patterns = [
    // Keywords
    {
      pattern: /\b(def|class|import|from|as|return|if|elif|else|for|while|break|continue|try|except|finally|with|in|is|not|and|or|True|False|None|lambda|global|nonlocal|pass|raise|assert|del|yield)\b/g,
      className: 'keyword'
    },
    // Strings - triple quotes
    {
      pattern: /("""[\s\S]*?"""|'''[\s\S]*?''')/g,
      className: 'string'
    },
    // Strings - single and double quotes
    {
      pattern: /(["'])((?:\\\1|(?!\1).)*?)\1/g,
      className: 'string'
    },
    // Comments
    {
      pattern: /#.*$/gm,
      className: 'comment'
    },
    // Numbers
    {
      pattern: /\b(\d+(?:\.\d+)?)\b/g,
      className: 'number'
    },
    // Function definitions
    {
      pattern: /\b(def)\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g,
      className: 'function'
    }
  ];
  
  applyHighlighting(element, code, patterns);
}

/**
 * Markdown syntax highlighting
 */
function highlightMarkdown(element, code) {
  const patterns = [
    // Headers
    {
      pattern: /^(#{1,6})\s+(.+)$/gm,
      className: 'header'
    },
    // Bold
    {
      pattern: /(\*\*|__)(.*?)\1/g,
      className: 'bold'
    },
    // Italic
    {
      pattern: /(\*|_)(.*?)\1/g,
      className: 'italic'
    },
    // Code blocks
    {
      pattern: /```[\s\S]*?```/g,
      className: 'code'
    },
    // Inline code
    {
      pattern: /`([^`]+)`/g,
      className: 'code-inline'
    },
    // Links
    {
      pattern: /\[([^\]]+)\]\(([^)]+)\)/g,
      className: 'link'
    },
    // Lists
    {
      pattern: /^(\s*)([-*+]|\d+\.)\s+/gm,
      className: 'list'
    }
  ];
  
  applyHighlighting(element, code, patterns);
}

/**
 * Generic syntax highlighting for any language
 */
function genericHighlight(element, code) {
  const patterns = [
    // Strings - single and double quotes
    {
      pattern: /(["'])((?:\\\1|(?!\1).)*?)\1/g,
      className: 'string'
    },
    // Comments - single line, supports multiple styles
    {
      pattern: /(\/\/|#).*$/gm,
      className: 'comment'
    },
    // Comments - multi line
    {
      pattern: /\/\*[\s\S]*?\*\//g,
      className: 'comment'
    },
    // Numbers
    {
      pattern: /\b(\d+(?:\.\d+)?)\b/g,
      className: 'number'
    }
  ];
  
  applyHighlighting(element, code, patterns);
}

/**
 * Applies highlighting based on patterns
 */
function applyHighlighting(element, code, patterns) {
  // Escape HTML entities first (convert < to &lt; etc.)
  let escapedCode = escapeHTML(code);
  
  // Replace matches with tagged spans
  patterns.forEach(({ pattern, className }) => {
    escapedCode = escapedCode.replace(pattern, (match, ...args) => {
      // If it's a capturing group pattern (like strings with quotes)
      if (args[0] && args[0] !== match) {
        // Preserve the first capturing group (often the quote character)
        // and wrap the content in a span
        return args[0] + `<span class="${className}">` + args[1] + '</span>' + args[0];
      }
      return `<span class="${className}">` + match + '</span>';
    });
  });
  
  // Set the HTML content
  element.innerHTML = escapedCode;
}

/**
 * Escapes HTML entities
 */
function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}