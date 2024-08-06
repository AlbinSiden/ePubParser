```markdown
# ePubParser

`ePubParser` is a lightweight JavaScript library designed for parsing ePub files on the client side. This library utilizes the `JSZip` library to handle ePub archives and provides methods for extracting and processing content from ePub files. It works in a browser environment where the DOM is available.

## Features

- Load ePub files using a `File` object.
- Extract and parse `.opf` content files.
- Retrieve CSS and HTML content from the ePub archive.
- Convert images to base64 data URLs for easy embedding.
- Fetch book metadata and cover image.

## Installation

To use `ePubParser` in your project, you need to include `JSZip` and your `ePubParser` script in your project. If you're using a module bundler like Webpack or Rollup, you can install `JSZip` via npm or yarn and import `ePubParser` as follows:

```bash
npm install jszip
```

```javascript
import JSZip from 'jszip';
import { ePubParser } from './ePubParser'; // Adjust the path as needed
```

## Usage

Here is a basic example of how to use `ePubParser`:

```javascript
// Create an instance of ePubParser
const parser = new ePubParser();

// Load an ePub file (e.g., from a file input)
document.getElementById('fileInput').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  await parser.loadFile(file);

  // Fetch book metadata
  const metadata = await parser.fetchMetadata();
  console.log('Title:', metadata.title);
  console.log('Publisher:', metadata.publisher);

  // Fetch and display CSS
  const cssFiles = await parser.fetchBookCSS();
  console.log('CSS Files:', cssFiles);

  // Fetch and display HTML content as strings
  const htmlStrings = await parser.pagesToHTMLString();
  console.log('HTML Content:', htmlStrings);

  // Fetch cover image
  const coverURL = await parser.fetchCoverURL();
  console.log('Cover URL:', coverURL);
});
```

## API

### `ePubParser`

#### Constructor

```javascript
constructor()
```

Creates a new instance of `ePubParser`.

#### Methods

- **`async loadFile(file: File): Promise<void>`**  
  Loads an ePub file into the parser.

- **`fetchContentPath(): JSZipObject | null`**  
  Finds and returns the content file path (e.g., `.opf` file) from the ePub archive.

- **`async fetchBookCSS(): Promise<string[]>`**  
  Fetches all CSS files from the ePub archive.

- **`async fetchContentFile(): Promise<XMLDocument | undefined>`**  
  Fetches and parses the content file (e.g., `.opf` file) as XML.

- **`getFileNameFromURL(url: string): string`**  
  Extracts the file name from a URL.

- **`async getFilesByExtension(extension: string, type: string): Promise<string[]>`**  
  Retrieves files with a specific extension from the ePub archive.

- **`findFileByAbsolutePath(fileName: string): JSZipObject | null`**  
  Finds a file in the ePub archive by its absolute path.

- **`async pagesToHTMLString(): Promise<string[]>`**  
  Converts pages from `.html` and `.xhtml` files to HTML strings, with images converted to base64 URLs.

- **`async imageFileToBase64URL(file: JSZipObject): Promise<string>`**  
  Converts an image file to a base64 URL.

- **`async fetchMetadata(): Promise<{title: string, publisher: string}>`**  
  Fetches metadata (title and publisher) from the ePub file.

- **`async fetchCoverURL(): Promise<string>`**  
  Fetches the cover image URL from the ePub file.

## Contributing

If you want to contribute to `ePubParser`, please fork the repository and submit a pull request with your changes. Make sure to include tests and documentation for any new features.

## Acknowledgements

- [JSZip](https://github.com/Stuk/jszip) for handling ePub files.
- [DOMParser](https://developer.mozilla.org/en-US/docs/Web/API/DOMParser) for parsing XML and HTML.
```
