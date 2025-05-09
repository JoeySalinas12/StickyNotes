/**
   * Renumbers an ordered list to ensure proper sequential numbering
   */
function renumberOrderedList(list) {
  if (!list || list.nodeName !== 'OL') return;
  
  // Get all list items
  const items = list.querySelectorAll('li');
  let number = 1;
  
  // We don't actually need to modify the HTML as the browser renders
  // ordered lists with the correct numbering automatically.
  // This function is included for completeness in case you want to
  // add custom attributes or modify the content in the future.
}/**
* Markdown Handler
* Provides real-time Markdown syntax processing for the editor
*/
import { applySyntaxHighlighting } from './syntax-highlighter.js';

export function initMarkdownHandler(editorElement) {
const patterns = [
  // Bullet list: "- " or "* " becomes a bullet point
  { 
    regex: /^(\s*)[-*]\s$/,
    transform: (match, spaces) => {
      return createBulletListItem(spaces);
    }
  },
  // Numbered list: "1. " becomes a numbered list item
  {
    regex: /^(\s*)\d+\.\s$/,
    transform: (match, spaces) => {
      return createNumberedListItem(spaces);
    }
  },
  // Headers: "# " becomes h1, "## " becomes h2, etc.
  {
    regex: /^(#{1,6})\s$/,
    transform: (match, hashes) => {
      return createHeading(hashes.length);
    }
  },
  // Blockquote: "> " becomes a blockquote
  {
    regex: /^>\s$/,
    transform: () => {
      return createBlockquote();
    }
  },
  // Task list: "- [ ] " becomes an unchecked task item
  {
    regex: /^(\s*)[-*]\s\[\s\]\s$/,
    transform: (match, spaces) => {
      return createTaskItem(spaces, false);
    }
  },
  // Task list: "- [x] " becomes a checked task item
  {
    regex: /^(\s*)[-*]\s\[x\]\s$/,
    transform: (match, spaces) => {
      return createTaskItem(spaces, true);
    }
  },
  // Code block: "```" becomes a code block
  {
    regex: /^```(\w*)$/,
    transform: (match, language) => {
      return createCodeBlock(language);
    }
  },
  // Horizontal rule: "---" or "***" becomes a horizontal rule
  {
    regex: /^(---|===|\*\*\*)$/,
    transform: () => {
      return createHorizontalRule();
    }
  }
];

// Track if we're inside a code block
let inCodeBlock = false;
let codeBlockContent = '';

// Track the state of list items
let lastListItemEmpty = false;

/**
 * Handle keydown events for special Markdown behavior
 */
function handleKeydown(e) {
  // Ignore if not in editor
  if (document.activeElement !== editorElement) return;
  
  // Handle Tab key for indentation in lists
  if (e.key === 'Tab') {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      // Only handle if we're in a list
      const currentNode = selection.anchorNode;
      if (isInList(currentNode)) {
        e.preventDefault();
        
        if (e.shiftKey) {
          // Decrease indentation (Shift+Tab)
          decreaseListIndentation(currentNode);
        } else {
          // Increase indentation (Tab)
          increaseListIndentation(currentNode);
        }
      }
    }
  }
  
  // Handle Enter key in lists to continue the list
  if (e.key === 'Enter') {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const currentNode = selection.anchorNode;
      
      // If we're in a code block
      if (inCodeBlock) {
        e.preventDefault();
        insertTextAtCursor('\n');
        return;
      }
      
      // Check if we're in a list item
      if (isInList(currentNode)) {
        e.preventDefault(); // Prevent default Enter behavior to avoid duplication
        
        const listItem = getListItemElement(currentNode);
        const range = selection.getRangeAt(0);
        
        // Get the text content of the current list item
        const listItemContent = listItem.textContent.trim();
        
        // Check if cursor is at the end of the list item text
        const isAtEnd = range.startOffset === currentNode.textContent.length;
        
        // Check if we're at a line with only a list marker
        const textBeforeCursor = getTextContentBeforeCursor(currentNode, range.startOffset);
        
        // Regular expressions to match bullet and numbered list markers
        const bulletRegex = /^(\s*)[-*]\s+$/;
        const numberedRegex = /^(\s*)\d+\.\s+$/;
        const taskRegex = /^(\s*)[-*]\s\[[\sx]\]\s+$/;
        
        // If the list item is empty or contains only a marker, break out of the list
        if (listItemContent === '' || 
            bulletRegex.test(textBeforeCursor) || 
            numberedRegex.test(textBeforeCursor) || 
            taskRegex.test(textBeforeCursor)) {
          breakOutOfList(listItem);
          return;
        }
        
        // Otherwise continue the list with a new item
        const isBullet = listItem.parentNode.nodeName === 'UL';
        
        // Create a new list item
        const newListItem = document.createElement('li');
        
        // Determine if we need to split the content
        if (!isAtEnd) {
          // Split the content at cursor position
          const beforeCursor = currentNode.textContent.substring(0, range.startOffset);
          const afterCursor = currentNode.textContent.substring(range.startOffset);
          
          // Update the current list item content
          while (listItem.firstChild) {
            listItem.removeChild(listItem.firstChild);
          }
          listItem.appendChild(document.createTextNode(beforeCursor));
          
          // Set the new item content
          newListItem.appendChild(document.createTextNode(afterCursor));
        }
        
        // Check if this is a task list
        const checkbox = listItem.querySelector('input[type="checkbox"]');
        if (checkbox) {
          const newCheckbox = document.createElement('input');
          newCheckbox.type = 'checkbox';
          newListItem.insertBefore(newCheckbox, newListItem.firstChild);
          newListItem.insertBefore(document.createTextNode(' '), newCheckbox.nextSibling);
        }
        
        // Insert the new list item after the current one
        if (listItem.nextSibling) {
          listItem.parentNode.insertBefore(newListItem, listItem.nextSibling);
        } else {
          listItem.parentNode.appendChild(newListItem);
        }
        
        // Update numbering for ordered lists
        if (!isBullet) {
          renumberOrderedList(listItem.parentNode);
        }
        
        // Set the cursor in the new list item
        range.selectNodeContents(newListItem);
        range.collapse(true); // Collapse to start
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Force save as we've made changes
        if (window.noteManager && typeof window.noteManager.forceSave === 'function') {
          window.noteManager.forceSave();
        }
      } else {
        // Not in a list, use normal Enter behavior but prevent double spacing
        // Only add a single line break, not a paragraph
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        
        // Check if we're in a paragraph
        let inParagraph = false;
        let node = range.startContainer;
        while (node && node !== editorElement) {
          if (node.nodeName === 'P') {
            inParagraph = true;
            break;
          }
          node = node.parentNode;
        }
        
        if (inParagraph) {
          e.preventDefault();
          // Insert a single <br> instead of a new paragraph to prevent double spacing
          document.execCommand('insertLineBreak');
        }
      }
    }
  }
}

/**
 * Handle input events to apply Markdown transformations
 */
function handleInput(e) {
  // When we detect the end of a code block, convert the whole thing
  if (inCodeBlock && e.data === '`') {
    const text = editorElement.textContent;
    if (text.endsWith('```')) {
      inCodeBlock = false;
      
      // Replace the entire code block with formatted HTML
      // First, find the opening ```
      const startPos = text.lastIndexOf('```', text.length - 4);
      if (startPos >= 0) {
        const codeContent = text.substring(startPos + 3, text.length - 3);
        
        // Split at the first newline to extract the language
        const firstNewline = codeContent.indexOf('\n');
        const language = firstNewline > 0 ? codeContent.substring(0, firstNewline).trim() : '';
        const code = firstNewline > 0 ? codeContent.substring(firstNewline + 1) : codeContent;
        
        // Replace the text range
        const range = document.createRange();
        const selection = window.getSelection();
        
        // Set the range to encompass the whole code block
        const startNode = findTextNodeContaining(editorElement, startPos);
        const endNode = findTextNodeContaining(editorElement, text.length);
        
        if (startNode && endNode) {
          range.setStart(startNode.node, startNode.offset);
          range.setEnd(endNode.node, endNode.offset);
          
          // Create the formatted code block
          const pre = document.createElement('pre');
          const codeEl = document.createElement('code');
          if (language) {
            codeEl.className = `language-${language}`;
          }
          codeEl.textContent = code;
          pre.appendChild(codeEl);
          
          // Apply syntax highlighting
          applySyntaxHighlighting(codeEl);
          
          // Replace the text with the formatted code block
          range.deleteContents();
          range.insertNode(pre);
          
          // Move the cursor to the end
          range.setStartAfter(pre);
          range.setEndAfter(pre);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      return;
    }
  }
  
  // Ignore if we're in a code block
  if (inCodeBlock) return;
  
  // Get the current line
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const currentNode = range.startContainer;
  
  // If we're in a non-text node, ignore
  if (currentNode.nodeType !== Node.TEXT_NODE) return;
  
  // Get current line text
  const lineText = getCurrentLineText(currentNode, range.startOffset);
  
  // Skip transformation if we're already in a list item and just adding content
  // This helps prevent duplication issues when adding content to existing list items
  if (isInList(currentNode) && !lineText.match(/^(\s*)[-*1-9.]\s+$/)) {
    return;
  }
  
  // Check if the line matches any of our patterns
  for (const pattern of patterns) {
    const match = lineText.match(pattern.regex);
    if (match) {
      // For starting a code block
      if (pattern.regex.toString().includes('```')) {
        inCodeBlock = true;
        // Don't replace anything yet, we'll wait for the closing ```
        return;
      }
      
      // Apply the transformation
      const transformResult = pattern.transform(...match);
      if (transformResult) {
        // Replace the matched text with the transformed HTML
        replaceCurrentLine(currentNode, lineText.length, transformResult);
        return;
      }
    }
  }
}

/**
 * Gets the text of the current line
 */
function getCurrentLineText(node, offset) {
  const text = node.textContent;
  
  // Find the start of the line
  let startOfLine = offset;
  while (startOfLine > 0 && text[startOfLine - 1] !== '\n') {
    startOfLine--;
  }
  
  // Extract the text from the start of the line to the cursor
  return text.substring(startOfLine, offset);
}

/**
 * Gets the full text content before the cursor up to the start of the line
 */
function getTextContentBeforeCursor(node, offset) {
  if (node.nodeType !== Node.TEXT_NODE) return '';
  
  const text = node.textContent;
  
  // Find the start of the line
  let startOfLine = offset;
  while (startOfLine > 0 && text[startOfLine - 1] !== '\n') {
    startOfLine--;
  }
  
  return text.substring(startOfLine, offset);
}

/**
 * Replaces the current line with the given HTML
 */
function replaceCurrentLine(node, lineLength, html) {
  const range = document.createRange();
  const selection = window.getSelection();
  
  // Set start position to the beginning of the line
  let startPos = selection.anchorOffset - lineLength;
  
  // Create the range that covers the text to replace
  range.setStart(node, startPos);
  range.setEnd(node, selection.anchorOffset);
  
  // Delete the matched text
  range.deleteContents();
  
  // Create a temporary element to hold the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // Insert each child node from the temp div
  const fragment = document.createDocumentFragment();
  while (tempDiv.firstChild) {
    fragment.appendChild(tempDiv.firstChild);
  }
  
  // Insert the fragment
  range.insertNode(fragment);
  
  // Move the cursor to the end of the inserted content
  range.setStartAfter(fragment);
  range.setEndAfter(fragment);
  selection.removeAllRanges();
  selection.addRange(range);
  
  // Force save as we've made changes
  if (window.noteManager && typeof window.noteManager.forceSave === 'function') {
    window.noteManager.forceSave();
  }
}

/**
 * Creates a bullet list item with the given indentation
 */
function createBulletListItem(spaces) {
  // Determine the indentation level based on spaces
  const indentLevel = spaces ? Math.floor(spaces.length / 2) : 0;
  
  // Create nested lists based on indentation
  let html = '<ul><li></li></ul>';
  
  return html;
}

/**
 * Creates a numbered list item with the given indentation
 */
function createNumberedListItem(spaces) {
  // Determine the indentation level based on spaces
  const indentLevel = spaces ? Math.floor(spaces.length / 2) : 0;
  
  // Create nested lists based on indentation
  let html = '<ol><li></li></ol>';
  
  return html;
}

/**
 * Creates a heading of the specified level
 */
function createHeading(level) {
  return `<h${level}></h${level}>`;
}

/**
 * Creates a blockquote
 */
function createBlockquote() {
  return '<blockquote></blockquote>';
}

/**
 * Creates a task list item
 */
function createTaskItem(spaces, checked) {
  // Determine the indentation level based on spaces
  const indentLevel = spaces ? Math.floor(spaces.length / 2) : 0;
  
  // Create the HTML for a task item
  const checkbox = checked ? 
    '<input type="checkbox" checked>' : 
    '<input type="checkbox">';
  
  let html = `<ul><li>${checkbox} </li></ul>`;
  
  return html;
}

/**
 * Creates a code block
 */
function createCodeBlock(language) {
  // We'll handle this when we see the closing ```
  // Just return the original text for now
  return '```' + language;
}

/**
 * Creates a horizontal rule
 */
function createHorizontalRule() {
  return '<hr>';
}

/**
 * Checks if the node is inside a list item
 */
function isInList(node) {
  while (node && node !== editorElement) {
    if (node.nodeName === 'LI') {
      return true;
    }
    node = node.parentNode;
  }
  return false;
}

/**
 * Gets the list item element containing the given node
 */
function getListItemElement(node) {
  while (node && node !== editorElement) {
    if (node.nodeName === 'LI') {
      return node;
    }
    node = node.parentNode;
  }
  return null;
}

/**
 * Checks if a list item is empty (contains no text)
 * This is an improved version that better detects empty list items
 */
function isEmptyListItem(listItem) {
  if (!listItem) return false;
  
  // Check if there's a checkbox (for task lists)
  const checkbox = listItem.querySelector('input[type="checkbox"]');
  
  // Get the text content
  let content = listItem.textContent.trim();
  
  // If it's completely empty, it's definitely empty
  if (content === '') return true;
  
  // Check if there's only a checkbox
  if (checkbox && content === ' ') return true;
  
  // Get all text nodes that are direct children of the list item
  const textNodes = [];
  let hasNonEmptyText = false;
  
  // Process all child nodes to find text content
  for (let i = 0; i < listItem.childNodes.length; i++) {
    const node = listItem.childNodes[i];
    if (node.nodeType === Node.TEXT_NODE) {
      textNodes.push(node);
      if (node.textContent.trim() !== '') {
        hasNonEmptyText = true;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      // Skip checkboxes when determining if there's content
      if (node.nodeName !== 'INPUT' || node.type !== 'checkbox') {
        // Check if the element has any text content
        if (node.textContent.trim() !== '') {
          hasNonEmptyText = true;
        }
      }
    }
  }
  
  // If there's a checkbox, look for text content that's not just spaces
  if (checkbox) {
    // Calculate the total text excluding the checkbox
    let textContent = '';
    for (const node of textNodes) {
      textContent += node.textContent;
    }
    
    // Trim the content and see if it's just spaces
    textContent = textContent.trim();
    if (textContent === '') return true;
  }
  
  return !hasNonEmptyText;
}

/**
 * Breaks out of a list when an empty list item is entered
 */
function breakOutOfList(listItem) {
  // Get the parent list
  const list = listItem.parentNode;
  
  // Create a paragraph to insert after the list
  const paragraph = document.createElement('p');
  paragraph.innerHTML = '<br>'; // Empty paragraph needs a <br> to be visible
  
  // If the list only has this one empty item, replace the entire list
  if (list.children.length === 1) {
    list.parentNode.replaceChild(paragraph, list);
  } else {
    // If the list has other items, just remove this item and add a paragraph after
    // Check if this is the last item
    if (listItem === list.lastChild) {
      list.removeChild(listItem);
      list.parentNode.insertBefore(paragraph, list.nextSibling);
    } else {
      // If it's not the last item, we need to split the list
      const newList = list.cloneNode(false); // Shallow clone
      let next = listItem.nextSibling;
      
      // Move all following items to the new list
      while (next) {
        const temp = next.nextSibling;
        newList.appendChild(next);
        next = temp;
      }
      
      // Remove the empty item
      list.removeChild(listItem);
      
      // Insert the paragraph and new list after the original list
      list.parentNode.insertBefore(paragraph, list.nextSibling);
      if (newList.hasChildNodes()) {
        list.parentNode.insertBefore(newList, paragraph.nextSibling);
      }
    }
  }
  
  // Move the cursor to the new paragraph
  const selection = window.getSelection();
  const range = document.createRange();
  range.setStart(paragraph, 0);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
  
  // Force save as we've made changes
  if (window.noteManager && typeof window.noteManager.forceSave === 'function') {
    window.noteManager.forceSave();
  }
}

/**
 * Gets the indentation level of a list item
 */
function getIndentationLevel(listItem) {
  let level = 0;
  let parent = listItem.parentNode;
  
  while (parent && parent !== editorElement) {
    if (parent.nodeName === 'UL' || parent.nodeName === 'OL') {
      // Only count if it's nested in another list, not the first level
      if (parent.parentNode.nodeName === 'LI') {
        level++;
      }
    }
    parent = parent.parentNode;
  }
  
  return ' '.repeat(level * 2);
}

/**
 * Gets the next number for a numbered list
 */
function getNextListNumber(listItem) {
  const list = listItem.parentNode;
  if (list.nodeName !== 'OL') return '1';
  
  // Find the index of the current list item
  let index = 0;
  let child = list.firstChild;
  
  while (child && child !== listItem) {
    if (child.nodeName === 'LI') {
      index++;
    }
    child = child.nextSibling;
  }
  
  // The next number is the current index + 2 
  // (index is 0-based and we want the number after this item)
  return (index + 2).toString();
}

/**
 * Increases list indentation level
 */
function increaseListIndentation(node) {
  const listItem = getListItemElement(node);
  if (!listItem) return;
  
  const list = listItem.parentNode;
  
  // Check if there's a previous list item
  const prevItem = listItem.previousElementSibling;
  if (!prevItem) return; // Can't indent the first item
  
  // Check if the previous item already has a nested list
  let nestedList = null;
  for (let i = 0; i < prevItem.children.length; i++) {
    const child = prevItem.children[i];
    if (child.nodeName === 'UL' || child.nodeName === 'OL') {
      nestedList = child;
      break;
    }
  }
  
  // If there's no nested list, create one of the same type
  if (!nestedList) {
    nestedList = document.createElement(list.nodeName);
    prevItem.appendChild(nestedList);
  }
  
  // Move the current item to the nested list
  nestedList.appendChild(listItem);
  
  // Force save as we've made changes
  if (window.noteManager && typeof window.noteManager.forceSave === 'function') {
    window.noteManager.forceSave();
  }
}

/**
 * Decreases list indentation level
 */
function decreaseListIndentation(node) {
  const listItem = getListItemElement(node);
  if (!listItem) return;
  
  const list = listItem.parentNode;
  
  // Check if we're already in a nested list
  const parentItem = list.parentNode;
  if (parentItem.nodeName !== 'LI') return; // Not in a nested list
  
  const parentList = parentItem.parentNode;
  
  // Insert this item after the parent list item
  parentList.insertBefore(listItem, parentItem.nextSibling);
  
  // If the nested list is now empty, remove it
  if (list.children.length === 0) {
    parentItem.removeChild(list);
  }
  
  // Force save as we've made changes
  if (window.noteManager && typeof window.noteManager.forceSave === 'function') {
    window.noteManager.forceSave();
  }
}

/**
 * Finds the text node containing the given position
 */
function findTextNodeContaining(root, targetOffset) {
  let currentOffset = 0;
  
  function walk(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const length = node.textContent.length;
      if (currentOffset <= targetOffset && targetOffset < currentOffset + length) {
        return {
          node: node,
          offset: targetOffset - currentOffset
        };
      }
      currentOffset += length;
    } else {
      for (let i = 0; i < node.childNodes.length; i++) {
        const result = walk(node.childNodes[i]);
        if (result) return result;
      }
    }
    return null;
  }
  
  return walk(root);
}

/**
 * Inserts text at the cursor position
 */
function insertTextAtCursor(text) {
  const selection = window.getSelection();
  if (selection.rangeCount) {
    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(document.createTextNode(text));
    
    // Move the cursor after the inserted text
    range.setStartAfter(range.endContainer);
    range.setEndAfter(range.endContainer);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}

/**
 * Replaces text immediately before the cursor
 */
function replaceTextBeforeCursor(text) {
  const selection = window.getSelection();
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const textNode = document.createTextNode(text);
  range.insertNode(textNode);
  
  // Move the cursor after the inserted text
  range.setStartAfter(textNode);
  range.setEndAfter(textNode);
  selection.removeAllRanges();
  selection.addRange(range);
}

// Set up event listeners
editorElement.addEventListener('keydown', handleKeydown);
editorElement.addEventListener('input', handleInput);

// Initialize any existing Markdown in the editor
function initializeExistingMarkdown() {
  // This would parse any existing text and apply Markdown formatting
  // For simplicity, we'll leave this for later implementation
}

return {
  initializeExistingMarkdown,
  // Could add more public methods if needed
};
}