import { MultiThreadParserChild } from './MultiThreadParserChild';

const childParser = new MultiThreadParserChild();

// Message from parent trigger child file reading
process.on('message', childParser.onParentMessage.bind(childParser));

