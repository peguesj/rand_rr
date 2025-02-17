# Resume Generator & Editor v1.0

A dynamic resume generation and editing system with real-time preview capabilities.

## Overview
This system provides a modern, JSON-driven approach to resume management and generation, 
following the separation of concerns principle between content, structure, and presentation.

## Schema
Uses parsedResume schema v3.1.3 (February 17, 2025)
Author: Jeremiah Pegues <jeremiah@pegues.io>

## Features
- Dynamic resume rendering from JSON
- Real-time preview of changes
- PDF export functionality
- Shareable resume links
- Support for custom schemas
- Bootstrap-based editor interface

## Architecture
The system follows a modular architecture:
- Content: JSON-based resume data
- Structure: JSON Schema validation
- Presentation: CSS styling
- Logic: JavaScript rendering engine

## URL Parameters
- `resume`: Path to custom JSON resume file
- `customSchema`: Boolean to use custom schema (true/false)
- `export`: Export format (e.g., 'pdf')

## Files
- `index.html`: Main resume viewer
- `editor.html`: Resume editor interface
- `renderResume.js`: Core resume rendering logic
- `parsedResume.json`: Default resume data
- `parsedResume_schema.json`: JSON schema for validation (v3.1.3)

## Development
Built with:
- jQuery 3.6.0
- Bootstrap 5.3
- html2pdf.js 0.10.1

## License
MIT License

Copyright (c) 2025 Jeremiah Pegues

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
