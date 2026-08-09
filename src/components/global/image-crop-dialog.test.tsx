import { renderWithProviders } from "@/lib/mocks/render-with-providers.mock";
import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ImageCropDialog } from "./image-crop-dialog";

const cropImageToDataUrlMock = jest.fn();
const onConfirmMock = jest.fn();
const onOpenChangeMock = jest.fn();

jest.mock("use-intl", () => {
  const translate = (key: string) => key;
  return { useTranslations: () => translate };
});

jest.mock("next-intl", () => {
  const translate = (key: string) => key;
  return { useTranslations: () => translate };
});

jest.mock("@/lib/utils/compress-image", () => ({
  cropImageToDataUrl: (...args: unknown[]) => cropImageToDataUrlMock(...args),
}));

jest.mock("react-easy-crop", () => {
  return {
    __esModule: true,
    default: ({
      image,
      onCropComplete,
      onZoomChange,
    }: {
      image: string;
      onCropComplete: (
        area: { x: number; y: number; width: number; height: number },
        pixels: { x: number; y: number; width: number; height: number },
      ) => void;
      onZoomChange: (zoom: number) => void;
    }) => (
      <div data-slot="mock-cropper">
        <span data-slot="mock-cropper-image">{image}</span>
        <button
          type="button"
          data-slot="mock-cropper-ready"
          onClick={() =>
            onCropComplete(
              { x: 0, y: 0, width: 100, height: 100 },
              { x: 10, y: 20, width: 200, height: 200 },
            )
          }
        >
          ready
        </button>
        <button
          type="button"
          data-slot="mock-cropper-zoom"
          onClick={() => onZoomChange(2)}
        >
          zoom
        </button>
      </div>
    ),
  };
});

const croppedDataUrl = "data:image/jpeg;base64,cropped-dialog";
const imageSrc = "blob:mock-image";

const renderDialog = (
  props?: Partial<React.ComponentProps<typeof ImageCropDialog>>,
) => {
  renderWithProviders(
    <ImageCropDialog
      open
      imageSrc={imageSrc}
      onConfirm={onConfirmMock}
      onOpenChange={onOpenChangeMock}
      dataSlot="image-crop-dialog"
      cancelDataSlot="image-crop-cancel"
      confirmDataSlot="image-crop-confirm"
      zoomDataSlot="image-crop-zoom"
      {...props}
    />,
  );
};

describe("ImageCropDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cropImageToDataUrlMock.mockReset();
    onConfirmMock.mockReset();
    onOpenChangeMock.mockReset();
    cropImageToDataUrlMock.mockResolvedValue(croppedDataUrl);
    onConfirmMock.mockResolvedValue(undefined);
  });

  it("Should not render the dialog content when closed", () => {
    renderDialog({ open: false });

    expect(screen.queryByTestId("image-crop-dialog")).not.toBeInTheDocument();
  });

  it("Should not render the dialog content without an image source", () => {
    renderDialog({ imageSrc: null });

    expect(screen.queryByTestId("image-crop-dialog")).not.toBeInTheDocument();
  });

  it("Should render title, description and cropper when open", async () => {
    renderDialog({
      title: "Crop avatar",
      description: "Adjust the crop",
    });

    expect(await screen.findByTestId("image-crop-dialog")).toBeInTheDocument();
    expect(screen.getByText("Crop avatar")).toBeInTheDocument();
    expect(screen.getByText("Adjust the crop")).toBeInTheDocument();

    expect(screen.getByTestId("mock-cropper-image")).toHaveTextContent(
      imageSrc,
    );
  });

  it("Should keep confirm disabled until the crop area is ready", async () => {
    renderDialog();

    expect(await screen.findByTestId("image-crop-confirm")).toBeDisabled();
  });

  it("Should crop and confirm successfully", async () => {
    renderDialog({ maxSize: 128 });

    await userEvent.click(await screen.findByTestId("mock-cropper-ready"));
    await userEvent.click(screen.getByTestId("image-crop-confirm"));

    await waitFor(() => {
      expect(cropImageToDataUrlMock).toHaveBeenCalledWith(
        imageSrc,
        { x: 10, y: 20, width: 200, height: 200 },
        128,
      );
      expect(onConfirmMock).toHaveBeenCalledWith(croppedDataUrl);
    });
  });

  it("Should show an error in the console when cropping fails", async () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    cropImageToDataUrlMock.mockRejectedValue(new Error("crop failed"));
    renderDialog();

    await userEvent.click(await screen.findByTestId("mock-cropper-ready"));
    await userEvent.click(screen.getByTestId("image-crop-confirm"));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(onConfirmMock).not.toHaveBeenCalled();
      expect(screen.getByTestId("image-crop-confirm")).not.toBeDisabled();
    });

    consoleSpy.mockRestore();
  });

  it("Should call onOpenChange(false) when cancel is clicked", async () => {
    renderDialog();

    await userEvent.click(await screen.findByTestId("image-crop-cancel"));
    expect(onOpenChangeMock).toHaveBeenCalledWith(false);
  });

  it("Should not close while saving", async () => {
    let resolveConfirm!: () => void;
    onConfirmMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveConfirm = resolve;
        }),
    );

    renderDialog();

    await userEvent.click(await screen.findByTestId("mock-cropper-ready"));
    await userEvent.click(screen.getByTestId("image-crop-confirm"));

    await waitFor(() => {
      expect(screen.getByTestId("image-crop-cancel")).toBeDisabled();
    });

    await userEvent.click(screen.getByTestId("image-crop-cancel"));
    expect(onOpenChangeMock).not.toHaveBeenCalled();

    resolveConfirm();
    await waitFor(() => expect(onConfirmMock).toHaveBeenCalled());
  });

  it("Should update zoom from the range input", async () => {
    renderDialog();

    const zoom = await screen.findByTestId("image-crop-zoom");
    fireEvent.change(zoom, { target: { value: "2.5" } });

    expect(zoom).toHaveValue("2.5");
  });

  it("Should use default shared labels when custom ones are omitted", async () => {
    renderDialog({
      title: undefined,
      description: undefined,
      confirmLabel: undefined,
      cancelLabel: undefined,
    });

    expect(await screen.findByText("crop_image")).toBeInTheDocument();
    expect(screen.getByText("crop_image_description")).toBeInTheDocument();
    expect(screen.getByText("cancel")).toBeInTheDocument();
    expect(screen.getByText("save")).toBeInTheDocument();
  });
});
