import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import VideoEmbed from "./VideoEmbed";

describe("VideoEmbed Component", () => {
  describe("Tier 1: YouTube Embeds & URL Parsing", () => {
    it("renders YouTube iframe using privacy-friendly youtube-nocookie.com for standard watch URL", () => {
      render(
        <VideoEmbed
          src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          title="Alanya Aerial Tour"
          caption="Stunning 4K drone footage of Alanya Castle and Mediterranean coastline."
        />
      );

      const iframe = screen.getByTitle("Alanya Aerial Tour");
      expect(iframe).toBeInTheDocument();
      expect(iframe.tagName).toBe("IFRAME");
      expect(iframe).toHaveAttribute(
        "src",
        expect.stringContaining("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")
      );
      expect(iframe).toHaveAttribute("allowfullscreen");
      expect(
        screen.getByText("Stunning 4K drone footage of Alanya Castle and Mediterranean coastline.")
      ).toBeInTheDocument();
    });

    it("parses youtu.be shortlinks and extracts video ID with query parameters", () => {
      render(
        <VideoEmbed
          src="https://youtu.be/kJQP7kiw5Fk?t=30"
          title="Dim Cave Exploration"
        />
      );

      const iframe = screen.getByTitle("Dim Cave Exploration");
      expect(iframe).toHaveAttribute(
        "src",
        expect.stringContaining("https://www.youtube-nocookie.com/embed/kJQP7kiw5Fk")
      );
    });

    it("autodetects youtube provider when provider prop is omitted", () => {
      render(
        <VideoEmbed
          src="https://www.youtube.com/embed/9bZkp7q19f0"
          title="Cleopatra Beach Sunset"
        />
      );

      const iframe = screen.getByTitle("Cleopatra Beach Sunset");
      expect(iframe).toHaveAttribute(
        "src",
        expect.stringContaining("youtube-nocookie.com/embed/9bZkp7q19f0")
      );
    });
  });

  describe("Tier 2: Vimeo & Direct HTML5 Video Embeds", () => {
    it("renders Vimeo iframe player from standard vimeo.com URL", () => {
      render(
        <VideoEmbed
          src="https://vimeo.com/76979871"
          provider="vimeo"
          title="Turkish Riviera Documentary"
          caption="Award-winning short documentary about Mediterranean marine life."
        />
      );

      const iframe = screen.getByTitle("Turkish Riviera Documentary");
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute(
        "src",
        expect.stringContaining("https://player.vimeo.com/video/76979871")
      );
      expect(
        screen.getByText("Award-winning short documentary about Mediterranean marine life.")
      ).toBeInTheDocument();
    });

    it("renders direct HTML5 <video> tag with controls and poster for MP4 sources", () => {
      render(
        <VideoEmbed
          src="https://cdn.example.com/videos/alanya-guide.mp4"
          provider="html5"
          poster="https://cdn.example.com/images/alanya-poster.jpg"
          caption="Official municipal tourism video."
        />
      );

      const video = screen.getByRole("region", { name: /video/i })?.querySelector("video") ||
        document.querySelector("video");

      expect(video).toBeInTheDocument();
      expect(video).toHaveAttribute("controls");
      expect(video).toHaveAttribute("src", "https://cdn.example.com/videos/alanya-guide.mp4");
      expect(video).toHaveAttribute("poster", "https://cdn.example.com/images/alanya-poster.jpg");
      expect(screen.getByText("Official municipal tourism video.")).toBeInTheDocument();
    });

    it("renders WebVTT subtitle track when trackSrc is provided for HTML5 videos", () => {
      render(
        <VideoEmbed
          src="https://cdn.example.com/videos/damlatas-cave.mp4"
          provider="html5"
          trackSrc="https://cdn.example.com/subtitles/damlatas-en.vtt"
          trackLabel="English Subtitles"
          trackLang="en"
        />
      );

      const track = document.querySelector("track");
      expect(track).toBeInTheDocument();
      expect(track).toHaveAttribute("src", "https://cdn.example.com/subtitles/damlatas-en.vtt");
      expect(track).toHaveAttribute("label", "English Subtitles");
      expect(track).toHaveAttribute("srclang", "en");
    });
  });

  describe("Tier 3: Captions, Titles & Responsive Layout", () => {
    it("renders responsive 16:9 container classes", () => {
      const { container } = render(
        <VideoEmbed
          src="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
          className="my-custom-video-class"
        />
      );

      const wrapper = container.querySelector(".my-custom-video-class");
      expect(wrapper).toBeInTheDocument();
    });

    it("omits figcaption when caption is not provided", () => {
      const { container } = render(
        <VideoEmbed src="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />
      );

      expect(container.querySelector("figcaption")).toBeNull();
    });
  });

  describe("Tier 4: Boundary & Invalid URL Fallback", () => {
    it("renders graceful fallback message when video URL is invalid or empty", () => {
      render(
        <VideoEmbed src="invalid-url-not-a-video" caption="Broken video link test" />
      );

      expect(
        screen.getByText(/video unavailable|unable to load video/i)
      ).toBeInTheDocument();
    });

    it("renders fallback UI when src is empty string without throwing", () => {
      render(<VideoEmbed src="" />);

      expect(
        screen.getByText(/video unavailable|unable to load video/i)
      ).toBeInTheDocument();
    });
  });
});
