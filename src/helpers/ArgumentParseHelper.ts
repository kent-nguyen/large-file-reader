import yargs from 'yargs/yargs';

export class ArgumentParseHelper {
  /**
   * 
   * @param args 
   * @returns 
   */
  getArguments(args: string[]) {
    // If empty, default to use cli arguments
    if (args.length === 0) {
      args = process.argv.slice(2);
    }
    const argv = yargs(args)
      .usage('Usage: $0 <fileName> [options]')
      .example('$0 trans.csv', 'Porfolio for all tokens up to now.')
      .example('$0 trans.csv -t ETH', 'Porfolio for ETH token up to now.')
      .example('$0 trans.csv -d 2021-05-05', 'Porfolio for all tokens on date.')
      .example('$0 trans.csv -d 2021-05-05 -t ETH', 'Porfolio for ETH token on date.')
      .demandCommand(1, 'Please specify filename as first argument.')
      .options({
        token: { type: 'string' },
        date: { type: 'string' },
        bufSize: { type: 'number' }
      })
      .alias('t', 'token')
      .describe('token', 'Porfolio for specific token.')
      .alias('d', 'date')
      .describe('date', 'Porfolio on specific date.')
      .alias('s', 'bufferSize')
      .describe('bufferSize', 'Read buffer size, in bytes.')
      .help()
      .epilog('Kent Nguyen (ntrantukhue@gmail.com)')
      .parseSync();

    return {
      fileName: argv._[0] as string,
      options: argv
    }
  }
}
