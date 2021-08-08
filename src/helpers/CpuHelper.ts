import os from 'os';

export class CpuHelper {
  /**
   * Return maximu number of thread we should use.
   * 
   * @returns {number}
   */
  public getOptimizedThreadNumber() {
    const cpuCount = os.cpus().length;
    const numberOfThreads = Math.max(1, cpuCount - 1);

    return numberOfThreads;
  }
}
