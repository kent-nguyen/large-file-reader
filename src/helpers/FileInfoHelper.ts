import { createReadStream, statSync } from 'fs';
import { FileFirstLineInfo } from '../interfaces/helpers/FileFirstLineInfo';

export class FileInfoHelper {
  /**
   * Get file length in bytes, without reading it content
   * 
   * @param {string} fileName 
   * @returns {number}
   */
  public getFileSize(fileName: string): number {
    const stats = statSync(fileName);

    return stats.size;
  }

  /**
   * Read first line of file and return postion for next line
   * 
   * @param fileName 
   */
  public async readFirstLine(fileName: string): Promise<FileFirstLineInfo> {
    const finishPromise: Promise<FileFirstLineInfo> = new Promise(function (resolve, reject) {
      // Small buffer because we do not need much for only first line
      const fileReadStream = createReadStream(fileName, { highWaterMark: 4096 });

      let firstLine = '';
      let nextLinePos = 0;
      fileReadStream.on('data', (chunk) => {
        let crIndex = 0;
        // Find position of end-of-line
        while (crIndex < chunk.length && chunk[crIndex] !== 10 && chunk[crIndex] !== 13) {
          crIndex++;
        }

        if (crIndex >= chunk.length) {
          // Should stop here because file may not be normal text file
          throw new Error('File first line exceed buffer');
        }

        firstLine = chunk.slice(0, crIndex).toString(); // First line string

        nextLinePos = crIndex;
        while (nextLinePos < chunk.length && (chunk[nextLinePos] === 10 || chunk[nextLinePos] === 13)) {
          nextLinePos++;
        }

        // Close read stream
        fileReadStream.destroy(); // Trigger close event
      });

      fileReadStream.on('close', () => resolve({ firstLine, nextLinePos }));
      fileReadStream.on('error', () => {
        return reject;
      });
    });

    return finishPromise;
  }
}
