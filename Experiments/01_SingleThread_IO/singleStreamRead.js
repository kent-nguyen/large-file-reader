/**
 * This code measure read speed from harddisk,
 * running in single thread, single stream.
 * 
 * This help identify the best highWaterMark value for reading stream.
 * 
 * Usage:
 * node singleStreamRead <originalFile>
 * 
 * <orinalFile>:  Required - The source file name.
 * 
 * Output:
 * - The duration this script read entire file.
 * 
 * Example:
 * > node singleStreamRead transactions.csv
 * 
 * File read.
 * Duration: 1.662s
 * 
 * (954 MB filesize, M2 PCI4.0 SSD)
 * 
 * Result vs highWaterMark: Best highWaterMark 4MB (4 * 1024 * 1024)
 * 
 * |          highWaterMark | Duration (s) |  Speed (MB/s) |
 * |-----------------------:|-------------:|--------------:|
 * |               8 * 1024 |          390 |         2,446 |
 * |              16 * 1024 |          384 |         2,484 |
 * |    (default) 64 * 1024 |          373 |         2,557 |
 * |             128 * 1024 |          379 |         2,517 |
 * |             512 * 1024 |          375 |         2,544 |
 * |        1 * 1024 * 1024 |          291 |         3,278 |
 * |        2 * 1024 * 1024 |          286 |         3,335 |
 * | (best) 4 * 1024 * 1024 |          260 |         3,669 |
 * |        8 * 1024 * 1024 |          266 |         3,586 |
 */

const { createReadStream } = require('fs');

const originalFile = process.argv[2];

const readStream = createReadStream(originalFile, {
  highWaterMark: 4 * 1024 * 1024
});

console.time('Duration');
readStream.on('data', (chunk) => {
  // console.log(`Chunk size ${chunk.length}`);
});

readStream.on('error', (error) => {
  console.log('An error occurred', error.message);
});

readStream.on('end', () => {
  process.stdout.write('File read.\n');
  console.timeEnd('Duration');
});
