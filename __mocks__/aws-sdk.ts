export const awsSdkPromiseResponse = jest
  .fn()
  .mockReturnValue(Promise.resolve(true));

const startExecutionFn = jest
  .fn()
  .mockImplementation(() => ({ promise: awsSdkPromiseResponse }));

export class StepFunctions {
  startExecution = startExecutionFn;
}

const sendEmailFn = jest
  .fn()
  .mockImplementation(() => ({ promise: awsSdkPromiseResponse }));

export class SES {
  sendEmail = sendEmailFn;
}

const deleteObjectsFn = jest
  .fn()
  .mockImplementation(() => ({ promise: awsSdkPromiseResponse }));

const listObjectsFn = jest
  .fn()
  .mockImplementation(() => ({ promise: awsSdkPromiseResponse }));

export class S3 {
  deleteObjects = deleteObjectsFn;
  listObjectsV2 = listObjectsFn;
}
