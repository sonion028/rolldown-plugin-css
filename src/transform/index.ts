class TimeoutError extends Error {
  public isTimeoutError = true;
}

export const { transform, Features } = await new Promise<
  typeof import('lightningcss')
>((resolve, reject) => {
  const id = setTimeout(
    () => reject(new TimeoutError('lightningcss 加载超时')),
    10000
  );

  import('lightningcss').then(resolve, reject).finally(() => clearTimeout(id));
}).catch((error) => {
  if (error instanceof TimeoutError) throw error;
  throw new Error(
    '[rolldown-plugin-css] ⚠️ lightningcss not installed. npm install -D lightningcss'
  );
});
