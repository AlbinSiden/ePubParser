import JSZip from "jszip";

/**
 * A class to parse ePub files using JSZip.
 */
export class ePubParser {
  /**
   * Creates an instance of ePubParser.
   */
  constructor() {
    /**
     * The JSZip instance for handling ePub files.
     * @type {JSZip}
     */
    this.zipInstance = new JSZip();

    /**
     * The loaded ePub file.
     * @type {?JSZip}
     */
    this.loadedFile = null;
  }

  /**
   * Loads an ePub file into the parser.
   * @param {File} file - The ePub file to load.
   * @returns {Promise<void>}
   */
  async loadFile(file) {
    const fileBuffer = await file.arrayBuffer();
    this.loadedFile = await this.zipInstance.loadAsync(fileBuffer);
  }

  /**
   * Finds and returns the content file path (e.g., `.opf` file) from the ePub archive.
   * @returns {?JSZipObject} The content file or null if not found.
   */
  fetchContentPath() {
    const contentFile = Object.values(this.loadedFile.files).find((entry) => {
      return !entry.dir && entry.name.endsWith(".opf");
    });

    return contentFile;
  }

  /**
   * Fetches all CSS files from the ePub archive.
   * @returns {Promise<string[]>} A promise that resolves to an array of CSS file contents.
   */
  async fetchBookCSS() {
    return await this.getFilesByExtension(".css", "string");
  }

  /**
   * Fetches and parses the content file (e.g., `.opf` file) as XML.
   * @returns {Promise<XMLDocument|undefined>} A promise that resolves to the parsed XML document or undefined if no content file is found.
   */
  async fetchContentFile() {
    const contentFile = this.fetchContentPath();

    if (!contentFile) return;

    const content = await contentFile.async("text");
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(content, "application/xml");

    return xmlDoc;
  }

  /**
   * Extracts the file name from a URL.
   * @param {string} url - The URL from which to extract the file name.
   * @returns {string} The extracted file name.
   */
  getFileNameFromURL(url) {
    const urlObject = new URL(url);
    const pathname = urlObject.pathname;
    const fileName = pathname.substring(pathname.lastIndexOf("/") + 1);
    return fileName;
  }

  /**
   * Retrieves files with a specific extension from the ePub archive.
   * @param {string} extension - The file extension to filter by (e.g., `.html`).
   * @param {string} type - The type of file content to retrieve (e.g., `string`, `base64`).
   * @returns {Promise<string[]>} A promise that resolves to an array of file contents.
   */
  async getFilesByExtension(extension, type) {
    const files = Object.values(this.loadedFile.files).filter(
      (file) => !file.dir && file.name.endsWith(extension)
    );

    const filesPromises = files.map((file) => file.async(type));
    const filesResolves = await Promise.all(filesPromises);

    return filesResolves;
  }

  /**
   * Finds a file in the ePub archive by its absolute path.
   * @param {string} fileName - The name or part of the name of the file to find.
   * @returns {?JSZipObject} The found file or null if not found.
   */
  findFileByAbsolutePath(fileName) {
    const file = Object.values(this.loadedFile.files).find((entry) => {
      return !entry.dir && entry.name.includes(fileName);
    });

    return file;
  }

  /**
   * Converts pages from `.html` and `.xhtml` files to HTML strings, with images converted to base64 URLs.
   * @returns {Promise<string[]>} A promise that resolves to an array of HTML strings.
   */
  async pagesToHTMLString() {
    const [htmlFiles, xhtmlFiles] = await Promise.all([
      this.getFilesByExtension(".html", "string"),
      this.getFilesByExtension(".xhtml", "string"),
    ]);

    const allHtmlFiles = [...htmlFiles, ...xhtmlFiles];

    const htmlStringsPromises = allHtmlFiles.map(async (file) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(file, "text/html");

      let imageElements = [...doc.getElementsByTagName("img")];

      await Promise.all(
        imageElements.map(async (image) => {
          const imageFileName = this.getFileNameFromURL(image.src);
          const imageFile = this.findFileByAbsolutePath(imageFileName);

          if (!imageFile) return;

          const imageURL = await this.imageFileToBase64URL(imageFile);

          image.src = imageURL;
        })
      );

      return doc.body.innerHTML;
    });

    const htmlStrings = await Promise.all(htmlStringsPromises);

    return htmlStrings;
  }

  /**
   * Converts an image file to a base64 URL.
   * @param {JSZipObject} file - The image file to convert.
   * @returns {Promise<string>} A promise that resolves to the base64 URL of the image.
   */
  async imageFileToBase64URL(file) {
    const imageInBase64 = await file.async("base64");
    const extension = file.name.split(".").pop().toLowerCase();

    return `data:image/${extension};base64,${imageInBase64}`;
  }

  /**
   * Fetches metadata (title and publisher) from the ePub file.
   * @returns {Promise<{title: string, publisher: string}>} A promise that resolves to an object containing the title and publisher.
   * @throws {Error} If the file is not loaded yet.
   */
  async fetchMetadata() {
    if (!this.loadedFile) {
      throw new Error("File not loaded yet.");
    }

    const xmlDoc = await this.fetchContentFile();
    const title = xmlDoc.getElementsByTagName("dc:title")[0].innerHTML;
    const publisher = xmlDoc.getElementsByTagName("dc:publisher")[0].innerHTML;

    return { title, publisher };
  }

  /**
   * Fetches the cover image URL from the ePub file.
   * @returns {Promise<string>} A promise that resolves to the base64 URL of the cover image.
   * @throws {Error} If the file is not loaded yet.
   */
  async fetchCoverURL() {
    if (!this.loadedFile) {
      throw new Error("File not loaded yet.");
    }

    const xmlDoc = await this.fetchContentFile();

    const epubVersion = xmlDoc
      .getElementsByTagName("package")[0]
      .getAttribute("version");
    const coverID = epubVersion == "2.0" ? "cover" : "cover-image";

    const absoluteCoverPath = xmlDoc
      .getElementById(coverID)
      .getAttribute("href");
    const coverFile = Object.values(this.loadedFile.files).find((entry) => {
      return !entry.dir && entry.name.includes(absoluteCoverPath);
    });

    const cover = await this.imageFileToBase64URL(coverFile);

    return cover;
  }
}
