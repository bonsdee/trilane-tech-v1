package com.trilanetech.api.catalog;

import com.trilanetech.api.common.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

/**
 * A one-time project, retainer or bundle offered on the Services page.
 * Named ServiceOffering to avoid confusion with Spring's {@code @Service}.
 * The slug is a stable identifier for future payment links and service pages.
 */
@Entity
@Table(name = "services")
public class ServiceOffering extends BaseEntity {

    public enum Category { ONE_TIME, RETAINER, BUNDLE }

    public enum BillingPeriod { ONCE, MONTHLY }

    @Column(nullable = false, length = 80)
    private String slug;

    @Column(nullable = false, length = 120)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_period", nullable = false, length = 10)
    private BillingPeriod billingPeriod;

    /** For bundles: what the parts would cost separately. */
    @Column(name = "regular_price", precision = 10, scale = 2)
    private BigDecimal regularPrice;

    @Column(length = 80)
    private String timeline;

    /** Hours included per month, for retainers that have a cap. */
    private Integer hours;

    @Column(columnDefinition = "text")
    private String summary;

    @Column(name = "ideal_for", length = 255)
    private String idealFor;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean published = true;

    @OneToMany(mappedBy = "service", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    private List<ServiceItem> items = new ArrayList<>();

    public ServiceOffering() {}

    public void replaceItems(List<ServiceItem> newItems) {
        items.clear();
        for (ServiceItem item : newItems) {
            item.setService(this);
            items.add(item);
        }
    }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BillingPeriod getBillingPeriod() { return billingPeriod; }
    public void setBillingPeriod(BillingPeriod billingPeriod) { this.billingPeriod = billingPeriod; }
    public BigDecimal getRegularPrice() { return regularPrice; }
    public void setRegularPrice(BigDecimal regularPrice) { this.regularPrice = regularPrice; }
    public String getTimeline() { return timeline; }
    public void setTimeline(String timeline) { this.timeline = timeline; }
    public Integer getHours() { return hours; }
    public void setHours(Integer hours) { this.hours = hours; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getIdealFor() { return idealFor; }
    public void setIdealFor(String idealFor) { this.idealFor = idealFor; }
    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public List<ServiceItem> getItems() { return items; }
}
