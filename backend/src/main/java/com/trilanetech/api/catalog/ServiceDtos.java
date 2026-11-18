package com.trilanetech.api.catalog;

import com.trilanetech.api.common.Slugs;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public final class ServiceDtos {

    private ServiceDtos() {}

    public record ItemDto(ServiceItem.Kind kind, String text) {}

    public record ServiceDto(Long id, String slug, String name, ServiceOffering.Category category, BigDecimal price,
                             ServiceOffering.BillingPeriod billingPeriod, BigDecimal regularPrice, String timeline,
                             Integer hours, String summary, String idealFor, int displayOrder, boolean published,
                             List<ItemDto> items) {

        public static ServiceDto from(ServiceOffering s) {
            return new ServiceDto(s.getId(), s.getSlug(), s.getName(), s.getCategory(), s.getPrice(),
                    s.getBillingPeriod(), s.getRegularPrice(), s.getTimeline(), s.getHours(), s.getSummary(),
                    s.getIdealFor(), s.getDisplayOrder(), s.isPublished(),
                    s.getItems().stream().map(i -> new ItemDto(i.getKind(), i.getText())).toList());
        }
    }

    public record CategoryGroup(ServiceOffering.Category category, String label, List<ServiceDto> services) {}

    public record ItemRequest(
            @NotNull(message = "Choose included or not included.") ServiceItem.Kind kind,
            @NotBlank(message = "Enter the item text.") @Size(max = 300, message = "Use at most 300 characters.") String text) {}

    public record ServiceRequest(
            @NotBlank(message = "Enter a URL name.") @Size(max = 80, message = "Use at most 80 characters.")
            @Pattern(regexp = Slugs.PATTERN, message = Slugs.MESSAGE) String slug,
            @NotBlank(message = "Enter a name.") @Size(max = 120, message = "Use at most 120 characters.") String name,
            @NotNull(message = "Choose a category.") ServiceOffering.Category category,
            @NotNull(message = "Enter a price.") @DecimalMin(value = "0", message = "Price cannot be negative.")
            @DecimalMax(value = "99999999.99", message = "Price is too large.")
            @Digits(integer = 8, fraction = 2, message = "Use at most 2 decimal places.") BigDecimal price,
            @NotNull(message = "Choose one-time or monthly.") ServiceOffering.BillingPeriod billingPeriod,
            @DecimalMin(value = "0", message = "Price cannot be negative.")
            @DecimalMax(value = "99999999.99", message = "Price is too large.")
            @Digits(integer = 8, fraction = 2, message = "Use at most 2 decimal places.") BigDecimal regularPrice,
            @Size(max = 80, message = "Use at most 80 characters.") String timeline,
            @Min(value = 1, message = "Hours must be at least 1.") @Max(value = 744, message = "Hours must be at most 744.") Integer hours,
            @Size(max = 2000, message = "Use at most 2,000 characters.") String summary,
            @Size(max = 255, message = "Use at most 255 characters.") String idealFor,
            @Min(value = 0, message = "Order must be 0 or more.") @Max(value = 10000, message = "Order is too large.") Integer displayOrder,
            Boolean published,
            @Size(max = 50, message = "Use at most 50 items.") List<@Valid ItemRequest> items) {}
}
