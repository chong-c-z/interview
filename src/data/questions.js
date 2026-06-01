import { buildQuestionBank, QUESTION_CATEGORIES } from './questionBankData';

export { QUESTION_CATEGORIES };
export const questionBank = buildQuestionBank();

export const encouragementMessages = [
  '太棒了！继续保持这种状态！',
  '回答得很全面，逻辑清晰！',
  '关键词都覆盖到了，很不错！',
  '这就是我们想要听到的答案！',
  '你的思考很深入，继续加油！',
  '完美的回答，下一个问题！',
];

export const pressureMessages = [
  '时间不多了，快速思考！',
  '加油！你还有时间！',
  '集中注意力，最后一分钟！',
  '快速组织你的答案！',
];
