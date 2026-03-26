export const logger = (message: string, params?: unknown) => {
  if (process.env.NODE_ENV === "development") {
    console.info(message, params);
  }
};
