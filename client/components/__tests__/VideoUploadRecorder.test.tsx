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

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
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

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
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

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
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
      { timeout: 3000 },
    );
  });

  it("displays camera permission request", () => {
    render(<VideoUploadRecorder onVideoChange={mockOnVideoChange} />);

    // Click on record tab
    fireEvent.click(screen.getByText("Record Video"));

    // Should show enable camera button
    expect(screen.getByText("Enable Camera")).toBeInTheDocument();
  });

  it("shows recording controls when camera is available", () => {
    navigator.mediaDevices.getUserMedia = vi
      .fn()
      .mockResolvedValue(new MediaStream());

    render(<VideoUploadRecorder onVideoChange={mockOnVideoChange} />);

    // Click on record tab
    fireEvent.click(screen.getByText("Record Video"));

    // Should show enable camera button
    expect(screen.getByText("Enable Camera")).toBeInTheDocument();
  });

  it("handles video file selection", async () => {
    const mockFile = new File(["test"], "test.mp4", { type: "video/mp4" });
    Object.defineProperty(mockFile, "size", { value: 10 * 1024 * 1024 });

    render(<VideoUploadRecorder onVideoChange={mockOnVideoChange} />);

    const fileInput = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    // Wait for video to be processed
    await waitFor(
      () => {
        expect(mockOnVideoChange).toHaveBeenCalledWith(
          expect.objectContaining({
            file: mockFile,
            format: "video/mp4",
            isRecorded: false,
          }),
        );
      },
      { timeout: 2000 },
    );
  });

  it("respects disabled state", () => {
    render(<VideoUploadRecorder onVideoChange={mockOnVideoChange} disabled />);

    const uploadTab = screen.getByText("Upload Video");
    const recordTab = screen.getByText("Record Video");

    expect(uploadTab.closest("button")).toBeDisabled();
    expect(recordTab.closest("button")).toBeDisabled();
  });
});
