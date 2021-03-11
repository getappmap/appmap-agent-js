import Logger from '../../lib/instrumenter/logger.mjs';

const logger = new Logger('foobar');

logger.debug('debug');
logger.info('info');
logger.warning('warning');
logger.error('error');
logger.critical('critical');
