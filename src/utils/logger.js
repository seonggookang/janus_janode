'use strict';

/**
 * The logging module used in janode.<br>
 *
 * The level of logging on the stdout can be set through the CLI argument "--janode-log={debug|verb|info|warn|error|none}"".<br>
 *
 * Default logging level is "info".
 * @module logger
 * @access private
 */

import { getCliArgument } from './utils.js';

const LEVELS = ['none', 'error', 'warning', 'info', 'verbose', 'debug'];
const LEVELS_IDX = LEVELS.reduce((obj, lvl, idx) => {
  obj[lvl] = idx;
  return obj;
}, {});

const DEFAULT_LEVEL = 'info';
let log_verbosity = getCliArgument('janode-log', 'string', DEFAULT_LEVEL);

const printout = (msg_verbosity, console_fn, ...args) => {
  if (LEVELS_IDX[msg_verbosity] > LEVELS_IDX[log_verbosity]) return;
  const ts = (new Date()).toISOString();
  const prefix = `${ts} - ${msg_verbosity.toUpperCase().padEnd(8, ' ')}:`;
  console_fn(prefix, ...args);
};

/**
 * The logger used by Janode.
 */
const Logger = {
  /**
   * Debug logging.
   * It is a wrapper for `console.debug()`.
   *
   * @function
   * @param {...any} args
   */
  debug: (...args) => printout('debug', console.debug, ...args),

  /**
   * Verbose logging.
   * It is a wrapper for `console.debug()`.
   *
   * @function
   * @param {...any} args
   */
  verbose: (...args) => printout('verbose', console.debug, ...args),

  /**
   * Info logging (default).
   * It is a wrapper for `console.info()`.
   *
   * @function
   * @param {...any} args
   */
  info: (...args) => printout('info', console.info, ...args),

  /**
   * Warning logging.
   * It is a wrapper for `console.warn()`.
   *
   * @function
   * @param {...any} args
   */
  warning: (...args) => printout('warning', console.warn, ...args),

  /**
   * Error logging.
   * It is a wrapper for `console.error()`.
   *
   * @function
   * @param {...any} args
   */
  error: (...args) => printout('error', console.error, ...args),

  /**
   * Set level of logger.
   *
   * @function
   * @param {"debug"|"verb"|"info"|"warn"|"error"|"none"} lvl
   * @returns {string} The current level
   */
  setLevel: (lvl = '') => {
    lvl = lvl.toLowerCase();
    if (lvl === 'verb') lvl = 'verbose';
    if (lvl === 'warn') lvl = 'warning';
    if (typeof LEVELS_IDX[lvl] === 'number') {
      log_verbosity = lvl;
    }
    else {
      log_verbosity = DEFAULT_LEVEL;
    }
    return log_verbosity;
  }
};
/* set aliases */
Logger.verb = Logger.verbose;
Logger.warn = Logger.warning;

Logger.setLevel(log_verbosity);

export default Logger;