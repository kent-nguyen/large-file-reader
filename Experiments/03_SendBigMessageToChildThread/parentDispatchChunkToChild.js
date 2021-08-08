/**
 * This experiment showing that it is slow to send big message
 * from parent to child process.
 *
 * When read large file using stream, we should not send data chunk
 * from parent thread to child thread for processing, because the overhead
 * for sending message trans-process too big, comparing to the speed gaining
 * from off-load the processing to child thread. 
 *
 *
 * Usage:
 *  node parentDispatchChunkToChild.js <dataFileName> [numThread]
 *
 * <dataFileName>:  Required - Data file name we will load.
 * [numThread]: Optional - number of child thread this process will spawn.
 * 
 * Output:
 * - Duration this script read the file and transfer raw chunk data to child threads
 *
 * Example:
 * >  node .\parentDispatchChunkToChild.js transactions.csv
 *
 * 954 MB file, Ryzen 9 3900x 12-core 24 threadss
 *

| highWaterMark    | Duration (s)      |
|------------------|-------------------|
|            1024  | 96.5              |
|      512 * 1024  | 36.7              |
| 4 * 1024 * 1024  | 38.8              |
*/
const { createReadStream } = require('fs');

const originalFile = process.argv[2];
const numThreadToRun = process.argv[3] ? parseInt(process.argv[3]) : 20;

const readStream = createReadStream(originalFile, {
  // highWaterMark: 4 * 1024 * 1024
  highWaterMark: 512 * 1024
  // highWaterMark: 1024
});


const { fork } = require('child_process');

const childThreads = [];
pickedThreadIndex = 0;

for (let i = 0; i < numThreadToRun; i++) {
  const childThread = fork('./child.js');
  childThreads.push(childThread);
}

console.time('Duration');
readStream.on('data', (chunk) => {
  // Pick a child thread in round-robin method
  pickedThreadIndex = (pickedThreadIndex + 1) % childThreads.length;

  // Send raw chunk data to child thread
  childThreads[pickedThreadIndex].send({ data: chunk });
});

readStream.on('error', (error) => {
  console.log('An error occurred', error.message);
});

readStream.on('end', () => {
  childThreads.forEach(child => { child.kill() })
  process.stdout.write('File read.\n');
  console.timeEnd('Duration');
});
