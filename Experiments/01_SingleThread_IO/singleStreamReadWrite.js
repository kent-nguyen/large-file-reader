/**
 * This code measure both read and write speed from/to harddisk,
 * running in single thread, single stream.
 * 
 * This help identify the best highWaterMark value for reading and writing stream.
 * 
 * Usage:
 * node singleStreamReadWrite <originalFile> [copyFileName]
 * 
 * <orinalFile>:  Required - The source file name.
 * [copyFileName] Optional - The output file name. Default: copy.file
 * 
 * Output:
 * - Create a file named [copyFileName]
 * - The duration this script read and write to new file.
 * 
 * Example:
 * > node singleStreamReadWrite transactions.csv copiedTransactions.csv
 * 
 * File copied.
 * Duration: 4.118s
 * 
 * (954 MB file, M2 PCI4.0 SSD)
 * 
 * |          highWaterMark | Duration (ms)|  Speed (MB/s) |
 * |-----------------------:|-------------:|--------------:|
 * |               8 * 1024 |        2,504 |           381 |
 * |              16 * 1024 |        1,504 |           634 |
 * |    (default) 64 * 1024 |          812 |         1,175 |
 * |             128 * 1024 |          701 |         1,361 |
 * |             512 * 1024 |          522 |         1,827 |
 * |        1 * 1024 * 1024 |          401 |         2,379 |
 * |        2 * 1024 * 1024 |          378 |         2,524 |
 * | (best) 4 * 1024 * 1024 |          372 |         2,565 |
 * |        8 * 1024 * 1024 |          381 |         2,503 |
 * |        8 * 1024 * 1024 |          380 |         2,510 |
 */

const { createReadStream, createWriteStream } = require('fs');

const originalFile = process.argv[2];
const destinationFile = process.argv[3] ? process.argv[3] : 'copy.file';

const highWaterMark = 4 * 1024 * 1024;
const readStream = createReadStream(originalFile, { highWaterMark });
const writeStream = createWriteStream(destinationFile, { highWaterMark });

console.time('Duration');
readStream.on('data', (chunk) => {
  const result = writeStream.write(chunk);
  if (!result) {
    readStream.pause();
  }
});

readStream.on('error', (error) => {
  console.log('An error occurred', error.message);
});

readStream.on('end', () => {
  writeStream.end();
});

writeStream.on('drain', () => {
  readStream.resume();
})

writeStream.on('close', () => {
  process.stdout.write('File copied.\n');
  console.timeEnd('Duration');
})
