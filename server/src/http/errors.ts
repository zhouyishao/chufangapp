export class HttpError extends Error {
  status: number;
  code: number;
  constructor(message: string, status = 400, code?: number) {
    super(message);
    this.status = status;
    this.code = code ?? status;
  }
}

