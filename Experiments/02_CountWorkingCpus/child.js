let counter = 0;

while (true) {
  // Infinite loop calculation to push usage to max
  counter *= Math.random();
}

// process.on('message', (msg) => {
//   console.log('Message from parent:', msg);
// });

// setInterval(() => {
//   process.send({ counter: counter, procId: process.pid });
// }, 1000);