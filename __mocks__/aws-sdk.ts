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
