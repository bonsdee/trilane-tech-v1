package com.trilanetech.api.catalog;

import com.trilanetech.api.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** One line in a service's "Includes" or "Not included" list. */
@Entity
@Table(name = "service_items")
public class ServiceItem extends BaseEntity {

    public enum Kind { INCLUDED, NOT_INCLUDED }

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "service_id", nullable = false)
    private ServiceOffering service;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 15)
    private Kind kind;

    @Column(nullable = false, length = 300)
    private String text;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    protected ServiceItem() {}

    public ServiceItem(Kind kind, String text, int displayOrder) {
        this.kind = kind;
        this.text = text;
        this.displayOrder = displayOrder;
    }

    void setService(ServiceOffering service) { this.service = service; }
    public Kind getKind() { return kind; }
    public String getText() { return text; }
    public int getDisplayOrder() { return displayOrder; }
}
