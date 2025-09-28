# MDX Toolkit

A comprehensive toolkit for working with MDX files in Visual Studio Code. This extension provides intelligent formatting, syntax support, and productivity tools specifically designed for MDX development.

## Features

### 🎨 Smart Formatting

- **Intelligent MDX formatting** that understands the mixed nature of Markdown and JSX
- **Nested component support** with proper indentation for React components inside MDX
- **JSON code block formatting** with automatic indentation based on nesting level
- **Markdown table formatting** with automatic column alignment
- **Frontmatter support** for YAML metadata blocks

### 🔧 Advanced Capabilities

- **Context-aware indentation** that respects VS Code editor settings
- **Mixed content handling** for complex nested structures
- **Preserves JSX attributes** formatting while maintaining readability
- **Configurable formatting options** to match your coding style

## Installation

1. Open Visual Studio Code
2. Press `Ctrl+P` (or `Cmd+P` on macOS) to open the Quick Open dialog
3. Type `ext install MikhailMinaev.mdx-toolkit`
4. Press Enter and restart VS Code

## Usage

### Automatic Formatting

The extension automatically formats MDX files when you:

- Save the file (if "Format on Save" is enabled)
- Use `Shift+Alt+F` (or `Shift+Option+F` on macOS)
- Right-click and select "Format Document"

### Manual Formatting

- Open Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`)
- Type "Format MDX Document"
- Press Enter

## Examples

### Before Formatting

```mdx
---
title: "My Document"
author: "John Doe"
---

import { Component } from 'my-library';

# Hello World

<Component prop="value" data={{
key: "test",
nested: {
value: 123
}
}}>
<div>
Some content
</div>
```json
{
"example": "data",
"nested": {
"key": "value"
}
}
```
</Component>

| Name | Age |
|:--|--:|
| John | 25 |
| Jane | 30 |
```

### After Formatting
```mdx
---
title: "My Document"
author: "John Doe"
---

import { Component } from 'my-library';

# Hello World

<Component
  prop="value"
  data={{
    key: "test",
    nested: {
      value: 123
    }
  }}
>
  <div>
    Some content
  </div>
  ```json
  {
    "example": "data",
    "nested": {
      "key": "value"
    }
  }
  ```
</Component>

| Name | Age |
| :--- | --: |
| John |  25 |
| Jane |  30 |
```

## Configuration

You can customize the formatter behavior in your VS Code settings:

```json
{
  "mdxToolkit.formatter.enable": true,
  "mdxToolkit.formatter.printWidth": 80,
  "mdxToolkit.formatter.tabWidth": 2,
  "mdxToolkit.formatter.useTabs": false,
  "mdxToolkit.formatter.semi": true,
  "mdxToolkit.formatter.singleQuote": true,
  "mdxToolkit.formatter.formatTables": true,
  "mdxToolkit.formatter.formatJSON": true
}
```

### Configuration Options

| Setting | Default | Description |
| --- | --- | --- |
| `mdxToolkit.formatter.enable` | `true` | Enable/disable MDX formatting |
| `mdxToolkit.formatter.printWidth` | `80` | Maximum line width |
| `mdxToolkit.formatter.tabWidth` | `2` | Number of spaces per indentation |
| `mdxToolkit.formatter.useTabs` | `false` | Use tabs instead of spaces |
| `mdxToolkit.formatter.semi` | `true` | Add semicolons to statements |
| `mdxToolkit.formatter.singleQuote` | `true` | Use single quotes |
| `mdxToolkit.formatter.formatTables` | `true` | Format Markdown tables |
| `mdxToolkit.formatter.formatJSON` | `true` | Format JSON code blocks |

## Supported File Types

- `.mdx` files
- Mixed Markdown and JSX content
- React components within MDX
- YAML frontmatter
- Code blocks (JSON, JavaScript, TypeScript, etc.)
- Markdown tables

## Roadmap

### Upcoming Features

- 🔍 **Syntax highlighting** improvements for MDX-specific constructs
- 🧠 **IntelliSense support** for React components in MDX
- 🔗 **Link validation** for internal references
- 📝 **Snippet library** for common MDX patterns
- 🎯 **Component outline** view for navigation
- 🔄 **Auto-import** suggestions for components

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Open in VS Code and press `F5` to run the extension in a new Extension Development Host window
4. Make changes and test them
5. Submit a pull request

## Issues and Support

If you encounter any issues or have feature requests, please file them on the [GitHub Issues page](https://github.com/MikhailMinaev/mdx-toolkit/issues).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Changelog

### 0.1.0

- Initial release
- MDX file formatting support
- Nested JSX component handling
- JSON code block formatting
- Markdown table formatting
- Configurable formatting options

---

**Enjoy using MDX Toolkit!** 🚀
