export class TimestampHelper {
  /**
   * Convert date string to unix timestamp.
   * 
   * The time is treated as 00:00:00, and the timezone is UTC
   * 
   * @param {string} date Date in format 'YYYY-MM-DD' 
   */
  convertDateToTimestamp(date: string): number {
    // Explicitly specify that the time is 00:00 UTC
    const utcStringDateTime = `${date}T00:00:00Z`;

    return Math.floor(new Date(utcStringDateTime).getTime() / 1000);;
  }
}
