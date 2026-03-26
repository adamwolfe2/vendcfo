export const logger = (message: string, ...rest: string[]) => {
  if (process.env.NODE_ENV === "development") {
    console.info(message, ...rest);
  }
};
