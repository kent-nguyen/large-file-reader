# Large file parser

This project benchmarks how fast we can parse large csv file 
in multiple processes by a multi-core cpu.

## Problem definition

Transaction data (withdrawal/deposit) of many assets are stored in a large csv file.
We need to process it to find the balance of all assets on a specific date.

### Fileformat

The file contain 300 millions records in this format:

| timestamp  | transaction_type | token | amount   |
|------------|------------------|-------|----------|
| 1571967208 | DEPOSIT          | BTC   | 0.298660 |
| 1571967189 | WITHDRAWAL       | ETH   | 0.493839 |

### Install tools

* node (v14.7.0)
* npm (v6.14.13)
* typescript (v4.3.5)
* Resiger for a free api key from https://www.cryptocompare.com/, put to .env file

### Executing program

* Install dependencies
```
npm install
```

* Compile typescript to js (or use ts-node)
```
tsc
```

* Get portfolio for all tokens up to now
```
  node ./dist/index.js ../transactions.csv

Total transactions 30000000
Duration: 9.750s
{
  "BTC": {
    "balance": 1200425.1521680003,
    "USD": 55015436706.85337
  },
  "XRP": {
    "balance": 903332.9813729969,
    "USD": 740100.7116388964
  },
  "ETH": {
    "balance": 901704.2831249977,
    "USD": 2820954798.6280613
  }
}
```

* Get portfolio for specific token
```
  node ./dist/index.js ../transactions.csv -t BTC

Total transactions 11995939
Duration: 9.386s
{
  "BTC": {
    "balance": 1200425.1521680003,
    "USD": 54904781516.32652
  }
}
```

* Get portfolio before on a date
```
 node ./dist/index.js ../transactions.csv -d 1972-10-03

Total transactions 485
Duration: 9.144s
{
  "BTC": {
    "balance": 15.849665999999987,
    "USD": 724653.2278830594
  },
  "XRP": {
    "balance": 9.496016999999993,
    "USD": 7.745901066899994
  },
  "ETH": {
    "balance": 28.11622000000001,
    "USD": 87565.15556800003
  }
}
```

* Get portfolio before a date for specific token
```
 node ./dist/index.js ../transactions.csv -t ETH -d 1972-10-03

Total transactions 129
Duration: 9.435s
{
  "ETH": {
    "balance": 28.11622000000001,
    "USD": 87710.51642540003
  }
}
```

## Discussion

### First naive approach

Simply reading and parsing 1GB of data sequentially, seems not to be a good way.
But I still try to implement a version of singleThreadParser.ts for benchmarking.
I am curious on how fast my M2 SSD can be read by node.js. As in my Experiment/01 folder,
my hardware can read 1GB data in 260ms at best. Most importantly, I also want to benchmark how much buffer size (highWaterMark in nodejs) affects the read/write speed. I found that the default nodejs buffer size 16KB makes the read/write 1GB last at 812ms. If I increase buffer size to 4MB, the duration is reduced to 372ms. All the benchmark results
 I put in the Experiments if you are interested in.
 
 Another thing this singleThreadParser script helps me, is that it helps me consider whether to use the `readline` library from nodejs. I had intended to parse the binary buffer
 from fileReadStream directly, gave all hard work code just for speed. Measuring help me find that:
 - String concatenation is 4 seconds slower than buffer.slice(start, end) when reading buffer (1GB data file).
 - Manually parsing the line (reading buffer search for "\n") help gaining 100ms
 - All those minor optimizations are wasted, when we start calling line.split(',') or any operation to do our business processing line by line.
 
So those little optimizations are not worth sacrificing the tidiness of code.
Finally I just use the `readline` package, piping from fileReadStream as source to start processing the file.

Processing 1GB of sample data file takes my hardware 23 seconds.

And I also have the correct output to compare, when developing my multithread script.

### Minor experiment on cross-process IO

Before implement my main script, I am curious that what is the speed for sending message
from parent process to child process in node.js. We know that processes in node js use different address space, and nodejs somehow make it easy for us to send messages cross-process. The question is, how much the speed is. Answer is 'slow'. As in my experiment #03 demonstrate, sending a big message from parent to forked process makes the program take 38 seconds for just reading a file, without any useful processing.

### File segmentation and process parallel

The business processing logic in this project makes it easy to implement parallel programs. It is just adding and subtracting. We can divide the large file into
multiple segments. Then fork multiple processes, on each CPU core, to process one segment.

Nodejs createReadStream() has the parameters 'start' and 'end' for us to specify the start and end reading position. We utilize it to let each child process read file stream from 'start' to 'end' position. Note that this approach is only reasonable when the harddrive has good random access support, such as SSD. If harddrive is magnetic, which is sequential access, although not benchmarking, but I guess the performance is not gained much by this approach.

After each child process finishes a file segment, it sends back the result to the parent process.
Parent process will sum up all the results to produce the final portfolio.

One big challenge here in this approach, is that the segmentation may cut into the transaction line. 
`1571966685,DEPOSIT,BTC,0.658794` can be splitted to `1571966685,DEPOS` and `IT,BTC,0.658794` in the previous and next segment. We need to carefully connect last line of segment #1 to the first line of segment #2. And we also need to handle the case when the cut is perfectly cut to the character '\n'.

My hardware can parse this same 1GB data in ~9.8 seconds.

### A better approach (?)

In production project, I would add column `balance` into dataset, and use some kind of 
data indexing to help query for balance on a specific date quickly. We can use any DBMS such as Sqlite, MySQL, MongoDB, DynamoDB.. they all can create index to timestamp column efficiently, help querying a record on a specific date at speed of O(1). If we want, we can manually create an index by ourselves, using B-tree or similar data structure to access sequential data such as timestamp quickly.
That way we are trading storage cost for speed. Provided that storage cost is cheap nowaday, the gain is worth it.

Storing an accumulated `balance` column has one drawback. Floating point numbers are inaccurate. Accumulating a long list of floating point numbers may cause precision problems.
And we need to schedule a run for number consolidation sometimes.

Using a dbms or creating an extra index file is out of scope of this project, so I did not implement it here.

