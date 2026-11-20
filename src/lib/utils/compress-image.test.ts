import { compressImageToDataUrl, cropImageToDataUrl } from "./compress-image";

describe("compressImageToDataUrl", () => {
  const originalImage = global.Image;
  const originalCreateObjectURL = URL.createObjectURL;
  const originalRevokeObjectURL = URL.revokeObjectURL;

  beforeEach(() => {
    URL.createObjectURL = jest.fn(() => "blob:mock");
    URL.revokeObjectURL = jest.fn();

    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: jest.fn(() => ({
        drawImage: jest.fn(),
      })),
    });

    Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
      configurable: true,
      value: jest.fn(() => "data:image/jpeg;base64,xx"),
    });

    class FakeImage {
      width = 800;
      height = 600;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.Image = FakeImage as any;
  });

  afterEach(() => {
    global.Image = originalImage;
    URL.createObjectURL = originalCreateObjectURL;
    URL.revokeObjectURL = originalRevokeObjectURL;
  });

  it("rejects non-image files", async () => {
    const file = new File(["plain"], "notes.txt", { type: "text/plain" });
    await expect(compressImageToDataUrl(file)).rejects.toThrow("invalid_image");
  });

  it("compresses an image file into a JPEG data URL", async () => {
    const file = new File(["img"], "avatar.png", { type: "image/png" });
    await expect(compressImageToDataUrl(file)).resolves.toBe(
      "data:image/jpeg;base64,xx",
    );
    expect(URL.createObjectURL).toHaveBeenCalledWith(file);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock");
  });

  it("rejects when the image fails to load", async () => {
    class BrokenImage {
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onerror?.();
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.Image = BrokenImage as any;

    const file = new File(["img"], "avatar.png", { type: "image/png" });
    await expect(compressImageToDataUrl(file)).rejects.toThrow("invalid_image");
  });
});

describe("cropImageToDataUrl", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: jest.fn(() => ({
        drawImage: jest.fn(),
      })),
    });

    Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
      configurable: true,
      value: jest.fn(() => "data:image/jpeg;base64,cropped"),
    });

    class FakeImage {
      width = 400;
      height = 400;
      onload: (() => void) | null = null;
      onerror: (() => void) | null = null;
      set src(_value: string) {
        this.onload?.();
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    global.Image = FakeImage as any;
  });

  it("crops a region into a JPEG data URL", async () => {
    await expect(
      cropImageToDataUrl("blob:source", {
        x: 10,
        y: 20,
        width: 100,
        height: 80,
      }),
    ).resolves.toBe("data:image/jpeg;base64,cropped");
  });

  it("throws when the canvas context is unavailable", async () => {
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
      configurable: true,
      value: jest.fn(() => null),
    });

    await expect(
      cropImageToDataUrl("blob:source", {
        x: 0,
        y: 0,
        width: 10,
        height: 10,
      }),
    ).rejects.toThrow("canvas_unavailable");
  });
});
