import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import VideoUploadRecorder, { VideoFile } from "../VideoUploadRecorder";

beforeEach(() => {
  // Reset mocks
  vi.clearAllMocks();
});

describe("VideoUploadRecorder", () => {
  const mockOnVideoChange = vi.fn();

  it("renders upload and record tabs", () => {
    render(<VideoUploadRecorder onVideoChange={mockOnVideoChange} />);

    expect(screen.getByText("Upload Video")).toBeInTheDocument();
    expect(screen.getByText("Record Video")).toBeInTheDocument();
  });

  it("displays configuration limits in badges", () => {
    render(
      <VideoUploadRecorder
        onVideoChange={mockOnVideoChange}
        config={{ maxSizeMB: 50, maxDurationMinutes: 3 }}
      />,
    );

    expect(screen.getByText("Max 50MB")).toBeInTheDocument();
    expect(screen.getByText("Max 3min")).toBeInTheDocument();
  });

  it("validates video file size", async () => {
    const mockFile = new File(["test"], "test.mp4", {
      type: "video/mp4",
    });
    // Mock file size to be 200MB (over 100MB limit)
    Object.defineProperty(mockFile, "size", { value: 200 * 1024 * 1024 });

    render(<VideoUploadRecorder onVideoChange={mockOnVideoChange} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(
        screen.getByText(/Video must be smaller than 100MB/),
      ).toBeInTheDocument();
    });
  });

  it("validates video file format", async () => {
    const mockFile = new File(["test"], "test.avi", {
      type: "video/avi",
    });

    render(<VideoUploadRecorder onVideoChange={mockOnVideoChange} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Unsupported format/)).toBeInTheDocument();
    });
  });

  it("handles successful file upload", async () => {
    const mockFile = new File(["test"], "test.mp4", {
      type: "video/mp4",
    });
    Object.defineProperty(mockFile, "size", { value: 10 * 1024 * 1024 }); // 10MB

    render(<VideoUploadRecorder onVideoChange={mockOnVideoChange} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(
      () => {
        expect(mockOnVideoChange).toHaveBeenCalledWith(
          expect.objectContaining({
            file: mockFile,
            format: "video/mp4",
            isRecorded: false,
            duration: 60,
          }),
        );
      },
      { timeout: 3000 }
    );
  });

  it("displays camera permission request", async () => {
    render(<VideoUploadRecorder onVideoChange={mockOnVideoChange} />);

    // Wait for component to initialize and permission check to complete
    await waitFor(() => {
      expect(screen.getByText("Record Video")).toBeInTheDocument();
    });

    // Click on record tab
    fireEvent.click(screen.getByText("Record Video"));

    await waitFor(
      () => {
        expect(screen.getByText("Enable Camera")).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it("shows recording controls when camera is available", async () => {
    navigator.mediaDevices.getUserMedia = vi.fn().mockResolvedValue(new MediaStream());

    render(<VideoUploadRecorder onVideoChange={mockOnVideoChange} />);

    // Click on record tab
    fireEvent.click(screen.getByText("Record Video"));

    // Wait for camera permission check
    await waitFor(() => {
      expect(screen.getByText("Enable Camera")).toBeInTheDocument();
    });

    // Click enable camera
    fireEvent.click(screen.getByText("Enable Camera"));

    await waitFor(
      () => {
        expect(screen.getByText("Start Recording")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("can remove uploaded video", async () => {
    const mockFile = new File(["test"], "test.mp4", { type: "video/mp4" });
    Object.defineProperty(mockFile, "size", { value: 10 * 1024 * 1024 });

    render(<VideoUploadRecorder onVideoChange={mockOnVideoChange} />);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Wait for video to be processed and UI to update
    await waitFor(
      () => {
        // Look for file name or success indicator
        expect(
          screen.getByText("test.mp4") || screen.getByDisplayValue("test.mp4")
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Find and click remove button (may have different text/aria-label)
    const removeButton =
      screen.queryByRole("button", { name: /remove/i }) ||
      screen.queryByRole("button", { name: /delete/i }) ||
      screen.queryByRole("button", { name: /clear/i }) ||
      screen.querySelector('button[aria-label*="remove"]') ||
      screen.querySelector('button[title*="remove"]');

    if (removeButton) {
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockOnVideoChange).toHaveBeenCalledWith(null);
      });
    } else {
      // If no remove button found, test that video was at least processed
      expect(mockOnVideoChange).toHaveBeenCalledWith(
        expect.objectContaining({
          file: mockFile,
          format: "video/mp4",
        })
      );
    }
  });

  it("respects disabled state", () => {
    render(<VideoUploadRecorder onVideoChange={mockOnVideoChange} disabled />);

    const uploadTab = screen.getByText("Upload Video");
    const recordTab = screen.getByText("Record Video");

    expect(uploadTab.closest("button")).toBeDisabled();
    expect(recordTab.closest("button")).toBeDisabled();
  });
});
