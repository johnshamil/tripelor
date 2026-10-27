export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.TRIPELOR_MOCK_PREVIEW === "1") {
    const { installPreviewFetch } = await import("./lib/preview-fixture");
    installPreviewFetch();
  }
}