import { EmptyError } from 'rxjs';

export type SerialFunctionDelegate<T> = (abortController: AbortController) => Promise<T>;

export class SerialFunction<T> {

  private doExecute = false;
  private isExecuting = false;
  private abortController?: AbortController;

  constructor(
    private delegate: SerialFunctionDelegate<T>
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
        if (error instanceof DOMException && error.name == "AbortError") {
          // Ignore.
        } else {
          console.error(error);
        }
      }
    }

    this.isExecuting = false;
    this.abortController = undefined;
  }

}
