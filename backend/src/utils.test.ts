import {sequentialBatch} from "../../common/utils";

describe('sequentialBatch', () => {
  const nonZero = (i: number) => i >= 0
  test('starts with ok, ends with ng', () => {
    const arr = [0, 1, -1, -1, 4, 5, -1]
    expect(sequentialBatch(arr, nonZero)).toEqual([[0, 1], [4, 5]])
  })
  test('starts with ng, ends with ng', () => {
    const arr = [-1, 1, 2, -1, -1, 5, -1]
    expect(sequentialBatch(arr, nonZero)).toEqual([[1, 2], [5]])
  })
  test('starts with ok, ends with ok', () => {
    const arr = [0, 1, -1, 3, 4]
    expect(sequentialBatch(arr, nonZero)).toEqual([[0, 1], [3, 4]])
  })
  test('starts with ng, ends with ok', () => {
    const arr = [-1, 1, 2, -1, 4]
    expect(sequentialBatch(arr, nonZero)).toEqual([[1, 2], [4]])
  })
  test('one block', () => {
    const arr = [0, 1, 2, 3]
    expect(sequentialBatch(arr, nonZero)).toEqual([[0, 1, 2, 3]])
  })
  test('empty', () => {
    const arr: number[] = []
    expect(sequentialBatch(arr, nonZero)).toEqual([])
  })
})
