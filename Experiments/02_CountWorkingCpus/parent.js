/**
 * Counting how many CPUs are really used when we fork() a number of children
 *
 * We need to look closely whether parent process is also consuming CPU as worker thread,
 * and whether there any other CPU consumption for cross-process communication.
 * This help us choosing exact number of child process for optimization.
 * 
 *
 * Usage:
 * node parent <number of child to fork>
 *
 * <num of child to fork>:  Required - Number of child process we fork out.
 *
 * Output:
 * - Open performance panel, count the CPU 100% run.
 *
 * Example:
 * > node parent 2
 *
 * Ryzen 9 3900x 12-core 24 threads - Window 10 Pro
 *
 
| Number of Thread | Number of CPUs 100%                            |
|------------------|------------------------------------------------|
| 1                | 4/24 cpus 80%                                  |
| 2                | 4/24 cpus 90%                                  |
| 3                | 3/24 cpus 90%, 2 cpus 75%                      |
| 4                | 4/24 cpus 90%, 2 cpus 75%                      |
| 5                | 5/24 cpus 90%, 2 cpus 75%                      |
| 6                | 6/24 cpus 90%, 2 cpus 75%                      |
| 11               | 9 cpus 90%, 4 cpus 75%, 4 cpus 40%, 7 cpus 20% |
| 12               | 9 cpus 92%, 4 cpus 78%, 5 cpus 40%, 6 cpus 20% |
| 18               | 18 cpus 100%, 5 cpus 90%                       |
| 20               | 23 cpus 100% 1 cpu 98%                         |
| 22               | 24 cpus 100%                                   |
| 24               | 24 cpus 100%                                   |

*/

const { fork } = require('child_process');

const numThreadToRun = process.argv[2];

for (let i = 0; i < numThreadToRun; i++) {
  const childThread = fork('child.js');
  childThread.on('message', (msg) => {
    console.log('Message from child', msg);
  });

  childThread.send({ hello: 'child' });
}
