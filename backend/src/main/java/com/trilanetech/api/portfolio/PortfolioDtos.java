package com.trilanetech.api.portfolio;

import com.trilanetech.api.common.Slugs;
import com.trilanetech.api.file.FileService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

public final class PortfolioDtos {

    private PortfolioDtos() {}

    public record ImageDto(Long fileId, String url, String altText) {}

    public record ProjectSummary(Long id, String slug, String title, String clientName, String summary,
                                 Long serviceId, String serviceName, String serviceSlug, Long coverFileId,
                                 String coverUrl, LocalDate completedOn, int displayOrder, boolean published) {
        static ProjectSummary from(PortfolioProject p) {
            var s = p.getService();
            return new ProjectSummary(p.getId(), p.getSlug(), p.getTitle(), p.getClientName(), p.getSummary(),
                    s == null ? null : s.getId(), s == null ? null : s.getName(), s == null ? null : s.getSlug(),
                    p.getCoverFileId(), FileService.urlFor(p.getCoverFileId()), p.getCompletedOn(),
                    p.getDisplayOrder(), p.isPublished());
        }
    }

    public record ProjectDetail(Long id, String slug, String title, String clientName, String summary,
                                String description, Long serviceId, String serviceName, String serviceSlug,
                                String projectUrl, Long coverFileId, String coverUrl, LocalDate completedOn,
                                int displayOrder, boolean published, List<ImageDto> images) {
        static ProjectDetail from(PortfolioProject p) {
            var s = p.getService();
            return new ProjectDetail(p.getId(), p.getSlug(), p.getTitle(), p.getClientName(), p.getSummary(),
                    p.getDescription(), s == null ? null : s.getId(), s == null ? null : s.getName(),
                    s == null ? null : s.getSlug(), p.getProjectUrl(), p.getCoverFileId(),
                    FileService.urlFor(p.getCoverFileId()), p.getCompletedOn(), p.getDisplayOrder(), p.isPublished(),
                    p.getImages().stream()
                            .map(i -> new ImageDto(i.getFileId(), FileService.urlFor(i.getFileId()), i.getAltText()))
                            .toList());
        }
    }

    public record ImageRequest(
            @NotNull(message = "Choose an image.") Long fileId,
            @Size(max = 255, message = "Use at most 255 characters.") String altText) {}

    public record ProjectRequest(
            @NotBlank(message = "Enter a URL name.") @Size(max = 80, message = "Use at most 80 characters.")
            @Pattern(regexp = Slugs.PATTERN, message = Slugs.MESSAGE) String slug,
            @NotBlank(message = "Enter a title.") @Size(max = 160, message = "Use at most 160 characters.") String title,
            @Size(max = 160, message = "Use at most 160 characters.") String clientName,
            @Size(max = 500, message = "Use at most 500 characters.") String summary,
            @Size(max = 20000, message = "Use at most 20,000 characters.") String description,
            Long serviceId,
            @Size(max = 500, message = "Use at most 500 characters.")
            @Pattern(regexp = "^$|^https?://\\S+$", message = "Enter a full address starting with https://") String projectUrl,
            Long coverFileId,
            LocalDate completedOn,
            @Min(value = 0, message = "Order must be 0 or more.") @Max(value = 10000, message = "Order is too large.") Integer displayOrder,
            Boolean published,
            @Size(max = 30, message = "Use at most 30 images.") List<@Valid ImageRequest> images) {}
}
