export type SerialFunctionDelegate<T> = (abortController: AbortController) => Promise<T>;

export class SerialFunction<T> {

  private doExecute = false;
  private isExecuting = false;
  private abortController?: AbortController;

  constructor(
    private delegate: SerialFunctionDelegate<T>,
    private errorHandler: (error: any) => void,
  ) {
  }


  public execute = async (): Promise<void> => {
    if (this.isExecuting) {
      this.doExecute = true;
      this.abortController?.abort();
      return;
    }

    this.doExecute = true;
    while (this.doExecute) {
      this.doExecute = false;
      this.isExecuting = true;
      this.abortController = new AbortController();

      try {
        // Do work.
        await this.delegate(this.abortController);
      } catch (error) {
        this.errorHandler(error);
      }
    }

    this.isExecuting = false;
    this.abortController = undefined;
  }

}
