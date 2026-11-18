package com.trilanetech.api.portfolio;

import com.trilanetech.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "portfolio_images")
public class PortfolioImage extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private PortfolioProject project;

    @Column(name = "file_id", nullable = false)
    private Long fileId;

    @Column(name = "alt_text", length = 255)
    private String altText;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected PortfolioImage() {}

    public PortfolioImage(Long fileId, String altText, int displayOrder) {
        this.fileId = fileId;
        this.altText = altText;
        this.displayOrder = displayOrder;
    }

    void setProject(PortfolioProject project) { this.project = project; }
    public Long getFileId() { return fileId; }
    public String getAltText() { return altText; }
    public int getDisplayOrder() { return displayOrder; }
}
