import {
  HASHED_STACK,
  INVALID_STACK,
  fromStackId,
  toStackId,
} from '../stackId.js';

const hugeList = [
  '1000000000000001',
  '1000000000000002',
  '2000000000000001',
  '2000000000000002',
  '3000000000000001',
  '3000000000000002',
  '4000000000000001',
  '4000000000000002',
  '5000000000000001',
  '5000000000000002',
  '6000000000000001',
  '6000000000000002',
  '7000000000000001',
  '7000000000000002',
  '8000000000000001',
  '8000000000000002',
];

describe('toStackId', () => {
  it.each`
    input                             | out
    ${[]}                             | ${'stack()'}
    ${['1']}                          | ${'stack(1)'}
    ${['1', '2']}                     | ${'stack(1-2)'}
    ${['1', '2', '3']}                | ${'stack(1-3)'}
    ${['1', '2', '4']}                | ${'stack(1-2,4)'}
    ${['1', '2', '4', '5']}           | ${'stack(1-2,4-5)'}
    ${['1', '2', '4', '6']}           | ${'stack(1-2,4,6)'}
    ${['1', '2', '4', '5', '6', '8']} | ${'stack(1-2,4-6,8)'}
    ${hugeList}                       | ${'stack[1fweibg]'}
  `('works for $input -> $out', ({ input, out }) => {
    expect(toStackId(input)).toStrictEqual(out);
  });
});

describe('fromStackId', () => {
  it.each`
    input                  | out
    ${'stack(1)'}          | ${['1']}
    ${'stack(1,2)'}        | ${['1', '2']}
    ${'stack(1-3)'}        | ${['1', '2', '3']}
    ${'stack(1-3,5)'}      | ${['1', '2', '3', '5']}
    ${'stack(1-3,5,9-11)'} | ${['1', '2', '3', '5', '9', '10', '11']}
    ${'stack[1fweibg]'}    | ${HASHED_STACK}
    ${'stack(1'}           | ${INVALID_STACK}
    ${'1)'}                | ${INVALID_STACK}
    ${''}                  | ${INVALID_STACK}
  `('works for $input -> $out', ({ input, out }) => {
    expect(fromStackId(input)).toStrictEqual(out);
  });
});
