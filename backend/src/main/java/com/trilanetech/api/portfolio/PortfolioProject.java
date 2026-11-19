package com.trilanetech.api.portfolio;

import com.trilanetech.api.catalog.ServiceOffering;
import com.trilanetech.api.common.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/** A case study. Projects start unpublished; the portfolio appears once one is published. */
@Entity
@Table(name = "portfolio_projects")
public class PortfolioProject extends BaseEntity {

    @Column(nullable = false, length = 80)
    private String slug;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(name = "client_name", length = 160)
    private String clientName;

    @Column(length = 500)
    private String summary;

    @Column(columnDefinition = "text")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    private ServiceOffering service;

    @Column(name = "project_url", length = 500)
    private String projectUrl;

    @Column(name = "cover_file_id")
    private Long coverFileId;

    @Column(name = "completed_on")
    private LocalDate completedOn;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean published;

    /** Concept work built to show skills, not a client project. Labelled as such on the site. */
    @Column(name = "is_concept", nullable = false)
    private boolean concept;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC, id ASC")
    private List<PortfolioImage> images = new ArrayList<>();

    public void replaceImages(List<PortfolioImage> newImages) {
        images.clear();
        for (PortfolioImage image : newImages) {
            image.setProject(this);
            images.add(image);
        }
    }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getClientName() { return clientName; }
    public void setClientName(String clientName) { this.clientName = clientName; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public ServiceOffering getService() { return service; }
    public void setService(ServiceOffering service) { this.service = service; }
    public String getProjectUrl() { return projectUrl; }
    public void setProjectUrl(String projectUrl) { this.projectUrl = projectUrl; }
    public Long getCoverFileId() { return coverFileId; }
    public void setCoverFileId(Long coverFileId) { this.coverFileId = coverFileId; }
    public LocalDate getCompletedOn() { return completedOn; }
    public void setCompletedOn(LocalDate completedOn) { this.completedOn = completedOn; }
    public int getDisplayOrder() { return displayOrder; }
    public void setDisplayOrder(int displayOrder) { this.displayOrder = displayOrder; }
    public boolean isPublished() { return published; }
    public void setPublished(boolean published) { this.published = published; }
    public boolean isConcept() { return concept; }
    public void setConcept(boolean concept) { this.concept = concept; }
    public List<PortfolioImage> getImages() { return images; }
}
